"""
Move the images that shipped in the Angular build into Django's media folder.

Why this exists
---------------
Images were never managed by the CMS. Every image was a path string in a content
block, pointing at a file sitting in `frontend/public/`, and the Angular build
copied that folder verbatim to the web root. Two problems followed:

  1. The paths were relative (`assets/images/hero-addis.jpg`) and bound straight
     to `[src]`, so the browser resolved them against whatever page the visitor
     was on. It worked on the homepage and 404'd on `/about`. Nobody had noticed
     because nobody had ever changed an image.

  2. There was no way to add one. The editor offered a text box.

So the files move to MEDIA_ROOT, and every stored path becomes root-absolute
(`/media/assets/images/hero-addis.jpg`), which is the form the frontend already
handles correctly. Remote URLs - the Unsplash placeholders on the industry and
solution pages - are left exactly as they are: they are already absolute and are
not ours to move.

What it changes
---------------
  - Copies each local file into MEDIA_ROOT, keeping its path so the public URL is
    the old one with `/media` in front. Nothing that renders today changes except
    gaining the prefix.
  - Rewrites `kind='image'` block values and `image` fields inside list blocks.
  - Records every migrated file as an ImageAsset, so the existing images show up
    in the staff image library alongside newly uploaded ones.

It is safe to re-run: files already present are left alone, values that are
already absolute are skipped, and the asset rows are matched on path.
"""
from __future__ import annotations

import shutil
from pathlib import Path

from django.conf import settings
from django.core.files.base import File
from django.core.management.base import BaseCommand
from django.db import transaction

from cms.image_upload import store_upload
from cms.models import ContentBlock, ImageAsset

# Where the Angular build used to read images from. `BASE_DIR` is the backend
# package, so the repo root is its parent.
FRONTEND_PUBLIC = settings.BASE_DIR.parent / 'frontend' / 'public'

# List-block fields that hold an image path. Named rather than sniffed by value so
# a list field that happens to hold text is never rewritten.
LIST_IMAGE_FIELDS = ('image', 'imagePath', 'featuredImage', 'heroImage')


def is_local(value: str) -> bool:
    """
    True for a path we own and must move, false for anything already resolved.

    Remote URLs and data URIs are left alone, as is anything already absolute -
    including a path under /media, which is what this command writes.
    """
    text = (value or '').strip()
    if not text:
        return False
    if text.startswith(('http://', 'https://', '//', 'data:')):
        return False
    return not text.startswith('/')


