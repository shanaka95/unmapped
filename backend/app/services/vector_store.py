"""ChromaDB vector store service for occupation embeddings."""

import chromadb
from chromadb.config import Settings as ChromaSettings
from openai import OpenAI

from app.config import get_settings

settings = get_settings()

# OpenRouter client for embeddings
_embedding_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.openrouter_api_key,
)

# Persistent chroma storage under backend/data/chroma
chroma_client = chromadb.PersistentClient(
    path=str(settings.data_dir / "chroma"),
    settings=ChromaSettings(anonymized_telemetry=False),
)

# Collection for ISCO occupation embeddings
OCCUPATIONS_COLLECTION = "isco_occupations"


def get_embedding(text: str) -> list[float]:
    """Generate an embedding vector using OpenRouter."""
    response = _embedding_client.embeddings.create(
        extra_headers={
            "HTTP-Referer": "https://unmapped.vitaz.dev",
            "X-OpenRouter-Title": "UNMAPPED",
        },
        model=settings.embedding_model,
        input=text,
        encoding_format="float",
    )
    return response.data[0].embedding


def get_occupations_collection():
    """Get or create the occupations embedding collection."""
    return chroma_client.get_or_create_collection(
        name=OCCUPATIONS_COLLECTION,
        metadata={"hnsw:space": "cosine"},
    )
