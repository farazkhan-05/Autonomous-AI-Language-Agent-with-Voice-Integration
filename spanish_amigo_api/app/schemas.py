from pydantic import BaseModel
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
        from_attributes = True


class ProgressCreate(BaseModel):
    user_id: str
    lesson_id: str

class ProgressResponse(BaseModel):
    lesson_id: str
    completed_at: datetime

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    user_id: str
    message: str
    user_name: Optional[str] = "Amigo"

class ChatResponse(BaseModel):
    reply: str


class ExplainRequest(BaseModel):
    spanish_sentence: str
    english_translation: str

class ExplainResponse(BaseModel):
    explanation: str

