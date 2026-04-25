# Backend Architecture

## Overview

Layered module pattern built on FastAPI + SQLAlchemy + SQLite. Each feature domain is a self-contained module. Adding a new feature means: create a module folder + register its router.

## Structure

```
backend/
├── app/
│   ├── config.py          # Settings (env vars via pydantic-settings)
│   ├── database.py        # Engine, SessionLocal, SQLAlchemy Base
│   ├── dependencies.py    # Shared FastAPI dependencies (get_db)
│   ├── main.py            # App factory: create_app() + router wiring
│   ├── models/            # SQLAlchemy ORM models
│   ├── schemas/           # Pydantic request/response schemas
│   ├── routers/           # FastAPI routers (one file per domain)
│   └── services/          # Business logic layer
├── docs/                  # Architecture & design docs
├── requirements.txt
└── run.py                 # uvicorn entrypoint
```

## Layers

```
Request → Router → Service → Model
                ↕           ↕
              Schema       Database
```

- **Router** — HTTP concerns only: parse request, call service, return response.
- **Service** — Business logic. Receives parsed data, interacts with DB via SQLAlchemy.
- **Model** — SQLAlchemy ORM models, one file per domain.
- **Schema** — Pydantic models for request validation and response serialization.

## Config

All settings live in `app/config.py` using pydantic-settings. Environment variables are prefixed with `UNMAPPED_`:

| Env Var | Default | Description |
|---------|---------|-------------|
| `UNMAPPED_APP_NAME` | Unmapped API | App title |
| `UNMAPPED_DEBUG` | false | Debug mode |
| `UNMAPPED_DATABASE_URL` | sqlite:///./unmapped.db | Database connection string |

## Adding a New Feature

1. Create `app/models/example.py` with SQLAlchemy model
2. Create `app/schemas/example.py` with Pydantic schemas
3. Create `app/services/example.py` with business logic
4. Create `app/routers/example.py` with FastAPI router
5. Register the router in `app/main.py`

## Running

```bash
cd backend
pip install -r requirements.txt
python run.py
```

API available at `http://localhost:8000`. Swagger docs at `/docs`.
