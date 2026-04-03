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
import { questions } from "@/lib/questions";
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
    const hfQuestions = questions.filter((q) => q.handlungsfeld === hf);
    // Durchschnittlicher Mastery-Score für dieses HF
    let masterySum = 0;
    let started = 0;
    for (const q of hfQuestions) {
      const qp = progress.get(q.id);
      if (qp) {
        masterySum += qp.mastery ?? 0;
        started++;
      }
    }
    const avgMastery = started > 0 ? Math.round(masterySum / started) : 0;
    // Score = Mastery × √Coverage (gleiche Formel wie Gesamt-Score)
    const coverage = hfQuestions.length > 0 ? started / hfQuestions.length : 0;
    const hfScore = Math.round(avgMastery * Math.sqrt(Math.min(coverage, 1)));
    return { hf, ...HANDLUNGSFELDER[hf], score: hfScore, avgMastery, started, mastered: p.mastered, total: p.total };
  });

  const weakestHF = hfData.reduce((a, b) => (a.score < b.score ? a : b));

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <NavBar />
      <motion.main variants={container} initial="hidden" animate="show" className="max-w-lg mx-auto px-4 md:px-6 py-6 space-y-5">

        {/* ═══ Dein Lern-Score — THE ONE NUMBER ═══ */}
        <motion.div variants={item}>
          <Card className="border-border/30 bg-card/50 backdrop-blur-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
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
          <Card className="border-border/30 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-5 space-y-4">
              <p className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Themenbereiche
              </p>

              {hfData.map(({ hf, title, score, started, mastered, total }) => (
                <Link key={hf} href={`/lernen/fragen?hf=${hf}`}>
                  <div className="space-y-1.5 group cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] h-5 px-1.5">{hf}</Badge>
                        <span className="text-xs font-medium group-hover:text-primary transition-colors">{title}</span>
                      </div>
                      <span className={cn("text-lg font-black tabular-nums", getMasteryColor(score))}>
                        {score}
                      </span>
                    </div>
                    <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                        className={cn("h-full rounded-full", getMasteryBarColor(score))}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                      <CheckCircle2 className="h-2.5 w-2.5 text-success" />
                      {mastered} gemeistert
                      <span className="mx-1">·</span>
                      {started}/{total} bearbeitet
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══ Schwäche + Aktion — ONE CTA ═══ */}
        {progress.size > 0 && weakestHF.score < 60 && (
          <motion.div variants={item}>
            <Card className="border-primary/20 bg-primary/5 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Empfehlung</p>
                    <p className="text-xs text-muted-foreground">
                      <strong>{weakestHF.title}</strong> ist dein schwächstes Thema (Score: {weakestHF.score})
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
            <Card className="border-border/30 bg-card/50 backdrop-blur-sm">
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
        {/* ═══ VIBE Prüfungs-Hacks ═══ */}
        <motion.div variants={item}>
          <Card className="border-[#c29b62]/20 bg-gradient-to-br from-[#c29b62]/5 to-[#2dd4bf]/5 overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-[#c29b62]/60 via-[#2dd4bf]/60 to-[#c29b62]/60" />
            <CardContent className="p-4 space-y-4">
              <p className="text-xs font-bold bg-gradient-to-r from-[#c29b62] to-[#2dd4bf] bg-clip-text text-transparent text-center">
                Prüfungs-Hacks
              </p>

              {/* Hero: 52% Bestanden — animated gauge */}
              <div className="flex items-center justify-center">
                <div className="relative">
                  <ProgressRing progress={52} size={100} strokeWidth={8}>
                    <div className="text-center">
                      <motion.p
                        className="text-2xl font-black text-success"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.3 }}
                      >
                        52%
                      </motion.p>
                      <p className="text-[7px] text-muted-foreground">nur mit Hacks</p>
                    </div>
                  </ProgressRing>
                </div>
              </div>
              <p className="text-[10px] text-center text-muted-foreground">
                3 Schritte ohne Fachwissen = <strong className="text-success">Bestanden</strong> (50% nötig)
              </p>

              {/* 3 Steps — visual flow with animated entrance */}
              <div className="space-y-2">
                {[
                  {
                    step: 1,
                    icon: "🚫",
                    title: "Streiche Extremes",
                    words: ["nur", "immer", "nie", "stets"],
                    stat: "100% falsch",
                    statColor: "text-destructive",
                    bg: "from-destructive/10 to-destructive/5",
                    border: "border-destructive/20",
                    delay: 0.1,
                  },
                  {
                    step: 2,
                    icon: "❌",
                    title: "Streiche Verneinungen",
                    words: ["nicht", "kein", "keine"],
                    stat: "75% falsch",
                    statColor: "text-orange-500",
                    bg: "from-orange-500/10 to-orange-500/5",
                    border: "border-orange-500/20",
                    delay: 0.2,
                  },
                  {
                    step: 3,
                    icon: "📏",
                    title: "Nimm die Längste",
                    words: ["doppelt so lang = 93%"],
                    stat: "93% richtig",
                    statColor: "text-success",
                    bg: "from-success/10 to-success/5",
                    border: "border-success/20",
                    delay: 0.3,
                  },
                ].map((s) => (
                  <motion.div
                    key={s.step}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: s.delay }}
                    className={cn("rounded-xl border bg-gradient-to-r p-3 flex items-center gap-3", s.bg, s.border)}
                  >
                    <div className="h-10 w-10 rounded-full bg-background/60 flex items-center justify-center shrink-0">
                      <span className="text-lg">{s.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold">{s.title}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {s.words.map((w) => (
                          <span key={w} className="text-[8px] px-1.5 py-0.5 rounded bg-background/50 text-muted-foreground">{w}</span>
                        ))}
                      </div>
                    </div>
                    <p className={cn("text-sm font-black shrink-0", s.statColor)}>{s.stat.split(" ")[0]}</p>
                  </motion.div>
                ))}
              </div>

              {/* Fallen — red pills */}
              <div className="rounded-xl bg-destructive/5 border border-destructive/15 p-3">
                <p className="text-[9px] font-bold text-destructive mb-2 text-center">Fallen erkennen</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-black text-destructive">0%</p>
                    <p className="text-[8px] text-muted-foreground">&quot;grundsätzlich&quot;</p>
                  </div>
                  <div>
                    <p className="text-lg font-black text-destructive">10%</p>
                    <p className="text-[8px] text-muted-foreground">&quot;Berufsschule&quot;</p>
                  </div>
                  <div>
                    <p className="text-lg font-black text-destructive">18%</p>
                    <p className="text-[8px] text-muted-foreground">Konkrete Zahlen</p>
                  </div>
                </div>
              </div>

              <p className="text-[7px] text-muted-foreground/40 text-center">Analyse: 211 MC-Fragen. Kein Ersatz fürs Lernen!</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.main>
    </div>
  );
}
