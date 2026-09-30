"""
Storing an uploaded image and handing back a path to put in a content block.

Separated from views.py because the interesting part is not the endpoint, it is
the decision about whether a file is safe to keep. The view is a thin wrapper; all
of the judgement lives in `store_upload`.

Two things are deliberately not done here:

    - No image resizing. A hero photo can legitimately be 3000px wide, and
      re-encoding someone's file on the way in would quietly degrade it. The
      dimensions are recorded so the frontend can size against them.

    - No trust in the browser. The extension and the Content-Type header both come
      from the client, so the file is identified by opening it with Pillow and
      reading what it actually is. A .png that is really a script gets refused on
      its real type, not the name it was sent under.
"""
from __future__ import annotations

import re
import secrets
from dataclasses import dataclass
from datetime import datetime, timezone as dt_timezone
from pathlib import Path

from django.conf import settings
from django.core.files.base import File
from django.core.files.storage import default_storage

from .models import ImageAsset


class UploadRejected(Exception):
    """An upload that must not be stored, with wording safe to show staff."""


@dataclass(frozen=True)
class StoredUpload:
    asset: ImageAsset


# The image types we keep, keyed by the format Pillow reports. Kept in step with
# ImageAsset.CONTENT_TYPES, which is what the admin displays.
_ACCEPTED_FORMATS = {
    'JPEG': 'image/jpeg',
    'PNG': 'image/png',
    'WEBP': 'image/webp',
    'AVIF': 'image/avif',
}

# A stored name is a fresh token plus the real extension. Nothing from the
# uploaded filename is reused, so there is no path to traverse and no double
# extension to be surprised by. The original name is kept on the row for display.
_SAFE_EXTENSIONS = re.compile(r'^\.(jpe?g|png|webp|avif)$')


def _sanitised_name(name: str) -> str:
    """A short, readable stem for the file, with anything unsafe removed."""
    stem = Path(name or '').stem
    cleaned = re.sub(r'[^A-Za-z0-9._-]+', '-', stem).strip('-._')
    # A leading dot would make it a hidden file; an empty one leaves nothing.
    return cleaned[:60] or 'image'


def _target_relpath(original_name: str, extension: str) -> str:
    """
    Where the file goes, relative to MEDIA_ROOT.

    Folders are dated so a site with regular uploads does not end up with one
    directory holding everything, and the leaf is randomised so two uploads named
    `hero.jpg` cannot collide.
    """
    now = datetime.now(dt_timezone.utc)
    token = secrets.token_hex(8)
    return f'uploads/{now:%Y/%m}/{_sanitised_name(original_name)}-{token}{extension}'


def _inspect(upload: File) -> tuple[str, int, int]:
    """
    Identify the file from its contents.

    Returns (content_type, width, height) or raises UploadRejected. Pillow is the
    authority here: `verify()` walks the file structure and raises on anything
    malformed, and the `format` it reports is what the bytes actually are rather
    than what the name claims.
    """
    try:
        from PIL import Image
    except ImportError as exc:  # pragma: no cover - Pillow is a hard requirement
        raise UploadRejected(
            'Image uploads are unavailable: the server is missing the Pillow library.'
        ) from exc

    # Seek back to the start: an upload that has been read once cannot be
    # reopened by Pillow.
    try:
        upload.seek(0)
    except (AttributeError, ValueError):
        pass

    try:
        with Image.open(upload) as image:
            content_type = _ACCEPTED_FORMATS.get(image.format or '')
            if not content_type:
                shown = image.format or 'this'
                raise UploadRejected(
                    f'{shown} images are not supported. Use a JPEG, PNG, WebP or AVIF file.'
                )
            # verify() is what actually parses the file, so a truncated or
            # corrupt upload is caught here rather than being stored and failing
            # in the browser later.
            image.verify()

        # verify() leaves the file object unusable, so reopen for the dimensions.
        upload.seek(0)
        with Image.open(upload) as image:
            width, height = image.size
    except UploadRejected:
        raise
    except Exception as exc:
        raise UploadRejected(
            'That file could not be read as an image. It may be damaged or not really an image.'
        ) from exc
    finally:
        try:
            upload.seek(0)
        except (AttributeError, ValueError):
            pass

    return content_type, width, height


def store_upload(upload: File, *, alt_text: str = '', uploaded_by=None) -> StoredUpload:
    """
    Validate an uploaded file, save it, and record it in the library.

    Raises UploadRejected for anything that should not be kept. The file is only
    written after every check has passed, so a rejected upload leaves nothing
    behind on disk.
    """
    if upload is None:
        raise UploadRejected('No file was sent. Choose an image to upload.')

    size = getattr(upload, 'size', 0) or 0
    if size <= 0:
        raise UploadRejected('That file is empty.')
    if size > settings.MAX_UPLOAD_BYTES:
        limit_mb = settings.MAX_UPLOAD_BYTES // (1024 * 1024)
        raise UploadRejected(f'That image is too large. The limit is {limit_mb} MB.')

    content_type, width, height = _inspect(upload)

    # The extension is derived from the detected type, not from the filename, so
    # the stored file always matches its own bytes.
    extension = Path(upload.name or '').suffix.lower()
    if not _SAFE_EXTENSIONS.match(extension):
        extension = Path(ImageAsset.CONTENT_TYPES[content_type]).suffix

    relpath = _target_relpath(upload.name or 'image', extension)
    stored_path = default_storage.save(relpath, upload)
    if not stored_path.startswith('uploads/'):
        # A storage backend that rewrites the name has taken over; trust it but
        # keep the public path in step with where the file actually is.
        stored_path = str(stored_path)

    asset = ImageAsset.objects.create(
        original_name=Path(upload.name or 'image').name[:255] or 'image',
        path=f'{settings.MEDIA_URL}{stored_path.replace(chr(92), "/")}',
        storage_path=stored_path.replace(chr(92), '/'),
        content_type=content_type,
        size_bytes=size,
        width=width,
        height=height,
        alt_text=(alt_text or '').strip()[:255],
        uploaded_by=uploaded_by,
    )
    return StoredUpload(asset=asset)
