"""
Page content endpoints.

Public (anonymous, read-only):
    GET api/cms/inquiry-topics/      the topic list for the quick-inquiry form
    GET api/content/pages/<slug>/   one page's blocks, for the page to render
    GET api/articles/                newsletter/insight articles, for /insights
    GET api/articles/<slug>/         one article plus its related articles

Staff-only (session cookie, is_staff):
    GET    api/staff/pages/            the card grid, grouped by category
    GET    api/staff/pages/<slug>/     one page's blocks, with labels and order
    PATCH  api/staff/pages/<slug>/     save changed block values
    POST   api/staff/uploads/          store an uploaded image, return its path
    GET    api/staff/images/           images already uploaded, for the picker
    GET    api/staff/articles/         the article list, newest first
    POST   api/staff/articles/create/  create an article
    GET    api/staff/articles/<slug>/  one article, for the editor
    PATCH  api/staff/articles/<slug>/update/  save changed fields
    DELETE api/staff/articles/<slug>/delete/  remove an article

The public read deliberately returns the same values the staff editor writes,
which is what makes an edit appear on the live page. The public read omits
`label` and `order` — those are editing affordances, not page content.
"""
from __future__ import annotations

import json

from django.conf import settings
from django.core.exceptions import SuspiciousFileOperation
from django.http import JsonResponse
from django.utils.text import slugify
from django.views.decorators.http import require_http_methods

from .categories import sort_key
from .image_upload import UploadRejected, store_upload
from .models import Article, ContentBlock, ImageAsset, InquiryTopic, Page

# A single page's block set is small (the home page has ~30), so there is no
# need to cap it the way the submissions lists are capped.
MAX_BLOCKS_PER_PAGE = 500

# The staff article list, capped like the submission lists so a large archive
# cannot slow the admin screen to a crawl.
MAX_STAFF_ARTICLES = 200


def _payload(request) -> dict:
    """Read fields from a JSON body. Same shape the rest of the API accepts."""
    content_type = (request.content_type or '').lower()
    if 'application/json' in content_type:
        try:
            data = json.loads(request.body or b'{}')
        except json.JSONDecodeError:
            return {}
        return data if isinstance(data, dict) else {}
    return {key: value for key, value in request.POST.items()}


def _staff_required(view):
    """Wrap a view so only signed-in staff may call it."""

    def wrapper(request, *args, **kwargs):
        user = request.user
        if not user.is_authenticated or not user.is_staff:
            return JsonResponse({'detail': 'Not signed in.'}, status=403)
        return view(request, *args, **kwargs)

    wrapper.__name__ = view.__name__
    return wrapper


def _page_summary(page: Page) -> dict:
    block_count = page.blocks.count()
    return {
        'slug': page.slug,
        'title': page.title,
        'route': page.route,
        'category': page.category,
        'order': page.order,
        'blockCount': block_count,
        'hasContent': block_count > 0,
        'version': page.content_version,
        'updatedAt': page.updated_at.isoformat(),
    }


def _public_content(page: Page) -> dict:
    """The rendering shape: a flat key -> value map, plus lists."""
    blocks = page.blocks.all()[:MAX_BLOCKS_PER_PAGE]
    return {
        'slug': page.slug,
        'route': page.route,
        'values': {block.key: (block.data if block.kind == ContentBlock.Kind.LIST else block.value) for block in blocks},
        'version': page.content_version,
        'updatedAt': page.updated_at.isoformat(),
    }


def _staff_content(page: Page) -> dict:
    """The editing shape: every block with its label, kind and order."""
    blocks = page.blocks.all()[:MAX_BLOCKS_PER_PAGE]
    return {
        **_page_summary(page),
        'blocks': [block.as_dict() for block in blocks],
    }


# ---------------------------------------------------------------------------
# Public read
# ---------------------------------------------------------------------------


@require_http_methods(['GET'])
def public_inquiry_topics(request):
    """
    The topics offered on the /quick-inquiry form.

    Inactive topics are omitted rather than sent with `active: false`. The form
    renders checkboxes, so a hidden topic should not occupy a slot in the payload
    it has to filter, and a visitor cannot discover a retired option.

    An empty list is a valid 200: staff may have unticked everything, and the
    form's own fallback list covers that case. It is not a 404, because the
    collection exists even with nothing in it.
    """
    topics = (
        InquiryTopic.objects.filter(is_active=True)
        .only('slug', 'label', 'group', 'order', 'is_active')
        .order_by('order', 'label')
    )
    return JsonResponse({'results': [topic.as_dict() for topic in topics]})


