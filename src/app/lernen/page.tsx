"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useProgress } from "@/lib/progress-context";
import { NavBar } from "@/components/nav-bar";
import { QuestionCard } from "@/components/question-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { HANDLUNGSFELDER, type Handlungsfeld, type SessionMode, LEVELS } from "@/lib/types";
import { getQuestionById } from "@/lib/questions";
import {
  Zap,
  BookOpen,
  Brain,
  ClipboardCheck,
  Trophy,
  Flame,
  Target,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { BookOpen as BookOpenIcon } from "lucide-react";

function LernenContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, stats, updateStats, loading: authLoading } = useAuth();
  const { getDueQuestions, getNewQuestions, getWeakQuestions, recordAnswer } = useProgress();

  const [mode, setMode] = useState<SessionMode | null>(null);
  const [selectedHF, setSelectedHF] = useState<Handlungsfeld | undefined>(undefined);
  const [sessionQuestions, setSessionQuestions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionWrong, setSessionWrong] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [streak, setStreak] = useState(0);
  const [sessionStartTime] = useState(Date.now());
  const [examTimer, setExamTimer] = useState(60 * 60); // 60 min in seconds

  // Parse URL params
  useEffect(() => {
    const hfParam = searchParams.get("hf") as Handlungsfeld | null;
    const modeParam = searchParams.get("mode") as SessionMode | null;
    if (hfParam && Object.keys(HANDLUNGSFELDER).includes(hfParam)) {
      setSelectedHF(hfParam);
    }
    if (modeParam) {
      setMode(modeParam);
    }
  }, [searchParams]);

  // Auto-start session if mode + HF are set
  useEffect(() => {
    if (mode && sessionQuestions.length === 0) {
      startSession(mode, selectedHF);
    }
  }, [mode, selectedHF]); // eslint-disable-line react-hooks/exhaustive-deps

  const startSession = useCallback((sessionMode: SessionMode, hf?: Handlungsfeld) => {
    let questionIds: string[] = [];

    switch (sessionMode) {
      case "spaced": {
        const due = getDueQuestions(hf);
        const newQ = getNewQuestions(hf, 10);
        questionIds = [...due.slice(0, 15), ...newQ].slice(0, 20);
        break;
      }
      case "handlungsfeld": {
        const due = getDueQuestions(hf);
        const newQ = getNewQuestions(hf, 20);
        questionIds = [...due, ...newQ].slice(0, 20);
        break;
      }
      case "weakTopics": {
        questionIds = getWeakQuestions(20);
        break;
      }
      case "exam": {
        // Prüfungs-Simulation: 30 zufällige Fragen aus ALLEN Typen (MC + Open)
        const all = getNewQuestions(undefined, 200);
        const due = getDueQuestions();
        const combined = [...new Set([...all, ...due])];
        questionIds = combined.sort(() => Math.random() - 0.5).slice(0, 30);
        break;
      }
    }

    // Fallback: if no due/weak questions, get new ones
    if (questionIds.length === 0) {
      questionIds = getNewQuestions(hf, 20);
    }

    setSessionQuestions(questionIds);
    setCurrentIndex(0);
    setSessionCorrect(0);
    setSessionWrong(0);
    setSessionXP(0);
    setSessionComplete(false);
    setStreak(0);
    setMode(sessionMode);
  }, [getDueQuestions, getNewQuestions, getWeakQuestions]);

  const handleAnswer = useCallback(async (correct: boolean, responseTime: number, partial?: boolean) => {
    const questionId = sessionQuestions[currentIndex];
    await recordAnswer(questionId, correct, responseTime);

    // XP calculation – partial answers get half XP
    let xp = correct ? (partial ? 5 : 10) : 2;
    if (correct && !partial && responseTime < 10) xp += 3; // Speed bonus
    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak >= 20) xp = Math.round(xp * 3);
      else if (newStreak >= 10) xp = Math.round(xp * 2);
      else if (newStreak >= 5) xp = Math.round(xp * 1.5);
    } else {
      setStreak(0);
    }

    setSessionXP((prev) => prev + xp);
    if (correct) setSessionCorrect((prev) => prev + 1);
    else setSessionWrong((prev) => prev + 1);

    // Move to next or finish
    if (currentIndex + 1 >= sessionQuestions.length) {
      setSessionComplete(true);
      // Update user stats
      const totalAnswered = sessionCorrect + sessionWrong + 1;
      await updateStats({
        xp: (stats?.xp ?? 0) + sessionXP + xp,
        totalQuestionsAnswered: (stats?.totalQuestionsAnswered ?? 0) + totalAnswered,
        totalCorrect: (stats?.totalCorrect ?? 0) + sessionCorrect + (correct ? 1 : 0),
        dailyGoalProgress: (stats?.dailyGoalProgress ?? 0) + totalAnswered,
        lastActiveDate: new Date().toISOString().split("T")[0],
      });
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [sessionQuestions, currentIndex, recordAnswer, streak, stats, updateStats, sessionCorrect, sessionWrong, sessionXP]);

  const currentQuestion = useMemo(() => {
    if (sessionQuestions.length === 0) return null;
    return getQuestionById(sessionQuestions[currentIndex]);
  }, [sessionQuestions, currentIndex]);

  // Exam timer – ticks every second
  useEffect(() => {
    if (mode !== "exam" || sessionComplete) return;
    const interval = setInterval(() => {
      setExamTimer((prev) => {
        if (prev <= 1) {
          setSessionComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [mode, sessionComplete]);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  if (authLoading || !user) return null;

  // Mode Selection Screen
  if (!mode) {
    return (
      <div className="min-h-screen pb-20 md:pb-6">
        <NavBar />
        <main className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Wie möchtest du lernen?</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Wähle einen Modus und leg los
            </p>
          </div>

          <div className="grid gap-4">
            {[
              {
                mode: "spaced" as SessionMode,
                icon: Zap,
                title: "Tägliches Lernen",
                desc: "Die App wählt die richtigen Fragen für dich aus (empfohlen)",
                accent: "text-primary",
              },
              {
                mode: "weakTopics" as SessionMode,
                icon: Brain,
                title: "Unsichere Fragen üben",
                desc: "Wiederhole Fragen die du oft falsch beantwortest",
                accent: "text-orange-500",
              },
            ].map((opt) => (
              <Card
                key={opt.mode}
                className="border-border/50 hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => startSession(opt.mode)}
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <opt.icon className={`h-6 w-6 ${opt.accent}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{opt.title}</h3>
                    <p className="text-muted-foreground text-xs mt-0.5">{opt.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">Nach Themenbereich</h2>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(HANDLUNGSFELDER) as [Handlungsfeld, typeof HANDLUNGSFELDER.HF1][]).map(
                ([hf, info]) => (
                  <Card
                    key={hf}
                    className="border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                  >
                    <CardContent className="p-4 text-center space-y-2">
                      <Badge variant="outline" className="mb-1">{hf}</Badge>
                      <p className="text-xs font-medium">{info.title}</p>
                      <div className="flex gap-1.5 justify-center pt-1">
                        <Button
                          size="sm"
                          className="text-[10px] h-7 px-2.5 rounded-lg"
                          onClick={() => {
                            setSelectedHF(hf);
                            startSession("handlungsfeld", hf);
                          }}
                        >
                          <Zap className="mr-1 h-3 w-3" />
                          Üben
                        </Button>
                        <Link href={`/lernen/fragen?hf=${hf}`}>
                          <Button variant="outline" size="sm" className="text-[10px] h-7 px-2.5 rounded-lg">
                            <BookOpen className="mr-1 h-3 w-3" />
                            Fragen
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Session Complete Screen
  if (sessionComplete) {
    const totalAnswered = sessionCorrect + sessionWrong;
    const accuracy = totalAnswered > 0 ? Math.round((sessionCorrect / totalAnswered) * 100) : 0;
    const timeSpent = Math.round((Date.now() - sessionStartTime) / 1000);
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;
    const isExamResult = mode === "exam";
    const examPassed = accuracy >= 50;

    return (
      <div className="min-h-screen pb-20 md:pb-6">
        <NavBar />
        <main className="max-w-lg mx-auto px-4 md:px-6 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <Card className="border-border/50 text-center overflow-hidden">
              <div className={`h-2 ${isExamResult ? (examPassed ? "bg-gradient-to-r from-success via-success to-primary" : "bg-gradient-to-r from-destructive via-destructive to-orange-500") : "bg-gradient-to-r from-primary via-success to-xp"}`} />
              <CardContent className="p-8 space-y-6">
                <div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="text-6xl mb-3"
                  >
                    {isExamResult
                      ? (examPassed ? "🎓" : "📝")
                      : (accuracy >= 90 ? "🌟" : accuracy >= 70 ? "🎯" : accuracy >= 50 ? "💪" : "📚")}
                  </motion.div>
                  <h1 className="text-xl font-bold">
                    {isExamResult
                      ? (examPassed ? "Prüfung bestanden!" : "Nicht bestanden")
                      : "Session abgeschlossen!"}
                  </h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    {isExamResult
                      ? (examPassed
                          ? `${accuracy}% – Glückwunsch! Du hast die Prüfungs-Simulation bestanden.`
                          : `${accuracy}% – Zum Bestehen werden 50% benötigt. Lerne weiter!`)
                      : (accuracy >= 90 ? "Hervorragend! Du bist auf dem besten Weg zum Meister!" :
                         accuracy >= 70 ? "Gut gemacht! Weiter so!" :
                         accuracy >= 50 ? "Nicht schlecht, aber da geht noch mehr!" :
                         "Übung macht den Meister – bleib dran!")}
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-success/10 p-4">
                    <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-1" />
                    <p className="text-2xl font-bold text-success">{sessionCorrect}</p>
                    <p className="text-xs text-muted-foreground">Richtig</p>
                  </div>
                  <div className="rounded-xl bg-destructive/10 p-4">
                    <XCircle className="h-5 w-5 text-destructive mx-auto mb-1" />
                    <p className="text-2xl font-bold text-destructive">{sessionWrong}</p>
                    <p className="text-xs text-muted-foreground">Falsch</p>
                  </div>
                  <div className="rounded-xl bg-xp/10 p-4">
                    <Trophy className="h-5 w-5 text-xp mx-auto mb-1" />
                    <p className="text-2xl font-bold text-xp">+{sessionXP}</p>
                    <p className="text-xs text-muted-foreground">XP verdient</p>
                  </div>
                  <div className="rounded-xl bg-muted p-4">
                    <Target className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-2xl font-bold">{accuracy}%</p>
                    <p className="text-xs text-muted-foreground">Genauigkeit</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Zeit: {minutes}:{seconds.toString().padStart(2, "0")} min
                </p>

                <div className="flex flex-col gap-2">
                  {sessionWrong > 0 && (
                    <Button
                      className="w-full rounded-xl"
                      variant="outline"
                      onClick={() => {
                        // Filter to only wrong questions from this session
                        const wrongIds = sessionQuestions.filter((qid, idx) => {
                          // We can't track per-question, so restart with weak
                          return true;
                        });
                        setMode(null);
                        setTimeout(() => startSession("weakTopics"), 100);
                      }}
                    >
                      <Brain className="mr-2 h-4 w-4" />
                      Fehler wiederholen
                    </Button>
                  )}
                  <div className="flex gap-2">
                    <Link href="/" className="flex-1">
                      <Button variant="outline" className="w-full">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Home
                      </Button>
                    </Link>
                    <Button className="flex-1" onClick={() => {
                      setMode(null);
                      setSessionQuestions([]);
                      setSessionComplete(false);
                    }}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Weiter lernen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    );
  }

  // Active Session
  if (!currentQuestion) {
    return (
      <div className="min-h-screen pb-20 md:pb-6">
        <NavBar />
        <main className="max-w-lg mx-auto px-4 md:px-6 py-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold">Keine Fragen verfügbar</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Es gibt gerade keine Fragen für diesen Modus.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => setMode(null)}>
            Zurück zur Auswahl
          </Button>
        </main>
      </div>
    );
  }

  const progressPercent = ((currentIndex + 1) / sessionQuestions.length) * 100;
  const isExam = mode === "exam";
  const examMinutes = Math.floor(examTimer / 60);
  const examSeconds = examTimer % 60;
  const examUrgent = examTimer < 300; // under 5 min

  return (
    <div className="min-h-screen pb-6">
      <NavBar hideOnMobile />
      <main className="max-w-2xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4">
        {/* Session Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setMode(null)}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {isExam ? "Abbrechen" : "Zurück"}
          </Button>
          <div className="flex items-center gap-3">
            {isExam ? (
              <>
                <Badge variant="destructive" className="gap-1 text-xs">
                  <ClipboardCheck className="h-3 w-3" />
                  Prüfung
                </Badge>
                <Badge variant={examUrgent ? "destructive" : "outline"} className={cn("gap-1 text-xs tabular-nums", examUrgent && "animate-pulse")}>
                  {examMinutes}:{examSeconds.toString().padStart(2, "0")}
                </Badge>
              </>
            ) : (
              <>
                {streak >= 3 && (
                  <Badge variant="secondary" className="gap-1">
                    <Flame className="h-3 w-3 text-orange-500" />
                    {streak}x Streak
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1">
                  <Trophy className="h-3 w-3 text-xp" />
                  +{sessionXP} XP
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <Progress value={progressPercent} className={cn("h-1.5", isExam && "[&>div]:bg-destructive")} />

        {/* Question */}
        <AnimatePresence mode="wait">
          <QuestionCard
            key={currentQuestion.id}
            question={currentQuestion}
            onAnswer={handleAnswer}
            questionNumber={currentIndex + 1}
            totalQuestions={sessionQuestions.length}
            examMode={isExam}
          />
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function LernenPage() {
  return (
    <Suspense>
      <LernenContent />
    </Suspense>
  );
}
