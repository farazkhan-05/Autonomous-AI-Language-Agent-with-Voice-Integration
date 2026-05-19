import json
import os
import sys
import time
from sqlalchemy import text
from google import genai

# Add parent directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import get_settings
from app.database import engine, SessionLocal
from app.models import Base, LessonSlide

settings = get_settings()

def seed_database():
    print("[RAG Seeder] Starting database vector initialization...")

    # 1. Enable the vector extension in Neon Postgres
    db = SessionLocal()
    try:
        print("[RAG Seeder] Enabling pgvector extension in Postgres...")
        db.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        db.commit()
    except Exception as e:
        print(f"[RAG Seeder] Notice: pgvector check failed or already exists: {e}")
        db.rollback()

    # 2. Drop and recreate the lesson_slides table to update vector dimensions (from 768 to 3072)
    print("[RAG Seeder] Dropping existing lesson_slides table to refresh schema...")
    try:
        Base.metadata.drop_all(bind=engine, tables=[LessonSlide.__table__])
        print("[RAG Seeder] Successfully dropped table lesson_slides.")
    except Exception as e:
        print(f"[RAG Seeder] Notice: Dropping table failed (probably does not exist yet): {e}")

    print("[RAG Seeder] Recreating database tables...")
    Base.metadata.create_all(bind=engine, tables=[LessonSlide.__table__])

    # 3. Load the JSON compiled lesson slides
    json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "lessons_data.json")
    if not os.path.exists(json_path):
        print(f"[RAG Seeder] Error: Compiled JSON lessons file not found at: {json_path}")
        print("Please run `node parse_lessons.js` at the root workspace first!")
        sys.exit(1)

    with open(json_path, "r", encoding="utf-8") as f:
        slides = json.load(f)

    print(f"[RAG Seeder] Loaded {len(slides)} slides from JSON file.")

    # 4. Initialize the Direct Google GenAI Client
    print("[RAG Seeder] Initializing direct Google GenAI client (models/gemini-embedding-2)...")
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    # 5. Seed slides one-by-one with intelligent rate-limit resilience
    print("[RAG Seeder] Generating embeddings and seeding slides...")
    
    total_slides = len(slides)

    for idx, slide_data in enumerate(slides):
        print(f"[{idx + 1}/{total_slides}] Generating embedding for slide in Lesson {slide_data['lesson_id']}...")
        
        # Get embedding vector with up to 5 retries and rate limit handling
        embedding_val = None
        for attempt in range(5):
            try:
                response = client.models.embed_content(
                    model="models/gemini-embedding-2",
                    contents=slide_data["content_text"]
                )
                embedding_val = response.embeddings[0].values
                # 0.75 seconds safety sleep to respect the 100 RPM free-tier limit
                time.sleep(0.75)
                break
            except Exception as e:
                err_msg = str(e).lower()
                if "429" in err_msg or "quota" in err_msg or "resource_exhausted" in err_msg:
                    print(f"⚠️ [Rate Limit] Free-tier limit hit at slide {idx + 1}. Waiting 30s to recover...")
                    time.sleep(30.0)
                else:
                    print(f"🚨 API failed for slide {idx + 1}: {e}. Retrying in 3s...")
                    time.sleep(3.0)

        if embedding_val is None:
            print(f"❌ Slide embedding completely failed after retries. Using zero-vector fallback.")
            embedding_val = [0.0] * 3072

        # Create and add LessonSlide record
        slide_record = LessonSlide(
            lesson_id=slide_data["lesson_id"],
            slide_index=slide_data["slide_index"],
            slide_type=slide_data["slide_type"],
            content_text=slide_data["content_text"],
            explanation=slide_data["explanation"],
            embedding=embedding_val
        )
        db.add(slide_record)
        
        # Commit periodically (every 10 slides) to prevent massive uncommitted states
        if (idx + 1) % 10 == 0:
            db.commit()
            print(f"💾 Committed progress up to slide {idx + 1}.")

    db.commit()
    print("[RAG Seeder] Database vector seeder completed successfully!")
    db.close()

if __name__ == "__main__":
    seed_database()