@require_http_methods(['GET'])
def public_page_content(request, slug: str):
    """
    One page's current copy.

    Returns 200 with `{"values": {}}` for a page that exists but has no
    migrated copy, so a component can tell "not migrated" from "missing page"
    and fall back to its own hardcoded text either way.
    """
    page = Page.objects.filter(slug=slug).first()
    if page is None:
        return JsonResponse({'detail': 'Unknown page.'}, status=404)
    return JsonResponse(_public_content(page))


@require_http_methods(['GET'])
def public_page_version(request, slug: str):
    """
    Just the change token, for clients watching a page for edits.

    Deliberately tiny: this is polled, so it must not drag the whole block set
    across the wire every few seconds to discover nothing changed. One indexed
    column read, and a full fetch only once the number moves.
    """
    page = Page.objects.only('slug', 'content_version', 'updated_at').filter(slug=slug).first()
    if page is None:
        return JsonResponse({'detail': 'Unknown page.'}, status=404)
    return JsonResponse(
        {
            'slug': page.slug,
            'version': page.content_version,
            'updatedAt': page.updated_at.isoformat(),
        }
    )


# ---------------------------------------------------------------------------
# Staff reads
# ---------------------------------------------------------------------------


@_staff_required
@require_http_methods(['GET'])
def staff_page_list(request):
    """Every page as a card, grouped by category in the shape of the site."""
    pages = list(Page.objects.all().order_by('category', 'order', 'title'))

    categories: dict[str, list[dict]] = {}
    for page in pages:
        categories.setdefault(page.category, []).append(_page_summary(page))

    # Group order follows cms.categories.CATEGORY_ORDER, not the alphabet.
    grouped = [
        {'category': name, 'pages': items}
        for name, items in sorted(categories.items(), key=lambda pair: sort_key(pair[0]))
    ]
    return JsonResponse({'categories': grouped, 'total': len(pages)})


@_staff_required
@require_http_methods(['GET'])
def staff_page_detail(request, slug: str):
    page = Page.objects.filter(slug=slug).first()
    if page is None:
        return JsonResponse({'detail': 'Unknown page.'}, status=404)
    return JsonResponse(_staff_content(page))


# ---------------------------------------------------------------------------
# Staff write
# ---------------------------------------------------------------------------


@_staff_required
@require_http_methods(['PATCH', 'PUT'])
def staff_page_update(request, slug: str):
    """
    Save changed block values.

    Body: {"blocks": {"<key>": <string|array>, ...}}

    Only keys that already exist on the page may be written. An unknown key is
    an error rather than a silent no-op, so a typo in the editor surfaces
    immediately instead of looking like a save that did nothing.

    An empty `blocks` object is a 200 no-op with `changed: []` and an unchanged
    version, not a 400 — "there was nothing to save" is an answer, not a
    malformed request. A `blocks` key that is absent or not an object is a 400.
    """
    page = Page.objects.filter(slug=slug).first()
    if page is None:
        return JsonResponse({'detail': 'Unknown page.'}, status=404)

    submitted = _payload(request).get('blocks')
    if not isinstance(submitted, dict):
        return JsonResponse({'detail': 'Expected a "blocks" object.'}, status=400)

    existing = {block.key: block for block in page.blocks.all()[:MAX_BLOCKS_PER_PAGE]}

    unknown = sorted(set(submitted) - set(existing))
    if unknown:
        # A flat list, not a {key: [...]} object: these are not failures on a
        # block the page has, and the editor distinguishes the two shapes.
        return JsonResponse(
            {
                'detail': 'Unknown block key(s).',
                'errors': [f'"{key}" is not a block on this page.' for key in unknown],
            },
            status=400,
        )

    errors: dict[str, list[str]] = {}
    changed: list[str] = []

    for key, value in submitted.items():
        block = existing[key]

        if block.kind == ContentBlock.Kind.LIST:
            if not isinstance(value, list):
                errors[key] = ['Expected a list.']
                continue
            # Every list block in the seed is an array of objects, except the
            # approach points, which are plain strings. Preserve whichever shape
            # the stored row already has so the editor cannot change the type
            # under the public component.
            if any(item is not None and not isinstance(item, (dict, str)) for item in value):
                errors[key] = ['List items must be objects or strings.']
                continue
            block.data = value
        else:
            if not isinstance(value, str):
                errors[key] = ['Expected text.']
                continue
            block.value = value

        block.save(update_fields=['value', 'data', 'updated_at'])
        changed.append(key)

    # Bump the token whenever anything was written, including a partial save that
    # also reported errors. If one value landed, the page did change, and a
    # viewer still polling the old number would keep showing stale copy.
    version = page.bump_version() if changed else page.content_version

    if errors:
        return JsonResponse(
            {
                'detail': 'Some values were rejected.',
                'errors': errors,
                'changed': changed,
                'version': version,
            },
            status=400,
        )

    return JsonResponse({**_page_summary(page), 'changed': changed, 'version': version})


