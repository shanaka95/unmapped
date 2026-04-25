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
│   ├── config.py            # Settings (env vars via pydantic-settings + .env)
│   ├── database.py          # Engine, SessionLocal, SQLAlchemy Base
│   ├── dependencies.py      # Shared deps (get_db, get_current_user_id)
│   ├── main.py              # App factory: create_app() + CORS + routers
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic request/response schemas
│   ├── routers/             # FastAPI routers (one file per domain)
│   ├── services/            # Business logic layer
│   └── utils/               # Security, JWT utilities
├── docs/                    # Architecture & design docs
├── .env                     # Secrets (gitignored)
├── .env.example             # Template for .env
├── requirements.txt
└── run.py                   # uvicorn entrypoint
```

## Layers

```
Request → Router → Service → Model
                ↕           ↕
              Schema       Database
```

- **Router** — HTTP concerns only: parse request, call service, return response, manage cookies.
- **Service** — Business logic. Receives parsed data, interacts with DB via SQLAlchemy.
- **Model** — SQLAlchemy ORM models, one file per domain.
- **Schema** — Pydantic models for request validation and response serialization.
- **Utils** — Shared utilities: password hashing (bcrypt), JWT creation/validation.

## Authentication

### Architecture

| Component | File | Purpose |
|-----------|------|---------|
| Password hashing | `app/utils/security.py` | bcrypt with 12 rounds |
| JWT tokens | `app/utils/jwt.py` | HS256 access + refresh token creation/validation |
| Auth service | `app/services/auth.py` | Register, login, verify, forgot/reset, refresh, logout |
| Email service | `app/services/email.py` | Resend API for verification + reset emails |
| Auth schemas | `app/schemas/auth.py` | Request/response validation |
| Auth router | `app/routers/auth.py` | HTTP endpoints under `/api/auth` |
| Protected dep | `app/dependencies.py` | `get_current_user_id()` via Bearer token |

### Token Strategy

| Token | Storage | Lifetime | Purpose |
|-------|---------|----------|---------|
| Access (JWT) | Response body → JS memory | 15 min | Authorization header |
| Refresh (JWT) | httpOnly cookie (path=/api/auth) | 7 days | Obtain new access tokens |
| Email verify | URL in email link | 24 hours | One-time email verification |
| Password reset | URL in email link | 1 hour | One-time password reset |

### Security Measures

- **bcrypt** password hashing, 12 rounds
- **Access tokens** stored only in JS memory (never localStorage)
- **Refresh tokens** in httpOnly, SameSite=Lax cookies (not accessible to JS)
- **Refresh token rotation**: new refresh token on every use; reuse detection revokes all user tokens
- **Token hash storage**: refresh tokens stored as SHA-256 hash in DB — DB leak cannot forge tokens
- **No email enumeration**: forgot password always returns same message; login returns "Invalid email or password"
- **Password validation**: 8+ chars, uppercase, lowercase, digit
- **CORS**: explicit origins only, credentials allowed

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Create account + send verification email |
| POST | `/api/auth/login` | No | Email + password → access token + refresh cookie |
| POST | `/api/auth/verify-email` | No | Verify email with token from email |
| POST | `/api/auth/forgot-password` | No | Request password reset email |
| POST | `/api/auth/reset-password` | No | Reset password with token from email |
| POST | `/api/auth/refresh` | Cookie | Rotate refresh token → new access + refresh |
| POST | `/api/auth/logout` | Cookie | Revoke refresh token + clear cookie |
| GET | `/api/auth/me` | Bearer | Get current user profile |

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

All settings live in `app/config.py` using pydantic-settings, loaded from `.env` file. Environment variables are prefixed with `UNMAPPED_`:

| Env Var | Default | Description |
|---------|---------|-------------|
| `UNMAPPED_APP_NAME` | Unmapped API | App title |
| `UNMAPPED_DEBUG` | false | Debug mode |
| `UNMAPPED_DATABASE_URL` | sqlite:///./unmapped.db | Database connection string |
| `UNMAPPED_SECRET_KEY` | (required) | JWT signing key — must be set in .env |
| `UNMAPPED_ACCESS_TOKEN_EXPIRE_MINUTES` | 15 | Access token lifetime |
| `UNMAPPED_REFRESH_TOKEN_EXPIRE_DAYS` | 7 | Refresh token lifetime |
| `UNMAPPED_RESEND_API_KEY` | (required) | Resend API key for emails |
| `UNMAPPED_MAIL_FROM` | noreply@unmapped.vitaz.dev | Sender email address |
| `UNMAPPED_MAIL_FROM_NAME` | Unmapped | Sender display name |
| `UNMAPPED_FRONTEND_URL` | http://localhost:5173 | Frontend URL for email links |

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
