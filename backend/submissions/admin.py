"""
Admin registrations for form submissions.

Registered in addition to the Angular staff screen: the admin gives staff search,
CSV export and bulk status changes, which the in-app list deliberately skips.
"""
from django.contrib import admin

from .models import ContactSubmission, NewsletterSubscriber, PropertyLeadSubmission


@admin.register(ContactSubmission)
class ContactSubmissionAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'source',
        'full_name',
        'email',
        'phone',
        'client_type',
        'reason_for_contact',
        'status',
    )
    list_filter = ('status', 'source', 'reason_for_contact', 'client_type', 'created_at')
    search_fields = ('full_name', 'email', 'phone', 'company', 'message')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    fieldsets = (
        (None, {'fields': ('source', 'full_name', 'email', 'phone', 'country', 'company')}),
        ('Enquiry', {'fields': ('client_type', 'reason_for_contact', 'areas_of_interest', 'preferred_date', 'message')}),
        ('Workflow', {'fields': ('status', 'notes', 'consent', 'created_at')}),
    )


@admin.register(PropertyLeadSubmission)
class PropertyLeadSubmissionAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'full_name',
        'email',
        'phone',
        'location',
        'property_interest',
        'status',
    )
    list_filter = ('status', 'property_interest', 'location', 'created_at')
    search_fields = ('full_name', 'email', 'phone', 'message')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    fieldsets = (
        (None, {'fields': ('full_name', 'email', 'phone')}),
        ('Interest', {'fields': ('location', 'property_interest', 'message')}),
        ('Workflow', {'fields': ('status', 'notes', 'consent', 'created_at')}),
    )


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'email', 'is_active', 'unsubscribed_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('email',)
    readonly_fields = ('created_at', 'unsubscribed_at')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    actions = ('mark_unsubscribed', 'mark_active')

    @admin.action(description='Mark selected subscribers as unsubscribed')
    def mark_unsubscribed(self, request, queryset):
        from django.utils import timezone

        updated = queryset.update(is_active=False, unsubscribed_at=timezone.now())
        self.message_user(request, f'{updated} subscriber(s) unsubscribed.')

    @admin.action(description='Mark selected subscribers as active')
    def mark_active(self, request, queryset):
        updated = queryset.update(is_active=True, unsubscribed_at=None)
        self.message_user(request, f'{updated} subscriber(s) marked active.')
