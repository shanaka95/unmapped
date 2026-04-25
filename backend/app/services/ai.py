from enum import StrEnum

import httpx

from app.config import get_settings


class AiModel(StrEnum):
    QWEN3_30B = "@cf/qwen/qwen3-30b-a3b-fp8"


def _base_url() -> str:
    settings = get_settings()
    return f"https://api.cloudflare.com/client/v4/accounts/{settings.cloudflare_account_id}/ai/run"


def chat(
    prompt: str,
    model: AiModel = AiModel.QWEN3_30B,
    system: str = "You are a helpful assistant.",
) -> str:
    settings = get_settings()
    url = f"{_base_url()}/{model}"

    response = httpx.post(
        url,
        headers={"Authorization": f"Bearer {settings.cloudflare_auth_token}"},
        json={
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
        },
        timeout=120,
    )
    response.raise_for_status()
    data = response.json()

    return data["result"]["choices"][0]["message"]["content"].strip()


def classify_ilo_sector(title: str, description: str | None, ilo_sectors: list[dict]) -> int | None:
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
        # Extract first integer from the response
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
