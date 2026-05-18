from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import progress

# Load our validated environment settings
settings = get_settings()

# Initialize the FastAPI app
app = FastAPI(
    title="SpanishAmigo API", 
    description="The Python AI backend for SpanishAmigo, powered by LangGraph, Neon Postgres, and Gemini.",
    version="0.1.0"
)

# Register feature routers
app.include_router(progress.router)

# Configure CORS (Cross-Origin Resource Sharing)
# This acts like a whitelist, telling our backend it's safe to receive requests from our React frontend.
origins = [
    "http://localhost:5173",  # The default port where your React Vite app runs
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,            # Only allow our React app to talk to this backend
    allow_credentials=True,
    allow_methods=["*"],             # Allow all types of requests (GET, POST, etc.)
    allow_headers=["*"],             # Allow all custom security headers (like Firebase Auth tokens!)
)

# A simple root route to verify the server is running
@app.get("/")
async def root():
    return {
        "message": "¡Hola! Welcome to the SpanishAmigo API.",
        "status": "online",
        "environment": settings.ENV
    }

# A status/health-check endpoint
@app.get("/status")
async def get_status():
    return {
        "status": "healthy",
        "database": "disconnected (setup pending)",
        "ai_engine": "gemini-embedding-2 ready"
    }
