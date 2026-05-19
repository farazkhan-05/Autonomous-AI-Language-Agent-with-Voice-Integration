import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models import ChatMessage, CompletedLesson
from app.schemas import ChatRequest, ChatResponse, ExplainRequest, ExplainResponse
from app.services.ai import tutor_graph, generate_explanation
from app.services.auth import get_current_user
from langchain_core.messages import HumanMessage, AIMessage

logger = logging.getLogger("spanish-amigo-ai")

router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)

# 1. Fetch previous chat history
@router.get("/history/{user_id}", response_model=List[dict])
def get_chat_history(user_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # Enforce strict tenancy: users can only view their own chat history
    if current_user.get("uid") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Cannot access another user's chat history."
        )

    query = (
        select(ChatMessage)
        .where(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = db.scalars(query).all()
    
    # Map 'assistant' back to React's expected 'model' role, and 'content' to 'text'
    return [
        {
            "role": "model" if msg.role == "assistant" else "user",
            "text": msg.content
        }
        for msg in messages
    ]

# 2. Send a new message to the AI Spanish tutor
@router.post("/send", response_model=ChatResponse)
def send_chat_message(payload: ChatRequest, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # Retrieve verified Firebase UID as primary source of truth
    verified_user_id = current_user.get("uid")

    # Enforce strict tenancy: users can only chat as themselves
    if verified_user_id != payload.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Cannot send messages on behalf of another user."
        )

    # Fetch completed lesson count for personalization using verified_user_id
    completed_lessons_query = select(CompletedLesson).where(CompletedLesson.user_id == verified_user_id)
    completed_count = len(db.scalars(completed_lessons_query).all())

    # Fetch last 10 messages from Postgres database for context using verified_user_id
    history_query = (
        select(ChatMessage)
        .where(ChatMessage.user_id == verified_user_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(10)
    )
    db_history = reversed(db.scalars(history_query).all())

    # Convert Postgres database history to LangChain message formats
    history_messages = []
    for msg in db_history:
        if msg.role == "user":
            history_messages.append(HumanMessage(content=msg.content))
        else:
            history_messages.append(AIMessage(content=msg.content))

    # Append the new user message
    new_message = HumanMessage(content=payload.message)
    all_messages = history_messages + [new_message]

    # Invoke our stateful LangGraph AI Tutor flowchart!
    state_input = {
        "messages": all_messages,
        "user_id": verified_user_id,
        "user_name": payload.user_name,
        "completed_lessons_count": completed_count
    }

    try:
        output = tutor_graph.invoke(state_input)
        last_msg = output["messages"][-1]
        reply_content = last_msg.content
        action_required = None

        if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
            for tc in last_msg.tool_calls:
                if tc.get("name") == "toggle_theme":
                    action_required = "TOGGLE_THEME"
                    reply_content = "¡Claro! Switched the theme. 😎"
                    break

        return ChatResponse(reply=reply_content, action_required=action_required)
    except Exception as e:
        logger.error(f"Tutor graph execution failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Tutor service failed. Please try again."
        )


@router.post("/explain", response_model=ExplainResponse)
def explain_sentence(payload: ExplainRequest, current_user: dict = Depends(get_current_user)):
    try:
        explanation_content = generate_explanation(payload.spanish_sentence, payload.english_translation)
        return ExplainResponse(explanation=explanation_content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Explanation error: {str(e)}")


