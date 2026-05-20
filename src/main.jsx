import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { setCustomFavicon } from './utils/favicon.js';

setCustomFavicon();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// Quick connection test to prove our React frontend can talk to our Python FastAPI backend!
async function testBackendConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/status`);
    const data = await response.json();
    console.log("🔌 [SpanishAmigo Backend Status]:", data);
  } catch (error) {
    console.warn("⚠️ [SpanishAmigo Backend Connection failed]: Make sure your FastAPI server is running!", error);
  }
}
testBackendConnection();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
