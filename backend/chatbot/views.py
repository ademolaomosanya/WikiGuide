from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .serializers import ChatRequestSerializer, ChatResponseSerializer
from .services import (
    UNAVAILABLE_ANSWER,
    build_answer,
    search_resources,
)


@api_view(["POST"])
@permission_classes([AllowAny])
def chat(request):
    serializer = ChatRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    message = serializer.validated_data["message"]
    resources = search_resources(message)

    if not resources:
        return Response({"answer": UNAVAILABLE_ANSWER, "sources": []})

    payload = {
        "answer": build_answer(resources),
        "sources": [
            {"title": resource.title, "url": resource.url}
            for resource in resources
        ],
    }
    response_serializer = ChatResponseSerializer(data=payload)
    response_serializer.is_valid(raise_exception=True)
    return Response(response_serializer.validated_data)
