"""
Staff sign-in for the Dinq staff area.

Authentication itself is Django's built-in machinery — this module only adds the
house rule that only staff accounts get in, and points people at the admin index
once they do.
"""
from django.contrib.auth.views import LoginView, LogoutView
from django.urls import reverse_lazy
from django.utils.http import url_has_allowed_host_and_scheme
from django.shortcuts import redirect


class StaffLoginView(LoginView):
    """Sign-in page restricted to `is_staff` accounts.

    `LoginView` handles the form, the session and the `next` redirect. The only
    addition is the staff gate: a valid password on a non-staff account is
    rejected with a form error instead of silently creating a session.
    """

    template_name = 'accounts/login.html'
    # Someone already signed in has no business on the sign-in page.
    redirect_authenticated_user = True

    def form_valid(self, form):
        user = form.get_user()

        if not user.is_staff:
            # Reject before LoginView logs anyone in, so no session is created.
            form.add_error(None, 'This account does not have access to the staff area.')
            return self.form_invalid(form)

        return super().form_valid(form)

    def get_success_url(self):
        """Honour a safe `next`, otherwise fall back to the admin index."""
        redirect_to = self.request.POST.get(self.redirect_field_name) or self.request.GET.get(self.redirect_field_name)
        if redirect_to and url_has_allowed_host_and_scheme(
            url=redirect_to,
            allowed_hosts=self.request.get_host(),
            require_https=self.request.is_secure(),
        ):
            return redirect_to
        return super().get_success_url()


class StaffLogoutView(LogoutView):
    """Sign-out. POST-only, per Django 5+; GET requests are refused."""

    next_page = reverse_lazy('accounts:login')

    # POST-only, per Django 5+; GET requests are refused.
    http_method_names = ['post', 'options']


def home(request):
    """Front door: staff go straight in, everyone else sees the sign-in page."""
    if request.user.is_authenticated and request.user.is_staff:
        return redirect('admin:index')
    return redirect('accounts:login')
