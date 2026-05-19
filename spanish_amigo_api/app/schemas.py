from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional, List

class UserCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str = Field(..., min_length=1, max_length=128)  # Firebase UID
    email: Optional[str] = Field(None, max_length=255)

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str = Field(..., min_length=1, max_length=128)
    email: Optional[str] = Field(None, max_length=255)
    created_at: datetime


class ProgressCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    user_id: str = Field(..., min_length=1, max_length=128)
    lesson_id: str = Field(..., min_length=1, max_length=128)

class ProgressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    lesson_id: str = Field(..., min_length=1, max_length=128)
    completed_at: datetime


class ChatRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    user_id: str = Field(..., min_length=1, max_length=128)
    message: str = Field(..., min_length=1, max_length=2000)
    user_name: Optional[str] = Field("Amigo", max_length=100)

class ChatResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    reply: str = Field(..., min_length=1)
    action_required: Optional[str] = None


class ExplainRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    spanish_sentence: str = Field(..., min_length=1, max_length=1000)
    english_translation: str = Field(..., min_length=1, max_length=1000)

class ExplainResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    explanation: str = Field(..., min_length=1)
