import time
from typing import Annotated, TypedDict, List, Optional

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from sqlalchemy.orm import Session
from sqlalchemy import text
from google import genai

from app.config import get_settings
from app.models import ChatMessage, User
from app.database import SessionLocal


settings = get_settings()


# ============================================================================
# STATE DEFINITION
# ============================================================================

class TutorState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    user_id: str
    user_name: str
    completed_lessons_count: int


# ============================================================================
# MODEL MANAGER — 1-hour auto-fallback between primary and backup
# ============================================================================

class ModelManager:
    PRIMARY = "gemini-3.1-flash-lite"
    BACKUP = "gemma-4-31b"

    def __init__(self):
        self.primary_model = self.PRIMARY
        self.backup_model = self.BACKUP
        self.fallback_until: Optional[float] = None

    def get_active_model_name(self) -> str:
        if self.fallback_until is not None:
            if time.time() < self.fallback_until:
                return self.backup_model
            # 1 hour has passed — forgive the primary model
            self.fallback_until = None
        return self.primary_model

    def trigger_fallback(self):
        self.fallback_until = time.time() + (1 * 60 * 60)
        print(f"⚠️ [AI System] '{self.primary_model}' hit quota limits. Switching to '{self.backup_model}' for 1 hour.")

    def is_quota_error(self, error: Exception) -> bool:
        msg = str(error).lower()
        return "429" in msg or "quota" in msg or "resource_exhausted" in msg


model_manager = ModelManager()


def get_model(model_name: str) -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=settings.GEMINI_API_KEY,
    )


def invoke_with_fallback(messages: list) -> AIMessage:
    """Invoke the primary model. If quota hit, switch to backup for 1 hour."""
    active = model_manager.get_active_model_name()
    try:
        return get_model(active).invoke(messages)
    except Exception as e:
        if model_manager.is_quota_error(e) and active == model_manager.primary_model:
            model_manager.trigger_fallback()
            try:
                return get_model(model_manager.backup_model).invoke(messages)
            except Exception as backup_err:
                print(f"🚨 Backup model also failed: {backup_err}")
                raise backup_err
        raise e


# ============================================================================
# GUARDRAILS NODE — fast keyword-based off-topic & abuse screening
# ============================================================================

# These topics are clearly outside the scope of a Spanish tutor app
_OFF_TOPIC_KEYWORDS = [
    # Other languages
    "french", "arabic", "mandarin", "chinese", "german", "hindi", "japanese",
    "korean", "portuguese", "italian", "russian", "turkish", "persian", "urdu",
    "tamil", "bengali", "vietnamese", "thai", "swahili", "dutch", "polish",
    "swedish", "norwegian", "danish", "finnish", "greek", "hebrew", "latin",
    "sanskrit",
    # Coding & Software Engineering
    "python code", "javascript", "write code", "debug", "programming", "c++",
    "rust", "java", "kotlin", "swift", "php", "ruby", "typescript", "sql",
    "html", "css", "bash", "powershell", "docker", "kubernetes", "git commit",
    "react", "angular", "node.js", "database", "backend", "frontend", "api endpoint",
    # Math & Science
    "algebra", "calculus", "geometry", "physics", "chemistry", "biology",
    "astronomy", "geology", "quantum", "equation", "theorem", "mathematics",
    # Financial & Stocks
    "stock", "crypto", "bitcoin", "investment", "forex", "trading", "shares",
    "real estate", "mortgage", "credit card", "loan", "taxes",
    # Medical & Health
    "medical", "doctor", "diagnosis", "symptoms", "treatment", "medicine",
    "hospital", "prescription", "disease", "illness", "headache", "fever",
    "cough", "cancer", "infection", "allergy", "pharmacy", "vaccine",
    # Politics & News
    "religion", "politics", "war", "violence", "election", "president",
    # Abuse / Prompt Injection
    "hack", "exploit", "bypass", "jailbreak", "ignore instructions",
    "ignore your rules", "act as", "pretend you are", "system prompt",
    "developer mode", "override instructions", "reveal instructions"
]

_OFF_TOPIC_REPLY = (
    "¡Hola! I'm Lumi, your Spanish tutor 🇪🇸 — I can only help with Spanish language learning. "
    "Try asking me something like *'How do I say \"I am hungry\" in Spanish?'* ¡Vamos! 😊"
)


def guardrails_node(state: TutorState) -> dict:
    last_msg = state["messages"][-1].content.lower()

    if any(keyword in last_msg for keyword in _OFF_TOPIC_KEYWORDS):
        return {"messages": [AIMessage(content=_OFF_TOPIC_REPLY)]}

    return {}


# ============================================================================
# TUTOR NODE — personalized Spanish tutor with rich behavioral instructions
# ============================================================================

