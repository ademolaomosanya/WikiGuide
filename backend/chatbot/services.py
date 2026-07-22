import re
from collections.abc import Sequence

from django.db.models import Q

from core.models import ChatResource

UNAVAILABLE_ANSWER = "WikiGuide does not have information about that yet."
STOP_WORDS = {
    "about",
    "could",
    "does",
    "from",
    "have",
    "help",
    "how",
    "make",
    "please",
    "should",
    "that",
    "the",
    "this",
    "what",
    "when",
    "where",
    "which",
    "with",
    "would",
    "your",
}


def _search_terms(message: str) -> list[str]:
    terms = []
    for raw_term in re.findall(r"[a-zA-Z0-9]+", message.lower()):
        if len(raw_term) < 3 or raw_term in STOP_WORDS:
            continue
        term = raw_term[:-1] if raw_term.endswith("s") and len(raw_term) > 4 else raw_term
        if term not in terms:
            terms.append(term)
    return terms[:10]


def _resource_score(resource: ChatResource, terms: Sequence[str]) -> int:
    fields = (
        (resource.title.lower(), 4),
        (resource.summary.lower(), 3),
        (resource.project.lower(), 2),
        (resource.content.lower(), 1),
    )
    return sum(weight for term in terms for value, weight in fields if term in value)


def search_resources(message: str, limit: int = 3) -> list[ChatResource]:
    terms = _search_terms(message)
    if not terms:
        return []

    query = Q()
    for term in terms:
        query |= (
            Q(title__icontains=term)
            | Q(summary__icontains=term)
            | Q(content__icontains=term)
            | Q(project__icontains=term)
        )

    candidates = list(ChatResource.objects.filter(query, is_active=True)[:50])
    candidates.sort(key=lambda resource: (-_resource_score(resource, terms), resource.title))
    return candidates[:limit]


def build_answer(resources: Sequence[ChatResource]) -> str:
    """Build a deterministic answer from the best matching database resource."""
    if not resources:
        return UNAVAILABLE_ANSWER

    resource = resources[0]
    summary = resource.summary.strip()
    content = resource.content.strip()
    return "\n\n".join(part for part in (summary, content) if part)
