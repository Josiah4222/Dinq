"""
Editable page content.

The public site is a set of Angular routes, each with copy currently hardcoded in
its component. This app holds that copy in the database so staff can change it
without a deploy, and exposes it to two audiences: the public pages (read-only)
and the staff CMS screen under /admin/pages (read + write).

Shape:
    Page         one per public route, carrying the grouping the CMS screen shows
    ContentBlock one editable value on a page — a heading, a paragraph, or a list

Blocks are keyed rather than positional (`hero.title`, not `block-7`) so content
can be reordered or inserted without rewriting unrelated rows, and so the public
component can look a value up by name and fall back to its own copy when the
database has nothing.
"""
from django.conf import settings
from django.db import models
from django.db.models import F
from django.utils import timezone


class Page(models.Model):
    """
    One public route.

    A row is created for every page up front so the CMS screen can show the full
    inventory as cards — including pages whose copy has not been migrated out of
    the Angular components yet. `has_content` is what tells those two states
    apart in the UI.
    """

    slug = models.SlugField(max_length=120, unique=True)
    title = models.CharField(max_length=200)
    route = models.CharField(
        max_length=200,
        help_text='Public path, e.g. /about/leadership. Shown as the card link.',
    )

    category = models.CharField(
        max_length=80,
        db_index=True,
        help_text='Grouping in the CMS screen, e.g. "About" or "Solutions".',
    )

    order = models.PositiveIntegerField(
        default=0,
        help_text='Sort within a category. Lower comes first.',
    )

    content_version = models.PositiveIntegerField(
        default=1,
        help_text=(
            'Incremented on every accepted edit. Clients poll this to notice a change, '
            'so it must change even when two saves land in the same clock tick — which '
            'a timestamp compared for inequality cannot guarantee.'
        ),
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'order', 'title']
        verbose_name = 'Page'
        verbose_name_plural = 'Pages'

    def __str__(self) -> str:
        return f'{self.category} / {self.title}'

    @property
    def has_content(self) -> bool:
        return self.blocks.exists()

    def bump_version(self) -> int:
        """
        Increment the change token and return the new value.

        Uses F() so two concurrent saves cannot both read the same number and one
        overwrite the other, and sets updated_at explicitly because a queryset
        .update() bypasses auto_now. Callers must be inside a transaction.
        """
        Page.objects.filter(pk=self.pk).update(
            content_version=F('content_version') + 1,
            updated_at=timezone.now(),
        )
        self.refresh_from_db(fields=['content_version', 'updated_at'])
        return self.content_version


class ContentBlock(models.Model):
    """
    A single editable value on a page.

    `kind` decides the editor control the CMS screen renders and how the public
    component reads the value: a heading is a single input, a paragraph is a
    textarea, and a repeating group (the partner cards, the solution list) is a
    JSON array in `data`.
    """

    class Kind(models.TextChoices):
        TEXT = 'text', 'Short text (single line)'
        TEXTAREA = 'textarea', 'Long text (paragraph)'
        LIST = 'list', 'Repeating list'
        IMAGE = 'image', 'Image'

    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name='blocks')

    key = models.CharField(
        max_length=120,
        help_text='Stable dotted name, e.g. hero.title. The public component looks values up by this.',
    )

    kind = models.CharField(max_length=20, choices=Kind.choices, default=Kind.TEXT)

    label = models.CharField(
        max_length=200,
        help_text='Field name shown above the input in the CMS screen.',
    )

    value = models.TextField(
        blank=True,
        default='',
        help_text='Text content, for text/textarea/image blocks.',
    )

    data = models.JSONField(
        default=list,
        blank=True,
        help_text='Array content, for list blocks.',
    )

    order = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'key']
        constraints = [
            models.UniqueConstraint(fields=['page', 'key'], name='unique_block_key_per_page'),
        ]
        verbose_name = 'Content block'
        verbose_name_plural = 'Content blocks'

    def __str__(self) -> str:
        return f'{self.page.slug}: {self.key}'

    def as_dict(self) -> dict:
        """The shape the API and the public component use."""
        return {
            'key': self.key,
            'kind': self.kind,
            'label': self.label,
            'value': self.value,
            'data': self.data,
            'order': self.order,
            'updatedAt': self.updated_at.isoformat(),
        }


