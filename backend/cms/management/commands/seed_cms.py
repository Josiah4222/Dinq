"""
Copy the page inventory and any migrated page copy into the database.

Idempotent by design, so it is safe to re-run after adding a page or a block:
    - Pages are matched on slug. A page that already exists has its title, route,
      category and order brought up to date, but its blocks are left alone.
    - Blocks are only written when they do not exist yet. That protects copy a
      staff member has since edited in the CMS screen — re-running the seed will
      not undo their changes. Use --overwrite to reset a page back to the seed.
    - Inquiry topics are matched on slug and always brought up to date, including
      the active flag. Staff manage these in the admin rather than a CMS screen,
      and a topic that is supposed to be hidden must not come back on a re-seed.
      A slug that has been dropped from the seed is deactivated, never deleted.
      This is the one place the seed overwrites staff edits: the list of matters
      the form offers is the code's to define.
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from cms.seed_blocks import BLOCKS_BY_PAGE, INVENTORY, UNMIGRATED, block_count
from cms.models import ContentBlock, InquiryTopic, Page
from cms.topics_seed import INQUIRY_TOPICS


class Command(BaseCommand):
    help = 'Seed the page inventory and migrated page copy into the database.'

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            '--overwrite',
            action='store_true',
            help='Replace existing block values with the seed copy, discarding staff edits.',
        )

    @transaction.atomic
    def handle(self, *args, **options) -> None:
        overwrite = options['overwrite']

        created_pages = 0
        for entry in INVENTORY:
            _, was_created = Page.objects.update_or_create(
                slug=entry['slug'],
                defaults={
                    'title': entry['title'],
                    'route': entry['route'],
                    'category': entry['category'],
                    'order': entry['order'],
                },
            )
            created_pages += 1 if was_created else 0

        self.stdout.write(
            self.style.SUCCESS(
                f'Pages: {len(INVENTORY)} in inventory, {created_pages} newly created.'
            )
        )

        created_blocks = 0
        skipped_blocks = 0
        for slug, blocks in BLOCKS_BY_PAGE.items():
            page = Page.objects.get(slug=slug)
            for block in blocks:
                key = block['key']
                _, was_created = ContentBlock.objects.get_or_create(
                    page=page,
                    key=key,
                    defaults={
                        'kind': block['kind'],
                        'label': block['label'],
                        'value': block.get('value', ''),
                        'data': block.get('data', []),
                        'order': block['order'],
                    },
                )
                if was_created:
                    created_blocks += 1
                    continue

                if overwrite:
                    ContentBlock.objects.filter(page=page, key=key).update(
                        kind=block['kind'],
                        label=block['label'],
                        value=block.get('value', ''),
                        data=block.get('data', []),
                        order=block['order'],
                    )
                else:
                    # Keep the stored value, but pick up a relabelled or retyped
                    # block so the seed stays the authority on structure.
                    ContentBlock.objects.filter(page=page, key=key).update(
                        label=block['label'],
                        kind=block['kind'],
                        order=block['order'],
                    )
                    skipped_blocks += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Blocks: {created_blocks} created, {skipped_blocks} left as-is '
                f'({block_count()} in seed across {len(BLOCKS_BY_PAGE)} pages)'
                + (' (values overwritten).' if overwrite else '.')
            )
        )

        if UNMIGRATED:
            self.stdout.write(
                self.style.WARNING(
                    f'{len(UNMIGRATED)} page(s) have no migrated copy: {", ".join(UNMIGRATED)}'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('Every page in the inventory has migrated copy.')
            )

        pending = Page.objects.filter(blocks__isnull=True).count()
        if pending:
            self.stdout.write(
                f'{pending} page(s) have no migrated copy yet - they show as '
                '"not yet migrated" in the CMS screen.'
            )

        created_topics = 0
        for topic in INQUIRY_TOPICS:
            _, was_created = InquiryTopic.objects.update_or_create(
                slug=topic['slug'],
                defaults={
                    'label': topic['label'],
                    'group': topic['group'],
                    'order': topic['order'],
                    'is_active': topic.get('is_active', True),
                },
            )
            created_topics += 1 if was_created else 0

        # A slug dropped from the seed would otherwise stay offered forever, since
        # nothing here deletes. They are deactivated rather than removed so a past
        # submission naming one still reads back, and reactivating needs no
        # client change.
        seeded_slugs = {topic['slug'] for topic in INQUIRY_TOPICS}
        retired_topics = InquiryTopic.objects.exclude(
            slug__in=seeded_slugs,
        ).filter(is_active=True).update(is_active=False)

        self.stdout.write(
            self.style.SUCCESS(
                f'Topics: {len(INQUIRY_TOPICS)} in seed, {created_topics} newly created.'
            )
        )
        if retired_topics:
            self.stdout.write(
                self.style.WARNING(
                    f'{retired_topics} topic(s) are no longer in the seed and were '
                    'deactivated. Delete them from the admin if they are not wanted back.'
                )
            )
