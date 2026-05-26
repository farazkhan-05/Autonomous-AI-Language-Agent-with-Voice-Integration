import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { auth, googleProvider } from "../firebase"; // Importing from your existing firebase.js
import {
  linkWithPopup,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut
} from "firebase/auth";

const AuthContext = createContext();

const LINK_FALLBACK_ERROR_CODES = new Set([
  "auth/credential-already-in-use",
  "auth/email-already-in-use",
  "auth/account-exists-with-different-credential",
  "auth/provider-already-linked",
]);

const AUTH_ERROR_MESSAGES = {
  "auth/popup-closed-by-user": "Sign-in was closed before completion. Please try again.",
  "auth/popup-blocked": "Your browser blocked the sign-in popup. Please allow popups for this site, then try again.",
  "auth/cancelled-popup-request": "A sign-in popup was already in progress. Please try again.",
  "auth/unauthorized-domain": "This website domain is not authorized in Firebase Auth yet.",
  "auth/operation-not-allowed": "Google sign-in is not enabled in Firebase Authentication settings.",
};

const getAuthErrorMessage = (error) => AUTH_ERROR_MESSAGES[error?.code] || "Sign-in failed. Please try again.";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signInPrompt, setSignInPrompt] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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
    if (isLoggingIn) return;
    setAuthError(null);
    setIsLoggingIn(true);

    try {
      if (auth.currentUser?.isAnonymous) {
        try {
          await linkWithPopup(auth.currentUser, googleProvider);
        } catch (linkError) {
          if (!LINK_FALLBACK_ERROR_CODES.has(linkError.code)) {
            throw linkError;
          }
          await signInWithPopup(auth, googleProvider);
        }
      } else {
        await signInWithPopup(auth, googleProvider);
      }
      await auth.currentUser?.getIdToken(true);
      setSignInPrompt(null);
    } catch (error) {
      console.error("Login failed:", error);
      setAuthError(getAuthErrorMessage(error));
      if (!signInPrompt) {
        setSignInPrompt("save-progress");
      }
    } finally {
      setIsLoggingIn(false);
    }
  }, [isLoggingIn, signInPrompt]);

  // 3. Logout Function
  const logout = useCallback(() => {
    signOut(auth);
  }, []);

  const openSignInPrompt = useCallback((reason = "save-progress") => {
    setAuthError(null);
    setSignInPrompt(reason);
  }, []);

  const closeSignInPrompt = useCallback(() => {
    setAuthError(null);
    setSignInPrompt(null);
  }, []);

  const value = useMemo(() => ({
    user,
    isAnonymous: Boolean(user?.isAnonymous),
    login,
    logout,
    loading,
    signInPrompt,
    authError,
    isLoggingIn,
    openSignInPrompt,
    closeSignInPrompt
  }), [user, login, logout, loading, signInPrompt, authError, isLoggingIn, openSignInPrompt, closeSignInPrompt]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