# ---------------------------------------------------------------------------
# Image uploads
#
# Two endpoints, both staff-only. The upload takes a file and returns the path to
# put in a block; the library lists what has already been uploaded so the editor
# can offer a reuse instead of making the same upload twice.
#
# Neither of these writes a content block. The editor saves the returned path
# through the same PATCH it already uses for copy, so a page's saved state and its
# images can never drift apart.
# ---------------------------------------------------------------------------

# How many images the library returns. Enough to browse recent work without
# paging an endpoint the staff area calls on every editor open.
MAX_LIBRARY_IMAGES = 200


@_staff_required
@require_http_methods(['GET'])
def staff_image_library(request):
    """Images already uploaded, newest first."""
    images = ImageAsset.objects.select_related('uploaded_by').all()[:MAX_LIBRARY_IMAGES]
    return JsonResponse({
        'results': [image.as_dict() for image in images],
        'uploadUrl': '/api/staff/uploads/',
        'maxBytes': settings.MAX_UPLOAD_BYTES,
    })


@_staff_required
@require_http_methods(['POST'])
def staff_image_upload(request):
    """
    Store one uploaded image and return its public path.

    Refusals are 400, never 403: the frontend's auth interceptor treats any 403
    as an expired session and would sign the user out for a file that was merely
    too big. 403 stays reserved for genuinely not being staff.
    """
    upload = request.FILES.get('file')
    alt_text = request.POST.get('altText', '') or ''

    try:
        result = store_upload(upload, alt_text=alt_text, uploaded_by=request.user)
    except UploadRejected as exc:
        return JsonResponse({'detail': str(exc)}, status=400)
    except SuspiciousFileOperation as exc:
        # Raised by Django itself for a malformed multipart body. Not the file's
        # content, so it is a bad request rather than a bad image.
        return JsonResponse({'detail': f'That upload could not be read: {exc}'}, status=400)

    return JsonResponse(result.asset.as_dict(), status=201)


# ---------------------------------------------------------------------------
# Articles (the newsletter / insights authoring screen)
# ---------------------------------------------------------------------------


def _clean_article_input(data: dict, *, require_all: bool) -> tuple[dict, dict]:
    """
    Validate the writable article fields from a JSON body.

    Returns (cleaned, errors). A field absent from `data` is left out of
    `cleaned` unless `require_all` is set, which is what lets one helper serve
    both create (every field present, title and slug required) and update (only
    the fields the editor actually touched).
    """
    cleaned: dict = {}
    errors: dict = {}

    def text(key: str) -> str:
        return str(data.get(key) or '').strip()

    # Title: required on create; optional on update but never accepted empty.
    if require_all or 'title' in data:
        title = text('title')
        if not title:
            errors['title'] = ['Enter a title.']
        else:
            cleaned['title'] = title

    # Slug: required on create, generated from the title when left blank.
    if require_all or 'slug' in data:
        slug = text('slug')
        if not slug and cleaned.get('title'):
            slug = slugify(cleaned['title'])[:140]
        if not slug:
            errors['slug'] = ['Enter a slug, or a title to generate one from.']
        else:
            cleaned['slug'] = slug

    for key in ('author', 'category', 'summary', 'featuredImage'):
        if require_all or key in data:
            cleaned[key] = text(key)

    # Body: an array of paragraph strings, rendered one <p> per entry.
    if require_all or 'body' in data:
        body = data.get('body') or []
        if not isinstance(body, list) or not all(isinstance(p, str) for p in body):
            errors['body'] = ['The body must be a list of paragraphs.']
        else:
            cleaned['body'] = [p.strip() for p in body if p.strip()]

    # Related: an array of other articles' slugs.
    if require_all or 'relatedSlugs' in data:
        related = data.get('relatedSlugs') or []
        if not isinstance(related, list) or not all(isinstance(s, str) for s in related):
            errors['relatedSlugs'] = ['Related articles must be a list of slugs.']
        else:
            cleaned['relatedSlugs'] = [s.strip() for s in related if s.strip()]

    return cleaned, errors


