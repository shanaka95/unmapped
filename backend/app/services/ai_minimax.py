"""Minimax AI client — Anthropic-compatible API wrapper."""

import httpx

from app.config import get_settings


def chat(
    prompt: str,
    model: str | None = None,
    system: str = "You are a helpful assistant.",
    temperature: float = 0.7,
    max_tokens: int = 4096,
) -> str:
    """Send a chat completion to the Minimax API.

    Uses the Anthropic message format, compatible with Minimax's endpoint.
    """
    settings = get_settings()
    base_url = settings.minimax_base_url.rstrip("/")
    model_name = model or settings.minimax_model

    response = httpx.post(
        f"{base_url}/v1/messages",
        headers={
            "x-api-key": settings.minimax_api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": model_name,
            "system": system,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens,
        },
        timeout=120,
    )
    response.raise_for_status()
    data = response.json()

    return data["content"][0]["text"].strip()


def classify_ilo_sector(title: str, description: str | None, ilo_sectors: list[dict]) -> int | None:
    """Classify a sector into an ILO category using Minimax AI."""
    sector_list = "\n".join(f"{s['id']}: {s['name']}" for s in ilo_sectors)
    text = title
    if description:
        text += f"\n{description}"

    prompt = f"""Given this sector description:
{text}

Which of these ILO sector categories does it best belong to? Reply with ONLY the numeric ID, nothing else.

{sector_list}"""

    result = chat(prompt, system="You are a classification system. Reply with only the ID number.")
    try:
        import re
        match = re.search(r"\d+", result)
        if match:
            sector_id = int(match.group())
            valid_ids = {s["id"] for s in ilo_sectors}
            if sector_id in valid_ids:
                return sector_id
    except (ValueError, TypeError):
        pass
    return None
