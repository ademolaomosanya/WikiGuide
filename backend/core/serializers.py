from rest_framework import serializers

from .models import LearningProgress


class LearningProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningProgress
        fields = ("id", "module_slug", "completed", "points", "updated_at")
        read_only_fields = ("id", "updated_at")
