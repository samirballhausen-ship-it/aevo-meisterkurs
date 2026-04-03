"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
import { BarChart3, Zap, Flame, BookOpen, CheckCircle2, ChevronDown } from "lucide-react";

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
        <VibeHacks />
      </motion.main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VIBE Prüfungs-Hacks — Interactive Expandable Patterns
// ═══════════════════════════════════════════════════════════════════════════

const PATTERNS = [
  {
    id: "extreme",
    icon: "🚫",
    title: "Extremwörter = FALSCH",
    stat: "100%",
    statLabel: "falsch",
    color: "text-destructive",
    bg: "bg-destructive/8",
    border: "border-destructive/20",
    detail: "Antworten mit \"nur\", \"immer\", \"nie\", \"niemals\", \"ausschließlich\" oder \"stets\" sind in 110 von 110 Fällen FALSCH gewesen. Das ist der stärkste Hack — null Ausnahmen. Sobald du eins dieser Wörter siehst: sofort streichen.",
    words: ["nur", "immer", "nie", "stets", "ausschließlich"],
    wordColor: "bg-destructive/15 text-destructive",
  },
  {
    id: "length",
    icon: "📏",
    title: "Deutlich längere Antwort = RICHTIG",
    stat: "93%",
    statLabel: "richtig",
    color: "text-success",
    bg: "bg-success/8",
    border: "border-success/20",
    detail: "Wenn eine Antwort doppelt so lang ist wie die anderen: 93% Trefferquote. Bei 50% länger: 86%. Bei 25% länger: 71%. Je größer der Längenunterschied, desto sicherer. Warum? Die richtige Antwort enthält oft Präzisierungen die falsche Antworten absichtlich weglassen.",
    words: ["2x länger = 93%", "1.5x = 86%", "1.25x = 71%"],
    wordColor: "bg-success/15 text-success",
  },
  {
    id: "negation",
    icon: "❌",
    title: "Verneinungen = meistens FALSCH",
    stat: "75%",
    statLabel: "falsch",
    color: "text-orange-500",
    bg: "bg-orange-500/8",
    border: "border-orange-500/20",
    detail: "Antworten mit \"nicht\", \"kein\" oder \"keine\" sind in 3 von 4 Fällen falsch. Verneinungen werden oft benutzt um plausibel klingende aber falsche Optionen zu bauen.",
    words: ["nicht", "kein", "keine"],
    wordColor: "bg-orange-500/15 text-orange-500",
  },
  {
    id: "position",
    icon: "🅰️",
    title: "Antwort A ist am häufigsten richtig",
    stat: "47%",
    statLabel: "richtig",
    color: "text-xp",
    bg: "bg-xp/8",
    border: "border-xp/20",
    detail: "Fast jede zweite Frage hat A als richtige Antwort (47% statt erwartete 22%). Besonders bei HF3 (Didaktik): 57% A richtig. Ausnahme: Bei HF4 (Prüfung) ist die letzte Antwort am häufigsten richtig.",
    words: ["HF3: 57% A", "HF4: letzte!"],
    wordColor: "bg-xp/15 text-xp",
  },
  {
    id: "combi",
    icon: "🔗",
    title: "Kombinations-Antworten gewinnen",
    stat: "71%",
    statLabel: "richtig",
    color: "text-primary",
    bg: "bg-primary/8",
    border: "border-primary/20",
    detail: "Antworten die mehrere Aspekte mit \"und\" verknüpfen sind zu 71% richtig. Die richtige Antwort ist fast immer die differenzierteste und umfassendste Option.",
    words: ["und...und", "sowohl...als auch"],
    wordColor: "bg-primary/15 text-primary",
  },
  {
    id: "brackets",
    icon: "📎",
    title: "Klammern (Präzisierungen) = RICHTIG",
    stat: "88%",
    statLabel: "richtig",
    color: "text-success",
    bg: "bg-success/8",
    border: "border-success/20",
    detail: "Antworten die etwas in Klammern präzisieren — z.B. \"der Ausbilder (Meister)\" oder \"HWK (zuständige Stelle)\" — sind zu 88% richtig (7 von 8). Klammern = der Autor wollte die richtige Antwort genauer formulieren.",
    words: ["(...) = 88%"],
    wordColor: "bg-success/15 text-success",
  },
  {
    id: "position-d",
    icon: "🎯",
    title: "Bei 4 Optionen: D ist fast nie richtig",
    stat: "6%",
    statLabel: "nur D",
    color: "text-destructive",
    bg: "bg-destructive/5",
    border: "border-destructive/15",
    detail: "Bei Fragen mit 4 Optionen (A-D) ist D nur in 6% der Fälle richtig! Zum Vergleich: A = 47%, B = 28%, C = 18%. Wenn du zwischen zwei Optionen schwankst und eine davon ist D — nimm die andere.",
    words: ["A:47%", "B:28%", "C:18%", "D:6%"],
    wordColor: "bg-destructive/15 text-destructive",
  },
  {
    id: "traps",
    icon: "⚠️",
    title: "Fallen erkennen",
    stat: "3",
    statLabel: "Fallen",
    color: "text-destructive",
    bg: "bg-destructive/5",
    border: "border-destructive/15",
    detail: "\"grundsätzlich\" und \"in der Regel\" klingen differenziert — sind aber 0% richtig! \"Berufsschule\" als Antwort ist zu 90% falsch. Konkrete Zahlen (\"X Monate\") sind zu 82% falsch. Der \"HWK ist immer richtig\"-Mythos stimmt nicht: nur 37%.",
    words: ["grundsätzlich 0%", "Berufsschule 90%✗", "HWK nur 37%"],
    wordColor: "bg-destructive/15 text-destructive",
  },
];

