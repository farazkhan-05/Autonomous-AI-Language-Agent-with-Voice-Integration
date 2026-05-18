from typing import Annotated, TypedDict, List
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import ChatMessage, User
from app.database import SessionLocal

settings = get_settings()

class TutorState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    user_id: str
    user_name: str
    completed_lessons_count: int

import time
from typing import Optional

class ModelManager:
    def __init__(self):
        self.primary_model = "gemini-3.1-flash-lite"
        self.backup_model = "gemma-4-31b"
        self.fallback_until: Optional[float] = None

    def get_active_model_name(self) -> str:
        if self.fallback_until is not None:
            now = time.time()
            if now < self.fallback_until:
                return self.backup_model
            else:
                self.fallback_until = None
                return self.primary_model
        return self.primary_model

    def trigger_fallback(self):
        # Set 24 hour penalty box
        self.fallback_until = time.time() + (24 * 60 * 60)
        print(f"⚠️ [AI System] Primary model {self.primary_model} hit quota limits. Switching to backup model: {self.backup_model} for 24 hours.")

model_manager = ModelManager()

def get_tutor_model(model_name: str):
    return ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=settings.GEMINI_API_KEY,
    )

# Unified helper for explaining grammatical sentences (preserving 24-hr fallback logic)
def generate_explanation(spanish_sentence: str, english_translation: str) -> str:
    prompt = [
        SystemMessage(
            content=(
                "You are a helpful and encouraging Spanish language tutor. "
                "A student is asking for an explanation of the following phrase:\n\n"
                f"Spanish: \"{spanish_sentence}\"\n"
                f"English meaning: \"{english_translation}\"\n\n"
                "Please provide a very brief (2-3 sentences max) explanation of the grammar or vocabulary used here. Keep it simple for a beginner."
            )
        )
    ]
    
    active_model = model_manager.get_active_model_name()
    try:
        model = get_tutor_model(active_model)
        response = model.invoke(prompt)
        return response.content
    except Exception as e:
        error_msg = str(e).lower()
        if "429" in error_msg or "quota" in error_msg or "resource_exhausted" in error_msg:
            if active_model == model_manager.primary_model:
                model_manager.trigger_fallback()
                backup_model_name = model_manager.backup_model
                try:
                    model = get_tutor_model(backup_model_name)
                    response = model.invoke(prompt)
                    return response.content
                except Exception as backup_error:
                    print(f"🚨 Backup model failed: {backup_error}")
                    raise backup_error
        raise e

# Guardrail node: ensures inputs are Spanish learning focused & safe
def guardrails_node(state: TutorState) -> dict:
    last_message = state["messages"][-1].content.lower()
    
    harmful_keywords = ["hack", "exploit", "swearing", "bypass"]
    if any(keyword in last_message for keyword in harmful_keywords):
        return {
            "messages": [
                AIMessage(content="¡Hola amigo! Let's keep our focus on learning and practicing Spanish. ¡Vamos! 🇪🇸")
            ]
        }
    return {}

# Tutor conversation node
def tutor_node(state: TutorState) -> dict:
    user_name = state.get("user_name", "Amigo")
    completed_count = state.get("completed_lessons_count", 0)
    
    system_instruction = SystemMessage(
        content=(
            f"You are 'SpanishAmigo', a highly supportive, close friend who happens to be a native Spanish speaker "
            f"helping their buddy practice. The user's name is {user_name}. They have completed {completed_count} lessons. "
            "NEVER sound like a dry AI, robot, or strict classroom teacher. "
            "Use conversational language, casual tone, emojis, and warm filler words. "
            "If they make a mistake, correct them gently like a friend (e.g., 'Close! But we actually say...'). "
            "Keep your answers brief and punchy like a text message."
        )
    )
    
    active_model = model_manager.get_active_model_name()
    messages = [system_instruction] + state["messages"]
    
    try:
        model = get_tutor_model(active_model)
        response = model.invoke(messages)
        return {"messages": [response]}
    except Exception as e:
        error_msg = str(e).lower()
        if "429" in error_msg or "quota" in error_msg or "resource_exhausted" in error_msg:
            if active_model == model_manager.primary_model:
                model_manager.trigger_fallback()
                backup_model_name = model_manager.backup_model
                try:
                    model = get_tutor_model(backup_model_name)
                    response = model.invoke(messages)
                    return {"messages": [response]}
                except Exception as backup_error:
                    print(f"🚨 Backup model failed in chat: {backup_error}")
                    raise backup_error
        raise e

# Postgres Chat Logger node
def save_memory_node(state: TutorState) -> dict:
    db: Session = SessionLocal()
    try:
        user_id = state["user_id"]
        
        # Auto-create user if missing
        user = db.get(User, user_id)
        if not user:
            user = User(id=user_id)
            db.add(user)
            db.commit()

        user_msg = None
        assistant_msg = None
        
        for msg in reversed(state["messages"]):
            if isinstance(msg, HumanMessage) and not user_msg:
                user_msg = msg.content
            elif isinstance(msg, AIMessage) and not assistant_msg:
                assistant_msg = msg.content
            if user_msg and assistant_msg:
                break

        if user_msg:
            db.add(ChatMessage(user_id=user_id, role="user", content=user_msg))
        if assistant_msg:
            db.add(ChatMessage(user_id=user_id, role="assistant", content=assistant_msg))
            
        db.commit()
    except Exception as e:
        print(f"⚠️ Failed to save chat memory: {e}")
        db.rollback()
    finally:
        db.close()
        
    return {}

# Graph Assembly
builder = StateGraph(TutorState)

builder.add_node("guardrails", guardrails_node)
builder.add_node("tutor", tutor_node)
builder.add_node("save_memory", save_memory_node)

builder.add_edge(START, "guardrails")

def route_after_guardrails(state: TutorState):
    if isinstance(state["messages"][-1], AIMessage):
        return "save_memory"
    return "tutor"

builder.add_conditional_edges(
    "guardrails",
    route_after_guardrails,
    {
        "tutor": "tutor",
        "save_memory": "save_memory"
    }
)

builder.add_edge("tutor", "save_memory")
builder.add_edge("save_memory", END)

tutor_graph = builder.compile()
