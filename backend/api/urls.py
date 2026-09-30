"""
JSON API routes for the Angular frontend.

Mounted at /api/ from config/urls.py. The auth endpoints are namespaced as
`api:login`, `api:logout`, `api:me` and `api:csrf`; submission endpoints live
under `submissions`/`staff` prefixes and are named for the forms they serve.
"""
from django.urls import path

from . import views
from submissions import views as submission_views
from cms import views as cms_views

app_name = 'api'

urlpatterns = [
    path('auth/csrf/', views.csrf, name='csrf'),
    path('auth/login/', views.api_login, name='login'),
    path('auth/logout/', views.api_logout, name='logout'),
    path('auth/me/', views.me, name='me'),

    # Public form writes (anonymous, CSRF-protected).
    path('submissions/contact/', submission_views.submit_contact, name='submit-contact'),
    path('submissions/quick-inquiry/', submission_views.submit_quick_inquiry, name='submit-quick-inquiry'),
    path('submissions/property-lead/', submission_views.submit_property_lead, name='submit-property-lead'),
    path('submissions/newsletter/', submission_views.subscribe_newsletter, name='subscribe-newsletter'),

    # Staff reads for the Angular /staff screen.
    path('staff/submissions/counts/', submission_views.staff_submission_counts, name='staff-submission-counts'),
    path('staff/submissions/contact/', submission_views.staff_contact_list, name='staff-contact-list'),
    path('staff/submissions/contact/<int:pk>/', submission_views.staff_contact_detail, name='staff-contact-detail'),
    path('staff/submissions/contact/<int:pk>/seen/', submission_views.staff_contact_mark_seen, name='staff-contact-seen'),
    path('staff/submissions/property-lead/', submission_views.staff_property_lead_list, name='staff-property-lead-list'),
    path('staff/submissions/newsletter/', submission_views.staff_newsletter_list, name='staff-newsletter-list'),

    # Editable content, public read so pages render from the database and the
    # quick-inquiry form offers staff-chosen topics; staff read/write so the CMS
    # screen under /admin/pages can show and change it.
    path('cms/inquiry-topics/', cms_views.public_inquiry_topics, name='public-inquiry-topics'),
    path('content/pages/<slug:slug>/', cms_views.public_page_content, name='public-page-content'),
    # Change token only, polled by open pages to notice an edit.
    path('content/pages/<slug:slug>/version/', cms_views.public_page_version, name='public-page-version'),
    path('staff/pages/', cms_views.staff_page_list, name='staff-page-list'),
    path('staff/pages/<slug:slug>/', cms_views.staff_page_detail, name='staff-page-detail'),
    path('staff/pages/<slug:slug>/update/', cms_views.staff_page_update, name='staff-page-update'),

    # Image uploads and the library they are picked from. Both are staff-only and
    # CSRF-protected like every other write; the frontend reaches them over the
    # dev proxy because they sit under /api/.
    path('staff/uploads/', cms_views.staff_image_upload, name='staff-image-upload'),
    path('staff/images/', cms_views.staff_image_library, name='staff-image-library'),
]
