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


class MentorRequest(models.Model):
    PROJECT_CHOICES = [
        ("wikipedia", "Wikipedia"),
        ("wikidata", "Wikidata"),
        ("commons", "Wikimedia Commons"),
        ("wiktionary", "Wiktionary"),
    ]
    TOPIC_CHOICES = [
        ("getting-started", "Getting started"),
        ("editing", "Editing and formatting"),
        ("sources", "Sources and citations"),
        ("community", "Community participation"),
        ("technical", "Technical contribution"),
    ]
    EXPERIENCE_CHOICES = [
        ("new", "New contributor"),
        ("beginner", "Some contribution experience"),
        ("experienced", "Experienced contributor"),
    ]
    STATUS_CHOICES = [
        ("pending", "Pending match"),
        ("matched", "Matched"),
        ("closed", "Closed"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mentor_requests",
    )
    project_slug = models.CharField(max_length=32, choices=PROJECT_CHOICES)
    topic = models.CharField(max_length=32, choices=TOPIC_CHOICES)
    experience_level = models.CharField(max_length=32, choices=EXPERIENCE_CHOICES)
    goals = models.CharField(max_length=500, blank=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("user",),
                condition=models.Q(status="pending"),
                name="unique_pending_mentor_request_per_user",
            )
        ]
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.user}: {self.get_project_slug_display()} ({self.status})"


class OnboardingProfile(models.Model):
    GOAL_CHOICES = [
        ("learn-editing", "Learn how to edit"),
        ("add-knowledge", "Add or improve knowledge"),
        ("share-media", "Share freely licensed media"),
        ("structured-data", "Work with structured data"),
        ("join-community", "Join a Wikimedia community"),
    ]
    PROJECT_CHOICES = MentorRequest.PROJECT_CHOICES
    EXPERIENCE_CHOICES = MentorRequest.EXPERIENCE_CHOICES
    SUPPORT_CHOICES = [
        ("self-guided", "Learn at my own pace"),
        ("mentor", "Get help from a mentor"),
        ("community", "Connect with a community"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="onboarding_profile",
    )
    primary_goal = models.CharField(max_length=32, choices=GOAL_CHOICES)
    preferred_project = models.CharField(max_length=32, choices=PROJECT_CHOICES)
    experience_level = models.CharField(max_length=32, choices=EXPERIENCE_CHOICES)
    support_preference = models.CharField(max_length=32, choices=SUPPORT_CHOICES)
    dismissed = models.BooleanField(default=False)
    completed_at = models.DateTimeField()
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.user}: {self.preferred_project} onboarding"


class ChatResource(models.Model):
    title = models.CharField(max_length=200)
    summary = models.TextField()
    content = models.TextField()
    project = models.CharField(max_length=80)
    url = models.URLField(max_length=500)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("title",)

    def __str__(self) -> str:
        return self.title
