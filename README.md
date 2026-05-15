# Autonomous AI Language Agent with Voice Integration

A Spanish learning web application built with React and the Google Gemini SDK. The AI in this app goes beyond standard chatbot behavior. It listens to your voice, speaks back in Spanish, understands your progress, and can control the interface itself based on what you say.

**Live Demo:** [spanishamigo.vercel.app](https://spanishamigo.vercel.app/)

---

## What I built and why

I have been picking up Spanish for a while and got frustrated with existing apps feeling too rigid. So I decided to build my own, and used it as an opportunity to implement three AI engineering concepts I had been curious about: LLM Function Calling, Voice User Interfaces, and Retrieval-Augmented Generation. The language learning context gave me a real product to build around rather than an isolated proof of concept.

---

## Technical highlights

### LLM Function Calling (Agentic AI)

The AI tutor does not just respond with text. It can take actions inside the application.

If you type something like "my eyes hurt, can you turn the lights off", the app switches to dark mode on its own. Under the hood, a `toggle_dark_mode` tool is declared using an OpenAPI JSON schema and passed to the Gemini model via the `tools` parameter. When the model detects the intent, it returns a `functionCall` payload instead of plain text. The React app intercepts that, fires the callback, updates global state, and returns a `functionResponse` so the model can confirm the action naturally in the conversation.

This is the core pattern behind what the industry calls Agentic AI and LLM Function Calling.

### Voice User Interface (VUI)

The app supports full bidirectional voice with no third-party audio APIs and no added cost.

Speech-to-Text is handled by `window.SpeechRecognition` configured to `lang: 'es-ES'`, which tunes the browser's acoustic model for Spanish phonetics. Text-to-Speech uses `SpeechSynthesisUtterance` with logic that maps over `window.speechSynthesis.getVoices()` at runtime to detect and lock in a native Spanish voice rather than defaulting to a generic English one. Before any AI response reaches the audio engine, a Regex pipeline strips Markdown tokens like asterisks and hashes so the spoken output sounds clean and natural.

Everything runs natively in the browser through the HTML5 Web Speech API.

### Retrieval-Augmented Generation (RAG)

The tutor is context-aware from the moment you open it. It knows your name and exactly how many lessons you have completed before you say a word.

When the Gemini chat session initialises, the app harvests the user's display name from Firebase Authentication and their lesson progress from a React Context. That data is injected directly into the model's `systemInstruction` payload at runtime. The model is then prompt-engineered to reference this information naturally in conversation, congratulating you on real milestones and nudging you toward your next lesson.

This follows the same principle as Retrieval-Augmented Generation. The retrieval step is reading live application state rather than querying a vector database, which keeps the architecture lightweight and fully client-side.

---

## Features

- Five structured Spanish lessons covering greetings, verbs, dining, navigation, and real-world conversation scenarios
- Progressive lesson locking so content unlocks as you complete each stage
- Google Sign-In via Firebase Authentication
- Progress saved to Cloud Firestore and synced across devices
- Dark mode toggle controllable manually or through a voice command to the AI
- Neo-Brutalist UI design with flat colors, thick borders, and offset block shadows
- Fully responsive on mobile and desktop

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 18, Vite |
| Routing | React Router DOM v6 |
| UI Component Library | Material UI (MUI v5) |
| Icons | Lucide React |
| AI Model | Google Gemini via `@google/generative-ai` SDK |
| AI Techniques | Function Calling, Prompt Engineering, Multi-turn Chat, RAG |
| Voice | HTML5 Web Speech API (SpeechRecognition + SpeechSynthesis) |
| Authentication | Firebase Authentication (Google OAuth) |
| Database | Cloud Firestore |
| Deployment | Vercel |

---

## Running locally

```bash
git clone https://github.com/farazkhan-05/spanishAmigo.git
cd spanishAmigo
npm install
npm run dev
```

### Environment setup

Create a `.env.local` file in the project root with the following keys:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_api_key
```

A free Gemini API key is available at [aistudio.google.com](https://aistudio.google.com/).

---

## Project Structure

```
src/
├── components/
│   ├── chat/
│   │   └── GlobalChatbot.jsx       # AI tutor: Function Calling, STT, TTS, RAG context injection
│   └── layout/
│       └── Layout.jsx              # Navbar, footer, global dark mode state
├── context/
│   ├── AuthContext.jsx             # Firebase auth state
│   └── ProgressContext.jsx         # Lesson progress synced with Firestore
├── data/
│   ├── lessons/                    # lesson1.js through lesson5.js
│   └── curriculum.js               # Lesson index and metadata
├── firebase.js                     # Firebase initialisation and config
├── hooks/
│   └── useLessonNavigation.js      # Slide and quiz progression logic
├── pages/
│   ├── CourseMap.jsx               # Lesson map with locked and unlocked states
│   ├── LessonPlayer.jsx            # Lesson runtime container
│   └── lesson/
│       ├── ContextSlide.jsx        # Introduction and context slides
│       ├── QuizSlide.jsx           # Multiple choice quizzes with feedback
│       ├── RevealSlide.jsx         # Translation reveal cards
│       └── SuccessScreen.jsx       # Lesson completion screen
├── theme/
│   └── theme.js                    # MUI theme with Neo-Brutalism configuration
└── utils/
    └── gemini.js                   # Gemini session factory and tool declarations
```

---

## Adding new lessons

Create a new file in `src/data/lessons/` following the same structure as the existing ones and register it in `curriculum.js`. The lesson player, course map, and progress tracking all pick it up automatically with no other changes needed.

---

## License

MIT