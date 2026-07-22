from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import get_user_model, login, logout
from django.db import transaction
from django.db.models import Count, Q, Sum
from django.db.models.functions import Coalesce
from django.http import HttpResponse, HttpResponseRedirect
from django.middleware.csrf import get_token
from django.utils.crypto import constant_time_compare
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import LearningProgress, MentorRequest, OnboardingProfile, WikimediaAccount
from .serializers import MentorRequestSerializer, OnboardingProfileSerializer
from .services.guides import get_project_guides
from .services.learning import (
    LessonLockedError,
    LessonNotFoundError,
    complete_lesson,
    get_learning_flow,
)
from .services import oauth
from .services.projects import get_wikimedia_projects
from .services.wikimedia import (
    TASKS as SUGGESTED_EDIT_TASKS,
    TOPICS as SUGGESTED_EDIT_TOPICS,
    WikimediaServiceError,
    get_demo_suggested_edit,
    get_suggested_edit,
)

OAUTH_STATE_SESSION_KEY = "wikimedia_oauth_state"
OAUTH_VERIFIER_SESSION_KEY = "wikimedia_oauth_verifier"
OAUTH_ACCESS_TOKEN_SESSION_KEY = "wikimedia_oauth_access_token"
WIKIPEDIA_NOTIFICATIONS_URL = "https://fr.wikipedia.org/wiki/Special:Notifications"


def _frontend_auth_redirect(result: str) -> HttpResponseRedirect:
    return HttpResponseRedirect(f"{settings.FRONTEND_URL}/?{urlencode({'auth': result})}")


@api_view(["GET"])
def health(request):
    return Response({"status": "ok", "service": "wikiguide-api"})


@api_view(["GET"])
def project_guides(request):
    return Response({"projects": get_project_guides()})


@api_view(["GET"])
def projects(request):
    return Response({"projects": get_wikimedia_projects()})


