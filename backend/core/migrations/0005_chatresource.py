from django.db import migrations, models


RESOURCES = [
    {
        "title": "Make your first Wikipedia edit",
        "summary": "Use Wikipedia's visual editor to make a small, constructive change.",
        "content": (
            "Start with a small improvement such as fixing a typo or clarifying a sentence. "
            "Open an article, select Edit, make the change in the visual editor, preview it, "
            "write a short edit summary, and publish. Practice in your personal sandbox first "
            "if you are not ready to edit a live article."
        ),
        "project": "Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Help:Introduction_to_editing_with_VisualEditor/1",
    },
    {
        "title": "Add a reference on Wikipedia",
        "summary": "Support article claims with reliable, published sources.",
        "content": (
            "In the visual editor, place the cursor after the claim, select Cite, and enter the "
            "source URL, DOI, ISBN, or source details. Review the generated citation before "
            "inserting it. Sources should be reliable, published, and independent where possible."
        ),
        "project": "Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Help:Referencing_for_beginners",
    },
    {
        "title": "Create a Wikipedia article carefully",
        "summary": "New articles require independent sourcing and demonstrated notability.",
        "content": (
            "Before creating an article, search for an existing page and gather significant "
            "coverage from multiple reliable, independent sources. Draft the article in the "
            "Article Wizard or your sandbox. Avoid writing about yourself, your employer, or "
            "subjects where you have a conflict of interest."
        ),
        "project": "Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Help:Your_first_article",
    },
    {
        "title": "Upload an image to Wikimedia Commons",
        "summary": "Use the Upload Wizard for media you can release under a free license.",
        "content": (
            "Open the Wikimedia Commons Upload Wizard. Upload a photo or media file that you "
            "created yourself or that is clearly available under an accepted free license. "
            "Choose the correct license, add a useful title and description, identify the date "
            "and source, and add specific categories. Do not upload copyrighted images found "
            "online without permission compatible with Commons."
        ),
        "project": "Wikimedia Commons",
        "url": "https://commons.wikimedia.org/wiki/Commons:Upload_Wizard",
    },
    {
        "title": "Understand Wikimedia Commons licensing",
        "summary": "Commons accepts freely licensed and public-domain media.",
        "content": (
            "Wikimedia Commons hosts media that anyone may reuse under free-license terms or "
            "that is in the public domain. You must accurately identify the author, source, and "
            "license. A file being visible on the internet does not make it free to upload."
        ),
        "project": "Wikimedia Commons",
        "url": "https://commons.wikimedia.org/wiki/Commons:Licensing",
    },
    {
        "title": "What Wikidata is",
        "summary": "Wikidata is a shared, structured knowledge base used by Wikimedia projects.",
        "content": (
            "Wikidata stores structured information as items. Items have labels, descriptions, "
            "aliases, and statements. A statement connects a property to a value and may include "
            "qualifiers and references. Wikimedia projects and external applications can reuse "
            "this structured data."
        ),
        "project": "Wikidata",
        "url": "https://www.wikidata.org/wiki/Wikidata:Introduction",
    },
    {
        "title": "Add a statement to Wikidata",
        "summary": "Search first, then add a precise statement with a reference.",
        "content": (
            "Search Wikidata before creating an item. On an existing item, add a statement by "
            "choosing the correct property and entering a precise value. Add qualifiers when the "
            "statement needs context and include a reliable reference so others can verify it."
        ),
        "project": "Wikidata",
        "url": "https://www.wikidata.org/wiki/Help:Statements",
    },
    {
        "title": "Contribute to Wiktionary",
        "summary": "Improve definitions, pronunciations, examples, and translations.",
        "content": (
            "Search for the word before creating or changing an entry. Place content under the "
            "correct language and part-of-speech headings. You can add a missing definition, a "
            "pronunciation, a real usage example, an etymology, or a translation. Follow the "
            "entry layout and cite unusual meanings when needed."
        ),
        "project": "Wiktionary",
        "url": "https://en.wiktionary.org/wiki/Help:How_to_edit_a_page",
    },
]


def seed_chat_resources(apps, schema_editor):
    ChatResource = apps.get_model("core", "ChatResource")
    for resource in RESOURCES:
        ChatResource.objects.update_or_create(
            title=resource["title"],
            defaults=resource,
        )


def remove_seeded_resources(apps, schema_editor):
    ChatResource = apps.get_model("core", "ChatResource")
    ChatResource.objects.filter(title__in=[item["title"] for item in RESOURCES]).delete()


class Migration(migrations.Migration):
    dependencies = [("core", "0004_onboardingprofile")]

    operations = [
        migrations.CreateModel(
            name="ChatResource",
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
                ("title", models.CharField(max_length=200)),
                ("summary", models.TextField()),
                ("content", models.TextField()),
                ("project", models.CharField(max_length=80)),
                ("url", models.URLField(max_length=500)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ("title",)},
        ),
        migrations.RunPython(seed_chat_resources, remove_seeded_resources),
    ]
