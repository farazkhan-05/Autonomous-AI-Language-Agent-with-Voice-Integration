import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Initialize the AI SDK. It's safe to do this on the frontend for portfolio projects
// IF you restrict the API key to your specific domain in Google Cloud Console.
const genAI = new GoogleGenerativeAI(API_KEY || "dummy_key_to_prevent_crash_during_setup");

export const explainGrammar = async (spanishSentence, englishTranslation) => {
  if (!API_KEY) {
    throw new Error("API Key Missing: Please add VITE_GEMINI_API_KEY to your .env file.");
  }

  try {
    // We use gemini-2.5-flash as the standard fast text model for 2026
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a helpful and encouraging Spanish language tutor. 
    A student is asking for an explanation of the following phrase:
    
    Spanish: "${spanishSentence}"
    English meaning: "${englishTranslation}"
    
    Please provide a very brief (2-3 sentences max) explanation of the grammar or vocabulary used here. Keep it simple for a beginner.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error calling Gemini:", error);
    throw new Error(`API Error: ${error.message}`);
  }
};

export const createTutorChat = (userData = {}) => {
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

  // Initialize the model with a system instruction to set the persona
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: tools,
    systemInstruction: `You are 'SpanishAmigo', but act like a highly supportive, close friend who happens to be a native Spanish speaker helping their buddy learn the language. The user's name is ${userName}. They have completed ${completedCount} lessons. NEVER sound like an AI, a robot, or a formal strict teacher. Use conversational language, casual tone, emojis, and warm filler words. If they make a mistake, correct them like a friend would (e.g., "Close! But we actually say..."). Keep your answers brief and punchy like a text message. If they ask to change the theme, use your toggle_theme tool.`
  });

  // We return a new chat session with a pre-seeded history so it immediately acts like a tutor
  return model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: "Hola!" }],
      },
      {
        role: "model",
        parts: [{ text: `¡Hola ${userName}! 👋 I see you've knocked out ${completedCount} lessons so far, nice work! I'm here to help you practice or translate whatever you need. Let's chat! What's on your mind? 😎` }],
      },
    ],
  });
};
