"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useProgress } from "@/lib/progress-context";
import { NavBar } from "@/components/nav-bar";
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
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

function FragenContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { progress } = useProgress();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "mastered" | "inProgress" | "new">("all");

  const hf = (searchParams.get("hf") ?? "HF1") as Handlungsfeld;
  const hfInfo = HANDLUNGSFELDER[hf];
  const allQuestions = getQuestionsByHF(hf);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  // Filter questions
  const filtered = allQuestions.filter((q) => {
    // Search filter
    if (search) {
      const s = search.toLowerCase();
      if (
        !q.prompt.toLowerCase().includes(s) &&
        !q.topic.toLowerCase().includes(s) &&
        !(q.context?.toLowerCase().includes(s)) &&
        !q.options?.some((o) => o.toLowerCase().includes(s))
      ) {
        return false;
      }
    }

    // Status filter
    const p = progress.get(q.id);
    if (filter === "mastered" && (!p || p.box < 5)) return false;
    if (filter === "inProgress" && (!p || p.box >= 5 || p.box === 0)) return false;
    if (filter === "new" && p) return false;

    return true;
  });

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

        {/* Search + Filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Fragen durchsuchen..."
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { key: "all" as const, label: "Alle", count: allQuestions.length },
              { key: "new" as const, label: "Neu", count: allQuestions.filter((q) => !progress.has(q.id)).length },
              { key: "inProgress" as const, label: "In Arbeit", count: allQuestions.filter((q) => { const p = progress.get(q.id); return p && p.box > 0 && p.box < 5; }).length },
              { key: "mastered" as const, label: "Gemeistert", count: allQuestions.filter((q) => { const p = progress.get(q.id); return p && p.box >= 5; }).length },
            ].map((f) => (
              <Button
                key={f.key}
                variant={filter === f.key ? "default" : "outline"}
                size="sm"
                className="rounded-full text-xs shrink-0 h-7 px-3"
                onClick={() => setFilter(f.key)}
              >
                {f.label} ({f.count})
              </Button>
            ))}
          </div>
        </div>

        {/* Question List */}
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Keine Fragen gefunden</p>
            </div>
          )}

          <AnimatePresence>
            {filtered.map((q, idx) => {
              const p = progress.get(q.id);
              const isExpanded = expandedId === q.id;
              const status = !p ? "new" : p.box >= 5 ? "mastered" : "inProgress";

              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                >
                  <Card
                    className={`border-border/30 bg-card/50 backdrop-blur-lg cursor-pointer transition-all hover:border-primary/30 ${
                      isExpanded ? "ring-1 ring-primary/20" : ""
                    }`}
                    onClick={() => setExpandedId(isExpanded ? null : q.id)}
                  >
                    <CardContent className="p-3.5">
                      {/* Question Header */}
                      <div className="flex items-start gap-2.5">
                        <div className={`shrink-0 mt-0.5 ${
                          status === "mastered" ? "text-success" :
                          status === "inProgress" ? "text-warning" :
                          "text-muted-foreground/40"
                        }`}>
                          {status === "mastered" ? <CheckCircle2 className="h-4 w-4" /> :
                           status === "inProgress" ? <Clock className="h-4 w-4" /> :
                           <div className="h-4 w-4 rounded-full border border-current" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug">
                            {q.context ? `${q.context.substring(0, 60)}... – ` : ""}
                            {q.prompt}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="secondary" className="text-[9px]">{q.topic}</Badge>
                            {p && (
                              <span className="text-[9px] text-muted-foreground">
                                {p.timesCorrect}✓ {p.timesWrong}✗
                              </span>
                            )}
                          </div>
                        </div>

                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </div>

                      {/* Expanded Content */}
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
                              {/* Full context */}
                              {q.context && (
                                <div className="rounded-lg bg-muted/30 p-2.5 text-xs text-muted-foreground italic">
                                  {q.context}
                                </div>
                              )}

                              {/* Options */}
                              <div className="space-y-1.5">
                                {q.options?.map((opt, i) => (
                                  <div
                                    key={i}
                                    className={`flex items-start gap-2 text-xs p-2 rounded-lg ${
                                      i === q.correctAnswer
                                        ? "bg-success/10 border border-success/20"
                                        : "bg-muted/20"
                                    }`}
                                  >
                                    <span className={`shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-medium ${
                                      i === q.correctAnswer
                                        ? "bg-success text-success-foreground"
                                        : "bg-muted text-muted-foreground"
                                    }`}>
                                      {i === q.correctAnswer ? <CheckCircle2 className="h-3 w-3" /> : String.fromCharCode(65 + i)}
                                    </span>
                                    <span className="flex-1 leading-relaxed">{opt}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Explanation */}
                              <div className="rounded-lg bg-primary/5 border border-primary/10 p-2.5">
                                <div className="flex items-start gap-2">
                                  <Lightbulb className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                                  <p className="text-xs text-muted-foreground leading-relaxed">{q.explanation}</p>
                                </div>
                              </div>

                              {/* Tags */}
                              {q.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {q.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-[9px]">{tag}</Badge>
                                  ))}
                                </div>
                              )}
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
