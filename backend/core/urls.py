from django.urls import path

from .views import (
    csrf_token,
    current_user,
    health,
    logout_user,
    project_guides,
    wikimedia_callback,
    wikimedia_login,
)

app_name = "core"

urlpatterns = [
    path("health/", health, name="health"),
    path("projects/guides/", project_guides, name="project-guides"),
    path("auth/csrf/", csrf_token, name="csrf-token"),
    path("auth/me/", current_user, name="current-user"),
    path("auth/logout/", logout_user, name="logout"),
    path("auth/wikimedia/login/", wikimedia_login, name="wikimedia-login"),
    path("auth/wikimedia/callback/", wikimedia_callback, name="wikimedia-callback"),
]
