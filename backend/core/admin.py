from django.contrib import admin

from .models import LearningProgress


@admin.register(LearningProgress)
class LearningProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "module_slug", "completed", "points", "updated_at")
    list_filter = ("completed",)
    search_fields = ("user__username", "module_slug")
