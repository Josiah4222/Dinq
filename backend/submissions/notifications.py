"""Email notifications for new public submissions.

A new enquiry should reach the team without anyone watching the staff screen.
Sending is deliberately best-effort: the visitor's 201 must not depend on an
SMTP handshake, and a mail outage must never turn a stored submission into an
error the submitter sees. The row is already saved by the time this runs, so a
failed email only means a notification was missed, not that data was lost.

Recipients and the relay come from settings, so the address can change without
a code change or a deploy.
"""
from __future__ import annotations

import logging

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

logger = logging.getLogger(__name__)


def _notification_recipients() -> list[str]:
    """The addresses a new-submission alert goes to, or an empty list.

    Empty means notifications are switched off (no SMTP configured or no
    recipients set), which is a valid state: the submission is still stored and
    shows up in the staff panel.
    """
    return list(getattr(settings, 'CONTACT_NOTIFICATION_EMAILS', []) or [])


def _contact_lines(record) -> list[str]:
    """A label: value line for each field that carries a value."""
    fields = [
        ('Reference', f'CON-{record.pk:06d}'),
        ('Name', record.full_name),
        ('Email', record.email),
        ('Phone', record.phone),
        ('Company', record.company),
        ('Country', record.country),
        ('Client type', record.client_type),
        ('Reason for contact', record.reason_for_contact),
        ('Areas of interest', ', '.join(record.areas_of_interest or [])),
        (
            'Preferred date',
            timezone.localtime(record.preferred_date).strftime('%Y-%m-%d %H:%M')
            if record.preferred_date
            else '',
        ),
    ]
    lines = [f'{label}: {value}' for label, value in fields if value]
    lines.append('')
    lines.append('Message:')
    lines.append(record.message or '(none)')
    return lines


def notify_new_contact(record) -> None:
    """Email the team about a new /contact consultation request.

    Never raises. A mail failure is logged and swallowed so the form still
    answers the visitor as if nothing went wrong -- because, for them, nothing
    did.
    """
    recipients = _notification_recipients()
    if not recipients:
        return

    reference = f'CON-{record.pk:06d}'
    subject = f'New contact request — {record.full_name} ({reference})'
    lines = _contact_lines(record)
    lines.append('')
    lines.append(
        f'Received: {timezone.localtime(record.created_at).strftime("%Y-%m-%d %H:%M %Z")}'
    )
    body = '\n'.join(lines)

    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipients,
            fail_silently=False,
        )
    except Exception:
        logger.exception('Contact notification email failed for %s', reference)
