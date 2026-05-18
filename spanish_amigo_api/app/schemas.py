from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

class UserCreate(BaseModel):
    id: str  # Firebase UID
    email: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True  # Tells Pydantic to read standard SQLAlchemy objects


class ProgressCreate(BaseModel):
    user_id: str
    lesson_id: str

class ProgressResponse(BaseModel):
    lesson_id: str
    completed_at: datetime

    class Config:
        from_attributes = True
