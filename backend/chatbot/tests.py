from rest_framework import status
from rest_framework.test import APITestCase

from core.models import ChatResource

from .services import UNAVAILABLE_ANSWER, build_answer, search_resources


class ChatAPITests(APITestCase):
    def setUp(self):
        self.resource = ChatResource.objects.create(
            title="Upload an image",
            summary="Upload your own freely licensed image to Commons.",
            content="Use the Upload Wizard and add a license, description, and categories.",
            project="Wikimedia Commons",
            url="https://commons.wikimedia.org/wiki/Commons:Upload_Wizard",
        )

    def test_chat_is_available_without_authentication(self):
        response = self.client.post(
            "/api/chat/",
            {"message": "How do I upload images to Commons?"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["sources"][0]["title"], "Upload an image")

    def test_resource_search_uses_database_fields(self):
        results = search_resources("How do I upload images to Commons?")

        self.assertEqual(results[0], self.resource)

    def test_chat_returns_database_answer_and_sources(self):
        response = self.client.post(
            "/api/chat/",
            {"message": "How do I upload images to Commons?"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["answer"],
            f"{self.resource.summary}\n\n{self.resource.content}",
        )
        self.assertEqual(response.data["sources"][0]["title"], "Upload an image")

    def test_unknown_question_returns_unavailable_answer(self):
        response = self.client.post(
            "/api/chat/",
            {"message": "How do I repair a motorcycle engine?"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"answer": UNAVAILABLE_ANSWER, "sources": []})

    def test_empty_message_is_rejected(self):
        response = self.client.post("/api/chat/", {"message": "   "}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_answer_is_built_from_the_best_database_resource(self):
        answer = build_answer([self.resource])

        self.assertEqual(answer, f"{self.resource.summary}\n\n{self.resource.content}")
