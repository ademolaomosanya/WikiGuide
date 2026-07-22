from rest_framework import serializers


class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=1000, trim_whitespace=True)


class ChatSourceSerializer(serializers.Serializer):
    title = serializers.CharField()
    url = serializers.URLField()


class ChatResponseSerializer(serializers.Serializer):
    answer = serializers.CharField()
    sources = ChatSourceSerializer(many=True)
