"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth-context";
import type { QuestionProgress, LeitnerBox, Handlungsfeld } from "./types";
import { LEITNER_INTERVALS } from "./types";
import { questions } from "./questions";

interface ProgressContextValue {
  progress: Map<string, QuestionProgress>;
  loading: boolean;
  recordAnswer: (questionId: string, correct: boolean, responseTime: number) => Promise<void>;
  getDueQuestions: (hf?: Handlungsfeld) => string[];
  getNewQuestions: (hf?: Handlungsfeld, count?: number) => string[];
  getWeakQuestions: (count?: number) => string[];
  getHFProgress: (hf: Handlungsfeld) => { total: number; mastered: number; inProgress: number; notStarted: number; correctRate: number };
  getOverallProgress: () => { total: number; mastered: number; correctRate: number };
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Map<string, QuestionProgress>>(new Map());
  const [loading, setLoading] = useState(true);

  const isGuest = user?.uid === "guest-user";

  useEffect(() => {
    if (!user) {
      setProgress(new Map());
      setLoading(false);
      return;
    }

    if (isGuest) {
      try {
        const stored = localStorage.getItem("lernapp-progress");
        if (stored) {
          setProgress(new Map(Object.entries(JSON.parse(stored))));
        }
      } catch { /* ignore */ }
      setLoading(false);
      return;
    }

    // Firebase user: load from Firestore
    async function loadProgress() {
      try {
        const snap = await getDoc(doc(db, "progress", user!.uid));
        if (snap.exists()) {
          setProgress(new Map(Object.entries(snap.data() as Record<string, QuestionProgress>)));
        }
      } catch (err) {
        console.error("Failed to load progress:", err);
      }
      setLoading(false);
    }
    loadProgress();
  }, [user, isGuest]);

  const saveProgress = useCallback(async (newProgress: Map<string, QuestionProgress>) => {
    if (!user) return;
    const obj = Object.fromEntries(newProgress);

    if (isGuest) {
      localStorage.setItem("lernapp-progress", JSON.stringify(obj));
    } else {
      try {
        await setDoc(doc(db, "progress", user.uid), obj);
      } catch (err) {
        console.error("Failed to save progress:", err);
      }
    }
  }, [user, isGuest]);

  const recordAnswer = useCallback(async (questionId: string, correct: boolean, responseTime: number) => {
    const now = Date.now();
    const existing = progress.get(questionId);
    let newBox: LeitnerBox;

    if (correct) {
      newBox = Math.min((existing?.box ?? 0) + 1, 5) as LeitnerBox;
    } else {
      newBox = 0;
    }

    const intervalDays = LEITNER_INTERVALS[newBox];
    const nextReview = now + intervalDays * 24 * 60 * 60 * 1000;

    const updated: QuestionProgress = {
      questionId,
      box: newBox,
      lastSeen: now,
      nextReview,
      timesCorrect: (existing?.timesCorrect ?? 0) + (correct ? 1 : 0),
      timesWrong: (existing?.timesWrong ?? 0) + (correct ? 0 : 1),
      avgResponseTime: existing
        ? (existing.avgResponseTime * (existing.timesCorrect + existing.timesWrong) + responseTime) /
          (existing.timesCorrect + existing.timesWrong + 1)
        : responseTime,
    };

    const newProgress = new Map(progress);
    newProgress.set(questionId, updated);
    setProgress(newProgress);
    await saveProgress(newProgress);
  }, [progress, saveProgress]);

  const getDueQuestions = useCallback((hf?: Handlungsfeld) => {
    const now = Date.now();
    return questions
      .filter((q) => (!hf || q.handlungsfeld === hf))
      .filter((q) => {
        const p = progress.get(q.id);
        return p && p.nextReview <= now && p.box < 5;
      })
      .sort((a, b) => progress.get(a.id)!.nextReview - progress.get(b.id)!.nextReview)
      .map((q) => q.id);
  }, [progress]);

  const getNewQuestions = useCallback((hf?: Handlungsfeld, count = 10) => {
    return questions
      .filter((q) => (!hf || q.handlungsfeld === hf))
      .filter((q) => !progress.has(q.id))
      .slice(0, count)
      .map((q) => q.id);
  }, [progress]);

  const getWeakQuestions = useCallback((count = 10) => {
    return Array.from(progress.entries())
      .filter(([, p]) => p.timesWrong > p.timesCorrect || p.box <= 1)
      .sort(([, a], [, b]) => {
        const ratioA = a.timesCorrect / Math.max(a.timesCorrect + a.timesWrong, 1);
        const ratioB = b.timesCorrect / Math.max(b.timesCorrect + b.timesWrong, 1);
        return ratioA - ratioB;
      })
      .slice(0, count)
      .map(([id]) => id);
  }, [progress]);

  const getHFProgress = useCallback((hf: Handlungsfeld) => {
    const hfQuestions = questions.filter((q) => q.handlungsfeld === hf);
    const total = hfQuestions.length;
    let mastered = 0, inProgress = 0, correctTotal = 0, answeredTotal = 0;

    for (const q of hfQuestions) {
      const p = progress.get(q.id);
      if (p) {
        if (p.box >= 5) mastered++;
        else inProgress++;
        correctTotal += p.timesCorrect;
        answeredTotal += p.timesCorrect + p.timesWrong;
      }
    }

    return {
      total,
      mastered,
      inProgress,
      notStarted: total - mastered - inProgress,
      correctRate: answeredTotal > 0 ? correctTotal / answeredTotal : 0,
    };
  }, [progress]);

  const getOverallProgress = useCallback(() => {
    const total = questions.length;
    let mastered = 0, correctTotal = 0, answeredTotal = 0;

    for (const [, p] of progress) {
      if (p.box >= 5) mastered++;
      correctTotal += p.timesCorrect;
      answeredTotal += p.timesCorrect + p.timesWrong;
    }

    return {
      total,
      mastered,
      correctRate: answeredTotal > 0 ? correctTotal / answeredTotal : 0,
    };
  }, [progress]);

  return (
    <ProgressContext.Provider
      value={{ progress, loading, recordAnswer, getDueQuestions, getNewQuestions, getWeakQuestions, getHFProgress, getOverallProgress }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
