import React, { createContext, useCallback, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext'; // Import the User Brain
import { authFetch } from '../api/authFetch';
import { throwApiError } from '../api/apiError';

const ProgressContext = createContext();

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
          // Fetch progress from our new FastAPI + Postgres database with token
          const response = await authFetch(`/progress/${user.uid}`, {
            user
          });
          await throwApiError(response, "Backend connection failed");
          
          const dbProgressRaw = await response.json(); // Array of lesson IDs e.g. ["1", "2"]
          const dbProgress = normalizeLessonIds(dbProgressRaw);

          // If there are unsaved local items, upload them to Postgres
          const unsavedLessons = localProgress.filter(id => !dbProgress.includes(id));
          if (unsavedLessons.length > 0) {
            await Promise.all(
              unsavedLessons.map(async (lessonId) => {
                return authFetch('/progress/complete', {
                  method: 'POST',
                  user,
                  body: { user_id: user.uid, lesson_id: String(lessonId) }
                }).then((uploadResponse) => throwApiError(uploadResponse, "Backend progress upload failed"));
              })
            );
          }

          // Read-after-write: server remains the source of truth.
          const refreshResponse = await authFetch(`/progress/${user.uid}`, {
            user
          });
          await throwApiError(refreshResponse, "Backend refresh failed");

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
          const response = await authFetch('/progress/complete', {
            method: 'POST',
            user,
            body: {
              user_id: user.uid,
              lesson_id: String(normalizedId)
            }
          });
          await throwApiError(response, "Failed to save progress to server");
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
