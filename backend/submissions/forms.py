"""
Server-side validation for the public forms, and the topic list the /quick-inquiry
form offers.

The Angular forms already validate in the browser, but that is a convenience
for the visitor, not a guarantee: anything can POST to these endpoints
directly. Every rule is re-checked here, and `consent` in particular is only
trustworthy once the server has seen it.

Errors come back as Django's usual `{field: [messages]}` shape, which the
frontend maps straight onto its form controls.
"""
from __future__ import annotations

import re

from django import forms
from django.utils import timezone

from cms.models import InquiryTopic

# The Angular forms are built from TypeScript objects, so their field names are
# camelCase (`fullName`, `areasOfInterest`). Django conventions are snake_case,
# so incoming keys are translated on the way in. The rest of the API already
# speaks camelCase (see api.views._user_payload), so this keeps one convention
# across the wire instead of mixing the two.
_CAMEL_BOUNDARY = re.compile(r'(?<!^)(?=[A-Z])')


def _camel_to_snake(name: str) -> str:
    return _CAMEL_BOUNDARY.sub('_', name).lower()


def _as_text(value) -> str:
    """Coerce a submitted value to a trimmed string.

    The API accepts JSON and form-encoded bodies alike, so a number or boolean
    can arrive where a string was expected. Rendering it as text keeps
    CharField validation meaningful instead of failing on the wrong type.
    """
    if value is None:
        return ''
    if isinstance(value, (list, tuple, dict)):
        return ''
    return str(value).strip()


class CamelCasePayload:
    """
    Accepts camelCase keys and binds them to the snake_case field names.

    Mixed in rather than applied per-form so every future form gets the same
    translation without having to remember it.
    """

    def __init__(self, data=None, *args, **kwargs):
        if isinstance(data, dict):
            data = {_camel_to_snake(key): value for key, value in data.items()}
        super().__init__(data, *args, **kwargs)


class ContactSubmissionForm(CamelCasePayload, forms.Form):
    """Mirrors ContactComponent.contactForm."""

    full_name = forms.CharField(max_length=200, min_length=2)
    email = forms.EmailField()
    phone = forms.CharField(max_length=60)
    country = forms.CharField(max_length=120, required=False)
    company = forms.CharField(max_length=200, required=False)
    client_type = forms.CharField(max_length=80)
    reason_for_contact = forms.CharField(max_length=80)
    areas_of_interest = forms.JSONField(required=False)
    preferred_date = forms.DateTimeField(required=False)
    message = forms.CharField(min_length=10)
    consent = forms.BooleanField(required=True)

    def clean_full_name(self):
        return _as_text(self.cleaned_data.get('full_name'))

    def clean_preferred_date(self):
        """
        Attach the current timezone to a naive value.

        The picker is a native `datetime-local`, so it sends `2026-09-28T14:30`
        with no offset. USE_TZ is on, and storing a naive value would make
        Django warn and shift the stored time on read.
        """
        value = self.cleaned_data.get('preferred_date')
        if value is not None and timezone.is_naive(value):
            value = timezone.make_aware(value, timezone.get_current_timezone())
        return value

    def clean_areas_of_interest(self):
        """
        Keep the selected areas as a list of non-empty strings.

        The frontend sends the solution names, but the endpoint is public, so
        the shape is enforced here rather than trusted.
        """
        value = self.cleaned_data.get('areas_of_interest')
        if value is None:
            return []
        if not isinstance(value, list):
            raise forms.ValidationError('Expected a list of areas of interest.')
        cleaned = []
        for item in value:
            text = _as_text(item)
            if text:
                cleaned.append(text[:200])
        return cleaned


class PropertyLeadSubmissionForm(CamelCasePayload, forms.Form):
    """Mirrors PropertyLeadFormComponent.leadForm."""

    full_name = forms.CharField(max_length=200, min_length=2)
    email = forms.EmailField()
    phone = forms.CharField(max_length=60, required=False)
    location = forms.CharField(max_length=120)
    property_interest = forms.CharField(max_length=120)
    message = forms.CharField(required=False)
    consent = forms.BooleanField(required=True)

    def clean_full_name(self):
        return _as_text(self.cleaned_data.get('full_name'))


class QuickInquiryForm(CamelCasePayload, forms.Form):
    """
    Mirrors QuickInquiryComponent.quickForm.

    The short form: a name, at least one way to reply, and optionally some topics.
    It is deliberately looser than `ContactSubmissionForm` — the point of the page
    is that a visitor can send something in under a minute — but not loose enough
    to store a row nobody can answer.
    """

    name = forms.CharField(max_length=200, min_length=2)
    phone = forms.CharField(max_length=60, required=False)
    email = forms.EmailField(required=False)
    topics = forms.JSONField(required=False)
    consent = forms.BooleanField(required=True)

    def clean_name(self):
        return _as_text(self.cleaned_data.get('name'))

    def clean_phone(self):
        return _as_text(self.cleaned_data.get('phone'))

    def clean(self):
        """
        Require at least one way to reply.

        A stored enquiry with neither an address nor a number is unactionable, so
        this is a form-level error rather than a field error: it belongs to the
        pair, and the frontend shows it under the pair.
        """
        cleaned = super().clean()
        phone = cleaned.get('phone') or ''
        email = cleaned.get('email') or ''
        if not phone and not email:
            self.add_error(
                'phone',
                'Enter a phone number or an email address so we can reply.',
            )
        return cleaned

    def clean_topics(self):
        """
        Keep the selected topic slugs as a list of known, non-empty strings.

        The frontend sends slugs rather than labels so a submission survives a
        topic being renamed. Unknown slugs are dropped rather than rejected: staff
        choosing the list should not be able to reject a visitor's form by adding
        or removing an option.
        """
        value = self.cleaned_data.get('topics')
        if value is None:
            return []
        if not isinstance(value, list):
            raise forms.ValidationError('Expected a list of topics.')
        submitted = [slug for slug in (_as_text(item) for item in value) if slug]
        if not submitted:
            return []
        known = set(
            InquiryTopic.objects.filter(is_active=True).values_list('slug', flat=True)
        )
        return [slug for slug in dict.fromkeys(submitted) if slug in known]


class NewsletterSubscriptionForm(CamelCasePayload, forms.Form):
    """Mirrors NewsletterFormComponent.form."""

    email = forms.EmailField()
