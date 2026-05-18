from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from typing import List

from app.database import get_db
from app.models import User, CompletedLesson
from app.schemas import ProgressCreate, ProgressResponse

router = APIRouter(
    prefix="/progress",
    tags=["Progress"]
)

# 1. Fetch completed lessons for a user
@router.get("/{user_id}", response_model=List[str])
def get_user_progress(user_id: str, db: Session = Depends(get_db)):
    # Find all lessons completed by this user
    query = select(CompletedLesson.lesson_id).where(CompletedLesson.user_id == user_id)
    results = db.scalars(query).all()
    return list(results)

# 2. Mark a lesson as complete
@router.post("/complete", response_model=ProgressResponse)
def complete_lesson(progress: ProgressCreate, db: Session = Depends(get_db)):
    # Check if the user exists in our database, auto-create them if not
    user = db.get(User, progress.user_id)
    if not user:
        user = User(id=progress.user_id)
        db.add(user)
        db.commit()
        db.refresh(user)

    # Save progress
    db_progress = CompletedLesson(
        user_id=progress.user_id,
        lesson_id=progress.lesson_id
    )
    db.add(db_progress)
    
    try:
        db.commit()
        db.refresh(db_progress)
        return db_progress
    except IntegrityError:
        # Gracefully handle if they already completed this lesson
        db.rollback()
        # Find the existing record to return it
        query = select(CompletedLesson).where(
            CompletedLesson.user_id == progress.user_id,
            CompletedLesson.lesson_id == progress.lesson_id
        )
        existing = db.scalars(query).first()
        return existing
