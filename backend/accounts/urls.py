"""
URLs for the staff sign-in area.

Mounted at the project root as `accounts:login` and `accounts:logout` (see
config/urls.py and the LOGIN_URL / LOGOUT_URL settings).
"""
from django.urls import path

from . import views

app_name = 'accounts'

urlpatterns = [
    path('login/', views.StaffLoginView.as_view(), name='login'),
    path('logout/', views.StaffLogoutView.as_view(), name='logout'),
]
