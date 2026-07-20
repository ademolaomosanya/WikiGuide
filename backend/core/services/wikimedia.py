from typing import Any

import requests

WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php"


def search_articles(query: str, limit: int = 5) -> list[dict[str, Any]]:
    """Search English Wikipedia and return the raw result entries."""
    response = requests.get(
        WIKIPEDIA_API_URL,
        params={
            "action": "query",
            "list": "search",
            "srsearch": query,
            "srlimit": limit,
            "format": "json",
            "origin": "*",
        },
        timeout=10,
    )
    response.raise_for_status()
    return response.json()["query"]["search"]
