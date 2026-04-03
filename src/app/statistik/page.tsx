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
            <Card className="border-primary/20 bg-primary/5 backdrop-blur-sm">
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
        {/* ═══ VIBE Prüfungs-Hacks — Visual-First ═══ */}
        <motion.div variants={item}>
          <Card className="border-[#c29b62]/20 bg-gradient-to-br from-[#c29b62]/5 to-[#2dd4bf]/5 backdrop-blur-sm overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-[#c29b62]/60 via-[#2dd4bf]/60 to-[#c29b62]/60" />
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-bold bg-gradient-to-r from-[#c29b62] to-[#2dd4bf] bg-clip-text text-transparent text-center">
                Prüfungs-Hacks
              </p>

              {/* Hero: Killer-Regel — big visual */}
              <motion.div
                className="rounded-2xl bg-destructive/10 border border-destructive/25 p-4 text-center"
                whileHover={{ scale: 1.02 }}
              >
                <p className="text-4xl font-black text-destructive">100%</p>
                <p className="text-xs font-bold mt-1">&quot;nur / immer / nie&quot; = FALSCH</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">110 von 110 Fällen. Null Ausnahmen.</p>
              </motion.div>

              {/* 4 Pattern Cards — numbers first */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { num: "47%", icon: "🅰️", label: "A richtig", bg: "bg-xp/10 border-xp/25" , numColor: "text-xp" },
                  { num: "93%", icon: "📏", label: "2x länger", bg: "bg-success/10 border-success/25", numColor: "text-success" },
                  { num: "71%", icon: "🔗", label: "und+und", bg: "bg-primary/10 border-primary/25", numColor: "text-primary" },
                  { num: "75%", icon: "🚫", label: "kein=falsch", bg: "bg-orange-500/10 border-orange-500/25", numColor: "text-orange-500" },
                ].map((p) => (
                  <div key={p.label} className={cn("rounded-xl border p-2 text-center", p.bg)}>
                    <p className="text-[10px]">{p.icon}</p>
                    <p className={cn("text-lg font-black leading-tight", p.numColor)}>{p.num}</p>
                    <p className="text-[8px] text-muted-foreground leading-tight mt-0.5">{p.label}</p>
                  </div>
                ))}
              </div>

              {/* Signal Words — compact pills */}
              <div className="flex flex-wrap gap-1 justify-center">
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-medium">Berufsschule 90% falsch</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-success/15 text-success font-medium">Ausb.ordnung 75% richtig</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-warning/15 text-warning font-medium">HWK nur 37%</span>
              </div>

              {/* Notfall — visual flow */}
              <div className="rounded-xl bg-[#c29b62]/8 border border-[#c29b62]/20 p-3">
                <p className="text-[9px] font-bold text-[#c29b62] text-center mb-2">Notfall-Strategie</p>
                <div className="flex items-center justify-center gap-1">
                  {[
                    { emoji: "🚫", label: "Extrem-\nwörter", color: "bg-destructive/20 border-destructive/30" },
                    { emoji: "→", label: "", color: "" },
                    { emoji: "❌", label: "Ver-\nneinungen", color: "bg-orange-500/20 border-orange-500/30" },
                    { emoji: "→", label: "", color: "" },
                    { emoji: "📏", label: "Längste\nnehmen", color: "bg-primary/20 border-primary/30" },
                    { emoji: "→", label: "", color: "" },
                    { emoji: "🅰️", label: "Sonst\nA", color: "bg-xp/20 border-xp/30" },
                  ].map((s, i) => (
                    s.color ? (
                      <div key={i} className={cn("h-12 w-12 rounded-lg border flex flex-col items-center justify-center", s.color)}>
                        <span className="text-sm leading-none">{s.emoji}</span>
                        <span className="text-[6px] text-muted-foreground text-center leading-tight mt-0.5 whitespace-pre">{s.label}</span>
                      </div>
                    ) : (
                      <span key={i} className="text-muted-foreground/30 text-xs">→</span>
                    )
                  ))}
                </div>
              </div>

              <p className="text-[7px] text-muted-foreground/40 text-center">211 MC-Fragen analysiert</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.main>
    </div>
  );
}
