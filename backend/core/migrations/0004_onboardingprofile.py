import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("core", "0003_mentorrequest"),
    ]

    operations = [
        migrations.CreateModel(
            name="OnboardingProfile",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "primary_goal",
                    models.CharField(
                        choices=[
                            ("learn-editing", "Learn how to edit"),
                            ("add-knowledge", "Add or improve knowledge"),
                            ("share-media", "Share freely licensed media"),
                            ("structured-data", "Work with structured data"),
                            ("join-community", "Join a Wikimedia community"),
                        ],
                        max_length=32,
                    ),
                ),
                (
                    "preferred_project",
                    models.CharField(
                        choices=[
                            ("wikipedia", "Wikipedia"),
                            ("wikidata", "Wikidata"),
                            ("commons", "Wikimedia Commons"),
                            ("wiktionary", "Wiktionary"),
                        ],
                        max_length=32,
                    ),
                ),
                (
                    "experience_level",
                    models.CharField(
                        choices=[
                            ("new", "New contributor"),
                            ("beginner", "Some contribution experience"),
                            ("experienced", "Experienced contributor"),
                        ],
                        max_length=32,
                    ),
                ),
                (
                    "support_preference",
                    models.CharField(
                        choices=[
                            ("self-guided", "Learn at my own pace"),
                            ("mentor", "Get help from a mentor"),
                            ("community", "Connect with a community"),
                        ],
                        max_length=32,
                    ),
                ),
                ("dismissed", models.BooleanField(default=False)),
                ("completed_at", models.DateTimeField()),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="onboarding_profile",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]