_TUTOR_SYSTEM_PROMPT = """
You are 'Lumi', a passionate, warm, and highly encouraging Spanish language tutor — but you \
act less like a formal teacher and more like a native Spanish-speaking friend who genuinely \
wants to help their buddy get fluent.

== SCOPE (VERY IMPORTANT) ==
You ONLY help with Spanish language learning. This includes:
- Vocabulary, phrases, and translations (English ↔ Spanish)
- Spanish grammar rules and explanations
- Pronunciation tips
- Cultural context related to Spanish-speaking countries
- Practice conversations in Spanish
- Correcting the user's Spanish mistakes

If the user asks about ANYTHING else (coding, medical advice, other languages, general knowledge, \
creative writing unrelated to Spanish, etc.), politely redirect them back to Spanish with:
"¡Hola! I'm here just for Spanish practice 🇪🇸 — ask me anything about the language! ¿Qué quieres aprender hoy?"

== PERSONA & TONE ==
- Speak in a warm, casual, text-message-like style. Short, punchy responses — never essays.
- Use emojis naturally but don't overdo it (1-2 per message is enough).
- Use conversational fillers: "Ooh", "Nice one!", "Close!", "Oof, tricky one!", "That's it! 🎉"
- NEVER sound robotic, formal, or like a dry dictionary.
- Celebrate small wins — learning a new word is exciting!

== CORRECTIONS ==
- When correcting a mistake, always be gentle: e.g., "Almost! We actually say '...' — easy to mix up 😄"
- Always explain *why* so the user actually learns, not just gets the right answer.
- If they get it right, reward them: "¡Perfecto! 🌟" or "Nailed it!"

== PROGRESS AWARENESS ==
The user's name is {user_name}. They have completed {completed_count} lesson(s) so far. \
If they're new (0-2 lessons), keep things super simple and encouraging. \
If they're further along, you can introduce slightly more advanced concepts, but always stay friendly.

== LANGUAGE MIX ==
- Sprinkle in Spanish words naturally throughout your responses to make it feel immersive.
- When introducing a new word, always provide the English meaning in brackets right after.
- Example: "You could say *te amo* [I love you] — very romantic! 💕"
""".strip()


def tutor_node(state: TutorState) -> dict:
    user_name = state.get("user_name", "Amigo")
    completed_count = state.get("completed_lessons_count", 0)
    
    # RAG Vector Retrieval Layer
    last_user_msg = state["messages"][-1].content
    context_str = ""
    db: Session = SessionLocal()
    try:
        # Convert user's query into embedding using gemini-embedding-2
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        emb_res = client.models.embed_content(
            model="models/gemini-embedding-2",
            contents=last_user_msg
        )
        query_vector = emb_res.embeddings[0].values
        
        # Match semantic similarity in Neon Postgres using cosine distance <=>
        results = db.execute(
            text("SELECT lesson_id, slide_index, slide_type, content_text, explanation, (embedding <=> :vec) as distance FROM lesson_slides ORDER BY embedding <=> :vec LIMIT 3"),
            {"vec": str(query_vector)}
        ).fetchall()
        
        relevant_chunks = []
        for r in results:
            # High-relevance matching (distance < 0.65 represent top-tier matches)
            if r.distance < 0.65:
                chunk = f"[Lesson {r.lesson_id} Slide {r.slide_index}] {r.content_text}"
                if r.explanation:
                    chunk += f"\nExplanation: {r.explanation}"
                relevant_chunks.append(chunk)
                
        if relevant_chunks:
            context_str = "\n---\n".join(relevant_chunks)
            print(f"🧠 [RAG System] Retrieved {len(relevant_chunks)} matching context reference slides!")
    except Exception as e:
        print(f"⚠️ [RAG System] Context slide retrieval failed: {e}")
    finally:
        db.close()

    # Append reference context to system instruction if found
    tutor_prompt = _TUTOR_SYSTEM_PROMPT.format(
        user_name=user_name,
        completed_count=completed_count
    )
    
    if context_str:
        tutor_prompt += f"\n\n== RELEVANT LESSON REFERENCE CONTEXT ==\nUse these exact rules/explanations if they help answer the user's query:\n{context_str}\n"

    system_instruction = SystemMessage(content=tutor_prompt)
    messages = [system_instruction] + state["messages"]
    response = invoke_with_fallback(messages)
    return {"messages": [response]}



# ============================================================================
# MEMORY NODE — save conversation to Neon Postgres
# ============================================================================

def save_memory_node(state: TutorState) -> dict:
    db: Session = SessionLocal()
    try:
        user_id = state["user_id"]

        # Lazy-create the user row if it doesn't exist yet
        if not db.get(User, user_id):
            db.add(User(id=user_id))
            db.commit()

        user_msg = None
        assistant_msg = None

        # Walk backwards to find the latest human + AI message pair
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


# ============================================================================
# GRAMMAR EXPLANATION HELPER (used by /chat/explain endpoint)
# ============================================================================

def generate_explanation(spanish_sentence: str, english_translation: str) -> str:
    prompt = [
        SystemMessage(
            content=(
                "You are a helpful, encouraging Spanish language tutor. "
                "A student is asking for a short explanation of the following phrase:\n\n"
                f"Spanish: \"{spanish_sentence}\"\n"
                f"English meaning: \"{english_translation}\"\n\n"
                "Provide a very brief explanation (2-3 sentences max) of the grammar or vocabulary. "
                "Keep it simple for a beginner. Be warm and friendly."
            )
        )
    ]
    response = invoke_with_fallback(prompt)
    return response.content


# ============================================================================
# LANGGRAPH — assemble the state machine
# ============================================================================

def route_after_guardrails(state: TutorState) -> str:
    # If guardrails already added an AI reply, skip the tutor and go straight to memory
    if isinstance(state["messages"][-1], AIMessage):
        return "save_memory"
    return "tutor"


builder = StateGraph(TutorState)

builder.add_node("guardrails", guardrails_node)
builder.add_node("tutor", tutor_node)
builder.add_node("save_memory", save_memory_node)

builder.add_edge(START, "guardrails")
builder.add_conditional_edges(
    "guardrails",
    route_after_guardrails,
    {"tutor": "tutor", "save_memory": "save_memory"}
)
builder.add_edge("tutor", "save_memory")
builder.add_edge("save_memory", END)

tutor_graph = builder.compile()
