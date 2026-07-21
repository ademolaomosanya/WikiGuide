import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("core", "0002_wikimediaaccount"),
    ]

    operations = [
        migrations.CreateModel(
            name="MentorRequest",
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
                    "project_slug",
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
                    "topic",
                    models.CharField(
                        choices=[
                            ("getting-started", "Getting started"),
                            ("editing", "Editing and formatting"),
                            ("sources", "Sources and citations"),
                            ("community", "Community participation"),
                            ("technical", "Technical contribution"),
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
                ("goals", models.CharField(blank=True, max_length=500)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending match"),
                            ("matched", "Matched"),
                            ("closed", "Closed"),
                        ],
                        default="pending",
                        max_length=16,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="mentor_requests",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ("-created_at",)},
        ),
        migrations.AddConstraint(
            model_name="mentorrequest",
            constraint=models.UniqueConstraint(
                condition=models.Q(("status", "pending")),
                fields=("user",),
                name="unique_pending_mentor_request_per_user",
            ),
        ),
    ]
