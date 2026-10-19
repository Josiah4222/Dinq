"""
Submission endpoints.

Public (CSRF-protected, anonymous):
    POST api/submissions/contact/         the /contact consultation form
    POST api/submissions/quick-inquiry/   the /quick-inquiry short form
    POST api/submissions/property-lead/   the PAM lead form
    POST api/submissions/newsletter/      the /insights signup

Staff-only (session cookie, is_staff):
    GET api/staff/submissions/contact/     ?source=contact|quick_inquiry
    GET api/staff/submissions/contact/<pk>/  ?source=contact|quick_inquiry
    POST api/staff/submissions/contact/<pk>/seen/?source=contact|quick_inquiry
    GET api/staff/submissions/property-lead/
    GET api/staff/submissions/newsletter/

Public writes return 201 with a short reference so a visitor can quote it, but
never echo the stored row back. Staff reads are the Angular /staff screen's
data source; the Django admin covers search and CSV export.
"""
from __future__ import annotations

import json

from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_http_methods

from .forms import (
    ContactSubmissionForm,
    NewsletterSubscriptionForm,
    PropertyLeadSubmissionForm,
    QuickInquiryForm,
)
from .models import ContactSubmission, NewsletterSubscriber, PropertyLeadSubmission
from .notifications import notify_new_contact

from cms.models import InquiryTopic

# How many rows a single staff list call may return. The staff screen pages
# through results; an unbounded list would grow without limit.
MAX_STAFF_ROWS = 200


def _payload(request) -> dict:
    """
    Read fields from either a JSON body or a form-encoded body.

    Mirrors api.views._payload so the two halves of the API accept the same
    shapes.
    """
    content_type = (request.content_type or '').lower()
    if 'application/json' in content_type:
        try:
            data = json.loads(request.body or b'{}')
        except json.JSONDecodeError:
            return {}
        return data if isinstance(data, dict) else {}
    return {key: value for key, value in request.POST.items()}


def _form_errors(form) -> dict:
    """Django's ErrorDict, JSON-encoded. `{field: [message, ...]}`."""
    return {field: list(messages) for field, messages in form.errors.items()}


def _reference(prefix: str, pk: int) -> str:
    """A short human-quotable id, e.g. `CON-7F3A2B`."""
    return f'{prefix}-{pk:06d}'


# ---------------------------------------------------------------------------
# Public writes
# ---------------------------------------------------------------------------


@require_http_methods(['POST'])
def submit_contact(request):
    """Store a /contact consultation request."""
    form = ContactSubmissionForm(_payload(request))
    if not form.is_valid():
        return JsonResponse({'errors': _form_errors(form)}, status=400)

    data = form.cleaned_data
    record = ContactSubmission.objects.create(
        full_name=data['full_name'],
        email=data['email'],
        phone=data['phone'],
        country=data.get('country', ''),
        company=data.get('company', ''),
        client_type=data['client_type'],
        reason_for_contact=data['reason_for_contact'],
        areas_of_interest=data.get('areas_of_interest', []),
        preferred_date=data.get('preferred_date'),
        message=data['message'],
        consent=data['consent'],
    )

    # Best-effort: the row is stored, so a mail failure must not fail the form.
    notify_new_contact(record)

    return JsonResponse(
        {
            'reference': _reference('CON', record.pk),
            'detail': 'Thank you. We will be in touch shortly.',
        },
        status=201,
    )


@require_http_methods(['POST'])
def submit_quick_inquiry(request):
    """
    Store a /quick-inquiry message.

    Stored as a `ContactSubmission` with `source=quick_inquiry`. Both forms share
    the table because they are the same business event, but staff work them as
    two queues, so `source` lets the list and the counts split them. The topic
    slugs are translated to their labels on the way in: the row should read as
    what the visitor selected even after a topic is renamed or retired, since
    staff are looking at the label, not the slug.
    """
    form = QuickInquiryForm(_payload(request))
    if not form.is_valid():
        return JsonResponse({'errors': _form_errors(form)}, status=400)

    data = form.cleaned_data
    slugs = data.get('topics') or []

    # Slugs that are no longer active still resolve, because a submission sent
    # last week must not lose its topics when staff retire one today. The queryset
    # is only touched when there is something to look up.
    labels_by_slug = dict(
        InquiryTopic.objects.filter(slug__in=slugs).values_list('slug', 'label')
    ) if slugs else {}

    record = ContactSubmission.objects.create(
        source=ContactSubmission.Source.QUICK_INQUIRY,
        full_name=data['name'],
        email=data.get('email') or '',
        phone=data.get('phone') or '',
        areas_of_interest=[labels_by_slug.get(slug, slug) for slug in slugs],
        consent=data['consent'],
    )

    return JsonResponse(
        {
            'reference': _reference('QIN', record.pk),
            'detail': 'Thank you. We will be in touch shortly.',
        },
        status=201,
    )


