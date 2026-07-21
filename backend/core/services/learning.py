from dataclasses import dataclass

from django.db import transaction
from django.db.models import Count, Q, Sum
from django.db.models.functions import Coalesce
from django.utils.text import slugify

from ..models import LearningProgress
from .guides import PROJECT_GUIDES


LESSON_POINTS = 20


class LessonNotFoundError(ValueError):
    pass


class LessonLockedError(ValueError):
    pass


@dataclass(frozen=True)
class Lesson:
    slug: str
    project_slug: str
    project_name: str
    project_mark: str
    title: str
    description: str
    order: int
    points: int = LESSON_POINTS


def _curriculum() -> list[tuple[dict, list[Lesson]]]:
    paths = []
    for project in PROJECT_GUIDES:
        lessons = [
            Lesson(
                slug=f"{project['slug']}-{slugify(step['title'])}",
                project_slug=project["slug"],
                project_name=project["name"],
                project_mark=project["mark"],
                title=step["title"],
                description=step["body"],
                order=index,
            )
            for index, step in enumerate(project["steps"], start=1)
        ]
        paths.append((project, lessons))
    return paths


def _serialize_lesson(lesson: Lesson, state: str) -> dict:
    return {
        "slug": lesson.slug,
        "title": lesson.title,
        "description": lesson.description,
        "order": lesson.order,
        "points": lesson.points,
        "state": state,
    }


def _leaderboard(user, completed_lessons: int) -> dict:
    if completed_lessons == 0:
        return {
            "unlocked": False,
            "unlockRequirement": 1,
            "entries": [],
        }

    rows = (
        LearningProgress.objects.filter(completed=True)
        .values(
            "user_id",
            "user__username",
            "user__wikimedia_account__username",
        )
        .annotate(
            points=Coalesce(Sum("points"), 0),
            completedLessons=Count("id"),
        )
        .order_by("-points", "-completedLessons", "user_id")[:20]
    )
    return {
        "unlocked": True,
        "unlockRequirement": 1,
        "entries": [
            {
                "rank": index,
                "username": row["user__wikimedia_account__username"]
                or row["user__username"],
                "points": row["points"],
                "completedLessons": row["completedLessons"],
                "isCurrentUser": row["user_id"] == user.pk,
            }
            for index, row in enumerate(rows, start=1)
        ],
    }


def get_learning_flow(user) -> dict:
    progress = {
        item.module_slug: item
        for item in LearningProgress.objects.filter(user=user)
    }
    paths = []
    available_lessons = 0

    for project, lessons in _curriculum():
        serialized_lessons = []
        previous_completed = True
        completed_in_path = 0
        for lesson in lessons:
            item = progress.get(lesson.slug)
            completed = bool(item and item.completed)
            if completed:
                state = "completed"
                completed_in_path += 1
            elif previous_completed:
                state = "available"
                available_lessons += 1
            else:
                state = "locked"
            serialized_lessons.append(_serialize_lesson(lesson, state))
            previous_completed = completed

        paths.append(
            {
                "slug": project["slug"],
                "name": project["name"],
                "mark": project["mark"],
                "completedLessons": completed_in_path,
                "totalLessons": len(lessons),
                "lessons": serialized_lessons,
            }
        )

    totals = LearningProgress.objects.filter(user=user).aggregate(
        total_points=Coalesce(Sum("points", filter=Q(completed=True)), 0),
        completed_lessons=Count("id", filter=Q(completed=True)),
    )
    account = getattr(user, "wikimedia_account", None)
    completed_lessons = totals["completed_lessons"]
    total_points = totals["total_points"]

    return {
        "username": account.username if account else user.get_username(),
        "stats": {
            "wikimediaEdits": account.edit_count if account else 0,
            "totalPoints": total_points,
            "completedLessons": completed_lessons,
            "availableLessons": available_lessons,
        },
        "paths": paths,
        "quests": [
            {
                "slug": "first-lesson",
                "title": "Complete your first lesson",
                "description": "Start one Wikimedia learning path.",
                "progress": min(completed_lessons, 1),
                "target": 1,
                "unit": "lesson",
                "completed": completed_lessons >= 1,
            },
            {
                "slug": "three-lessons",
                "title": "Build momentum",
                "description": "Complete three lessons across any project.",
                "progress": min(completed_lessons, 3),
                "target": 3,
                "unit": "lessons",
                "completed": completed_lessons >= 3,
            },
            {
                "slug": "one-hundred-points",
                "title": "Earn 100 XP",
                "description": "Learn consistently to reach your first XP milestone.",
                "progress": min(total_points, 100),
                "target": 100,
                "unit": "XP",
                "completed": total_points >= 100,
            },
        ],
        "leaderboard": _leaderboard(user, completed_lessons),
        "communities": [
            {
                "projectSlug": "wikipedia",
                "name": "Wikipedia Teahouse",
                "description": "Friendly help and questions for new Wikipedia editors.",
                "url": "https://en.wikipedia.org/wiki/Wikipedia:Teahouse",
            },
            {
                "projectSlug": "wikidata",
                "name": "Wikidata Project Chat",
                "description": "Discuss Wikidata items, policies, proposals, and technical issues.",
                "url": "https://www.wikidata.org/wiki/Wikidata:Project_chat",
            },
            {
                "projectSlug": "commons",
                "name": "Commons Village Pump",
                "description": "Community-wide discussion about Wikimedia Commons.",
                "url": "https://commons.wikimedia.org/wiki/Commons:Village_pump",
            },
            {
                "projectSlug": "wiktionary",
                "name": "Wiktionary Beer Parlour",
                "description": "General policy discussions and community proposals.",
                "url": "https://en.wiktionary.org/wiki/Wiktionary:Beer_parlour",
            },
        ],
    }


@transaction.atomic
def complete_lesson(user, lesson_slug: str) -> dict:
    selected = None
    previous = None
    for _, lessons in _curriculum():
        for index, lesson in enumerate(lessons):
            if lesson.slug == lesson_slug:
                selected = lesson
                previous = lessons[index - 1] if index > 0 else None
                break
        if selected:
            break

    if selected is None:
        raise LessonNotFoundError("That lesson does not exist.")

    if previous and not LearningProgress.objects.filter(
        user=user,
        module_slug=previous.slug,
        completed=True,
    ).exists():
        raise LessonLockedError("Complete the previous lesson to unlock this one.")

    LearningProgress.objects.update_or_create(
        user=user,
        module_slug=selected.slug,
        defaults={"completed": True, "points": selected.points},
    )
    return get_learning_flow(user)
