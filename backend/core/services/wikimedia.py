from hashlib import sha256
from typing import Any
from urllib.parse import quote

import requests
from django.conf import settings
from django.core.cache import cache
from django.utils.html import strip_tags

FRENCH_WIKIPEDIA_API_URL = "https://fr.wikipedia.org/w/api.php"
SEARCH_BATCH_SIZE = 10
SEARCH_CACHE_SECONDS = 300

TASKS = {
    "copyedit": {
        "name": "Improve the writing",
        "template": 'hastemplate:"À wikifier"',
        "guidance": "Clarify a sentence, fix spelling, or improve the article's structure.",
    },
    "references": {
        "name": "Add a reference",
        "template": 'hastemplate:"À sourcer"',
        "guidance": "Find a reliable published source for a statement that needs support.",
    },
    "links": {
        "name": "Add useful links",
        "template": 'hastemplate:"Orphelin"',
        "guidance": "Connect the article to other relevant Wikipedia pages.",
    },
    "expand": {
        "name": "Expand a short article",
        "template": 'hastemplate:"Ébauche"',
        "guidance": "Add a concise, sourced fact to improve this short article.",
    },
}

TOPICS = {
    "all": "",
    "culture": "culture arts patrimoine",
    "history": "histoire",
    "science": "science technologie nature",
    "society": "société éducation droits",
}


class WikimediaServiceError(Exception):
    """Raised when Wikipedia cannot provide a usable suggestion."""


def search_articles(query: str, limit: int = 5) -> list[dict[str, Any]]:
    """Search French Wikipedia and return raw result entries."""
    response = _request_search(query, limit=limit, offset=0)
    return response.get("query", {}).get("search", [])


def get_suggested_edit(
    task_type: str,
    topic: str,
    offset: int = 0,
) -> dict[str, Any]:
    """Return one live maintenance-task candidate from French Wikipedia."""
    task = TASKS[task_type]
    topic_query = TOPICS[topic]
    search_query = " ".join(part for part in (task["template"], topic_query) if part)
    result = _first_search_result(search_query, offset)
    topic_matched = True

    if result is None and topic != "all":
        result = _first_search_result(task["template"], offset)
        topic_matched = False
    if result is None:
        raise WikimediaServiceError("No suitable Wikipedia task is available right now.")

    title = str(result["title"])
    encoded_title = quote(title.replace(" ", "_"), safe="()_-'éèêëàâäîïôöùûüçÉÈÀÇ")
    article_url = f"https://fr.wikipedia.org/wiki/{encoded_title}"

    return {
        "taskType": task_type,
        "taskName": task["name"],
        "guidance": task["guidance"],
        "topic": topic,
        "topicMatched": topic_matched,
        "isFallback": False,
        "nextOffset": offset + 1,
        "article": {
            "title": title,
            "excerpt": _clean_excerpt(str(result.get("snippet", ""))),
            "url": article_url,
            "editUrl": f"{article_url}?veaction=edit",
        },
    }


def get_demo_suggested_edit(task_type: str, topic: str) -> dict[str, Any]:
    """Return a safe local-demo task when live Wikipedia search is unavailable."""
    task = TASKS[task_type]
    article_url = (
        "https://fr.wikipedia.org/wiki/"
        "Wikip%C3%A9dia:Bac_%C3%A0_sable"
    )
    return {
        "taskType": task_type,
        "taskName": task["name"],
        "guidance": task["guidance"],
        "topic": topic,
        "topicMatched": topic == "all",
        "isFallback": True,
        "nextOffset": 0,
        "article": {
            "title": "Wikipedia practice sandbox",
            "excerpt": (
                "Practice this task safely in Wikipedia's sandbox while live article "
                "recommendations are unavailable. Sandbox edits are designed for testing."
            ),
            "url": article_url,
            "editUrl": f"{article_url}?veaction=edit",
        },
    }


def _first_search_result(query: str, offset: int) -> dict[str, Any] | None:
    batch_offset = (offset // SEARCH_BATCH_SIZE) * SEARCH_BATCH_SIZE
    result_index = offset % SEARCH_BATCH_SIZE
    results = _search_batch(query, batch_offset)
    if result_index < len(results):
        return results[result_index]
    if offset > 0:
        results = _search_batch(query, 0)
        return results[0] if results else None
    return None


def _search_batch(query: str, offset: int) -> list[dict[str, Any]]:
    query_hash = sha256(query.encode("utf-8")).hexdigest()
    cache_key = f"wikiguide:suggested-edits:{query_hash}:{offset}"
    cached_results = cache.get(cache_key)
    if cached_results is not None:
        return cached_results

    payload = _request_search(query, limit=SEARCH_BATCH_SIZE, offset=offset)
    results = payload.get("query", {}).get("search", [])
    cache.set(cache_key, results, SEARCH_CACHE_SECONDS)
    return results


def _request_search(query: str, limit: int, offset: int) -> dict[str, Any]:
    try:
        response = requests.get(
            FRENCH_WIKIPEDIA_API_URL,
            params={
                "action": "query",
                "list": "search",
                "srsearch": query,
                "srnamespace": 0,
                "srlimit": limit,
                "sroffset": offset,
                "format": "json",
                "formatversion": 2,
                "maxlag": 5,
            },
            headers={"User-Agent": settings.WIKIMEDIA_USER_AGENT},
            timeout=10,
        )
        response.raise_for_status()
        return response.json()
    except (requests.RequestException, ValueError) as exc:
        raise WikimediaServiceError(
            "French Wikipedia could not be reached. Please try again shortly."
        ) from exc


def _clean_excerpt(snippet: str) -> str:
    return " ".join(strip_tags(snippet).replace("&quot;", '"').split())
