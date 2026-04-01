"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AppUser, UserStats } from "./types";

const IS_FIREBASE_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

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

const DEFAULT_STATS: UserStats = {
  totalPoints: 0,
  currentStreak: 3,
  longestStreak: 7,
  level: 2,
  xp: 850,
  dailyGoalTarget: 20,
  dailyGoalProgress: 12,
  lastActiveDate: new Date().toISOString().split("T")[0],
  achievements: ["first-step", "weekend-warrior"],
  totalQuestionsAnswered: 47,
  totalCorrect: 38,
  totalTimeSpent: 2340,
};

const GUEST_USER: AppUser = {
  uid: "guest-user",
  email: null,
  displayName: "Gast",
  photoURL: null,
};

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

// ─── Local Storage Provider (no Firebase) ──────────────────────────────────

function LocalAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("lernapp-user");
    if (stored) {
      setUser(JSON.parse(stored));
      const s = localStorage.getItem("lernapp-stats");
      setStats(s ? JSON.parse(s) : FRESH_STATS);
    }
    setLoading(false);
  }, []);

  function getStoredStats(): UserStats {
    try {
      const s = localStorage.getItem("lernapp-stats");
      return s ? JSON.parse(s) : FRESH_STATS;
    } catch { return FRESH_STATS; }
  }

  function loginUser(u: AppUser, s: UserStats) {
    setUser(u);
    setStats(s);
    localStorage.setItem("lernapp-user", JSON.stringify(u));
    localStorage.setItem("lernapp-stats", JSON.stringify(s));
  }

  async function signInWithGoogle() {
    const u: AppUser = { uid: "local-google", email: "samir@meisterkurs.de", displayName: "Samir", photoURL: null };
    loginUser(u, getStoredStats());
  }

  async function signInWithEmail(email: string, _password: string) {
    const u: AppUser = { uid: "local-email", email, displayName: email.split("@")[0], photoURL: null };
    loginUser(u, getStoredStats());
  }

  async function signUpWithEmail(email: string, _password: string, name: string) {
    const u: AppUser = { uid: "local-email", email, displayName: name, photoURL: null };
    loginUser(u, FRESH_STATS);
  }

  async function signInAsGuest() {
    loginUser(GUEST_USER, getStoredStats());
  }

  async function signOut() {
    setUser(null);
    setStats(null);
    localStorage.removeItem("lernapp-user");
    localStorage.removeItem("lernapp-stats");
  }

  async function updateStats(updates: Partial<UserStats>) {
    const newStats = { ...stats, ...updates } as UserStats;
    setStats(newStats);
    localStorage.setItem("lernapp-stats", JSON.stringify(newStats));
  }

  return (
    <AuthContext.Provider
      value={{ user, stats, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signInAsGuest, signOut, updateStats }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Firebase Provider ─────────────────────────────────────────────────────

function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for guest user first
    const guestData = localStorage.getItem("lernapp-guest");
    if (guestData) {
      setUser(GUEST_USER);
      const s = localStorage.getItem("lernapp-stats");
      setStats(s ? JSON.parse(s) : FRESH_STATS);
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    async function init() {
      const { onAuthStateChanged } = await import("firebase/auth");
      const { auth } = await import("./firebase");
      const { doc, getDoc, setDoc } = await import("firebase/firestore");
      const { db } = await import("./firebase");

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          });
          const statsDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (statsDoc.exists()) {
            setStats(statsDoc.data() as UserStats);
          } else {
            const defaultStats: UserStats = { ...FRESH_STATS };
            await setDoc(doc(db, "users", firebaseUser.uid), defaultStats);
            setStats(defaultStats);
          }
        } else {
          setUser(null);
          setStats(null);
        }
        setLoading(false);
      });
    }

    init();
    return () => unsubscribe?.();
  }, []);

  async function signInWithGoogle() {
    const { signInWithPopup } = await import("firebase/auth");
    const { auth, googleProvider } = await import("./firebase");
    await signInWithPopup(auth, googleProvider);
  }

  async function signInWithEmail(email: string, password: string) {
    const { signInWithEmailAndPassword } = await import("firebase/auth");
    const { auth } = await import("./firebase");
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signUpWithEmail(email: string, password: string, name: string) {
    const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");
    const { auth } = await import("./firebase");
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
  }

  async function signInAsGuest() {
    localStorage.setItem("lernapp-guest", "true");
    localStorage.setItem("lernapp-stats", JSON.stringify(FRESH_STATS));
    setUser(GUEST_USER);
    setStats(FRESH_STATS);
    setLoading(false);
  }

  async function signOut() {
    // Clear guest mode
    localStorage.removeItem("lernapp-guest");
    localStorage.removeItem("lernapp-stats");
    // Also sign out Firebase if active
    try {
      const { signOut: firebaseSignOut } = await import("firebase/auth");
      const { auth } = await import("./firebase");
      await firebaseSignOut(auth);
    } catch { /* guest mode, no firebase auth active */ }
    setUser(null);
    setStats(null);
  }

  async function updateStats(updates: Partial<UserStats>) {
    if (!user) return;
    const newStats = { ...stats, ...updates } as UserStats;
    setStats(newStats);

    if (user.uid === "guest-user") {
      // Guest: save to localStorage only
      localStorage.setItem("lernapp-stats", JSON.stringify(newStats));
    } else {
      // Firebase user: save to Firestore
      const { doc, setDoc } = await import("firebase/firestore");
      const { db } = await import("./firebase");
      await setDoc(doc(db, "users", user.uid), newStats);
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, stats, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signInAsGuest, signOut, updateStats }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Auto-Select Provider ──────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  if (IS_FIREBASE_CONFIGURED) {
    return <FirebaseAuthProvider>{children}</FirebaseAuthProvider>;
  }
  return <LocalAuthProvider>{children}</LocalAuthProvider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
