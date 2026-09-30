"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Create a URLconf in my_app
    2. Import the include() function: from django.urls import include, path
    3. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from accounts import views

urlpatterns = [
    # Mounted at the root, so this serves /login/ and /logout/ while keeping the
    # `accounts:` namespace that LOGIN_URL and reverse() rely on.
    path('', include('accounts.urls')),

    # JSON auth consumed by the Angular frontend (dev server on :4200).
    path('api/', include('api.urls')),

    path('', views.home, name='home'),
    path('admin/', admin.site.urls),
]

# Uploaded images, served straight off disk in development only. In production
# the web server owns /media/ - Django deliberately refuses to serve media when
# DEBUG is off, so this list comes out empty and nothing leaks.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