function VibeHacks() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* ═══ BLACKOUT GUIDE — Hero, eigenständig oben ═══ */}
      <Card
        className={cn(
          "border-[#c29b62]/25 overflow-hidden cursor-pointer transition-all",
          showGuide ? "bg-gradient-to-br from-[#c29b62]/8 to-[#2dd4bf]/8" : "bg-gradient-to-br from-[#c29b62]/5 to-[#2dd4bf]/5",
        )}
        onClick={() => setShowGuide(!showGuide)}
      >
        <div className="h-0.5 bg-gradient-to-r from-[#c29b62]/60 via-[#2dd4bf]/60 to-[#c29b62]/60" />
        <CardContent className="p-0">
          <div className="flex items-center gap-3 p-4">
            <div className="h-12 w-12 rounded-2xl bg-[#c29b62]/15 flex items-center justify-center shrink-0">
              <span className="text-2xl">🆘</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold bg-gradient-to-r from-[#c29b62] to-[#2dd4bf] bg-clip-text text-transparent">
                Blackout? So gehst du vor.
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">5 Schritte wenn du die Antwort nicht weißt</p>
            </div>
            <div className="text-right shrink-0">
              <ProgressRing progress={54} size={48} strokeWidth={4}>
                <span className="text-[11px] font-black text-success">54%</span>
              </ProgressRing>
            </div>
            <ChevronDown className={cn("h-4 w-4 text-[#c29b62] shrink-0 transition-transform", showGuide && "rotate-180")} />
          </div>

          <AnimatePresence>
            {showGuide && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-1 border-t border-[#c29b62]/15 space-y-3">
                  <p className="text-[10px] text-muted-foreground">
                    Diese 5 Schritte bringen dich von <strong className="text-foreground">20% (Zufall)</strong> auf <strong className="text-success">54% (Bestanden)</strong> — komplett ohne Fachwissen:
                  </p>

                  {[
                    { step: "1", action: "Lies alle Antworten durch", detail: "Suche nach den Signalwörtern", color: "bg-muted/50 text-foreground", arrow: true },
                    { step: "🚫", action: "Streiche \"nur/immer/nie/stets\"", detail: "100% Trefferquote — null Ausnahmen", color: "bg-destructive/15 text-destructive", arrow: true },
                    { step: "❌", action: "Streiche \"nicht/kein/keine\"", detail: "75% sind Fallen", color: "bg-orange-500/15 text-orange-500", arrow: true },
                    { step: "📏", action: "Vergleiche die Länge der Restlichen", detail: "Ist eine deutlich länger? → Die ist's (93%)", color: "bg-success/15 text-success", arrow: true },
                    { step: "🅰️", action: "Alle gleich lang? → Nimm A", detail: "47% Trefferquote. Bei HF4: nimm die Letzte.", color: "bg-xp/15 text-xp", arrow: false },
                  ].map((s, idx) => (
                    <div key={idx}>
                      <div className="flex items-center gap-2.5">
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-black", s.color)}>{s.step}</div>
                        <div className="flex-1">
                          <p className="text-[11px] font-bold">{s.action}</p>
                          <p className="text-[9px] text-muted-foreground">{s.detail}</p>
                        </div>
                      </div>
                      {s.arrow && <div className="flex justify-center py-0.5"><div className="w-0.5 h-3 bg-muted/40 rounded-full" /></div>}
                    </div>
                  ))}

                  <div className="rounded-xl bg-success/10 border border-success/20 p-3 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <ProgressRing progress={54} size={50} strokeWidth={5}>
                        <span className="text-sm font-black text-success">54%</span>
                      </ProgressRing>
                      <div className="text-left">
                        <p className="text-xs font-bold text-success">= Bestanden</p>
                        <p className="text-[9px] text-muted-foreground">50% nötig, 20% wäre Zufall</p>
                        <p className="text-[9px] text-muted-foreground">+160% besser als blindes Raten</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* ═══ Muster-Cards Header ═══ */}
      <div className="flex items-center justify-between px-1 pt-2">
        <p className="text-xs font-semibold text-muted-foreground">Alle Muster im Detail</p>
        <Badge variant="outline" className="text-[8px] border-muted/40">211 Fragen</Badge>
      </div>

      {/* Expandable Pattern Cards */}
      {PATTERNS.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card
            className={cn("border overflow-hidden cursor-pointer transition-all", p.border, expanded === p.id ? p.bg : "hover:border-primary/20")}
            onClick={() => setExpanded(expanded === p.id ? null : p.id)}
          >
            <CardContent className="p-0">
              {/* Always visible row */}
              <div className="flex items-center gap-3 p-3">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", p.bg)}>
                  <span className="text-lg">{p.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold">{p.title}</p>
                  <div className="flex gap-1 mt-1">
                    {p.words.slice(0, 3).map((w) => (
                      <span key={w} className={cn("text-[7px] px-1.5 py-0.5 rounded-full font-medium", p.wordColor)}>{w}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn("text-xl font-black leading-none", p.color)}>{p.stat}</p>
                  <p className="text-[7px] text-muted-foreground">{p.statLabel}</p>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform", expanded === p.id && "rotate-180")} />
              </div>

              {/* Expandable detail */}
              <AnimatePresence>
                {expanded === p.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className={cn("px-3 pb-3 pt-0 border-t", p.border)}>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-2">
                        {p.detail}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      ))}

    </motion.div>
  );
}
