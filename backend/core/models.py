from django.conf import settings
from django.db import models


class LearningProgress(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="learning_progress",
    )
    module_slug = models.SlugField(max_length=120)
    completed = models.BooleanField(default=False)
    points = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("user", "module_slug"),
                name="unique_user_learning_module",
            )
        ]
        ordering = ("-updated_at",)

    def __str__(self) -> str:
        return f"{self.user}: {self.module_slug}"


class WikimediaAccount(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wikimedia_account",
    )
    wikimedia_user_id = models.CharField(max_length=64, unique=True)
    username = models.CharField(max_length=255)
    edit_count = models.PositiveIntegerField(default=0)
    registered_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.username
