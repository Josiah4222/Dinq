"""
Production settings for the public site.

Everything here is driven by environment variables, with the development
settings as the fallback. That is deliberate: this module must be importable on a
fresh server with nothing but the environment set, and it must never contain a
secret, a hostname, or a domain of ours. If a value is needed in production, it
comes from the environment; if it is missing, this module fails loudly at
startup rather than quietly serving a default that is wrong in public.

    export DJANGO_SETTINGS_MODULE=config.settings_prod
    gunicorn config.wsgi:application

Deployment shape this assumes
-----------------------------
nginx terminates TLS and serves three things on one origin:

    /            the built Angular app (frontend/dist/dinq/browser)
    /static/     collected Django static, from STATIC_ROOT
    /media/      uploaded images, straight off disk
    /api/ /django-admin/    proxied to gunicorn

Everything else — the staff panel at /admin/... and the sign-in page at
/login — is part of the Angular app and falls through to its index.html.

The single origin matters. The frontend calls the API with root-relative paths
(`/api/...`) and there is no environment.ts or API base URL anywhere in the
source, so the browser resolves them against whatever host served the page. If
the app and the API were on different hosts the session cookie would be blocked
by SameSite=Lax, and staff sign-in would fail in a way that looks like a
credentials bug. Same origin avoids the whole problem.

Because nginx sets X-Forwarded-Proto, USE_X_FORWARDED_PROTO is on below, or
Django would believe every request arrived over plain HTTP and, with
SECURE_SSL_REDIRECT, would redirect to https forever.
"""
from __future__ import annotations

import os
from pathlib import Path

from config.settings import *  # noqa: F403 - the base settings are the defaults

BASE_DIR = Path(__file__).resolve().parent.parent


def env(name: str, default: str | None = None) -> str:
    """
    Read a required setting from the environment.

    Raises rather than falling back, because a production process starting with
    a missing SECRET_KEY or ALLOWED_HOSTS is a site that either 400s every
    visitor or signs sessions with a published key. Failing at startup is the
    better of the two.
    """
    value = os.environ.get(name, default)
    if value is None or value == '':
        raise RuntimeError(f'{name} must be set in the environment for production')
    return value


def env_bool(name: str, default: str = 'true') -> bool:
    return env(name, default).strip().lower() in {'1', 'true', 'yes', 'on'}


# -----------------------------------------------------------------------------
# Core security
# -----------------------------------------------------------------------------

# Never fall back to the development key. Generate with:
#   python -c "from django.core.management.utils import get_random_secret_key as k; print(k())"
SECRET_KEY = env('DJANGO_SECRET_KEY')

# DEBUG stays overridable only so `manage.py check --deploy` can be run against
# production settings without pretending the site is live.
DEBUG = env_bool('DJANGO_DEBUG', 'false')

# The public names plus the bare IP, because a certificate for the domain does
# not make the IP address go away and someone will always try it. Comma
# separated, which is how Django wants it in an environment variable.
ALLOWED_HOSTS = [h.strip() for h in env('DJANGO_ALLOWED_HOSTS').split(',') if h.strip()]

# Behind nginx, which sets X-Forwarded-Proto. Without this, SECURE_SSL_REDIRECT
# below becomes an infinite redirect loop.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# nginx also carries the original Host and port, which Django needs to build
# correct absolute URLs in the Django-rendered admin pages and in redirects.
USE_X_FORWARDED_HOST = True
USE_X_FORWARDED_PORT = True

# nginx already answers http on 80 by redirecting to https, but this makes the
# guarantee hold for anything that reaches gunicorn directly.
SECURE_SSL_REDIRECT = env_bool('DJANGO_SECURE_SSL_REDIRECT', 'true')

# Only worth enabling once the certificate is reliably renewing; a browser that
# has cached HSTS will not let you back out over plain HTTP.
SECURE_HSTS_SECONDS = int(os.environ.get('DJANGO_HSTS_SECONDS', '0'))
SECURE_HSTS_INCLUDE_SUBDOMAINS = SECURE_HSTS_SECONDS > 0
SECURE_HSTS_PRELOAD = SECURE_HSTS_SECONDS > 0

SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'same-origin'


# -----------------------------------------------------------------------------
# Cookies
# -----------------------------------------------------------------------------
# The session cookie is not readable by JavaScript and must never travel over
# plain HTTP. The CSRF cookie is deliberately the opposite on the HttpOnly
# point: Angular's withXsrfConfiguration (app.config.ts) reads `csrftoken` from
# document.cookie and echoes it back as X-CSRFToken, and that header is how
# every write authenticates itself - staff sign-in, mark-as-seen, and the public
# contact forms alike. Marking it HttpOnly made the cookie invisible to the
# frontend, so those POSTs arrived with no token and Django answered 403 to all
# of them (silently, on any browser that had not kept an older readable cookie).
# False is also Django's own default.

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = False
SESSION_COOKIE_HTTPONLY = True

