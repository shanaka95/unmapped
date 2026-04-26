"""Generate and store embeddings for ISCO occupations using OpenRouter/qwen3-embedding-8b.

For each ISCO occupation, concatenates all 6 fields into one text:
  title + definition + tasks_include + included_occupations + excluded_occupations + notes

Generates one embedding per occupation and stores it in ChromaDB.
Document ID: {isco_code}
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from openai import OpenAI

from app.config import get_settings
from app.database import SessionLocal
from app.models.isco_occupation import IscoOccupation
from app.services.vector_store import get_occupations_collection

settings = get_settings()

# OpenRouter client for embeddings
openai_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.openrouter_api_key,
)

# Fields to concatenate, in order
EMBEDDING_FIELDS = [
    "title",
    "definition",
    "tasks_include",
    "included_occupations",
    "excluded_occupations",
    "notes",
]


def build_occupation_text(occ: IscoOccupation) -> str:
    """Concatenate all occupation fields into one searchable text."""
    parts = []
    for field in EMBEDDING_FIELDS:
        value = getattr(occ, field, None)
        if value and value.strip():
            parts.append(f"{field}: {value.strip()}")
    return "\n\n".join(parts)


def get_embedding(text: str) -> list[float]:
    """Get embedding vector from OpenRouter."""
    response = openai_client.embeddings.create(
        extra_headers={
            "HTTP-Referer": "https://unmapped.vitaz.dev",
            "X-OpenRouter-Title": "UNMAPPED",
        },
        model=settings.embedding_model,
        input=text,
        encoding_format="float",
    )
    return response.data[0].embedding


def seed():
    collection = get_occupations_collection()

    # Clear existing embeddings
    existing_ids = collection.get()["ids"]
    if existing_ids:
        collection.delete(ids=existing_ids)
        print(f"Cleared {len(existing_ids)} existing embeddings.")

    with SessionLocal() as session:
        occupations = session.query(IscoOccupation).all()
        print(f"Found {len(occupations)} ISCO occupations to embed.")

        texts = []
        ids = []
        metadatas = []

        for occ in occupations:
            occ_text = build_occupation_text(occ)
            if not occ_text.strip():
                continue

            texts.append(occ_text)
            ids.append(occ.code)
            metadatas.append({
                "isco_code": occ.code,
                "title": occ.title,
                "level": occ.level,
                "group_id": occ.group_id or 0,
            })

        print(f"Will embed {len(texts)} occupations.")

        # Embed in small sub-batches to avoid API rate limits
        sub_batch_size = 5
        for i in range(0, len(texts), sub_batch_size):
            sub_texts = texts[i : i + sub_batch_size]
            sub_ids = ids[i : i + sub_batch_size]
            sub_metas = metadatas[i : i + sub_batch_size]

            embeddings = []
            for text in sub_texts:
                try:
                    vec = get_embedding(text)
                    embeddings.append(vec)
                    print(f"  [{i + len(embeddings)}/{len(texts)}] Embedded {sub_ids[len(embeddings)-1]}")
                except Exception as e:
                    print(f"  ERROR embedding {sub_ids[len(embeddings)]}: {e}")
                    continue

            if embeddings:
                collection.add(
                    embeddings=embeddings,
                    documents=sub_texts[: len(embeddings)],
                    ids=sub_ids[: len(embeddings)],
                    metadatas=sub_metas[: len(embeddings)],
                )

        print(f"Done! Stored {len(ids)} embeddings for {len(occupations)} occupations.")


if __name__ == "__main__":
    seed()
