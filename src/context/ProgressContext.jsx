import React, { createContext, useCallback, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext'; // Import the User Brain

const ProgressContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const normalizeLessonIds = (ids) => {
  if (!Array.isArray(ids)) return [];
  const normalized = ids
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);
  return [...new Set(normalized)].sort((a, b) => a - b);
};

export const ProgressProvider = ({ children }) => {
  const { user } = useAuth(); // Check who is logged in
  const [completedLessons, setCompletedLessons] = useState([]);

  // 1. SYNC LOGIC (Runs when you login/logout)
  useEffect(() => {
    const loadProgress = async () => {
      // Fetch local storage fallback
      const saved = localStorage.getItem('spanishProgress');
      const localProgress = normalizeLessonIds(saved ? JSON.parse(saved) : []);

      if (user) {
        // --- SCENARIO A: USER IS LOGGED IN ---
        try {
          // Fetch token from Firebase auth context
          const token = await user.getIdToken();
          
          // Fetch progress from our new FastAPI + Postgres database with token
          const response = await fetch(`${API_BASE_URL}/progress/${user.uid}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (!response.ok) throw new Error("Backend connection failed");
          
          const dbProgressRaw = await response.json(); // Array of lesson IDs e.g. ["1", "2"]
          const dbProgress = normalizeLessonIds(dbProgressRaw);

          // If there are unsaved local items, upload them to Postgres
          const unsavedLessons = localProgress.filter(id => !dbProgress.includes(id));
          if (unsavedLessons.length > 0) {
            await Promise.all(
              unsavedLessons.map(async (lessonId) => {
                const uploadToken = await user.getIdToken();
                return fetch(`${API_BASE_URL}/progress/complete`, {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${uploadToken}`
                  },
                  body: JSON.stringify({ user_id: user.uid, lesson_id: String(lessonId) })
                });
              })
            );
          }

          // Read-after-write: server remains the source of truth.
          const refreshToken = await user.getIdToken();
          const refreshResponse = await fetch(`${API_BASE_URL}/progress/${user.uid}`, {
            headers: {
              'Authorization': `Bearer ${refreshToken}`
            }
          });
          if (!refreshResponse.ok) throw new Error("Backend refresh failed");

          const canonicalProgress = normalizeLessonIds(await refreshResponse.json());
          setCompletedLessons(canonicalProgress);
          localStorage.setItem('spanishProgress', JSON.stringify(canonicalProgress));
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
  const markLessonComplete = useCallback(async (id) => {
    const normalizedId = Number(id);
    if (!Number.isInteger(normalizedId) || normalizedId <= 0) return;

    if (!completedLessons.includes(normalizedId)) {
      const newProgress = [...completedLessons, normalizedId].sort((a, b) => a - b);
      
      // Update UI and local storage instantly for snappy feedback
      setCompletedLessons(newProgress);
      localStorage.setItem('spanishProgress', JSON.stringify(newProgress));

      if (user) {
        // --- SAVE TO POSTGRES DB ---
        try {
          const token = await user.getIdToken();
          const response = await fetch(`${API_BASE_URL}/progress/complete`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              user_id: user.uid,
              lesson_id: String(normalizedId)
            })
          });
          if (!response.ok) throw new Error("Failed to save progress to server");
        } catch (error) {
          console.warn("⚠️ [SpanishAmigo] Progress saved locally, but cloud sync failed:", error);
        }
      }
    }
  }, [completedLessons, user]);

  const value = useMemo(() => ({
    completedLessons,
    markLessonComplete
  }), [completedLessons, markLessonComplete]);

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => useContext(ProgressContext);
