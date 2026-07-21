from rest_framework import serializers

from .models import LearningProgress, MentorRequest, OnboardingProfile


class LearningProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningProgress
        fields = ("id", "module_slug", "completed", "points", "updated_at")
        read_only_fields = ("id", "updated_at")


class MentorRequestSerializer(serializers.ModelSerializer):
    projectName = serializers.CharField(source="get_project_slug_display", read_only=True)
    topicName = serializers.CharField(source="get_topic_display", read_only=True)
    experienceName = serializers.CharField(
        source="get_experience_level_display",
        read_only=True,
    )

    class Meta:
        model = MentorRequest
        fields = (
            "id",
            "project_slug",
            "projectName",
            "topic",
            "topicName",
            "experience_level",
            "experienceName",
            "goals",
            "status",
            "created_at",
        )
        read_only_fields = ("id", "status", "created_at")


class OnboardingProfileSerializer(serializers.ModelSerializer):
    primaryGoal = serializers.ChoiceField(
        source="primary_goal",
        choices=OnboardingProfile.GOAL_CHOICES,
    )
    preferredProject = serializers.ChoiceField(
        source="preferred_project",
        choices=OnboardingProfile.PROJECT_CHOICES,
    )
    experienceLevel = serializers.ChoiceField(
        source="experience_level",
        choices=OnboardingProfile.EXPERIENCE_CHOICES,
    )
    supportPreference = serializers.ChoiceField(
        source="support_preference",
        choices=OnboardingProfile.SUPPORT_CHOICES,
    )
    completedAt = serializers.DateTimeField(source="completed_at", read_only=True)

    class Meta:
        model = OnboardingProfile
        fields = (
            "id",
            "primaryGoal",
            "preferredProject",
            "experienceLevel",
            "supportPreference",
            "dismissed",
            "completedAt",
        )
        read_only_fields = ("id", "completedAt")
