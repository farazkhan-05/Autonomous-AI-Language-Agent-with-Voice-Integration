import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext'; // Import the User Brain
import { db } from '../firebase';        // Import the Cloud Database
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Import Firebase tools

const ProgressContext = createContext();

export const ProgressProvider = ({ children }) => {
  const { user } = useAuth(); // Check who is logged in
  const [completedLessons, setCompletedLessons] = useState([]);

  // 1. SYNC LOGIC (Runs when you login/logout)
  useEffect(() => {
    const loadProgress = async () => {
      if (user) {
        // --- SCENARIO A: USER IS LOGGED IN ---
        try {
          const docRef = doc(db, "users", user.uid); // Look for a file named after their User ID
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            // Found existing cloud data! Download it.
            const cloudProgress = docSnap.data().completedLessons || [];
            
            // Merge cloud and local to ensure no progress is lost if cloud save failed previously
            const saved = localStorage.getItem('spanishProgress');
            const localProgress = saved ? JSON.parse(saved) : [];
            const mergedProgress = [...new Set([...cloudProgress, ...localProgress])];
            
            setCompletedLessons(mergedProgress);
            
            // Sync the merged progress back to cloud if they differ
            if (mergedProgress.length > cloudProgress.length) {
              await setDoc(docRef, { completedLessons: mergedProgress }, { merge: true });
            }
          } else {
            // New user? Upload their current local progress to start their account.
            const saved = localStorage.getItem('spanishProgress');
            const localProgress = saved ? JSON.parse(saved) : [];
            await setDoc(docRef, { completedLessons: localProgress });
            setCompletedLessons(localProgress);
          }
        } catch (error) {
          console.error("Error loading cloud progress:", error);
          // Fallback to local storage
          const saved = localStorage.getItem('spanishProgress');
          if (saved) {
            setCompletedLessons(JSON.parse(saved));
          } else {
            setCompletedLessons([]);
          }
        }
      } else {
        // --- SCENARIO B: GUEST MODE ---
        // Just read from the browser's memory
        const saved = localStorage.getItem('spanishProgress');
        if (saved) {
          setCompletedLessons(JSON.parse(saved));
        } else {
          setCompletedLessons([]);
        }
      }
    };

    loadProgress();
  }, [user]); // Only run this when the user changes (Login/Logout)

  // 2. SAVE LOGIC (Runs when you finish a lesson)
  const markLessonComplete = async (id) => {
    if (!completedLessons.includes(id)) {
      // Create the new list first
      const newProgress = [...completedLessons, id];
      
      // Update the App UI immediately (Instant feedback)
      setCompletedLessons(newProgress);

      // Always save to browser memory as a reliable fallback
      localStorage.setItem('spanishProgress', JSON.stringify(newProgress));

      if (user) {
        // --- SAVE TO CLOUD ---
        try {
          const docRef = doc(db, "users", user.uid);
          // { merge: true } means "update only this field, don't delete other stuff"
          await setDoc(docRef, { completedLessons: newProgress }, { merge: true });
        } catch (error) {
          console.error("Error saving to cloud:", error);
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