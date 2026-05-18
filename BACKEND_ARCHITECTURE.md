# SpanishAmigo - Backend Architecture Specification (2026)

This is the core tech stack and architecture plan for the SpanishAmigo backend. We will be sticking to these specific tools to ensure a scalable and modern AI setup.

## 1. Core Language & Framework
* **Language:** Python 3.12+
* **Web Framework:** FastAPI
* **Server:** Uvicorn
* **Package Manager:** `uv` (Astral)

## 2. AI & Orchestration
* **LLM Provider:** Google Gemini API
* **Orchestration:** LangGraph (for cyclic/agentic workflows)
* **Embeddings:** `gemini-embedding-2`

## 3. Databases & Memory
* **Primary Database:** Neon Serverless Postgres
* **Vector Database:** Neon Postgres + `pgvector` extension
* **Memory/Chat History:** Neon Serverless Postgres (Unified DB)
* **ORM:** SQLAlchemy 2.0
* **Migrations:** Alembic

## 4. Guardrails & Safety
* **Validation:** Pydantic v2
* **AI Guardrails:** NVIDIA NeMo Guardrails
* **API Auth:** Firebase Auth JWT Verification (to sync with React frontend)

## 5. Deployment & Hosting
* **Containerization:** Docker
* **Hosting Backend:** Google Cloud Run (GCP)
* **Hosting Frontend:** Vercel (Already active)
* **CI/CD:** GitHub Actions

## 6. Testing & Production Quality
* **Testing:** `pytest`
* **Type Checking:** `mypy`
* **Observability:** Google Cloud Logging + Error Reporting

## General Guidelines
Going forward, the backend will be written using async Python. We will use Pydantic v2 for data validation and rely on modern SQLAlchemy 2.0 patterns for all database interactions.