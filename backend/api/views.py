"""
JSON auth API for the Angular frontend.

Session-based rather than token-based: the browser stores Django's `sessionid`
cookie and every call sends it. That keeps Django's admin login and the Angular
login sharing one identity, with no second auth system to keep in sync.

Endpoints (all under /api/auth/):
    GET  csrf/   -> primes the csrftoken cookie, returns 204
    POST login/  -> {username, password}; sets the session cookie
    POST logout/ -> ends the session
    GET  me/     -> the signed-in staff user, or 403
"""
from __future__ import annotations

import json

from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods


def _payload(request):
    """Read fields from either a JSON body or a form-encoded body.

    Accepting both means the caller can use Angular's HttpClient with a plain
    object (sent as JSON) or with FormData/URLSearchParams, without the API
    caring which.
    """
    content_type = (request.content_type or '').lower()
    if 'application/json' in content_type:
        try:
            data = json.loads(request.body or b'{}')
        except json.JSONDecodeError:
            return {}
        return data if isinstance(data, dict) else {}
    return request.POST


def _user_payload(user):
    """The only user fields the frontend needs."""
    return {
        'id': user.pk,
        'username': user.get_username(),
        'email': user.email,
        'firstName': (user.first_name or '').strip(),
        'lastName': (user.last_name or '').strip(),
        'isStaff': user.is_staff,
        'isSuperuser': user.is_superuser,
    }


@ensure_csrf_cookie
@require_http_methods(['GET'])
def csrf(request):
    """Hand out a CSRF token.

    The response sets the `csrftoken` cookie, which Angular reads and echoes back
    in the `X-CSRFToken` header on subsequent POSTs. GET is exempt from the CSRF
    check, so this is safe to call on page load.
    """
    return JsonResponse({'csrfToken': get_token(request)})


@require_http_methods(['POST'])
def api_login(request):
    """Sign a staff user in and set the session cookie."""
    data = _payload(request)
    username = str(data.get('username') or '').strip()
    password = str(data.get('password') or '')

    if not username or not password:
        return JsonResponse(
            {'detail': 'Enter both a username and a password.'},
            status=400,
        )

    user = authenticate(request, username=username, password=password)

    # One generic message for every failure so the endpoint does not reveal
    # which usernames exist.
    if user is None:
        return JsonResponse({'detail': 'Incorrect username or password.'}, status=400)

    if not user.is_active:
        return JsonResponse({'detail': 'This account has been deactivated.'}, status=400)

    # Mirrors accounts.views.StaffLoginView: the staff area is for staff only.
    if not user.is_staff:
        return JsonResponse(
            {'detail': 'This account does not have access to the staff area.'},
            status=403,
        )

    # Rotate the session key on privilege change to avoid session fixation.
    login(request, user)

    return JsonResponse({'user': _user_payload(user)})


@require_http_methods(['POST'])
def api_logout(request):
    """End the session. Idempotent: signing out twice is not an error."""
    logout(request)
    return JsonResponse({'detail': 'Signed out.'})


@require_http_methods(['GET'])
def me(request):
    """Report the current session, used to restore state on page load."""
    user = request.user
    if not user.is_authenticated or not user.is_staff:
        return JsonResponse({'detail': 'Not signed in.'}, status=403)
    return JsonResponse({'user': _user_payload(user)})