class Command(BaseCommand):
    help = 'Move the images shipped in frontend/public into MEDIA_ROOT and rewrite their paths.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Report what would change without writing anything.',
        )
        parser.add_argument(
            '--skip-files',
            action='store_true',
            help='Rewrite the stored paths but do not copy any files.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        skip_files = options['skip_files']

        if not FRONTEND_PUBLIC.is_dir():
            raise SystemExit(
                f'Could not find the Angular public folder at {FRONTEND_PUBLIC}. '
                'Run this from a checkout that includes frontend/public.'
            )

        copied, reused, migrated_values = 0, 0, 0

        for block in ContentBlock.objects.filter(kind=ContentBlock.Kind.IMAGE).order_by('pk'):
            old = block.value
            if not is_local(old):
                continue

            source = FRONTEND_PUBLIC / old
            new_value = f'{settings.MEDIA_URL}{old.lstrip("/")}'

            if not dry_run and not skip_files:
                if not source.is_file():
                    self.stderr.write(
                        self.style.WARNING(
                            f'  {block.page.slug}/{block.key}: no file at {source} - '
                            'the value was rewritten anyway, so fix the path or upload a new image.'
                        )
                    )
                else:
                    destination = Path(settings.MEDIA_ROOT) / old.lstrip('/')
                    if destination.is_file():
                        reused += 1
                    else:
                        destination.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(source, destination)
                        copied += 1

            if not dry_run:
                self._record_asset(source, old, new_value)
                block.value = new_value
                block.save(update_fields=['value', 'updated_at'])
            migrated_values += 1
            self.stdout.write(f'  {block.page.slug}/{block.key}: {old} -> {new_value}')

        list_updates = self._migrate_list_items(dry_run=dry_run)
        migrated_values += list_updates

        self.stdout.write('')
        verb = 'Would migrate' if dry_run else 'Migrated'
        self.stdout.write(
            self.style.SUCCESS(
                f'{verb} {migrated_values} image value(s); copied {copied} file(s), '
                f'{reused} already present.'
            )
        )
        if not dry_run and skip_files:
            self.stdout.write(
                self.style.WARNING('  --skip-files was used, so the copied files were not checked.')
            )

    def _record_asset(self, source: Path, old: str, new_value: str) -> None:
        """
        Put a migrated file in the library, reusing the row if it is already there.

        The file has been copied into MEDIA_ROOT by the time this runs, so it is
        read from its new home rather than uploaded again. `store_upload` is still
        what validates it, so a file that is not really an image is reported
        instead of being listed as a usable asset.
        """
        if ImageAsset.objects.filter(path=new_value).exists():
            return

        destination = Path(settings.MEDIA_ROOT) / old.lstrip('/')
        if not destination.is_file():
            return

        try:
            with destination.open('rb') as handle:
                stored = store_upload(File(handle, name=destination.name))
        except Exception as exc:  # noqa: BLE001 - reported, not raised
            self.stderr.write(
                self.style.WARNING(
                    f'  could not register {old} in the image library: {exc}'
                )
            )
            return

        # store_upload invents a dated, randomised filename. For a migrated file
        # the public path is already decided by where we copied it, so the row is
        # repointed and the copy it made of the file is removed.
        duplicate = Path(settings.MEDIA_ROOT) / stored.asset.storage_path
        asset = stored.asset
        asset.path = new_value
        asset.storage_path = str(destination.relative_to(settings.MEDIA_ROOT)).replace('\\', '/')
        asset.original_name = destination.name
        asset.save()
        if duplicate.is_file() and duplicate != destination:
            duplicate.unlink()

    def _migrate_list_items(self, *, dry_run: bool) -> int:
        """
        Rewrite image paths held inside list blocks.

        List items have no `kind`, so the leadership portraits and the home page's
        industry cards are edited as plain text and never went through the image
        block path. The field names are explicit so nothing else is touched.
        """
        updated = 0
        for block in ContentBlock.objects.filter(kind=ContentBlock.Kind.LIST).order_by('pk'):
            items = block.data or []
            changed = False

            for item in items:
                if not isinstance(item, dict):
                    continue
                for field in LIST_IMAGE_FIELDS:
                    value = item.get(field)
                    if not isinstance(value, str) or not is_local(value):
                        continue
                    new_value = f'{settings.MEDIA_URL}{value.lstrip("/")}'
                    source = FRONTEND_PUBLIC / value
                    if not dry_run:
                        if not self._copy_for_list(source, new_value, value):
                            continue
                        item[field] = new_value
                    changed = True
                    self.stdout.write(
                        f'  {block.page.slug}/{block.key} [{field}]: {value} -> {new_value}'
                    )

            if changed and not dry_run:
                block.data = items
                block.save(update_fields=['data', 'updated_at'])
                updated += 1
            elif changed:
                updated += 1
        return updated

    def _copy_for_list(self, source: Path, new_value: str, old: str) -> bool:
        """Copy a list item's file into media and register it, if it is not already there."""
        destination = Path(settings.MEDIA_ROOT) / old.lstrip('/')
        if not source.is_file():
            self.stderr.write(
                self.style.WARNING(f'  no file at {source} - {old} was left unchanged.')
            )
            return False
        if not destination.is_file():
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, destination)
        if not ImageAsset.objects.filter(path=new_value).exists():
            self._record_asset(destination, old, new_value)
        return True
