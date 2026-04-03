"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth-context";
import type { QuestionProgress, LeitnerBox, Handlungsfeld, AttemptRecord } from "./types";
import { questions } from "./questions";

// ─── Mastery Algorithm ───────────────────────────────────────────────────────

/** Weighted average of last 5 attempts with response time modifier and time decay */
function calculateMastery(history: AttemptRecord[], lastSeen: number): number {
  if (history.length === 0) return 0;

  // 1. Weighted base score (newest first)
  const weights = [1.0, 0.7, 0.5, 0.3, 0.15];
  let score = 0;
  let wTotal = 0;
  for (let i = 0; i < Math.min(history.length, 5); i++) {
    const w = weights[i];
    const h = history[i];
    // Correct: base 100. Fast correct: 110. Slow correct: 85. Wrong: 0
    let pts = 0;
    if (h.c) {
      pts = h.t < 8 ? 110 : h.t > 25 ? 85 : 100;
    }
    score += pts * w;
    wTotal += w;
  }
  let mastery = score / wTotal;

  // 2. Streak bonus (consecutive correct from most recent)
  let streak = 0;
  for (const h of history) {
    if (h.c) streak++;
    else break;
  }
  mastery *= 1 + Math.min(streak * 0.04, 0.2); // up to +20%

  // 3. Time decay (half-life 14 days)
  const days = (Date.now() - lastSeen) / 86400000;
  if (days > 0.5) {
    mastery *= Math.pow(0.5, days / 14);
  }

  return Math.round(Math.min(Math.max(mastery, 0), 100));
}

/** Confidence factor: more attempts = more trustworthy score */
function calculateConfidence(totalAttempts: number): number {
  return 1 - 0.6 / (1 + totalAttempts * 0.4);
}

/** Effective mastery = raw mastery × confidence. Used for prioritization. */
function getEffectiveMastery(mastery: number, confidence: number): number {
  return mastery * confidence;
}

/** Derive Leitner box from mastery (backwards compatible) */
function masteryToBox(mastery: number): LeitnerBox {
  if (mastery >= 90) return 5;
  if (mastery >= 75) return 4;
  if (mastery >= 55) return 3;
  if (mastery >= 35) return 2;
  if (mastery >= 15) return 1;
  return 0;
}

/** Dynamic review interval based on mastery + streak + attempts
 *  Key rule: 3x in Folge richtig = "sicher gelernt" → longer intervals
 *  Few attempts = always come back soon regardless of mastery */
function calculateNextReview(mastery: number, streak: number, totalAttempts: number): number {
  let days: number;

  // 3+ in Folge richtig = bewiesen → gestaffelte Intervalle
  if (streak >= 5 && mastery >= 80) days = 30;
  else if (streak >= 3 && mastery >= 70) days = 14;
  else if (streak >= 3 && mastery >= 50) days = 7;
  // Wenige Versuche = immer bald wiederkommen (egal wie hoch der Score)
  else if (totalAttempts <= 1) days = 0;           // sofort wieder
  else if (totalAttempts <= 2) days = 1;           // 1 Tag
  else if (totalAttempts <= 3) days = 2;           // 2 Tage
  // Normal mastery-basiert (aber mit Streak < 3)
  else if (mastery >= 80) days = 7;
  else if (mastery >= 60) days = 3;
  else if (mastery >= 40) days = 1;
  else days = 0;

  return Date.now() + days * 86400000;
}

