"""ChromaDB vector store service for occupation embeddings."""

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config import get_settings

settings = get_settings()

# Persistent chroma storage under backend/data/chroma
chroma_client = chromadb.PersistentClient(
    path=str(settings.data_dir / "chroma"),
    settings=ChromaSettings(anonymized_telemetry=False),
)

# Collection for ISCO occupation embeddings
OCCUPATIONS_COLLECTION = "isco_occupations"


def get_occupations_collection():
    """Get or create the occupations embedding collection."""
    return chroma_client.get_or_create_collection(
        name=OCCUPATIONS_COLLECTION,
        metadata={"hnsw:space": "cosine"},
    )
