from django.urls import path

from .views import (
    csrf_token,
    current_user,
    dashboard,
    health,
    learning_flow,
    learning_lesson_complete,
    logout_user,
    mentorship,
    notification_status,
    onboarding,
    project_guides,
    projects,
    suggested_edit,
    wikimedia_callback,
    wikimedia_login,
)

app_name = "core"

urlpatterns = [
    path("health/", health, name="health"),
    path("projects/guides/", project_guides, name="project-guides"),
    path("projects/", projects, name="projects"),
    path("suggested-edits/", suggested_edit, name="suggested-edit"),
    path("dashboard/", dashboard, name="dashboard"),
    path("learning/", learning_flow, name="learning-flow"),
    path(
        "learning/lessons/<slug:lesson_slug>/complete/",
        learning_lesson_complete,
        name="learning-lesson-complete",
    ),
    path("mentorship/", mentorship, name="mentorship"),
    path("notifications/", notification_status, name="notification-status"),
    path("onboarding/", onboarding, name="onboarding"),
    path("auth/csrf/", csrf_token, name="csrf-token"),
    path("auth/me/", current_user, name="current-user"),
    path("auth/logout/", logout_user, name="logout"),
    path("auth/wikimedia/login/", wikimedia_login, name="wikimedia-login"),
    path("auth/wikimedia/callback/", wikimedia_callback, name="wikimedia-callback"),
]