@api_view(["GET"])
def suggested_edit(request):
    task_type = request.query_params.get("task", "copyedit")
    topic = request.query_params.get("topic", "all")
    try:
        offset = max(0, int(request.query_params.get("offset", "0")))
    except ValueError:
        return Response({"detail": "Offset must be a non-negative integer."}, status=400)
    if offset > 1000:
        return Response({"detail": "Offset is outside the available suggestion range."}, status=400)

    if task_type not in SUGGESTED_EDIT_TASKS:
        return Response({"detail": "Unknown suggested-edit task type."}, status=400)
    if topic not in SUGGESTED_EDIT_TOPICS:
        return Response({"detail": "Unknown suggested-edit topic."}, status=400)

    try:
        return Response(get_suggested_edit(task_type, topic, offset))
    except WikimediaServiceError:
        return Response(get_demo_suggested_edit(task_type, topic))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def notification_status(request):
    access_token = request.session.get(OAUTH_ACCESS_TOKEN_SESSION_KEY)
    if not access_token:
        return Response(
            {
                "available": False,
                "hasUnread": None,
                "url": WIKIPEDIA_NOTIFICATIONS_URL,
            }
        )

    try:
        has_unread = oauth.has_unread_notifications(access_token)
    except oauth.WikimediaOAuthError:
        return Response(
            {
                "available": False,
                "hasUnread": None,
                "url": WIKIPEDIA_NOTIFICATIONS_URL,
            }
        )

    return Response(
        {
            "available": True,
            "hasUnread": has_unread,
            "url": WIKIPEDIA_NOTIFICATIONS_URL,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard(request):
    progress = LearningProgress.objects.filter(user=request.user)
    totals = progress.aggregate(
        total_points=Coalesce(Sum("points"), 0),
        completed_modules=Count("id", filter=Q(completed=True)),
        active_modules=Count("id", filter=Q(completed=False)),
    )
    account = getattr(request.user, "wikimedia_account", None)

    return Response(
        {
            "username": account.username if account else request.user.get_username(),
            "stats": {
                "wikimediaEdits": account.edit_count if account else 0,
                "totalPoints": totals["total_points"],
                "completedModules": totals["completed_modules"],
                "activeModules": totals["active_modules"],
            },
            "recentProgress": [
                {
                    "moduleSlug": item.module_slug,
                    "completed": item.completed,
                    "points": item.points,
                    "updatedAt": item.updated_at,
                }
                for item in progress[:5]
            ],
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def learning_flow(request):
    return Response(get_learning_flow(request.user))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def learning_lesson_complete(request, lesson_slug):
    try:
        return Response(complete_lesson(request.user, lesson_slug))
    except LessonNotFoundError as exc:
        return Response({"detail": str(exc)}, status=404)
    except LessonLockedError as exc:
        return Response({"detail": str(exc)}, status=409)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def mentorship(request):
    if request.method == "GET":
        current = MentorRequest.objects.filter(user=request.user).first()
        return Response(
            {"request": MentorRequestSerializer(current).data if current else None}
        )

    if MentorRequest.objects.filter(user=request.user, status="pending").exists():
        return Response(
            {"detail": "You already have a mentor request awaiting a match."},
            status=409,
        )

    serializer = MentorRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    mentor_request = serializer.save(user=request.user)
    return Response(
        {"request": MentorRequestSerializer(mentor_request).data},
        status=201,
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def onboarding(request):
    profile = OnboardingProfile.objects.filter(user=request.user).first()
    if request.method == "GET":
        return Response(
            {
                "completed": profile is not None,
                "profile": OnboardingProfileSerializer(profile).data if profile else None,
            }
        )

    is_new = profile is None
    serializer = OnboardingProfileSerializer(instance=profile, data=request.data)
    serializer.is_valid(raise_exception=True)
    profile = serializer.save(user=request.user, completed_at=timezone.now())
    return Response(
        {"completed": True, "profile": OnboardingProfileSerializer(profile).data},
        status=201 if is_new else 200,
    )


@require_GET
def wikimedia_login(request):
    try:
        authorization = oauth.create_authorization_request()
    except oauth.WikimediaOAuthError as exc:
        return HttpResponse(str(exc), status=503, content_type="text/plain")

    request.session[OAUTH_STATE_SESSION_KEY] = authorization.state
    request.session[OAUTH_VERIFIER_SESSION_KEY] = authorization.verifier
    return HttpResponseRedirect(authorization.authorization_url)


@require_GET
def wikimedia_callback(request):
    expected_state = request.session.pop(OAUTH_STATE_SESSION_KEY, "")
    verifier = request.session.pop(OAUTH_VERIFIER_SESSION_KEY, "")
    received_state = request.GET.get("state", "")
    code = request.GET.get("code", "")

    if request.GET.get("error"):
        return _frontend_auth_redirect("denied")
    if not expected_state or not constant_time_compare(expected_state, received_state):
        return _frontend_auth_redirect("invalid-state")
    if not code or not verifier:
        return _frontend_auth_redirect("missing-code")

    try:
        access_token = oauth.exchange_code(code, verifier)
        profile = oauth.fetch_profile(access_token)
    except oauth.WikimediaOAuthError:
        return _frontend_auth_redirect("failed")

    wikimedia_user_id = str(profile["sub"])
    wikimedia_username = str(profile["username"])
    email = str(profile.get("email") or "")
    registered_at = parse_datetime(profile.get("registered") or "")

    with transaction.atomic():
        account = WikimediaAccount.objects.select_related("user").filter(
            wikimedia_user_id=wikimedia_user_id
        ).first()
        if account is None:
            user = get_user_model().objects.create_user(
                username=f"wikimedia_{wikimedia_user_id}",
                email=email,
            )
            user.set_unusable_password()
            user.save(update_fields=["password"])
            account = WikimediaAccount.objects.create(
                user=user,
                wikimedia_user_id=wikimedia_user_id,
                username=wikimedia_username,
            )
        else:
            user = account.user
            if email and user.email != email:
                user.email = email
                user.save(update_fields=["email"])

        account.username = wikimedia_username
        account.edit_count = max(0, int(profile.get("editcount") or 0))
        account.registered_at = registered_at
        account.save(update_fields=["username", "edit_count", "registered_at", "updated_at"])

    login(request, user, backend="django.contrib.auth.backends.ModelBackend")
    request.session[OAUTH_ACCESS_TOKEN_SESSION_KEY] = access_token
    return _frontend_auth_redirect("success")


@api_view(["GET"])
def current_user(request):
    if not request.user.is_authenticated:
        return Response({"authenticated": False, "user": None})

    account = getattr(request.user, "wikimedia_account", None)
    return Response(
        {
            "authenticated": True,
            "user": {
                "id": request.user.pk,
                "username": account.username if account else request.user.get_username(),
                "editCount": account.edit_count if account else 0,
                "wikimediaUserId": account.wikimedia_user_id if account else None,
            },
        }
    )


@ensure_csrf_cookie
@api_view(["GET"])
def csrf_token(request):
    return Response({"csrfToken": get_token(request)})


@api_view(["POST"])
def logout_user(request):
    logout(request)
    return Response({"authenticated": False, "user": None})
