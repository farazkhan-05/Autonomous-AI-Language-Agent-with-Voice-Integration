# Autonomous AI Language Agent with Voice Integration

SpanishAmigo is a Spanish learning web app with structured lessons and an AI tutor named Lumi. It combines a simple lesson path with contextual chat support, voice input, speech playback, and saved learning progress.

The project started as a frontend learning app and now includes a FastAPI backend for progress sync, chat memory, streamed AI responses, and lesson-aware retrieval.

## What It Solves

Most beginner language apps keep the lesson flow separate from help and explanation. SpanishAmigo keeps both close together:

- Learners move through short, guided Spanish lessons.
- They can ask Lumi for help without leaving the app.
- Progress works for guests through local storage and syncs to the backend for signed-in users.
- The AI tutor can use lesson context and prior chat history when responding.

## Current Features

- Five structured Spanish lessons built from context, translation reveal, and practice quiz slides
- Course map with lesson locking, completion states, progress stats, and achievement badges
- Lesson player with progress tracking, hints, feedback, and a completion screen
- Google sign-in through Firebase Authentication
- Guest progress stored in `localStorage`
- Signed-in progress synced through FastAPI to Postgres
- Floating AI tutor with streamed responses from the backend
- Multi-session chat history with create, rename, delete, and reload support
- Browser speech recognition for Spanish voice input
- Browser speech synthesis for reading tutor responses aloud
- AI-generated short explanations for translation reveal cards
- Manual light and dark mode toggle
- AI tool call support for changing the theme from chat
- Backend guardrails to keep chat focused on Spanish learning
- Optional semantic lesson retrieval using Gemini embeddings and pgvector

## High-Level Architecture

### Frontend

The frontend is a Vite React app. It handles routing, lesson UI, authentication state, progress state, the global layout, and the chat widget.

Key frontend pieces:

- `src/App.jsx` wires the app providers, theme, layout, and routes.
- `src/components/layout/Layout.jsx` owns the app shell, sign-in controls, theme toggle, and global chatbot.
- `src/context/AuthContext.jsx` handles Firebase Google sign-in and auth state.
- `src/context/ProgressContext.jsx` manages completed lessons and syncs with the backend when possible.
- `src/pages/CourseMap.jsx` shows the lesson path and progress.
- `src/pages/LessonPlayer.jsx` runs the slide-based lesson flow.
- `src/components/chat/GlobalChatbot.jsx` handles chat sessions, streaming, voice input, and speech playback.

### Backend

The backend lives in `spanish_amigo_api/` and is built with FastAPI. It verifies Firebase ID tokens, stores user data in Postgres, streams AI chat responses, and runs the AI tutor workflow.

Key backend pieces:

- `spanish_amigo_api/main.py` creates the FastAPI app and registers routers.
- `app/routers/progress.py` exposes progress read and completion endpoints.
- `app/routers/chat.py` exposes chat, streaming, session management, and explanation endpoints.
- `app/services/auth.py` verifies Firebase bearer tokens.
- `app/services/ai.py` contains the LangGraph tutor flow, guardrails, model fallback logic, tools, memory saving, and RAG lookup.
- `app/models.py` defines users, completed lessons, chat sessions, chat messages, lesson slides, and system status records.
- `migrations/` contains Alembic migrations for the database schema.

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React 19, Vite |
| Routing | React Router 7 |
| UI | Material UI 7, Lucide React, Tailwind CSS |
| Auth | Firebase Authentication |
| Backend | FastAPI, Uvicorn |
| AI | Google Gemini, LangChain, LangGraph |
| Data | Neon Postgres or compatible Postgres |
| Vector Search | pgvector |
| ORM and Migrations | SQLAlchemy 2.0, Alembic |
| Package Management | npm, uv |

## Project Structure

```text
.
+-- src/
|   +-- components/
|   |   +-- chat/              # Global AI tutor widget
|   |   +-- layout/            # App shell and navigation
|   |   +-- lesson/            # Lesson slide components
|   +-- context/               # Auth and progress providers
|   +-- data/                  # Lesson registry and lesson files
|   +-- hooks/                 # Lesson navigation logic
|   +-- pages/                 # Course map and lesson player
|   +-- theme/                 # MUI theme
|   +-- utils/                 # Small browser utilities
+-- spanish_amigo_api/
|   +-- app/
|   |   +-- routers/           # FastAPI route modules
|   |   +-- services/          # Auth and AI services
|   |   +-- config.py
|   |   +-- database.py
|   |   +-- models.py
|   |   +-- schemas.py
|   +-- migrations/            # Alembic migrations
|   +-- main.py                # API entry point
|   +-- seed_embeddings.py     # Optional lesson embedding seeder
+-- parse_lessons.js           # Builds lesson JSON for embedding seed data
+-- lessons_data.json          # Generated lesson slide data
+-- package.json
```

## Setup

### Prerequisites

- Node.js and npm
- Python 3.12 or newer
- `uv` for the backend Python environment
- A Firebase project with Google sign-in enabled
- A Postgres database, preferably Neon Postgres with pgvector support
- A Gemini API key

### Frontend

Install dependencies from the project root:

```bash
npm install
```

Create `.env.local` in the project root:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Run the frontend:

```bash
npm run dev
```

### Backend

From the backend directory:

```bash
cd spanish_amigo_api
uv sync
```

Create `spanish_amigo_api/.env`:

```env
ENV=development
DATABASE_URL=postgresql+psycopg://user:password@host:5432/database
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:5173
```

Optional model overrides:

```env
GEMINI_PRIMARY_MODEL=gemini-3.1-flash-lite
GEMINI_BACKUP_MODEL=gemma-4-31b
GEMINI_EMBEDDING_MODEL=gemini-embedding-2
```

Apply database migrations:

```bash
uv run alembic upgrade head
```

Run the API:

```bash
uv run uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The frontend expects the backend at `http://127.0.0.1:8000` unless `VITE_API_BASE_URL` is changed.

## Optional RAG Setup

The backend can retrieve relevant lesson-slide context through pgvector. To seed those embeddings:

```bash
node parse_lessons.js
cd spanish_amigo_api
uv run python seed_embeddings.py
```

This requires a working `DATABASE_URL`, `GEMINI_API_KEY`, and a database that supports the `vector` extension.

## Useful Commands

Frontend:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

Backend:

```bash
cd spanish_amigo_api
uv run uvicorn main:app --reload
uv run alembic upgrade head
uv run python -m unittest discover tests
```

## Developer Notes

- `src/firebase.js` exports Firestore, but current progress sync uses the FastAPI backend and Postgres.
- The backend development auth path decodes Firebase JWTs locally for speed. Production should use verified Firebase token checks.
- `POST /chat/explain` is public because it does not read or write user-scoped data.
- The app can still work as a guest if the backend is unavailable, but signed-in progress sync and chat features require the API.

## Status

The main product flow is implemented: course map, lessons, completion tracking, Google sign-in, backend progress sync, and AI tutor chat. The backend has migrations, tests for guardrails and RAG-related behavior, and a seeding path for lesson embeddings.

Deployment support is partial. The frontend includes Vercel routing configuration. Backend deployment files such as Docker and CI/CD are not present in the current codebase.
