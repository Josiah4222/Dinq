"""
JSON auth API for the Angular frontend.

Session-based rather than token-based: the browser stores Django's `sessionid`
cookie and every call sends it. That keeps Django's admin login and the Angular
login sharing one identity, with no second auth system to keep in sync.

Endpoints (all under /api/auth/):
    GET    csrf/     -> primes the csrftoken cookie, returns 204
    POST   login/    -> {username, password}; sets the session cookie
    POST   logout/   -> ends the session
    GET    me/       -> the signed-in staff user, or 403
    POST   profile/  -> {username}; renames the signed-in staff user
    POST   password/ -> {currentPassword, newPassword}; replaces their password

The staff-account endpoints under /api/staff/users/ (list, create) are
superuser-only and back the /admin/team screen.
"""
from __future__ import annotations

import json

from django.contrib.auth import (
    authenticate,
    get_user_model,
    login,
    logout,
    update_session_auth_hash,
)
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
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


def _staff_required(view):
    """Wrap a view so only signed-in staff may call it."""

    def wrapper(request, *args, **kwargs):
        user = request.user
        if not user.is_authenticated or not user.is_staff:
            return JsonResponse({'detail': 'Not signed in.'}, status=403)
        return view(request, *args, **kwargs)

    wrapper.__name__ = view.__name__
    return wrapper


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


@_staff_required
@require_http_methods(['POST'])
def update_profile(request):
    """Rename the signed-in staff user, for the /admin/account screen.

    The user edits their own account here, so the checks are the same ones a
    signup form would run: a username is required, stays within Django's
    validator rules, and cannot collide with anyone else's (case-insensitively,
    so Admin and admin are the same name to a login form that will not know
    the difference). The response carries the fresh user payload so the
    frontend can refresh the name it shows without a second request.
    """
    data = _payload(request)
    username = str(data.get('username') or '').strip()
    user = request.user

    error = None
    if not username:
        error = 'Enter a username.'
    elif len(username) > 150:
        error = 'Usernames are limited to 150 characters.'
    else:
        try:
            UnicodeUsernameValidator()(username)
        except ValidationError as exc:
            error = ' '.join(exc.messages)

    if error is None:
        taken = (
            get_user_model()
            .objects.filter(username__iexact=username)
            .exclude(pk=user.pk)
            .exists()
        )
        if taken:
            error = 'That username is already taken.'

    if error is not None:
        return JsonResponse({'detail': error, 'field': 'username'}, status=400)

    user.username = username
    user.save(update_fields=['username'])
    return JsonResponse({'user': _user_payload(user)})


@_staff_required
@require_http_methods(['POST'])
def change_password(request):
    """Replace the signed-in staff user's password, for /admin/account.

    The current password is required even though the session is already
    authenticated: a stolen session should not be able to mint a permanent
    credential of its own. Django's password validators run on the new choice
    (they know the user's name and the common-password lists), and the session
    hash is updated afterwards so the person who just proved they own the
    account is not signed out by the very next request.
    """
    data = _payload(request)
    current = str(data.get('currentPassword') or '')
    new = str(data.get('newPassword') or '')
    user = request.user

    if not current:
        return JsonResponse(
            {'detail': 'Enter your current password.', 'field': 'currentPassword'},
            status=400,
        )
    if not new:
        return JsonResponse(
            {'detail': 'Enter a new password.', 'field': 'newPassword'},
            status=400,
        )
    if not user.check_password(current):
        return JsonResponse(
            {'detail': 'Your current password is incorrect.', 'field': 'currentPassword'},
            status=400,
        )
    if new == current:
        return JsonResponse(
            {'detail': 'The new password must differ from the current one.', 'field': 'newPassword'},
            status=400,
        )
    try:
        validate_password(new, user=user)
    except ValidationError as exc:
        return JsonResponse(
            {'detail': ' '.join(exc.messages), 'field': 'newPassword'},
            status=400,
        )

    user.set_password(new)
    user.save(update_fields=['password'])
    # The session stores a hash of the password; re-hash it in place or the
    # change would sign this user out on their next request.
    update_session_auth_hash(request, user)
    return JsonResponse({'detail': 'Password updated.'})


def _superuser_required(view):
    """Wrap a view so only a signed-in superuser may call it."""

    def wrapper(request, *args, **kwargs):
        user = request.user
        if not user.is_authenticated or not user.is_staff:
            return JsonResponse({'detail': 'Not signed in.'}, status=403)
        if not user.is_superuser:
            return JsonResponse(
                {'detail': 'Only a superuser can manage staff accounts.'},
                status=403,
            )
        return view(request, *args, **kwargs)

    wrapper.__name__ = view.__name__
    return wrapper


def _staff_user_payload(user):
    """A staff account as the /admin/team screen lists it."""
    return {
        'id': user.pk,
        'username': user.get_username(),
        'email': user.email,
        'firstName': (user.first_name or '').strip(),
        'lastName': (user.last_name or '').strip(),
        'isSuperuser': user.is_superuser,
        'isActive': user.is_active,
        'dateJoined': user.date_joined.isoformat(),
        'lastLogin': user.last_login.isoformat() if user.last_login else None,
    }


@_superuser_required
@require_http_methods(['GET', 'POST'])
def staff_users(request):
    """List staff accounts, or create a new one. Superusers only.

    GET returns every account with `is_staff=True`, so the screen can show who
    already has access. POST creates one, always as staff and optionally as a
    superuser when the caller asks for it. Usernames are matched
    case-insensitively (Django's own uniqueness check is exact) so "Admin" and
    "admin" cannot both be handed out; the password runs through Django's
    validators, which know the common-password lists.
    """
    user_model = get_user_model()

    if request.method == 'GET':
        users = user_model.objects.filter(is_staff=True).order_by('username')
        return JsonResponse({'results': [_staff_user_payload(u) for u in users]})

    data = _payload(request)
    username = str(data.get('username') or '').strip()
    email = str(data.get('email') or '').strip()
    password = str(data.get('password') or '')
    first_name = str(data.get('firstName') or '').strip()
    last_name = str(data.get('lastName') or '').strip()
    is_superuser = bool(data.get('isSuperuser'))

    errors: dict[str, list[str]] = {}

    if not username:
        errors.setdefault('username', []).append('Enter a username.')
    elif len(username) > 150:
        errors.setdefault('username', []).append(
            'Usernames are limited to 150 characters.'
        )
    else:
        try:
            UnicodeUsernameValidator()(username)
        except ValidationError as exc:
            errors.setdefault('username', []).extend(exc.messages)
        else:
            if user_model.objects.filter(username__iexact=username).exists():
                errors.setdefault('username', []).append(
                    'That username is already taken.'
                )

    if email:
        try:
            validate_email(email)
        except ValidationError:
            errors.setdefault('email', []).append('Enter a valid email address.')

    if not password:
        errors.setdefault('password', []).append('Enter a password.')
    else:
        try:
            validate_password(password)
        except ValidationError as exc:
            errors.setdefault('password', []).extend(exc.messages)

    if errors:
        return JsonResponse(
            {'detail': 'Please correct the errors below.', 'errors': errors},
            status=400,
        )

    user = user_model.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        is_staff=True,
        is_superuser=is_superuser,
    )
    return JsonResponse({'user': _staff_user_payload(user)}, status=201)
