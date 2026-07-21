from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import get_user_model, login, logout
from django.db import transaction
from django.http import HttpResponse, HttpResponseRedirect
from django.middleware.csrf import get_token
from django.utils.crypto import constant_time_compare
from django.utils.dateparse import parse_datetime
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import WikimediaAccount
from .services.guides import get_project_guides
from .services import oauth

OAUTH_STATE_SESSION_KEY = "wikimedia_oauth_state"
OAUTH_VERIFIER_SESSION_KEY = "wikimedia_oauth_verifier"


def _frontend_auth_redirect(result: str) -> HttpResponseRedirect:
    return HttpResponseRedirect(f"{settings.FRONTEND_URL}/?{urlencode({'auth': result})}")


@api_view(["GET"])
def health(request):
    return Response({"status": "ok", "service": "wikiguide-api"})


@api_view(["GET"])
def project_guides(request):
    return Response({"projects": get_project_guides()})


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
