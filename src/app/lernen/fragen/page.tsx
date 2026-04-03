"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
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
import { Input } from "@/components/ui/input";
import { HANDLUNGSFELDER, type Handlungsfeld } from "@/lib/types";
import { getQuestionsByHF } from "@/lib/questions";
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  BookOpen,
  ArrowUpDown,
  Play,
  Eye,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

function getMasteryColor(m: number) {
  if (m >= 80) return "text-success";
  if (m >= 60) return "text-emerald-400";
  if (m >= 40) return "text-warning";
  if (m >= 20) return "text-orange-500";
  return "text-destructive";
}

function getMasteryBg(m: number) {
  if (m >= 80) return "bg-success/15 border-success/30";
  if (m >= 60) return "bg-emerald-400/15 border-emerald-400/30";
  if (m >= 40) return "bg-warning/15 border-warning/30";
  if (m >= 20) return "bg-orange-500/15 border-orange-500/30";
  return "bg-destructive/15 border-destructive/30";
}

function FragenContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, stats, updateStats, loading } = useAuth();
  const { progress, getQuestionMastery, recordAnswer } = useProgress();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "mastered" | "weak" | "new">("all");
  const [sortBy, setSortBy] = useState<"default" | "mastery-asc" | "mastery-desc">("default");
  const [viewMode, setViewMode] = useState<"browse" | "practice">("browse");

  // Practice mode state
  const [practiceQuestionId, setPracticeQuestionId] = useState<string | null>(null);
  const [practiceIdx, setPracticeIdx] = useState(0);

  const hf = (searchParams.get("hf") ?? "HF1") as Handlungsfeld;
  const hfInfo = HANDLUNGSFELDER[hf];
  const allQuestions = getQuestionsByHF(hf);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  // Filter + Sort
  const processed = allQuestions
    .filter((q) => {
      if (search) {
        const s = search.toLowerCase();
        if (
          !q.prompt.toLowerCase().includes(s) &&
          !q.topic.toLowerCase().includes(s) &&
          !(q.context?.toLowerCase().includes(s)) &&
          !q.options?.some((o) => o.toLowerCase().includes(s))
        ) return false;
      }
      const m = getQuestionMastery(q.id);
      if (filter === "mastered" && (!m || m.mastery < 80)) return false;
      if (filter === "weak" && (!m || m.mastery >= 60)) return false;
      if (filter === "new" && m) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "default") return 0;
      const ma = getQuestionMastery(a.id)?.effective ?? -1;
      const mb = getQuestionMastery(b.id)?.effective ?? -1;
      return sortBy === "mastery-asc" ? ma - mb : mb - ma;
    });

  const masteredCount = allQuestions.filter((q) => { const m = getQuestionMastery(q.id); return m && m.mastery >= 80; }).length;
  const weakCount = allQuestions.filter((q) => { const m = getQuestionMastery(q.id); return m && m.mastery < 60; }).length;
  const newCount = allQuestions.filter((q) => !getQuestionMastery(q.id)).length;

  // Practice mode: handle answer
  const handlePracticeAnswer = useCallback(async (correct: boolean, responseTime: number) => {
    if (!practiceQuestionId) return;
    await recordAnswer(practiceQuestionId, correct, responseTime);

    // XP
    const xp = correct ? 10 : 2;
    await updateStats({
      xp: (stats?.xp ?? 0) + xp,
      totalQuestionsAnswered: (stats?.totalQuestionsAnswered ?? 0) + 1,
      totalCorrect: (stats?.totalCorrect ?? 0) + (correct ? 1 : 0),
      dailyGoalProgress: (stats?.dailyGoalProgress ?? 0) + 1,
      lastActiveDate: new Date().toISOString().split("T")[0],
    });
  }, [practiceQuestionId, recordAnswer, stats, updateStats]);

  // Start practicing a specific question
  const startPractice = (questionId: string) => {
    const idx = processed.findIndex((q) => q.id === questionId);
    setPracticeQuestionId(questionId);
    setPracticeIdx(idx >= 0 ? idx : 0);
    setExpandedId(null);
  };

  // Navigate in practice mode
  const practiceNext = () => {
    const nextIdx = practiceIdx + 1;
    if (nextIdx < processed.length) {
      setPracticeIdx(nextIdx);
      setPracticeQuestionId(processed[nextIdx].id);
    } else {
      setPracticeQuestionId(null); // Back to list
    }
  };

  const practicePrev = () => {
    const prevIdx = practiceIdx - 1;
    if (prevIdx >= 0) {
      setPracticeIdx(prevIdx);
      setPracticeQuestionId(processed[prevIdx].id);
    }
  };

  // Get current practice question
  const practiceQuestion = practiceQuestionId
    ? allQuestions.find((q) => q.id === practiceQuestionId)
    : null;

  // ═══ Practice Mode: Single Question View ═══
  if (practiceQuestion) {
    return (
      <div className="min-h-screen pb-24 md:pb-6">
        <NavBar />
        <main className="max-w-2xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setPracticeQuestionId(null)}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Zurück zur Liste
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {practiceIdx + 1} / {processed.length}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <QuestionCard
              key={practiceQuestion.id}
              question={practiceQuestion}
              onAnswer={handlePracticeAnswer}
              questionNumber={practiceIdx + 1}
              totalQuestions={processed.length}
              questionStreak={progress.get(practiceQuestion.id)?.streak ?? 0}
            />
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={practicePrev}
              disabled={practiceIdx === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={practiceNext}
              className="rounded-xl"
            >
              {practiceIdx + 1 < processed.length ? (
                <>Nächste Frage <ChevronRight className="ml-1 h-4 w-4" /></>
              ) : (
                "Fertig"
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={practiceNext}
              disabled={practiceIdx >= processed.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // ═══ Browse/List View ═══
  return (
    <div className="min-h-screen pb-24 md:pb-6">
      <NavBar />
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/lernen">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{hf}</Badge>
              <h1 className="text-base font-bold truncate">{hfInfo.title}</h1>
            </div>
            <p className="text-xs text-muted-foreground">{allQuestions.length} Fragen · {hfInfo.subtitle}</p>
          </div>
        </div>

        {/* Mode Toggle + Alle üben */}
        <div className="flex gap-2">
          <div className="flex gap-1 p-1 bg-muted/30 rounded-xl flex-1">
            <button
              onClick={() => setViewMode("browse")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer",
                viewMode === "browse" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground",
              )}
            >
              <Eye className="h-3 w-3" />
              Nachschlagen
            </button>
            <button
              onClick={() => setViewMode("practice")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer",
                viewMode === "practice" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground",
              )}
            >
              <Play className="h-3 w-3" />
              Üben
            </button>
          </div>
          <Button
            size="sm"
            className="rounded-xl text-xs shrink-0 h-auto"
            onClick={() => {
              setPracticeIdx(0);
              setPracticeQuestionId(processed[0]?.id ?? null);
            }}
            disabled={processed.length === 0}
          >
            <Zap className="mr-1 h-3 w-3" />
            Alle üben
          </Button>
        </div>

        {/* Search + Filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Fragen durchsuchen..." className="pl-9" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { key: "all" as const, label: "Alle", count: allQuestions.length },
              { key: "new" as const, label: "Neu", count: newCount },
              { key: "weak" as const, label: "Schwach", count: weakCount },
              { key: "mastered" as const, label: "Gemeistert", count: masteredCount },
            ].map((f) => (
              <Button key={f.key} variant={filter === f.key ? "default" : "outline"} size="sm" className="rounded-full text-xs shrink-0 h-7 px-3" onClick={() => setFilter(f.key)}>
                {f.label} ({f.count})
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-xs shrink-0 h-7 px-2.5 ml-auto"
              onClick={() => setSortBy((prev) => prev === "default" ? "mastery-asc" : prev === "mastery-asc" ? "mastery-desc" : "default")}
            >
              <ArrowUpDown className="h-3 w-3 mr-1" />
              {sortBy === "mastery-asc" ? "Score ↑" : sortBy === "mastery-desc" ? "Score ↓" : "Standard"}
            </Button>
          </div>
        </div>

        {/* Question List */}
        <div className="space-y-2">
          {processed.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Keine Fragen gefunden</p>
            </div>
          )}

          <AnimatePresence>
            {processed.map((q, idx) => {
              const mastery = getQuestionMastery(q.id);
              const p = progress.get(q.id);
              const isExpanded = expandedId === q.id && viewMode === "browse";

              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                >
                  <Card
                    className={cn(
                      "border-border/30 bg-card/50 cursor-pointer transition-all hover:border-primary/30",
                      isExpanded && "ring-1 ring-primary/20",
                    )}
                    onClick={() => {
                      if (viewMode === "practice") {
                        startPractice(q.id);
                      } else {
                        setExpandedId(isExpanded ? null : q.id);
                      }
                    }}
                  >
                    <CardContent className="p-3.5">
                      <div className="flex items-start gap-2.5">
                        {/* Mastery Circle */}
                        {mastery ? (
                          <div className={cn("shrink-0 h-9 w-9 rounded-full flex flex-col items-center justify-center border", getMasteryBg(mastery.mastery))}>
                            <span className={cn("text-[11px] font-bold leading-none", getMasteryColor(mastery.mastery))}>{mastery.mastery}</span>
                            <span className="text-[7px] text-muted-foreground leading-none mt-0.5">{mastery.attempts}x</span>
                          </div>
                        ) : (
                          <div className="shrink-0 h-9 w-9 rounded-full flex items-center justify-center border border-muted/50 bg-muted/20">
                            <span className="text-[10px] text-muted-foreground">neu</span>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug">
                            {q.prompt.substring(0, 100)}{q.prompt.length > 100 ? "..." : ""}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="secondary" className="text-[9px]">{q.topic}</Badge>
                            {p && <span className="text-[9px] text-muted-foreground">{p.timesCorrect}✓ {p.timesWrong}✗</span>}
                          </div>
                        </div>

                        {viewMode === "practice" ? (
                          <Play className="h-4 w-4 text-primary shrink-0 mt-1" />
                        ) : isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </div>

                      {/* Expanded: Browse mode only */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 pt-3 border-t border-border/30 space-y-3">
                              {q.context && (
                                <div className="rounded-lg bg-muted/30 p-2.5 text-xs text-muted-foreground italic">{q.context}</div>
                              )}

                              <p className="text-sm font-medium">{q.prompt}</p>

                              {q.type === "open" ? (
                                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                                  <p className="text-[10px] font-medium text-primary mb-1.5">Musterantwort</p>
                                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{q.solution || q.explanation}</p>
                                  {q.solutionPoints && q.solutionPoints.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {q.solutionPoints.map((pt) => <Badge key={pt} variant="secondary" className="text-[9px]">{pt}</Badge>)}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-1.5">
                                  {q.options?.map((opt, i) => (
                                    <div key={i} className={cn("flex items-start gap-2 text-xs p-2 rounded-lg", i === q.correctAnswer ? "bg-success/10 border border-success/20" : "bg-muted/20")}>
                                      <span className={cn("shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-medium", i === q.correctAnswer ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground")}>
                                        {i === q.correctAnswer ? <CheckCircle2 className="h-3 w-3" /> : String.fromCharCode(65 + i)}
                                      </span>
                                      <span className="flex-1 leading-relaxed">{opt}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {q.explanation && (
                                <div className="rounded-lg bg-primary/5 border border-primary/10 p-2.5">
                                  <div className="flex items-start gap-2">
                                    <Lightbulb className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                                    <p className="text-xs text-muted-foreground leading-relaxed">{q.explanation}</p>
                                  </div>
                                </div>
                              )}

                              {/* Üben-Button im Browse-Modus */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full rounded-xl text-xs"
                                onClick={(e) => { e.stopPropagation(); startPractice(q.id); }}
                              >
                                <Play className="mr-1.5 h-3.5 w-3.5" />
                                Diese Frage üben
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function FragenPage() {
  return (
    <Suspense>
      <FragenContent />
    </Suspense>
  );
}