# SameSite=Lax is Django's default and is correct here: the API is same-origin,
# so Lax never blocks it, while still refusing to send the session on a
# cross-site POST that arrives as a drive-by.

CSRF_COOKIE_NAME = 'csrftoken'  # matches the frontend's withXsrfConfiguration
SESSION_COOKIE_NAME = 'dinq_sessionid'

CSRF_TRUSTED_ORIGINS = [
    o.strip() for o in os.environ.get('DJANGO_CSRF_TRUSTED_ORIGINS', '').split(',') if o.strip()
]


# -----------------------------------------------------------------------------
# Static and media files
# -----------------------------------------------------------------------------
# The development value is 'static/' with no leading slash, which Django resolves
# relative to the current path. It has to be '/static/' in production or nginx
# and the templates disagree about where the files are.

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# backend/static holds css/auth.css, which the Django login and admin templates
# load. It sits at BASE_DIR rather than inside an app, so it is not on the
# staticfiles search path by default and collectstatic would skip it, leaving the
# staff login unstyled.
STATICFILES_DIRS = [BASE_DIR / 'static']

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'


# -----------------------------------------------------------------------------
# Database
# -----------------------------------------------------------------------------
# Defaults to the same SQLite file development uses, so a single-server deploy
# needs no configuration. DATABASE_URL-shaped overrides are left out on purpose:
# there is no psycopg2 requirement in requirements.txt and no Postgres setup in
# this project yet, so adding the indirection would be a claim the repo cannot
# back up. Moving to Postgres is a deliberate later change, not a default.

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.environ.get('DJANGO_DB_PATH', str(BASE_DIR / 'db.sqlite3')),
    }
}

# A brief wait on the database lock keeps a form POST from failing outright when
# an admin is saving the CMS at the same moment.
DATABASES['default']['OPTIONS'] = {'timeout': 20}


# -----------------------------------------------------------------------------
# Email
# -----------------------------------------------------------------------------
# Alerts for new public form submissions. SMTP rather than a local mail daemon:
# the server has no MTA, and a relay with SPF/DKIM is what keeps the mail out of
# spam. Every value is optional -- with no host configured, `send_mail` is not
# called and the notification is simply skipped, while the submission is still
# stored and shows up in the staff panel.

EMAIL_BACKEND = os.environ.get(
    'DJANGO_EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend'
)
EMAIL_HOST = os.environ.get('DJANGO_EMAIL_HOST', '')
EMAIL_PORT = int(os.environ.get('DJANGO_EMAIL_PORT', '587'))
EMAIL_HOST_USER = os.environ.get('DJANGO_EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('DJANGO_EMAIL_HOST_PASSWORD', '')
# 587 (STARTTLS) is the common relay port; 465 wants EMAIL_USE_SSL instead. The
# two are mutually exclusive and Django raises if both are on.
EMAIL_USE_TLS = env_bool('DJANGO_EMAIL_USE_TLS', 'true')
EMAIL_USE_SSL = env_bool('DJANGO_EMAIL_USE_SSL', 'false')
# A bounded timeout so a slow relay cannot hold a gunicorn worker indefinitely.
EMAIL_TIMEOUT = int(os.environ.get('DJANGO_EMAIL_TIMEOUT', '10'))
DEFAULT_FROM_EMAIL = os.environ.get(
    'DJANGO_DEFAULT_FROM_EMAIL', 'Dinq Advisory Group <no-reply@dinqadvisory.com>'
)
# Who a new /contact submission is announced to. Comma separated.
CONTACT_NOTIFICATION_EMAILS = [
    e.strip()
    for e in os.environ.get('DJANGO_CONTACT_NOTIFICATION_EMAILS', '').split(',')
    if e.strip()
]


# -----------------------------------------------------------------------------
# CORS
# -----------------------------------------------------------------------------
# Same-origin in production, so no origins are allowed. The development list on
# the base settings is not inherited on purpose: leaving localhost:4200 in would
# let a page running on a developer's machine talk to the live API with
# credentials. If a second origin is ever genuinely needed, add it here
# explicitly and read the CORS section of the base settings first - session
# cookies plus cross-origin XHR is a SameSite trap.

CORS_ALLOWED_ORIGINS: list[str] = []
CORS_ALLOW_CREDENTIALS = True


# -----------------------------------------------------------------------------
# Logging
# -----------------------------------------------------------------------------
# gunicorn captures its own stderr, so the app's logs go to stdout as plain text
# and end up wherever the service's journal does. A file handler would be
# invisible to `journalctl -u dinq`, which is where anyone will look first.

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'plain': {'format': '{levelname} {asctime} {name} {message}', 'style': '{'},
    },
    'handlers': {
        'console': {'class': 'logging.StreamHandler', 'formatter': 'plain'},
    },
    'root': {
        'handlers': ['console'],
        'level': os.environ.get('DJANGO_LOG_LEVEL', 'INFO'),
    },
}
