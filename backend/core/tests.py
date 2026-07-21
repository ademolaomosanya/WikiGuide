from unittest.mock import patch

from django.test import override_settings
from rest_framework import status
from rest_framework.test import APISimpleTestCase, APITestCase

from .models import WikimediaAccount
from .services.oauth import OAuthRequest


class ProjectGuideAPITests(APISimpleTestCase):
    def test_project_guides_returns_all_supported_projects(self):
        response = self.client.get("/api/projects/guides/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [project["slug"] for project in response.data["projects"]],
            ["wikipedia", "wikidata", "commons", "wiktionary"],
        )
        self.assertTrue(response.data["projects"][0]["actions"])
        self.assertTrue(response.data["projects"][0]["steps"])
        self.assertTrue(response.data["projects"][0]["faqs"])


class AuthenticationAPITests(APITestCase):
    def test_current_user_is_anonymous_by_default(self):
        response = self.client.get("/api/auth/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"authenticated": False, "user": None})

    @patch("core.views.oauth.create_authorization_request")
    def test_login_stores_oauth_state_and_redirects(self, create_request):
        create_request.return_value = OAuthRequest(
            state="safe-state",
            verifier="pkce-verifier",
            authorization_url="https://meta.wikimedia.org/authorize-test",
        )

        response = self.client.get("/api/auth/wikimedia/login/")

        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        self.assertEqual(response.url, "https://meta.wikimedia.org/authorize-test")
        self.assertEqual(self.client.session["wikimedia_oauth_state"], "safe-state")
        self.assertEqual(self.client.session["wikimedia_oauth_verifier"], "pkce-verifier")

    def test_callback_rejects_an_invalid_state(self):
        session = self.client.session
        session["wikimedia_oauth_state"] = "expected"
        session["wikimedia_oauth_verifier"] = "verifier"
        session.save()

        response = self.client.get(
            "/api/auth/wikimedia/callback/?state=wrong&code=authorization-code"
        )

        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        self.assertIn("auth=invalid-state", response.url)

    @override_settings(FRONTEND_URL="http://localhost:5173")
    @patch("core.views.oauth.fetch_profile")
    @patch("core.views.oauth.exchange_code")
    def test_callback_creates_a_linked_user(self, exchange_code, fetch_profile):
        exchange_code.return_value = "temporary-access-token"
        fetch_profile.return_value = {
            "sub": 12345,
            "username": "Example Editor",
            "editcount": 42,
            "registered": "2020-01-01T00:00:00Z",
        }
        session = self.client.session
        session["wikimedia_oauth_state"] = "safe-state"
        session["wikimedia_oauth_verifier"] = "pkce-verifier"
        session.save()

        response = self.client.get(
            "/api/auth/wikimedia/callback/?state=safe-state&code=authorization-code"
        )

        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        self.assertEqual(response.url, "http://localhost:5173/?auth=success")
        account = WikimediaAccount.objects.get(wikimedia_user_id="12345")
        self.assertEqual(account.username, "Example Editor")
        self.assertEqual(account.edit_count, 42)

        me_response = self.client.get("/api/auth/me/")
        self.assertTrue(me_response.data["authenticated"])
        self.assertEqual(me_response.data["user"]["username"], "Example Editor")
