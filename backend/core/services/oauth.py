import base64
import hashlib
import secrets
from dataclasses import dataclass
from urllib.parse import urlencode

import requests
from django.conf import settings

AUTHORIZE_URL = "https://meta.wikimedia.org/w/rest.php/oauth2/authorize"
ACCESS_TOKEN_URL = "https://meta.wikimedia.org/w/rest.php/oauth2/access_token"
PROFILE_URL = "https://meta.wikimedia.org/w/rest.php/oauth2/resource/profile"


class WikimediaOAuthError(Exception):
    """Raised when Wikimedia rejects or cannot complete the OAuth flow."""


@dataclass(frozen=True)
class OAuthRequest:
    state: str
    verifier: str
    authorization_url: str


def _required_setting(name: str) -> str:
    value = getattr(settings, name, "")
    if not value:
        raise WikimediaOAuthError(f"{name} is not configured")
    return value


def create_authorization_request() -> OAuthRequest:
    client_id = _required_setting("WIKIMEDIA_OAUTH_CLIENT_ID")
    callback_url = _required_setting("WIKIMEDIA_OAUTH_CALLBACK_URL")
    state = secrets.token_urlsafe(32)
    verifier = secrets.token_urlsafe(64)
    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(verifier.encode("utf-8")).digest()
    ).rstrip(b"=").decode("ascii")
    query = urlencode(
        {
            "response_type": "code",
            "client_id": client_id,
            "redirect_uri": callback_url,
            "state": state,
            "code_challenge": challenge,
            "code_challenge_method": "S256",
        }
    )
    return OAuthRequest(
        state=state,
        verifier=verifier,
        authorization_url=f"{AUTHORIZE_URL}?{query}",
    )


def exchange_code(code: str, verifier: str) -> str:
    try:
        response = requests.post(
            ACCESS_TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "client_id": _required_setting("WIKIMEDIA_OAUTH_CLIENT_ID"),
                "client_secret": _required_setting("WIKIMEDIA_OAUTH_CLIENT_SECRET"),
                "redirect_uri": _required_setting("WIKIMEDIA_OAUTH_CALLBACK_URL"),
                "code": code,
                "code_verifier": verifier,
            },
            headers={"User-Agent": settings.WIKIMEDIA_USER_AGENT},
            timeout=15,
        )
        response.raise_for_status()
        access_token = response.json().get("access_token")
    except (requests.RequestException, ValueError) as exc:
        raise WikimediaOAuthError("Wikimedia token exchange failed") from exc

    if not access_token:
        raise WikimediaOAuthError("Wikimedia returned no access token")
    return access_token


def fetch_profile(access_token: str) -> dict:
    try:
        response = requests.get(
            PROFILE_URL,
            headers={
                "Authorization": f"Bearer {access_token}",
                "User-Agent": settings.WIKIMEDIA_USER_AGENT,
            },
            timeout=15,
        )
        response.raise_for_status()
        profile = response.json()
    except (requests.RequestException, ValueError) as exc:
        raise WikimediaOAuthError("Wikimedia profile request failed") from exc

    if not profile.get("sub") or not profile.get("username"):
        raise WikimediaOAuthError("Wikimedia returned an incomplete profile")
    return profile