@require_http_methods(['POST'])
def submit_property_lead(request):
    """Store a Property & Asset Management lead."""
    form = PropertyLeadSubmissionForm(_payload(request))
    if not form.is_valid():
        return JsonResponse({'errors': _form_errors(form)}, status=400)

    data = form.cleaned_data
    record = PropertyLeadSubmission.objects.create(
        full_name=data['full_name'],
        email=data['email'],
        phone=data.get('phone', ''),
        location=data['location'],
        property_interest=data['property_interest'],
        message=data.get('message', ''),
        consent=data['consent'],
    )

    return JsonResponse(
        {
            'reference': _reference('PAL', record.pk),
            'detail': 'Thank you. We will be in touch shortly.',
        },
        status=201,
    )


@require_http_methods(['POST'])
def subscribe_newsletter(request):
    """
    Record a newsletter signup.

    Repeat signups are not an error: the existing row is reactivated and the
    same 201 comes back, so a double-click or a resubmit never shows the
    visitor an error for something they already did.
    """
    form = NewsletterSubscriptionForm(_payload(request))
    if not form.is_valid():
        return JsonResponse({'errors': _form_errors(form)}, status=400)

    email = form.cleaned_data['email']
    subscriber, created = NewsletterSubscriber.objects.get_or_create(
        email=email,
        defaults={'is_active': True},
    )
    if not created and not subscriber.is_active:
        subscriber.is_active = True
        subscriber.unsubscribed_at = None
        subscriber.save(update_fields=['is_active', 'unsubscribed_at'])

    return JsonResponse(
        {
            'detail': 'You are subscribed to the Dinq newsletter.',
            'alreadySubscribed': not created,
        },
        status=201,
    )


# ---------------------------------------------------------------------------
# Staff reads
# ---------------------------------------------------------------------------


def _staff_required(view):
    """Wrap a view so only signed-in staff may call it."""

    def wrapper(request, *args, **kwargs):
        user = request.user
        if not user.is_authenticated or not user.is_staff:
            return JsonResponse({'detail': 'Not signed in.'}, status=403)
        return view(request, *args, **kwargs)

    wrapper.__name__ = view.__name__
    return wrapper


def _serialize_contact(record) -> dict:
    return {
        'id': record.pk,
        'reference': _reference('CON', record.pk),
        'createdAt': record.created_at.isoformat(),
          'status': record.status,
          'notes': record.notes,
          'seenAt': record.seen_at.isoformat() if record.seen_at else None,
          'source': record.source,

          'consent': record.consent,
          'fullName': record.full_name,

        'email': record.email,
        'phone': record.phone,
        'country': record.country,
        'company': record.company,
        'clientType': record.client_type,
        'reasonForContact': record.reason_for_contact,
        'areasOfInterest': record.areas_of_interest or [],
        'preferredDate': record.preferred_date.isoformat() if record.preferred_date else None,
        'message': record.message,
    }


def _serialize_property_lead(record) -> dict:
    return {
        'id': record.pk,
        'reference': _reference('PAL', record.pk),
        'createdAt': record.created_at.isoformat(),
        'status': record.status,
        'notes': record.notes,
        'fullName': record.full_name,
        'email': record.email,
        'phone': record.phone,
        'location': record.location,
        'propertyInterest': record.property_interest,
        'message': record.message,
    }


def _serialize_subscriber(record) -> dict:
    return {
        'id': record.pk,
        'createdAt': record.created_at.isoformat(),
        'email': record.email,
        'isActive': record.is_active,
        'unsubscribedAt': record.unsubscribed_at.isoformat() if record.unsubscribed_at else None,
    }


@require_http_methods(['GET'])
@_staff_required
def staff_submission_counts(request):
    """
    Row counts per submission type, for the staff sidebar.

    A separate endpoint because the sidebar shows all three counts on every staff
    screen, including ones where the list itself is never opened. Reading them
    from the list endpoints would mean pulling up to three pages of rows just to
    render three numbers, and the counts would be absent for whichever tab had
    not been opened yet.

    The counts cover the whole table, matching the `count` the list endpoints
    report, so the sidebar number and the number of rows shown cannot disagree.

    `contacts` is the count of the full consultation requests and `quickInquiries`
    the short-form ones, which between them are every row in the table. They are
    reported separately because the staff screen lists them as two destinations
    and a badge that counted both would sit next to a list showing one of them.
    `contactsTotal` is kept for callers that want the undivided number.
    """
    return JsonResponse(
        {
            'contacts': ContactSubmission.objects.filter(
                source=ContactSubmission.Source.CONTACT
            ).count(),
            'quickInquiries': ContactSubmission.objects.filter(
                source=ContactSubmission.Source.QUICK_INQUIRY
            ).count(),
            'contactsTotal': ContactSubmission.objects.count(),
            'propertyLeads': PropertyLeadSubmission.objects.count(),
            'newsletter': NewsletterSubscriber.objects.count(),
            'newsletterActive': NewsletterSubscriber.objects.filter(is_active=True).count(),
        }
    )


