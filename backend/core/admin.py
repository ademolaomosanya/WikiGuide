from django.contrib import admin

from .models import LearningProgress, WikimediaAccount


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
