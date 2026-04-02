"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useProgress } from "@/lib/progress-context";
import { NavBar } from "@/components/nav-bar";
import { ProgressRing } from "@/components/progress-ring";
import { AnimatedCounter } from "@/components/animated-counter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HANDLUNGSFELDER, type Handlungsfeld } from "@/lib/types";
import Link from "next/link";
import { BarChart3, Zap, Flame, BookOpen, CheckCircle2 } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function getMasteryColor(m: number) {
  if (m >= 80) return "text-success";
  if (m >= 60) return "text-emerald-400";
  if (m >= 40) return "text-warning";
  if (m >= 20) return "text-orange-500";
  return "text-destructive";
}

function getMasteryBarColor(m: number) {
  if (m >= 80) return "bg-success";
  if (m >= 60) return "bg-emerald-400";
  if (m >= 40) return "bg-warning";
  if (m >= 20) return "bg-orange-500";
  return "bg-destructive";
}

function getMasteryLabel(m: number) {
  if (m >= 80) return "Prüfungsreif!";
  if (m >= 60) return "Fast geschafft!";
  if (m >= 40) return "Auf gutem Weg";
  if (m >= 20) return "Weitermachen!";
  return "Los geht's!";
}

export default function StatistikPage() {
  const { user, stats, loading } = useAuth();
  const { getHFProgress, progress, getMasteryStats } = useProgress();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  const ms = getMasteryStats();
  const totalAnswered = stats?.totalQuestionsAnswered ?? 0;
  const totalCorrect = stats?.totalCorrect ?? 0;
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  const hfData = (["HF1", "HF2", "HF3", "HF4"] as Handlungsfeld[]).map((hf) => {
    const p = getHFProgress(hf);
    const pct = p.total > 0 ? Math.round(((p.mastered + p.inProgress) / p.total) * 100) : 0;
    return { hf, ...HANDLUNGSFELDER[hf], pct, mastered: p.mastered, total: p.total };
  });

  const weakestHF = hfData.reduce((a, b) => (a.pct < b.pct ? a : b));

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <NavBar />
      <motion.main variants={container} initial="hidden" animate="show" className="max-w-lg mx-auto px-4 md:px-6 py-6 space-y-5">

        {/* ═══ Dein Lern-Score — THE ONE NUMBER ═══ */}
        <motion.div variants={item}>
          <Card className="border-border/30 bg-card/50 backdrop-blur-xl overflow-hidden">
            <CardContent className="p-6 relative">
              {/* Glow */}
              <motion.div
                className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-3xl pointer-events-none"
                style={{ background: `radial-gradient(circle, ${ms.avgMastery >= 60 ? "rgba(52,211,153,0.25)" : ms.avgMastery >= 30 ? "rgba(234,179,8,0.2)" : "rgba(239,68,68,0.15)"}, transparent)` }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.45, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
              />

              <div className="relative flex items-center gap-6">
                <ProgressRing progress={ms.avgMastery} size={130} strokeWidth={10}>
                  <div className="text-center">
                    <motion.span
                      className={cn("text-4xl font-black", getMasteryColor(ms.avgMastery))}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                    >
                      <AnimatedCounter value={ms.avgMastery} />
                    </motion.span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Lern-Score</p>
                  </div>
                </ProgressRing>

                <div className="space-y-1.5">
                  <p className="text-lg font-bold">{getMasteryLabel(ms.avgMastery)}</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p><strong className="text-foreground">{progress.size}</strong> von {ms.totalQuestions} Fragen bearbeitet</p>
                    <p><strong className="text-foreground">{accuracy}%</strong> richtig beantwortet</p>
                    {(stats?.currentStreak ?? 0) > 0 && (
                      <p className="flex items-center gap-1">
                        <Flame className="h-3 w-3 text-orange-400" />
                        <strong className="text-foreground">{stats?.currentStreak}</strong> Tage Streak
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══ 4 HF Fortschrittsbalken — SIMPLE ═══ */}
        <motion.div variants={item}>
          <Card className="border-border/30 bg-card/50 backdrop-blur-lg">
            <CardContent className="p-5 space-y-4">
              <p className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Themenbereiche
              </p>

              {hfData.map(({ hf, title, pct, mastered, total }) => (
                <div key={hf} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px] h-5 px-1.5">{hf}</Badge>
                      <span className="text-xs font-medium">{title}</span>
                    </div>
                    <span className={cn("text-sm font-bold tabular-nums", getMasteryColor(pct))}>
                      {pct}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                      className={cn("h-full rounded-full", getMasteryBarColor(pct))}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                    <CheckCircle2 className="h-2.5 w-2.5 text-success" />
                    {mastered} gemeistert
                    <span className="ml-auto">{total} Fragen</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══ Schwäche + Aktion — ONE CTA ═══ */}
        {progress.size > 0 && weakestHF.pct < 60 && (
          <motion.div variants={item}>
            <Card className="border-primary/20 bg-primary/5 backdrop-blur-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Empfehlung</p>
                    <p className="text-xs text-muted-foreground">
                      <strong>{weakestHF.title}</strong> ist dein schwächstes Thema ({weakestHF.pct}%)
                    </p>
                  </div>
                </div>
                <Link href={`/lernen?hf=${weakestHF.hf}`}>
                  <Button className="w-full mt-3 rounded-xl">
                    <Zap className="mr-1.5 h-4 w-4" />
                    {weakestHF.title} jetzt üben
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ═══ Mastery-Verteilung — SIMPLE VISUAL ═══ */}
        {progress.size > 5 && (
          <motion.div variants={item}>
            <Card className="border-border/30 bg-card/50 backdrop-blur-lg">
              <CardContent className="p-5">
                <p className="text-sm font-semibold mb-3">Deine Fragen</p>

                {/* Stacked bar */}
                <div className="h-6 rounded-full overflow-hidden flex bg-muted/30">
                  {[
                    { count: ms.mastered, color: "bg-success", label: "Gemeistert" },
                    { count: ms.secure, color: "bg-emerald-400", label: "Sicher" },
                    { count: ms.learning, color: "bg-warning", label: "Lernend" },
                    { count: ms.beginner, color: "bg-orange-500", label: "Anfänger" },
                    { count: ms.unknown, color: "bg-destructive", label: "Unsicher" },
                  ].filter((d) => d.count > 0).map((d) => (
                    <motion.div
                      key={d.label}
                      initial={{ width: 0 }}
                      animate={{ width: `${(d.count / ms.totalQuestions) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={cn("h-full", d.color)}
                      title={`${d.label}: ${d.count}`}
                    />
                  ))}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 justify-center">
                  {[
                    { count: ms.mastered, color: "bg-success", label: "Gemeistert" },
                    { count: ms.secure, color: "bg-emerald-400", label: "Sicher" },
                    { count: ms.learning, color: "bg-warning", label: "Lernend" },
                    { count: ms.beginner + ms.unknown, color: "bg-orange-500", label: "Schwach" },
                    { count: ms.notStarted, color: "bg-muted", label: "Offen" },
                  ].filter((d) => d.count > 0).map((d) => (
                    <div key={d.label} className="flex items-center gap-1">
                      <div className={cn("h-2 w-2 rounded-full", d.color)} />
                      <span className="text-[9px] text-muted-foreground">{d.label} ({d.count})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.main>
    </div>
  );
}
