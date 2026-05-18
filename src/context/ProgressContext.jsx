import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext'; // Import the User Brain

const ProgressContext = createContext();

const API_BASE_URL = "http://127.0.0.1:8000";

export const ProgressProvider = ({ children }) => {
  const { user } = useAuth(); // Check who is logged in
  const [completedLessons, setCompletedLessons] = useState([]);

  // 1. SYNC LOGIC (Runs when you login/logout)
  useEffect(() => {
    const loadProgress = async () => {
      // Fetch local storage fallback
      const saved = localStorage.getItem('spanishProgress');
      const localProgress = saved ? JSON.parse(saved) : [];

      if (user) {
        // --- SCENARIO A: USER IS LOGGED IN ---
        try {
          // Fetch progress from our new FastAPI + Postgres database
          const response = await fetch(`${API_BASE_URL}/progress/${user.uid}`);
          if (!response.ok) throw new Error("Backend connection failed");
          
          const dbProgress = await response.json(); // Array of lesson IDs e.g. ["1", "2"]
          
          // Merge cloud and local so no progress is lost
          const mergedProgress = [...new Set([...dbProgress, ...localProgress])];
          setCompletedLessons(mergedProgress);
          localStorage.setItem('spanishProgress', JSON.stringify(mergedProgress));

          // If there are unsaved local items, upload them to Postgres
          const unsavedLessons = localProgress.filter(id => !dbProgress.includes(id));
          if (unsavedLessons.length > 0) {
            await Promise.all(
              unsavedLessons.map(lessonId =>
                fetch(`${API_BASE_URL}/progress/complete`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ user_id: user.uid, lesson_id: lessonId })
                })
              )
            );
          }
        } catch (error) {
          console.warn("⚠️ [SpanishAmigo] Fallback to local storage (Backend offline):", error);
          setCompletedLessons(localProgress);
        }
      } else {
        // --- SCENARIO B: GUEST MODE ---
        setCompletedLessons(localProgress);
      }
    };

    loadProgress();
  }, [user]); // Run when login status changes

  // 2. SAVE LOGIC (Runs when you finish a lesson)
  const markLessonComplete = async (id) => {
    if (!completedLessons.includes(id)) {
      const newProgress = [...completedLessons, id];
      
      // Update UI and local storage instantly for snappy feedback
      setCompletedLessons(newProgress);
      localStorage.setItem('spanishProgress', JSON.stringify(newProgress));

      if (user) {
        // --- SAVE TO POSTGRES DB ---
        try {
          const response = await fetch(`${API_BASE_URL}/progress/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.uid,
              lesson_id: id
            })
          });
          if (!response.ok) throw new Error("Failed to save progress to server");
        } catch (error) {
          console.warn("⚠️ [SpanishAmigo] Progress saved locally, but cloud sync failed:", error);
        }
      }
    }
  };

  return (
    <ProgressContext.Provider value={{ completedLessons, markLessonComplete }}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => useContext(ProgressContext);