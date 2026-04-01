"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";
import type { AppUser, UserStats } from "./types";

interface AuthContextValue {
  user: AppUser | null;
  stats: UserStats | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  updateStats: (updates: Partial<UserStats>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const FRESH_STATS: UserStats = {
  totalPoints: 0,
  currentStreak: 0,
  longestStreak: 0,
  level: 1,
  xp: 0,
  dailyGoalTarget: 20,
  dailyGoalProgress: 0,
  lastActiveDate: "",
  achievements: [],
  totalQuestionsAnswered: 0,
  totalCorrect: 0,
  totalTimeSpent: 0,
};

const GUEST_USER: AppUser = {
  uid: "guest-user",
  email: null,
  displayName: "Gast",
  photoURL: null,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Check for guest session first
    if (typeof window !== "undefined" && localStorage.getItem("lernapp-guest")) {
      setUser(GUEST_USER);
      setIsGuest(true);
      try {
        const s = localStorage.getItem("lernapp-stats");
        setStats(s ? JSON.parse(s) : FRESH_STATS);
      } catch {
        setStats(FRESH_STATS);
      }
      setLoading(false);
      return;
    }

    // Firebase auth listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
        setIsGuest(false);

        // Load or create user stats in Firestore
        try {
          const statsDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (statsDoc.exists()) {
            setStats(statsDoc.data() as UserStats);
          } else {
            await setDoc(doc(db, "users", firebaseUser.uid), FRESH_STATS);
            setStats(FRESH_STATS);
          }
        } catch (err) {
          console.error("Firestore error:", err);
          setStats(FRESH_STATS);
        }
      } else {
        if (!localStorage.getItem("lernapp-guest")) {
          setUser(null);
          setStats(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ─── Real Google Auth ──────────────────────────────────────────────────────
  async function handleSignInWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);

    // Initialize progress if new user
    const progressRef = doc(db, "users", result.user.uid);
    const existing = await getDoc(progressRef);
    if (!existing.exists()) {
      await setDoc(progressRef, FRESH_STATS);
    }
  }

  // ─── Real Email Auth ───────────────────────────────────────────────────────
  async function handleSignInWithEmail(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function handleSignUpWithEmail(email: string, password: string, name: string) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    await setDoc(doc(db, "users", result.user.uid), FRESH_STATS);
  }

  // ─── Guest Mode (localStorage only) ───────────────────────────────────────
  async function handleSignInAsGuest() {
    localStorage.setItem("lernapp-guest", "true");
    localStorage.setItem("lernapp-stats", JSON.stringify(FRESH_STATS));
    setUser(GUEST_USER);
    setStats(FRESH_STATS);
    setIsGuest(true);
    setLoading(false);
  }

  // ─── Sign Out ──────────────────────────────────────────────────────────────
  async function handleSignOut() {
    if (isGuest) {
      localStorage.removeItem("lernapp-guest");
      localStorage.removeItem("lernapp-stats");
      localStorage.removeItem("lernapp-progress");
    }
    try {
      await firebaseSignOut(auth);
    } catch { /* guest mode */ }
    setUser(null);
    setStats(null);
    setIsGuest(false);
  }

  // ─── Update Stats ─────────────────────────────────────────────────────────
  async function handleUpdateStats(updates: Partial<UserStats>) {
    if (!user) return;
    const newStats = { ...stats, ...updates } as UserStats;
    setStats(newStats);

    if (isGuest) {
      localStorage.setItem("lernapp-stats", JSON.stringify(newStats));
    } else {
      try {
        await setDoc(doc(db, "users", user.uid), newStats);
      } catch (err) {
        console.error("Failed to save stats:", err);
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        stats,
        loading,
        signInWithGoogle: handleSignInWithGoogle,
        signInWithEmail: handleSignInWithEmail,
        signUpWithEmail: handleSignUpWithEmail,
        signInAsGuest: handleSignInAsGuest,
        signOut: handleSignOut,
        updateStats: handleUpdateStats,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
