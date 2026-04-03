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
        {/* ═══ VIBE Prüfungs-Hacks ═══ */}
        <motion.div variants={item}>
          <Card className="border-[#c29b62]/20 bg-gradient-to-br from-[#c29b62]/5 to-[#2dd4bf]/5 backdrop-blur-lg overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-[#c29b62]/60 via-[#2dd4bf]/60 to-[#c29b62]/60" />
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔍</span>
                <p className="text-sm font-bold bg-gradient-to-r from-[#c29b62] to-[#2dd4bf] bg-clip-text text-transparent">
                  VIBE Prüfungs-Hacks
                </p>
                <Badge variant="outline" className="text-[8px] border-[#c29b62]/30 text-[#c29b62] ml-auto">
                  Muster-Analyse
                </Badge>
              </div>

              {/* Killer-Regel */}
              <div className="rounded-xl bg-destructive/8 border border-destructive/20 p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🚫</span>
                  <p className="text-xs font-bold text-destructive">Killer-Regel: Extremwörter streichen</p>
                  <Badge className="ml-auto text-[9px] bg-destructive/15 text-destructive border-destructive/30" variant="outline">100%</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Antworten mit <strong className="text-foreground">&quot;nur&quot;</strong>, <strong className="text-foreground">&quot;immer&quot;</strong>, <strong className="text-foreground">&quot;nie&quot;</strong>, <strong className="text-foreground">&quot;ausschließlich&quot;</strong> oder <strong className="text-foreground">&quot;stets&quot;</strong> sind <strong className="text-destructive">in 110 von 110 Fällen FALSCH</strong>. Sofort streichen!
                </p>
              </div>

              {/* Pattern-Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* Längste Antwort */}
                <div className="rounded-lg bg-success/8 border border-success/20 p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">📏</span>
                    <span className="text-[10px] font-bold text-success">51%</span>
                  </div>
                  <p className="text-[10px] font-medium">Längste = Richtig</p>
                  <p className="text-[9px] text-muted-foreground">Im Schnitt 20 Zeichen länger als falsche</p>
                </div>

                {/* Antwort A */}
                <div className="rounded-lg bg-xp/8 border border-xp/20 p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">🅰️</span>
                    <span className="text-[10px] font-bold text-xp">47%</span>
                  </div>
                  <p className="text-[10px] font-medium">A ist am häufigsten richtig</p>
                  <p className="text-[9px] text-muted-foreground">Fast jede 2. Frage! (normal wären 22%)</p>
                </div>

                {/* Kombinations-Antworten */}
                <div className="rounded-lg bg-primary/8 border border-primary/20 p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">🔗</span>
                    <span className="text-[10px] font-bold text-primary">71%</span>
                  </div>
                  <p className="text-[10px] font-medium">&quot;und...und&quot; = richtig</p>
                  <p className="text-[9px] text-muted-foreground">Kombinations-Antworten gewinnen</p>
                </div>

                {/* Verneinungen */}
                <div className="rounded-lg bg-orange-500/8 border border-orange-500/20 p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">⚠️</span>
                    <span className="text-[10px] font-bold text-orange-500">75%</span>
                  </div>
                  <p className="text-[10px] font-medium">&quot;nicht/kein&quot; = falsch</p>
                  <p className="text-[9px] text-muted-foreground">3 von 4 Verneinungen sind Fallen</p>
                </div>
              </div>

              {/* Wort-Signale */}
              <div className="rounded-lg bg-muted/30 p-3 space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground">Wort-Signale</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-[9px] border-destructive/30 text-destructive">🚫 &quot;Berufsschule&quot; → 90% falsch</Badge>
                  <Badge variant="outline" className="text-[9px] border-destructive/30 text-destructive">🚫 &quot;nur/immer/nie&quot; → 100% falsch</Badge>
                  <Badge variant="outline" className="text-[9px] border-success/30 text-success">✓ &quot;Ausbildungsordnung&quot; → 75% richtig</Badge>
                  <Badge variant="outline" className="text-[9px] border-success/30 text-success">✓ &quot;BBiG&quot; → 67% richtig</Badge>
                  <Badge variant="outline" className="text-[9px] border-warning/30 text-warning">⚠ &quot;HWK&quot; → nur 37% (Mythos!)</Badge>
                </div>
              </div>

              {/* HF-Ausnahme */}
              <div className="flex items-start gap-2 text-[10px] text-muted-foreground">
                <span className="shrink-0 mt-0.5">💡</span>
                <p>
                  <strong className="text-foreground">Ausnahme HF4</strong> (Prüfung/Abschluss): Hier ist die <strong className="text-foreground">letzte Antwort</strong> am häufigsten richtig (35%), nicht A.
                </p>
              </div>

              {/* Notfall-Strategie */}
              <div className="rounded-xl bg-[#c29b62]/8 border border-[#c29b62]/20 p-3">
                <p className="text-[10px] font-bold text-[#c29b62] mb-2">🆘 Notfall-Strategie (wenn du GAR nichts weißt)</p>
                <div className="space-y-1">
                  {[
                    { step: "1", text: "Streiche Optionen mit \"nur/immer/nie\"", color: "text-destructive" },
                    { step: "2", text: "Streiche Verneinungen (\"nicht\", \"kein\")", color: "text-orange-500" },
                    { step: "3", text: "Nimm die längste verbleibende Antwort", color: "text-primary" },
                    { step: "4", text: "Wenn gleichlang → nimm A", color: "text-xp" },
                  ].map((s) => (
                    <div key={s.step} className="flex items-center gap-2">
                      <span className={cn("text-[10px] font-black w-4 text-center", s.color)}>{s.step}</span>
                      <span className="text-[10px] text-muted-foreground">{s.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[8px] text-muted-foreground/50 text-center italic">
                Basierend auf statistischer Analyse aller 211 MC-Fragen. Kein Ersatz fürs Lernen!
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.main>
    </div>
  );
}
