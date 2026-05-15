import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Initialize the AI SDK. It's safe to do this on the frontend for portfolio projects
// IF you restrict the API key to your specific domain in Google Cloud Console.
const genAI = new GoogleGenerativeAI(API_KEY || "dummy_key_to_prevent_crash_during_setup");

// ============================================================================
// MODEL ROUTING & FALLBACK SYSTEM
// ============================================================================
const PRIMARY_MODEL = "gemini-3.1-flash-lite"; // 500 requests/day
const BACKUP_MODEL = "gemma-4-31b";            // Higher limits if needed
const FALLBACK_KEY = "spanishAmigo_ai_fallback_time";
const HOUR_1_MS = 1 * 60 * 60 * 1000;

export const getActiveModelName = () => {
  const fallbackTimestamp = localStorage.getItem(FALLBACK_KEY);
  if (fallbackTimestamp) {
    const timeSinceFailure = Date.now() - parseInt(fallbackTimestamp, 10);
    if (timeSinceFailure < HOUR_1_MS) {
      return BACKUP_MODEL; // We are in the 1-hour penalty box for the primary model
    } else {
      // 1 hour has passed! Forgive the primary model and try again.
      localStorage.removeItem(FALLBACK_KEY);
      return PRIMARY_MODEL;
    }
  }
  return PRIMARY_MODEL;
};

export const markPrimaryModelFailed = () => {
  localStorage.setItem(FALLBACK_KEY, Date.now().toString());
  console.warn(`[AI System] Primary model ${PRIMARY_MODEL} exhausted. Switching to backup: ${BACKUP_MODEL} for 1 hour.`);
};

// ============================================================================
// AI FUNCTIONS
// ============================================================================

export const explainGrammar = async (spanishSentence, englishTranslation) => {
  if (!API_KEY) {
    throw new Error("API Key Missing: Please add VITE_GEMINI_API_KEY to your .env file.");
  }

  const prompt = `You are a helpful and encouraging Spanish language tutor. 
    A student is asking for an explanation of the following phrase:
    
    Spanish: "${spanishSentence}"
    English meaning: "${englishTranslation}"
    
    Please provide a very brief (2-3 sentences max) explanation of the grammar or vocabulary used here. Keep it simple for a beginner.`;

  // Helper function to attempt generation with fallback logic
  const attemptGeneration = async (modelName, isFallbackAttempt = false) => {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      if (modelName.includes("gemini")) {
        console.log("Status: Success. Source: Primary Model.");
      } else {
        console.log("Status: Success. Source: Backup Model (Fallback).");
      }
      
      return response.text();
    } catch (error) {
      // If we hit a quota error on the primary model, instantly try the backup.
      if (!isFallbackAttempt && (error.message.includes("429") || error.message.includes("Quota"))) {
        markPrimaryModelFailed();
        return attemptGeneration(BACKUP_MODEL, true);
      }
      throw error; // If the backup fails, or it's a different error, throw it to the UI.
    }
  };

  return attemptGeneration(getActiveModelName());
};

// We now export the raw creation function so the Chatbot UI can manually rebuild 
// the session if a mid-conversation failure happens.
export const createTutorSessionWithModel = (modelName, userData = {}, existingHistory = null) => {
  if (!API_KEY) {
    throw new Error("API Key Missing");
  }

  const tools = [
    {
      functionDeclarations: [
        {
          name: "toggle_theme",
          description: "Toggles the application theme between dark mode and light mode. Call this when the user mentions their eyes hurting, wanting a darker/lighter screen, or explicitly asking for dark/light mode.",
        },
      ],
    },
  ];

  const userName = userData.name || "Amigo";
  const completedCount = userData.completedLessonsCount || 0;

  const model = genAI.getGenerativeModel({
    model: modelName,
    tools: tools,
    systemInstruction: `You are 'SpanishAmigo', but act like a highly supportive, close friend who happens to be a native Spanish speaker helping their buddy learn the language. The user's name is ${userName}. They have completed ${completedCount} lessons. NEVER sound like an AI, a robot, or a formal strict teacher. Use conversational language, casual tone, emojis, and warm filler words. If they make a mistake, correct them like a friend would (e.g., "Close! But we actually say..."). Keep your answers brief and punchy like a text message. If they ask to change the theme, use your toggle_theme tool.`
  });

  const historyToUse = existingHistory || [
    {
      role: "user",
      parts: [{ text: "Hola!" }],
    },
    {
      role: "model",
      parts: [{ text: `¡Hola ${userName}! 👋 I see you've knocked out ${completedCount} lessons so far, nice work! I'm here to help you practice or translate whatever you need. Let's chat! What's on your mind? 😎` }],
    },
  ];

  return model.startChat({ history: historyToUse });
};

// The default exported function for normal initialization
export const createTutorChat = (userData = {}) => {
  return createTutorSessionWithModel(getActiveModelName(), userData);
};
