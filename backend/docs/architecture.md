# Backend Architecture

## Overview

Layered module pattern built on FastAPI + SQLAlchemy + SQLite. Each feature domain is a self-contained module. Adding a feature means: create a module folder + register its router.

## Structure

```
backend/
├── alembic/                 # Database migrations
│   └── versions/            # Migration scripts
├── alembic.ini              # Alembic config
├── app/
│   ├── config.py            # Settings (env vars via pydantic-settings)
│   ├── database.py          # Engine, SessionLocal, SQLAlchemy Base
│   ├── dependencies.py      # Shared FastAPI dependencies (get_db)
│   ├── main.py              # App factory: create_app() + router wiring
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic request/response schemas
│   ├── routers/             # FastAPI routers (one file per domain)
│   └── services/            # Business logic layer
├── docs/                    # Architecture & design docs
├── requirements.txt
└── run.py                   # uvicorn entrypoint
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

## Database

SQLAlchemy ORM with SQLite as the default database. The connection is configured via `app/config.py` and read from the `UNMAPPED_DATABASE_URL` env var. SQLite-specific options (like `check_same_thread`) are applied conditionally in `database.py`, so switching to PostgreSQL or MySQL only requires changing the connection string — no code changes.

### Migrations (Alembic)

All schema changes are managed through Alembic migrations.

**RULE: Always create an Alembic migration for any database schema change.** Never modify the database schema manually or via `Base.metadata.create_all()` in production. Every model change (new table, new column, type change, index, etc.) must go through:

```bash
alembic revision --autogenerate -m "description of change"
```

Review the generated migration before applying. Then:

```bash
alembic upgrade head
```

To rollback:

```bash
alembic downgrade -1
```

The `alembic/env.py` imports all models from `app.models` and reads the database URL from `app/config.py`, so migrations always reflect the current model state.

## Config

All settings live in `app/config.py` using pydantic-settings. Environment variables are prefixed with `UNMAPPED_`:

| Env Var | Default | Description |
|---------|---------|-------------|
| `UNMAPPED_APP_NAME` | Unmapped API | App title |
| `UNMAPPED_DEBUG` | false | Debug mode |
| `UNMAPPED_DATABASE_URL` | sqlite:///./unmapped.db | Database connection string |

To switch databases, set `UNMAPPED_DATABASE_URL`:
- SQLite: `sqlite:///./unmapped.db`
- PostgreSQL: `postgresql+psycopg2://user:pass@localhost/dbname`
- MySQL: `mysql+pymysql://user:pass@localhost/dbname`

## Adding a New Feature

1. Create `app/models/example.py` with SQLAlchemy model — import it in `app/models/__init__.py`
2. Create `app/schemas/example.py` with Pydantic schemas
3. Create `app/services/example.py` with business logic
4. Create `app/routers/example.py` with FastAPI router
5. Register the router in `app/main.py`
6. Generate migration: `alembic revision --autogenerate -m "add example table"`
7. Apply migration: `alembic upgrade head`

## Running

```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

API available at `http://localhost:8000`. Swagger docs at `/docs`.
