# SpanishAmigo API

FastAPI backend for SpanishAmigo. It powers lesson progress, Lumi chat, AI explanations, chat sessions, Firebase-authenticated user data, Neon Postgres persistence, and Cloud Run deployment.

This is the backend-specific README. The root project README is intentionally not edited as part of backend production notes.

## Current Stack

- Python 3.12+
- FastAPI + Uvicorn
- SQLAlchemy 2.0 typed ORM
- Alembic migrations
- Neon Serverless Postgres
- Neon `pgvector` for lesson RAG embeddings
- Google Gemini API
- LangGraph tutor workflow
- Firebase Admin Auth for bearer-token verification
- `uv` for dependency and lockfile management

## Runtime Services

- `GET /health`: Cloud Run and database health check.
- `GET /status`: backward-compatible alias for `/health`.
- `/progress/*`: protected progress read/write routes.
- `/chat/send`: protected non-streaming Lumi chat route.
- `/chat/send_stream`: protected SSE Lumi chat route.
- `/chat/sessions/*`: protected chat session lifecycle routes.
- `POST /chat/explain`: public explanation route used by lesson reveal cards.

Protected routes require:

```http
Authorization: Bearer <Firebase ID token>
```

`/chat/explain` is intentionally public and does not count against the anonymous global chat quota.

## Environment Variables

Local development uses `spanish_amigo_api/.env`:

```env
ENV=development
DATABASE_URL=postgresql://...
GEMINI_API_KEY=...
FIREBASE_PROJECT_ID=spanishamigo-8016a
ALLOWED_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
AUTH_ALLOW_INSECURE_DEV_TOKENS=true
LOG_LEVEL=INFO
```

Production Cloud Run sets:

```env
ENV=production
LOG_LEVEL=INFO
FIREBASE_PROJECT_ID=...
ALLOWED_CORS_ORIGINS=...
AUTH_ALLOW_INSECURE_DEV_TOKENS=false
```

Production secrets are mounted from Google Secret Manager:

```text
DATABASE_URL=DATABASE_URL:latest
GEMINI_API_KEY=GEMINI_API_KEY:latest
```

Important:

- `AUTH_ALLOW_INSECURE_DEV_TOKENS=false` must stay enforced in production.
- `ALLOWED_CORS_ORIGINS` is comma-separated and is passed through `--env-vars-file` in GitHub Actions to avoid comma parsing issues.

## Local Development

```powershell
cd spanish_amigo_api
uv sync
uv run uvicorn main:app --reload
```

Health check:

```powershell
curl http://127.0.0.1:8000/health
```

## Migrations

```powershell
cd spanish_amigo_api
uv run alembic upgrade head
```

The GitHub Actions deploy workflow runs migrations before deploying the new Cloud Run revision.

## Tests And Quality Gates

Backend tests:

```powershell
cd spanish_amigo_api
uv run python -m unittest discover -s tests -p "test_*.py"
```

Targeted type check is configured through:

```text
mypy.ini
```

Dependency audit:

```powershell
cd spanish_amigo_api
uv run --with pip-audit pip-audit --desc
```

The security workflow also runs frontend production dependency audit from the repo root:

```powershell
npm.cmd audit --omit=dev --audit-level=high
```

## Anonymous User Rules

The frontend silently creates Firebase anonymous users. The backend treats anonymous UIDs as real users for ownership checks.

Current anonymous limits:

- Lesson 1 is available without Google sign-in.
- Lesson 2 and later require Google sign-in.
- Global Lumi chat allows exactly 3 lifetime messages for an anonymous UID.
- The 4th global Lumi message returns `403` with code `ANONYMOUS_CHAT_LIMIT_REACHED`.
- `Ask Lumi to Explain` remains public, free, and unmetered.

Anonymous chat usage is stored in `SystemStatus` with keys like:

```text
anonymous_chat_usage:<firebase_uid>
```

## Deployment

Primary deployment path:

```text
.github/workflows/backend-deploy.yml
```

Deploy flow:

1. Validate required GitHub secrets.
2. Authenticate to Google Cloud with Workload Identity Federation.
3. Build Docker image from this directory.
4. Push image to Artifact Registry.
5. Run Alembic migrations.
6. Deploy Cloud Run revision.
7. Verify `/health`.

The Docker image excludes tests and migrations from the runtime image. Migrations are run by the deploy workflow before Cloud Run receives traffic.

## Monitoring

Monitoring-as-code lives in:

```text
spanish_amigo_api/deploy/monitoring
```

The manual workflow:

```text
.github/workflows/monitoring-bootstrap.yml
```

It creates:

- Cloud Run overview dashboard.
- 5xx spike alert.
- p95 latency alert.
- auth failure alert for 401/403 request logs.
- logs-based metric `spanishamigo_auth_failures`.

## Security Notes

- Firebase ID tokens are verified through Firebase Admin SDK.
- Progress and chat/session routes enforce Firebase UID tenancy.
- Production uses JSON logs and request IDs.
- Dependency security is gated by `pip-audit`, `npm audit`, and dependency review.
- Known remaining hardening item: rate limiting for expensive LLM endpoints.
