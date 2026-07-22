from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APISimpleTestCase, APITestCase

from .models import LearningProgress, MentorRequest, OnboardingProfile, WikimediaAccount
from .services.oauth import OAuthRequest
from .services.wikimedia import WikimediaServiceError


class SuggestedEditsAPITests(APISimpleTestCase):
    @patch("core.views.get_suggested_edit")
    def test_returns_a_live_wikipedia_task(self, get_suggestion):
        get_suggestion.return_value = {
            "taskType": "references",
            "taskName": "Add a reference",
            "guidance": "Add a reliable source.",
            "topic": "science",
            "topicMatched": True,
            "isFallback": False,
            "nextOffset": 1,
            "article": {
                "title": "Example",
                "excerpt": "An article needing a source.",
                "url": "https://fr.wikipedia.org/wiki/Example",
                "editUrl": "https://fr.wikipedia.org/wiki/Example?veaction=edit",
            },
        }

        response = self.client.get(
            "/api/suggested-edits/?task=references&topic=science&offset=0"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["article"]["title"], "Example")
        get_suggestion.assert_called_once_with("references", "science", 0)

    @patch("core.views.get_suggested_edit")
    def test_uses_a_safe_demo_task_when_wikipedia_is_unavailable(self, get_suggestion):
        get_suggestion.side_effect = WikimediaServiceError("rate limited")

        response = self.client.get(
            "/api/suggested-edits/?task=references&topic=science"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["isFallback"])
        self.assertEqual(response.data["article"]["title"], "Wikipedia practice sandbox")
        self.assertIn("Bac_%C3%A0_sable", response.data["article"]["editUrl"])

    def test_rejects_unknown_filters(self):
        response = self.client.get("/api/suggested-edits/?task=write-an-opinion")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rejects_invalid_offset(self):
        response = self.client.get("/api/suggested-edits/?offset=next")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


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

    def test_project_catalog_lists_active_and_archived_project_families(self):
        response = self.client.get("/api/projects/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["projects"]), 14)
        self.assertEqual(response.data["projects"][0]["name"], "Wikipedia")
        wikinews = next(
            project
            for project in response.data["projects"]
            if project["name"] == "Wikinews"
        )
        self.assertEqual(wikinews["status"], "archived")


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
        self.assertEqual(
            self.client.session["wikimedia_oauth_access_token"],
            "temporary-access-token",
        )


class NotificationStatusAPITests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="message-reader")

    def test_notification_status_requires_authentication(self):
        response = self.client.get("/api/notifications/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_status_is_unavailable_without_an_oauth_token(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/notifications/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["available"], False)
        self.assertIsNone(response.data["hasUnread"])

    @patch("core.views.oauth.has_unread_notifications")
    def test_status_reports_unread_notifications(self, has_unread_notifications):
        has_unread_notifications.return_value = True
        self.client.force_authenticate(user=self.user)
        session = self.client.session
        session["wikimedia_oauth_access_token"] = "server-side-token"
        session.save()

        response = self.client.get("/api/notifications/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["available"], True)
        self.assertEqual(response.data["hasUnread"], True)
        has_unread_notifications.assert_called_once_with("server-side-token")


class DashboardAPITests(APITestCase):
    def test_dashboard_requires_authentication(self):
        response = self.client.get("/api/dashboard/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_dashboard_returns_real_user_totals(self):
        user = get_user_model().objects.create_user(username="wikimedia_987")
        WikimediaAccount.objects.create(
            user=user,
            wikimedia_user_id="987",
            username="Dashboard Editor",
            edit_count=126,
        )
        LearningProgress.objects.create(
            user=user,
            module_slug="add-a-citation",
            completed=True,
            points=25,
        )
        LearningProgress.objects.create(
            user=user,
            module_slug="visual-editor",
            completed=False,
            points=10,
        )
        self.client.force_authenticate(user=user)

        response = self.client.get("/api/dashboard/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "Dashboard Editor")
        self.assertEqual(
            response.data["stats"],
            {
                "wikimediaEdits": 126,
                "totalPoints": 35,
                "completedModules": 1,
                "activeModules": 1,
            },
        )
        self.assertEqual(len(response.data["recentProgress"]), 2)


class LearningFlowAPITests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="learner")

    def test_learning_flow_requires_authentication(self):
        response = self.client.get("/api/learning/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_first_lesson_in_each_path_is_available(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/learning/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["paths"]), 4)
        for path in response.data["paths"]:
            self.assertEqual(path["lessons"][0]["state"], "available")
            self.assertEqual(path["lessons"][1]["state"], "locked")
        self.assertFalse(response.data["leaderboard"]["unlocked"])

    def test_locked_lesson_cannot_be_completed(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            "/api/learning/lessons/wikipedia-use-the-visual-editor/complete/"
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertFalse(LearningProgress.objects.filter(user=self.user).exists())

    def test_completing_lesson_awards_xp_and_unlocks_next(self):
        self.client.force_authenticate(user=self.user)
        lesson_url = (
            "/api/learning/lessons/"
            "wikipedia-practice-in-your-sandbox/complete/"
        )

        response = self.client.post(lesson_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        wikipedia = response.data["paths"][0]
        self.assertEqual(wikipedia["lessons"][0]["state"], "completed")
        self.assertEqual(wikipedia["lessons"][1]["state"], "available")
        self.assertEqual(response.data["stats"]["totalPoints"], 20)
        self.assertTrue(response.data["leaderboard"]["unlocked"])

        repeated = self.client.post(lesson_url)

        self.assertEqual(repeated.data["stats"]["totalPoints"], 20)
        self.assertEqual(LearningProgress.objects.filter(user=self.user).count(), 1)


class MentorshipAPITests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="mentee")

    def test_mentorship_requires_authentication(self):
        response = self.client.get("/api/mentorship/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_can_create_a_mentor_request(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            "/api/mentorship/",
            {
                "project_slug": "wikipedia",
                "topic": "sources",
                "experience_level": "new",
                "goals": "Learn to cite reliable sources.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["request"]["status"], "pending")
        self.assertEqual(response.data["request"]["projectName"], "Wikipedia")
        self.assertEqual(MentorRequest.objects.filter(user=self.user).count(), 1)

    def test_user_cannot_create_two_pending_requests(self):
        MentorRequest.objects.create(
            user=self.user,
            project_slug="wikidata",
            topic="getting-started",
            experience_level="beginner",
        )
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            "/api/mentorship/",
            {
                "project_slug": "commons",
                "topic": "community",
                "experience_level": "new",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(MentorRequest.objects.filter(user=self.user).count(), 1)


class OnboardingAPITests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="newcomer")

    def test_onboarding_requires_authentication(self):
        response = self.client.get("/api/onboarding/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_new_user_has_incomplete_onboarding(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/onboarding/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"completed": False, "profile": None})

    def test_user_can_complete_onboarding(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            "/api/onboarding/",
            {
                "primaryGoal": "share-media",
                "preferredProject": "commons",
                "experienceLevel": "new",
                "supportPreference": "community",
                "dismissed": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["completed"])
        self.assertEqual(response.data["profile"]["preferredProject"], "commons")
        profile = OnboardingProfile.objects.get(user=self.user)
        self.assertEqual(profile.primary_goal, "share-media")

    def test_onboarding_rejects_unknown_choices(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            "/api/onboarding/",
            {
                "primaryGoal": "become-famous",
                "preferredProject": "wikipedia",
                "experienceLevel": "new",
                "supportPreference": "self-guided",
                "dismissed": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