/** Migrate progress data to include all mastery fields */
function migrateProgress(p: QuestionProgress): QuestionProgress {
  const total = (p.timesCorrect ?? 0) + (p.timesWrong ?? 0);

  // Already fully migrated
  if (p.mastery !== undefined && p.history !== undefined && p.streak !== undefined && p.confidence !== undefined) return p;

  const rate = total > 0 ? (p.timesCorrect ?? 0) / total : 0;
  const days = (Date.now() - (p.lastSeen ?? Date.now())) / 86400000;
  const decay = Math.pow(0.5, Math.max(days, 0) / 14);

  let rawMastery = p.mastery ?? Math.round(Math.min(Math.max(rate * 100 * decay, 0), 100));
  const confidence = p.confidence ?? calculateConfidence(total);

  // Estimate streak from history or box
  let streak = p.streak ?? 0;
  if (p.history && p.history.length > 0 && streak === 0) {
    for (const h of p.history) {
      if (h.c) streak++;
      else break;
    }
  } else if (streak === 0 && p.box >= 2) {
    streak = Math.min(p.box, 3);
  }

  return {
    ...p,
    mastery: rawMastery,
    history: p.history ?? [],
    streak,
    confidence,
  };
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface MasteryStats {
  totalQuestions: number;
  mastered: number;
  secure: number;
  learning: number;
  beginner: number;
  unknown: number;
  notStarted: number;
  provenLearned: number;   // streak >= 3 AND mastery >= 70 = "sicher gelernt"
  unproven: number;        // mastery > 50 AND totalAttempts <= 2 = "noch unbewiesen"
  avgMastery: number;
  weakestTopics: { topic: string; hf: Handlungsfeld; avgMastery: number }[];
}

interface ProgressContextValue {
  progress: Map<string, QuestionProgress>;
  loading: boolean;
  recordAnswer: (questionId: string, correct: boolean, responseTime: number) => Promise<void>;
  getDueQuestions: (hf?: Handlungsfeld) => string[];
  getNewQuestions: (hf?: Handlungsfeld, count?: number) => string[];
  getWeakQuestions: (count?: number) => string[];
  getSmartQuestions: (hf?: Handlungsfeld, count?: number, typeFilter?: "mc" | "open") => string[];
  getStreakBuildQuestions: (hf?: Handlungsfeld, count?: number) => string[];
  getHFProgress: (hf: Handlungsfeld) => { total: number; mastered: number; inProgress: number; notStarted: number; correctRate: number };
  getOverallProgress: () => { total: number; mastered: number; correctRate: number };
  getMasteryStats: () => MasteryStats;
  getQuestionMastery: (questionId: string) => { mastery: number; confidence: number; effective: number; attempts: number } | null;
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
          const raw = JSON.parse(stored) as Record<string, QuestionProgress>;
          const migrated = new Map<string, QuestionProgress>();
          for (const [id, p] of Object.entries(raw)) {
            migrated.set(id, migrateProgress(p));
          }
          setProgress(migrated);
        }
      } catch { /* ignore */ }
      setLoading(false);
      return;
    }

    async function loadProgress() {
      try {
        const snap = await getDoc(doc(db, "progress", user!.uid));
        if (snap.exists()) {
          const raw = snap.data() as Record<string, QuestionProgress>;
          const migrated = new Map<string, QuestionProgress>();
          for (const [id, p] of Object.entries(raw)) {
            migrated.set(id, migrateProgress(p));
          }
          setProgress(migrated);
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

  // ─── Record Answer (with Mastery) ──────────────────────────────────────────

  const recordAnswer = useCallback(async (questionId: string, correct: boolean, responseTime: number) => {
    const now = Date.now();
    const existing = progress.get(questionId);

    // Build history (newest first, max 5)
    const newHistory: AttemptRecord[] = [
      { ts: now, c: correct, t: responseTime },
      ...(existing?.history ?? []).slice(0, 4),
    ];

    // Calculate mastery from history
    const mastery = calculateMastery(newHistory, now);
    const totalAttempts = (existing?.timesCorrect ?? 0) + (existing?.timesWrong ?? 0) + 1;
    const confidence = calculateConfidence(totalAttempts);

    // Streak (consecutive correct from most recent)
    let streak = 0;
    for (const h of newHistory) {
      if (h.c) streak++;
      else break;
    }

    // Derive Leitner box and review interval
    const box = masteryToBox(mastery);
    const nextReview = calculateNextReview(mastery, streak, totalAttempts);

    const updated: QuestionProgress = {
      questionId,
      box,
      lastSeen: now,
      nextReview,
      timesCorrect: (existing?.timesCorrect ?? 0) + (correct ? 1 : 0),
      timesWrong: (existing?.timesWrong ?? 0) + (correct ? 0 : 1),
      avgResponseTime: existing
        ? (existing.avgResponseTime * (existing.timesCorrect + existing.timesWrong) + responseTime) / totalAttempts
        : responseTime,
      mastery,
      history: newHistory,
      streak,
      confidence,
    };

    const newProgress = new Map(progress);
    newProgress.set(questionId, updated);
    setProgress(newProgress);
    await saveProgress(newProgress);
  }, [progress, saveProgress]);

  // ─── Smart Question Selection ──────────────────────────────────────────────

  const getSmartQuestions = useCallback((hf?: Handlungsfeld, count = 20, typeFilter?: "mc" | "open") => {
    const now = Date.now();
    const candidates = questions
      .filter((q) => !hf || q.handlungsfeld === hf)
      .filter((q) => !typeFilter || q.type === typeFilter)
      .map((q) => {
        const p = progress.get(q.id);

        if (!p) {
          // New question: moderate-high priority (want to discover weaknesses)
          return { id: q.id, priority: 55, isNew: true };
        }

        const m = p.mastery ?? 0;
        const totalAttempts = p.timesCorrect + p.timesWrong;
        const conf = p.confidence ?? calculateConfidence(totalAttempts);
        const effective = getEffectiveMastery(m, conf);

        let priority = 100 - effective;

        // Due for review: +15
        if (p.nextReview <= now) priority += 15;

        // Recently answered wrong: +12
        if (p.history && p.history.length > 0 && !p.history[0].c) priority += 12;

        const streak = p.streak ?? 0;

        // Unbewiesen: hoher Score aber wenige Versuche → MUSS wiederholt werden
        if (totalAttempts <= 1 && m > 40) priority += 25;  // 1x richtig = sofort nochmal
        else if (totalAttempts <= 2 && streak < 3) priority += 15;
        else if (totalAttempts <= 3 && streak < 3) priority += 8;

        // Noch nicht 3x in Folge richtig = nicht gesichert
        if (streak < 3 && totalAttempts >= 2 && m > 50) priority += 5;

        // 3+ in Folge richtig = gesichert → niedrigere Priorität
        if (streak >= 3 && m >= 70) priority -= 10;

        return { id: q.id, priority: Math.round(priority), isNew: false };
      });

    // Sort by priority descending
    candidates.sort((a, b) => b.priority - a.priority);

    // Ensure mix: ~15% new questions if available
    const newOnes = candidates.filter((c) => c.isNew);
    const reviewed = candidates.filter((c) => !c.isNew);

    const newSlots = Math.min(Math.ceil(count * 0.15), newOnes.length);
    const reviewSlots = count - newSlots;

    const selected = [...reviewed.slice(0, reviewSlots), ...newOnes.slice(0, newSlots)];

    // Shuffle to avoid predictable order
    for (let i = selected.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selected[i], selected[j]] = [selected[j], selected[i]];
    }

    return selected.slice(0, count).map((s) => s.id);
  }, [progress]);

  // ─── Streak Build: Questions answered but not yet 3x correct in a row ──────

  const getStreakBuildQuestions = useCallback((hf?: Handlungsfeld, count = 20) => {
    const candidates = Array.from(progress.entries())
      .filter(([id, p]) => {
        const q = questions.find((qq) => qq.id === id);
        if (!q) return false;
        if (hf && q.handlungsfeld !== hf) return false;
        const streak = p.streak ?? 0;
        const attempts = p.timesCorrect + p.timesWrong;
        return attempts >= 1 && streak < 3;
      })
      .map(([id, p]) => ({ id, streak: p.streak ?? 0 }));

    // Fair mix: ~40% streak 0 (unsicher), ~40% streak 1, ~20% streak 2
    // So it's not always the same streak-2 questions repeating
    const s0 = candidates.filter((c) => c.streak === 0).sort(() => Math.random() - 0.5);
    const s1 = candidates.filter((c) => c.streak === 1).sort(() => Math.random() - 0.5);
    const s2 = candidates.filter((c) => c.streak === 2).sort(() => Math.random() - 0.5);

    const slots0 = Math.min(Math.ceil(count * 0.4), s0.length);
    const slots2 = Math.min(Math.ceil(count * 0.2), s2.length);
    const slots1 = Math.min(count - slots0 - slots2, s1.length);
    const rest = count - slots0 - slots1 - slots2;

    const selected = [
      ...s0.slice(0, slots0),
      ...s1.slice(0, slots1),
      ...s2.slice(0, slots2),
      // Fill remaining from any pool
      ...[...s0.slice(slots0), ...s1.slice(slots1), ...s2.slice(slots2)].slice(0, rest),
    ];

    // Shuffle final selection
    for (let i = selected.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selected[i], selected[j]] = [selected[j], selected[i]];
    }

    return selected.slice(0, count).map((c) => c.id);
  }, [progress]);

  // ─── Legacy Selection Functions (still used by some modes) ─────────────────

  const getDueQuestions = useCallback((hf?: Handlungsfeld) => {
    const now = Date.now();
    return questions
      .filter((q) => !hf || q.handlungsfeld === hf)
      .filter((q) => {
        const p = progress.get(q.id);
        return p && p.nextReview <= now && (p.mastery ?? 0) < 90;
      })
      .sort((a, b) => (progress.get(a.id)?.mastery ?? 0) - (progress.get(b.id)?.mastery ?? 0))
      .map((q) => q.id);
  }, [progress]);

  const getNewQuestions = useCallback((hf?: Handlungsfeld, count = 10) => {
    return questions
      .filter((q) => !hf || q.handlungsfeld === hf)
      .filter((q) => !progress.has(q.id))
      .slice(0, count)
      .map((q) => q.id);
  }, [progress]);

  const getWeakQuestions = useCallback((count = 20) => {
    return Array.from(progress.entries())
      .filter(([, p]) => {
        const effective = getEffectiveMastery(p.mastery ?? 0, p.confidence ?? 0.5);
        return effective < 50;
      })
      .sort(([, a], [, b]) => {
        const ea = getEffectiveMastery(a.mastery ?? 0, a.confidence ?? 0.5);
        const eb = getEffectiveMastery(b.mastery ?? 0, b.confidence ?? 0.5);
        return ea - eb;
      })
      .slice(0, count)
      .map(([id]) => id);
  }, [progress]);

  // ─── Analytics ─────────────────────────────────────────────────────────────

  const getHFProgress = useCallback((hf: Handlungsfeld) => {
    const hfQuestions = questions.filter((q) => q.handlungsfeld === hf);
    const total = hfQuestions.length;
    let mastered = 0, inProgress = 0, correctTotal = 0, answeredTotal = 0;

    for (const q of hfQuestions) {
      const p = progress.get(q.id);
      if (p) {
        if ((p.mastery ?? 0) >= 80) mastered++;
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
      if ((p.mastery ?? 0) >= 80) mastered++;
      correctTotal += p.timesCorrect;
      answeredTotal += p.timesCorrect + p.timesWrong;
    }

    return {
      total,
      mastered,
      correctRate: answeredTotal > 0 ? correctTotal / answeredTotal : 0,
    };
  }, [progress]);

  const getMasteryStats = useCallback((): MasteryStats => {
    const stats: MasteryStats = {
      totalQuestions: questions.length,
      mastered: 0, secure: 0, learning: 0, beginner: 0, unknown: 0, notStarted: 0,
      provenLearned: 0, unproven: 0,
      avgMastery: 0,
      weakestTopics: [],
    };

    let masterySum = 0;
    const topicData: Record<string, { sum: number; count: number; hf: Handlungsfeld }> = {};

    for (const q of questions) {
      const p = progress.get(q.id);
      if (!p) { stats.notStarted++; continue; }

      const m = p.mastery ?? 0;
      const streak = p.streak ?? 0;
      const totalAttempts = p.timesCorrect + p.timesWrong;
      masterySum += m;

      if (m >= 80) stats.mastered++;
      else if (m >= 60) stats.secure++;
      else if (m >= 40) stats.learning++;
      else if (m >= 20) stats.beginner++;
      else stats.unknown++;

      // Proven vs unproven tracking
      if (streak >= 3 && m >= 70) stats.provenLearned++;
      if (m > 50 && totalAttempts <= 2) stats.unproven++;

      const key = `${q.handlungsfeld}|${q.topic}`;
      if (!topicData[key]) topicData[key] = { sum: 0, count: 0, hf: q.handlungsfeld };
      topicData[key].sum += m;
      topicData[key].count++;
    }

    const started = stats.totalQuestions - stats.notStarted;
    // Lern-Score = avgMastery × √coverage
    // Prevents inflated score from few answered questions (30/255 perfect → 35 not 100)
    const rawAvg = started > 0 ? masterySum / started : 0;
    const coverage = started / stats.totalQuestions;
    stats.avgMastery = Math.round(rawAvg * Math.sqrt(Math.min(coverage, 1)));

    stats.weakestTopics = Object.entries(topicData)
      .map(([key, d]) => ({
        topic: key.split("|")[1],
        hf: d.hf,
        avgMastery: Math.round(d.sum / d.count),
      }))
      .sort((a, b) => a.avgMastery - b.avgMastery)
      .slice(0, 5);

    return stats;
  }, [progress]);

  const getQuestionMastery = useCallback((questionId: string) => {
    const p = progress.get(questionId);
    if (!p) return null;
    const m = p.mastery ?? 0;
    const c = p.confidence ?? 0.5;
    return {
      mastery: m,
      confidence: c,
      effective: Math.round(getEffectiveMastery(m, c)),
      attempts: p.timesCorrect + p.timesWrong,
    };
  }, [progress]);

  return (
    <ProgressContext.Provider
      value={{
        progress, loading, recordAnswer,
        getDueQuestions, getNewQuestions, getWeakQuestions, getSmartQuestions, getStreakBuildQuestions,
        getHFProgress, getOverallProgress, getMasteryStats, getQuestionMastery,
      }}
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
