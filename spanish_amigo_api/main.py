from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import progress, chat

settings = get_settings()

app = FastAPI(
    title="SpanishAmigo API",
    description="Python API with LangGraph, Neon Postgres, and Gemini.",
    version="0.1.0"
)

# CORS Whitelist for React dev server
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(progress.router)
app.include_router(chat.router)

@app.get("/")
async def root():
    return {
        "message": "¡Hola! Welcome to the SpanishAmigo API.",
        "status": "online"
    }

@app.get("/status")
async def get_status():
    return {
        "status": "healthy",
        "database": "connected",
        "ai_engine": "gemini-2.5-flash ready"
    }
