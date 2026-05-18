import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { setCustomFavicon } from './utils/favicon.js';

setCustomFavicon();

// Quick connection test to prove our React frontend can talk to our Python FastAPI backend!
async function testBackendConnection() {
  try {
    const response = await fetch("http://127.0.0.1:8000/status");
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
