from django.contrib import admin

from .models import (
    ChatResource,
    LearningProgress,
    MentorRequest,
    OnboardingProfile,
    WikimediaAccount,
)


@admin.register(LearningProgress)
class LearningProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "module_slug", "completed", "points", "updated_at")
    list_filter = ("completed",)
    search_fields = ("user__username", "module_slug")


@admin.register(WikimediaAccount)
class WikimediaAccountAdmin(admin.ModelAdmin):
    list_display = ("username", "wikimedia_user_id", "edit_count", "updated_at")
    search_fields = ("username", "wikimedia_user_id", "user__username")
    readonly_fields = ("wikimedia_user_id", "updated_at")


@admin.register(MentorRequest)
class MentorRequestAdmin(admin.ModelAdmin):
    list_display = ("user", "project_slug", "topic", "status", "created_at")
    list_filter = ("status", "project_slug", "topic")
    search_fields = ("user__username", "user__wikimedia_account__username", "goals")


@admin.register(OnboardingProfile)
class OnboardingProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "preferred_project",
        "primary_goal",
        "support_preference",
        "dismissed",
        "completed_at",
    )
    list_filter = ("preferred_project", "experience_level", "support_preference")


@admin.register(ChatResource)
class ChatResourceAdmin(admin.ModelAdmin):
    list_display = ("title", "project", "is_active", "updated_at")
    list_filter = ("project", "is_active")
    search_fields = ("title", "summary", "content", "project")
