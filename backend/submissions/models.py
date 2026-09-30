"""
Stored form submissions from the public site.

One model per form rather than a single table with a JSON blob: staff filter
and search these in the admin, and typed columns are what make that practical.
`Submission` holds the fields every form shares (workflow status, staff notes,
timestamp) so the three concrete models stay short.
"""
from django.db import models


class Submission(models.Model):
    """
    Abstract base for the contact and property-lead forms.

    Newsletter signups are not a `Submission`: a subscriber has no workflow,
    only an active/unsubscribed flag, so modelling it as one would add columns
    that are always empty.
    """

    class Status(models.TextChoices):
        NEW = 'new', 'New'
        IN_PROGRESS = 'in_progress', 'In progress'
        CLOSED = 'closed', 'Closed'
        SPAM = 'spam', 'Spam'

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NEW,
        db_index=True,
    )
    """Free-text workspace for staff. Never shown to the submitter."""

    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    seen_at = models.DateTimeField(null=True, blank=True, db_index=True)
    """When a staff member first opened this submission, or null if nobody has.

    Separate from `status` on purpose. `status` is where a submission is in the
    work, and opening a message is not the same as starting on it. Folding
    "someone looked at this" into the status would mean reading a submission
    silently claimed it as in progress, and there would be no way back to telling
    the two apart.

    One timestamp for the whole table rather than one per person: the queue is
    worked by a small team off a shared badge count, so "has anyone seen this" is
    the question worth answering. The first view is kept, not the latest, so the
    time still means when it arrived on someone's desk.

    Newsletter signups have no such field because there is nothing to open.
    """

    class Meta:
        abstract = True
        ordering = ['-created_at']


class ContactSubmission(Submission):
    """
    An enquiry, from either the /contact consultation form or /quick-inquiry.

    Both forms store here rather than in separate tables. They are the same
    business event - someone asking to be contacted about a service line - so
    one table means one place to look and no rows to reconcile between two
    copies of the same event.

    `source` records which form it came from. The short form captures only a
    name, a way to reply, and ticked topics, where the full form also captures a
    client type, a reason, and a message. That difference in how much is known
    makes them worth working as separate queues: a quick inquiry is a name to
    call back, a consultation is a brief to prepare for. Splitting the screen
    does not split the storage, so either can still be seen undivided.
    """


    class Source(models.TextChoices):
        CONTACT = 'contact', 'Contact form'
        QUICK_INQUIRY = 'quick_inquiry', 'Quick inquiry'

    source = models.CharField(
        max_length=20,
        choices=Source.choices,
        default=Source.CONTACT,
        db_index=True,
    )
    """Which form produced the row. Defaults to the full contact form, so rows
    created before this field existed keep a meaningful value."""

    full_name = models.CharField(max_length=200)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=60, blank=True)

    country = models.CharField(max_length=120, blank=True)
    company = models.CharField(max_length=200, blank=True)

    client_type = models.CharField(max_length=80, blank=True)
    reason_for_contact = models.CharField(max_length=80, blank=True)
    """Blank rather than optional in the schema, because a quick inquiry has no
    client type. The /contact form still requires one at validation time."""

    areas_of_interest = models.JSONField(default=list, blank=True)
    """Selected solution or topic names. A JSON list because the set is defined
    by the frontend and changes without a migration."""

    preferred_date = models.DateTimeField(null=True, blank=True)
    message = models.TextField(blank=True)
    """Blank for a quick inquiry, which collects no free-text message. The
    /contact form still requires one of 10+ characters."""

    consent = models.BooleanField(default=False)

    class Meta(Submission.Meta):
        verbose_name = 'Contact submission'
        verbose_name_plural = 'Contact submissions'

    def __str__(self) -> str:
        # Quick inquiries may carry only a phone number, so fall back rather
        # than showing a row labelled with an empty address.
        return f'{self.full_name} — {self.email or self.phone or "no contact detail"}'


class PropertyLeadSubmission(Submission):
    """The lead form embedded on /solutions/property-asset-management."""

    full_name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=60, blank=True)

    location = models.CharField(max_length=120)
    property_interest = models.CharField(max_length=120)

    message = models.TextField(blank=True)
    consent = models.BooleanField(default=False)

    class Meta(Submission.Meta):
        verbose_name = 'Property lead'
        verbose_name_plural = 'Property leads'

    def __str__(self) -> str:
        return f'{self.full_name} — {self.property_interest}'


class NewsletterSubscriber(models.Model):
    """
    An /insights newsletter signup.

    `email` is unique so repeat signups update the existing row instead of
    piling up duplicates. `is_active` rather than a delete, so the address is
    kept for audit and can be suppressed without re-collecting consent.
    """

    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True, db_index=True)
    unsubscribed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Newsletter subscriber'
        verbose_name_plural = 'Newsletter subscribers'

    def __str__(self) -> str:
        return self.email
