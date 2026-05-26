import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { auth, googleProvider } from "../firebase"; // Importing from your existing firebase.js
import { linkWithPopup, onAuthStateChanged, signInAnonymously, signInWithPopup, signOut } from "firebase/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signInPrompt, setSignInPrompt] = useState(null);

  // 1. Check if user is already logged in when app starts
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
        return;
      }

      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Anonymous sign-in failed:", error);
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Login Function
  const login = useCallback(async () => {
    try {
      if (auth.currentUser?.isAnonymous) {
        try {
          await linkWithPopup(auth.currentUser, googleProvider);
        } catch (linkError) {
          if (linkError.code !== "auth/credential-already-in-use") {
            throw linkError;
          }
          await signInWithPopup(auth, googleProvider);
        }
      } else {
        await signInWithPopup(auth, googleProvider);
      }
      setSignInPrompt(null);
    } catch (error) {
      console.error("Login failed:", error);
    }
  }, []);

  // 3. Logout Function
  const logout = useCallback(() => {
    signOut(auth);
  }, []);

  const openSignInPrompt = useCallback((reason = "save-progress") => {
    setSignInPrompt(reason);
  }, []);

  const closeSignInPrompt = useCallback(() => {
    setSignInPrompt(null);
  }, []);

  const value = useMemo(() => ({
    user,
    isAnonymous: Boolean(user?.isAnonymous),
    login,
    logout,
    loading,
    signInPrompt,
    openSignInPrompt,
    closeSignInPrompt
  }), [user, login, logout, loading, signInPrompt, openSignInPrompt, closeSignInPrompt]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