class InquiryTopic(models.Model):
    """
    One selectable topic on the /quick-inquiry form.

    Lives here rather than in `submissions` because staff choose the options, not
    visitors: it is editable content, so it belongs with the other content and is
    managed in the same admin. The chosen topics on a submitted inquiry are copied
    into the submission's `areas_of_interest`, so renaming or retiring a topic
    never rewrites history.

    `slug` is the stable id the frontend keys its ticked-state on. It is not the
    label, so renaming the wording a visitor sees leaves existing selections
    matched.
    """

    class Group(models.TextChoices):
        """Which column of the form the topic appears under."""

        CANADIAN = 'canadian', 'Canadian advisory services'
        ETHIOPIA = 'ethiopia', 'Ethiopia sectors'

    slug = models.SlugField(
        max_length=120,
        unique=True,
        help_text='Stable id used by the form, e.g. sector-mining. Not shown to visitors.',
    )

    label = models.CharField(
        max_length=120,
        help_text='Wording shown as the checkbox.',
    )

    group = models.CharField(
        max_length=20,
        choices=Group.choices,
        default=Group.ETHIOPIA,
        db_index=True,
        help_text='Column of the form this topic is offered under.',
    )

    order = models.PositiveIntegerField(
        default=0,
        help_text='Sort within the form. Lower comes first; ties break by label.',
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text=(
            'Untick to hide it from the form. Existing submissions keep the topic '
            'they were sent with.'
        ),
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['group', 'order', 'label']
        verbose_name = 'Inquiry topic'
        verbose_name_plural = 'Inquiry topics'

    def __str__(self) -> str:
        return self.label

    def as_dict(self) -> dict:
        """The wire shape the public form reads. camelCase, like the rest of the API."""
        return {
            'id': self.slug,
            'label': self.label,
            'group': self.group,
            'order': self.order,
            'active': self.is_active,
        }


class ImageAsset(models.Model):
    """
    One uploaded image, offered to staff as a pickable library.

    The file itself lives on disk under MEDIA_ROOT; this row is the catalogue.
    It exists so the editor can offer "reuse an image we already have" and so a
    staff member can see what has been uploaded and by whom, which a directory
    listing on the server cannot answer.

    Nothing renders from this model directly. A content block still stores a
    path string, because that is what the public API already serves and what the
    frontend already reads - this is the library that path was picked from, not a
    second way of pointing at an image. That also means deleting a row here never
    breaks a live page; the block keeps its own copy of the path.
    """

    # Matches the uploads the validator accepts, minus gif: animated logos are
    # almost never what a hero image should be, and a gif can be a very large
    # thing to put on a page.
    CONTENT_TYPES = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'image/avif': '.avif',
    }

    original_name = models.CharField(
        max_length=255,
        help_text='The filename as it was uploaded, kept for display only.',
    )

    # Root-absolute public path, e.g. /media/uploads/2026/09/hero.jpg. This is
    # what gets written into a content block, and why it is stored absolute: a
    # relative value would resolve against whatever page the visitor is on.
    path = models.CharField(
        max_length=500,
        unique=True,
        help_text='Root-absolute public path written into content blocks.',
    )

    # Relative to MEDIA_ROOT, used to find the file again for reading its
    # dimensions and for the admin thumbnail.
    storage_path = models.CharField(
        max_length=500,
        help_text='Location on disk, relative to MEDIA_ROOT.',
    )

    content_type = models.CharField(
        max_length=100,
        help_text='Detected from the file contents, not trusted from the browser.',
    )

    size_bytes = models.PositiveIntegerField(
        help_text='File size in bytes.',
    )

    width = models.PositiveIntegerField(
        default=0,
        help_text='Pixel width, 0 if it could not be read.',
    )

    height = models.PositiveIntegerField(
        default=0,
        help_text='Pixel height, 0 if it could not be read.',
    )

    alt_text = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text=(
            'Suggested description for when this image is picked. Optional - the '
            'decorative hero images on this site take empty alt text.'
        ),
    )

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='uploaded_images',
        help_text='The staff member who uploaded it. Null if their account was removed.',
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Image'
        verbose_name_plural = 'Images'

    def __str__(self) -> str:
        return self.original_name

    def as_dict(self) -> dict:
        """The wire shape the staff editor reads."""
        return {
            'path': self.path,
            'name': self.original_name,
            'contentType': self.content_type,
            'sizeBytes': self.size_bytes,
            'width': self.width,
            'height': self.height,
            'altText': self.alt_text,
            'uploadedAt': self.created_at.isoformat(),
        }