@require_http_methods(['GET'])
@_staff_required
def staff_contact_list(request):
    """
    Contact submissions, newest first, optionally filtered by status or source.

    The two forms that land here are one table, so the staff screen can ask for
    either kind on its own: `?source=contact` for the full consultation requests
    and `?source=quick_inquiry` for the short form. That is what lets them be
    separate queues to work, without giving up a single place to see everything
    when neither filter is sent.

    An unrecognised `source` is ignored rather than refused. It is a display
    filter, not a data boundary: a typo should show the unfiltered list, which
    is the safe direction, rather than an error the staff member cannot act on.
    """
    queryset = ContactSubmission.objects.all()

    status = request.GET.get('status')
    if status:
        queryset = queryset.filter(status=status)

    source = request.GET.get('source')
    if source in ContactSubmission.Source.values:
        queryset = queryset.filter(source=source)

    rows = queryset[:MAX_STAFF_ROWS]
    return JsonResponse(
        {
            'count': queryset.count(),
            'results': [_serialize_contact(row) for row in rows],
        }
    )


@require_http_methods(['GET'])
@_staff_required
def staff_contact_detail(request, pk):
    """
    One contact row in full, for the screen a staff member opens from the list.

    The lists show a line each — enough to recognise a submission and decide
    which one to open — so the message, the notes, and the rest are fetched here
    rather than being carried in every list row. Nothing is lost by that: the
    detail is the same record, read again.

    `?source=` is optional and, unlike on the list, it is a real check rather
    than a convenience filter. A detail URL is pasted and edited by hand, so
    asking for a quick inquiry and receiving a full consultation would put the
    wrong form's shape around the same numbers. A row that is not the kind asked
    for is reported as missing, which is the same answer as a bad id.
    """
    queryset = ContactSubmission.objects.all()

    source = request.GET.get('source')
    if source in ContactSubmission.Source.values:
        queryset = queryset.filter(source=source)

    record = queryset.filter(pk=pk).first()
    if record is None:
        return JsonResponse({'detail': 'Not found.'}, status=404)

    return JsonResponse(_serialize_contact(record))


@require_http_methods(['POST'])
@_staff_required
def staff_contact_mark_seen(request, pk):
    """
    Record that a staff member has opened this submission.

    Opening a message should stop it looking unread, so the row's `new` flag
    stops nagging the team about something already dealt with. It does not
    advance `status`: reading a submission and starting work on it are different
    acts, and only the second should move it to in progress.

    Two details make this safe to call from a screen render:

    - It only ever writes a first time. A second view leaves the original
      timestamp alone, so "seen at" keeps meaning when it arrived rather than
      when someone last scrolled past it, and calling it twice is harmless.
    - The write is a single conditional UPDATE, not a read followed by a save,
      so two people opening the same submission at once cannot overwrite each
      other's timestamp.

    A row that is not there, or not the kind asked for, is a 404 like the detail
    screen, and an already-seen row answers 200 with what it was rather than an
    error, because the caller's intent — "this should be seen" — is satisfied.
    """
    queryset = ContactSubmission.objects.all()

    source = request.GET.get('source')
    if source in ContactSubmission.Source.values:
        queryset = queryset.filter(source=source)

    record = queryset.filter(pk=pk).first()
    if record is None:
        return JsonResponse({'detail': 'Not found.'}, status=404)

    if record.seen_at is None:
        queryset.filter(pk=pk, seen_at__isnull=True).update(seen_at=timezone.now())

    return JsonResponse(_serialize_contact(queryset.filter(pk=pk).first()))


@require_http_methods(['GET'])
@_staff_required
def staff_property_lead_list(request):
    """Property leads, newest first, optionally filtered by status."""
    queryset = PropertyLeadSubmission.objects.all()

    status = request.GET.get('status')
    if status:
        queryset = queryset.filter(status=status)

    rows = queryset[:MAX_STAFF_ROWS]
    return JsonResponse(
        {
            'count': queryset.count(),
            'results': [_serialize_property_lead(row) for row in rows],
        }
    )


@require_http_methods(['GET'])
@_staff_required
def staff_newsletter_list(request):
    """
    Newsletter subscribers plus per-tab counts.

    The counts are for the staff screen's tab labels, so they cover the whole
    table rather than just the page being displayed.
    """
    queryset = NewsletterSubscriber.objects.all()

    return JsonResponse(
        {
            'count': queryset.count(),
            'activeCount': queryset.filter(is_active=True).count(),
            'results': [_serialize_subscriber(row) for row in queryset[:MAX_STAFF_ROWS]],
        }
    )