@_staff_required
@require_http_methods(['GET'])
def staff_article_list(request):
    """Every article, newest first, for the /admin/newsletters list."""
    articles = list(Article.objects.all()[:MAX_STAFF_ARTICLES])
    return JsonResponse({
        'count': Article.objects.count(),
        'results': [article.as_staff_dict() for article in articles],
    })


@_staff_required
@require_http_methods(['POST'])
def staff_article_create(request):
    """Create one article. The slug is generated from the title when blank."""
    data = _payload(request)
    cleaned, errors = _clean_article_input(data, require_all=True)

    slug = cleaned.get('slug')
    if slug and Article.objects.filter(slug=slug).exists():
        errors['slug'] = ['That slug is already in use.']

    if errors:
        return JsonResponse({'detail': 'Check the highlighted fields.', 'errors': errors}, status=400)

    article = Article.objects.create(
        slug=cleaned['slug'],
        title=cleaned['title'],
        author=cleaned.get('author', ''),
        category=cleaned.get('category', ''),
        summary=cleaned.get('summary', ''),
        body=cleaned.get('body', []),
        featured_image=cleaned.get('featuredImage', ''),
        related=cleaned.get('relatedSlugs', []),
    )
    return JsonResponse({'article': article.as_staff_dict()}, status=201)


@_staff_required
@require_http_methods(['GET'])
def staff_article_detail(request, slug: str):
    """One article, for the editor to load."""
    article = Article.objects.filter(slug=slug).first()
    if article is None:
        return JsonResponse({'detail': 'Unknown article.'}, status=404)
    return JsonResponse({'article': article.as_staff_dict()})


@_staff_required
@require_http_methods(['PATCH'])
def staff_article_update(request, slug: str):
    """
    Save the fields the editor touched. Only keys present in the body are
    written, so an editor can send a partial payload without clearing the rest.
    """
    article = Article.objects.filter(slug=slug).first()
    if article is None:
        return JsonResponse({'detail': 'Unknown article.'}, status=404)

    data = _payload(request)
    cleaned, errors = _clean_article_input(data, require_all=False)

    new_slug = cleaned.get('slug')
    if new_slug and new_slug != article.slug and Article.objects.filter(slug=new_slug).exists():
        errors['slug'] = ['That slug is already in use.']

    if errors:
        return JsonResponse({'detail': 'Check the highlighted fields.', 'errors': errors}, status=400)

    field_map = {
        'title': 'title',
        'slug': 'slug',
        'author': 'author',
        'category': 'category',
        'summary': 'summary',
        'body': 'body',
        'featuredImage': 'featured_image',
        'relatedSlugs': 'related',
    }
    changed = []
    for wire, attr in field_map.items():
        if wire in cleaned:
            setattr(article, attr, cleaned[wire])
            changed.append(wire)

    if changed:
        article.save()

    return JsonResponse({'article': article.as_staff_dict(), 'changed': changed})


@_staff_required
@require_http_methods(['DELETE'])
def staff_article_delete(request, slug: str):
    """Remove an article. The public URL stops working immediately."""
    article = Article.objects.filter(slug=slug).first()
    if article is None:
        return JsonResponse({'detail': 'Unknown article.'}, status=404)
    article.delete()
    return JsonResponse({'detail': 'Article deleted.'})


@require_http_methods(['GET'])
def public_article_list(request):
    """Every article, newest first — the /insights index grid."""
    articles = Article.objects.all()
    return JsonResponse({
        'count': articles.count(),
        'results': [article.as_public_dict() for article in articles],
    })


@require_http_methods(['GET'])
def public_article_detail(request, slug: str):
    """One article plus a few related ones, for the article page."""
    article = Article.objects.filter(slug=slug).first()
    if article is None:
        return JsonResponse({'detail': 'Unknown article.'}, status=404)

    related_slugs = article.related if isinstance(article.related, list) else []
    related = [
        item.as_public_dict()
        for item in Article.objects.filter(slug__in=related_slugs).exclude(pk=article.pk)[:3]
    ]
    return JsonResponse({'article': article.as_public_dict(), 'related': related})

