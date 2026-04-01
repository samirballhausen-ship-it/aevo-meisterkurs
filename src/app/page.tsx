"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useProgress } from "@/lib/progress-context";
import { NavBar } from "@/components/nav-bar";
import { ProgressRing } from "@/components/progress-ring";
import { AnimatedCounter } from "@/components/animated-counter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { HANDLUNGSFELDER, LEVELS, type Handlungsfeld } from "@/lib/types";
import {
  BookOpen, Flame, Trophy, Target, Zap, ChevronRight, ClipboardCheck,
  FileText, GraduationCap, Award, Brain, Gamepad2, Sparkles,
} from "lucide-react";
import Link from "next/link";
import { ClawbuisBadge } from "@/components/clawbuis-badge";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HF_ICONS: Record<string, any> = { ClipboardCheck, FileText, GraduationCap, Award };
const HF_COLORS: Record<string, string> = {
  HF1: "from-emerald-500/20 to-emerald-500/5",
  HF2: "from-blue-500/20 to-blue-500/5",
  HF3: "from-violet-500/20 to-violet-500/5",
  HF4: "from-amber-500/20 to-amber-500/5",
};
const HF_ACCENTS: Record<string, string> = {
  HF1: "text-emerald-400", HF2: "text-blue-400", HF3: "text-violet-400", HF4: "text-amber-400",
};

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };

export default function DashboardPage() {
  const { user, stats, loading: authLoading } = useAuth();
  const { getHFProgress, getOverallProgress, getDueQuestions, getWeakQuestions } = useProgress();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return <div className="min-h-screen p-4 space-y-4"><Skeleton className="h-48 w-full rounded-2xl" /><div className="grid grid-cols-3 gap-3"><Skeleton className="h-20 rounded-xl" /><Skeleton className="h-20 rounded-xl" /><Skeleton className="h-20 rounded-xl" /></div></div>;
  }

  const overall = getOverallProgress();
  const dueCount = getDueQuestions().length;
  const weakCount = getWeakQuestions().length;
  const dailyProgress = stats?.dailyGoalProgress ?? 0;
  const dailyTarget = stats?.dailyGoalTarget ?? 20;
  const dailyPercent = Math.min((dailyProgress / dailyTarget) * 100, 100);
  const currentLevel = LEVELS.findLast((l) => (stats?.xp ?? 0) >= l.xpRequired) ?? LEVELS[0];
  const nextLevel = LEVELS.find((l) => l.xpRequired > (stats?.xp ?? 0));
  const xpToNext = nextLevel ? nextLevel.xpRequired - (stats?.xp ?? 0) : 0;
  const levelProgress = nextLevel ? ((stats?.xp ?? 0) - currentLevel.xpRequired) / (nextLevel.xpRequired - currentLevel.xpRequired) * 100 : 100;
  const firstName = user.displayName?.split(" ")[0] ?? "Meisterschüler";
  const isNewUser = (stats?.totalQuestionsAnswered ?? 0) === 0;

  // ─── Onboarding für Erstnutzer ────────────────────────────────────────────
  if (isNewUser) {
    return (
      <div className="min-h-screen pb-20 md:pb-6">
        <NavBar />
        <main className="max-w-lg mx-auto px-4 md:px-6 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} className="text-6xl">
              👋
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold">Willkommen, {firstName}!</h1>
              <p className="text-muted-foreground text-sm mt-2">
                Du hast <span className="text-primary font-semibold">{overall.total} Fragen</span> zum Üben.
                <br />So funktioniert die App:
              </p>
            </div>

            <div className="space-y-3 text-left">
              {[
                { icon: "📖", title: "Fragen beantworten", desc: "Multiple Choice und Freitext – mit Erklärungen zu jeder Antwort" },
                { icon: "🧠", title: "Clever wiederholen", desc: "Die App merkt sich was du kannst und was nicht – und fragt gezielt nach" },
                { icon: "📊", title: "Fortschritt sehen", desc: "Verfolge wie gut du für die Prüfung vorbereitet bist" },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.15 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-card/50 backdrop-blur-lg border border-border/30"
                >
                  <span className="text-2xl">{step.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="space-y-3">
              <Link href="/lernen">
                <Button size="lg" className="w-full h-14 rounded-2xl text-base font-semibold shadow-lg shadow-primary/20">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Erste Frage beantworten
                </Button>
              </Link>

              {user.uid === "guest-user" && (
                <div className="rounded-xl bg-warning/10 border border-warning/20 p-3 text-center">
                  <p className="text-xs text-foreground/80">
                    ⚠️ Du bist ohne Anmeldung unterwegs. Dein Fortschritt wird <strong>nur auf diesem Gerät</strong> gespeichert und kann verloren gehen.
                  </p>
                  <Link href="/login">
                    <Button variant="outline" size="sm" className="mt-2 text-xs rounded-lg h-7">
                      Jetzt Konto erstellen & Fortschritt sichern
                    </Button>
                  </Link>
                </div>
              )}
            </motion.div>
          </motion.div>
        </main>
      </div>
    );
  }

  // ─── Reguläres Dashboard ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <NavBar />
      <motion.main variants={stagger} initial="hidden" animate="show" className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-5">

        {/* Hero */}
        <motion.div variants={fadeUp}>
          <Card className="border-border/30 bg-card/50 backdrop-blur-xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-emerald-400 to-primary" />
            <CardContent className="p-5 md:p-6">
              <div className="flex flex-col md:flex-row items-center gap-5">
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 150, delay: 0.2 }}>
                  <ProgressRing progress={dailyPercent} size={100} strokeWidth={7}>
                    <div className="text-center">
                      <span className="text-lg font-bold">{dailyProgress}</span>
                      <span className="text-muted-foreground text-[9px]">/{dailyTarget}</span>
                      <p className="text-[8px] text-muted-foreground">heute</p>
                    </div>
                  </ProgressRing>
                </motion.div>

                <div className="flex-1 text-center md:text-left space-y-3">
                  <div>
                    <h1 className="text-lg font-bold">Hallo, {firstName}!</h1>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      {dueCount > 0 ? `${dueCount} Fragen zur Wiederholung bereit` : "Lerne neue Fragen und werde Meister"}
                    </p>
                  </div>
                  <div className="flex gap-2.5 justify-center md:justify-start">
                    <Link href="/lernen">
                      <Button size="lg" className="rounded-xl h-10 px-5 text-sm">
                        <Zap className="mr-1.5 h-4 w-4" />
                        {dueCount > 0 ? "Wiederholen" : "Jetzt lernen"}
                      </Button>
                    </Link>
                    {weakCount > 0 && (
                      <Link href="/lernen?mode=weakTopics">
                        <Button variant="outline" size="lg" className="rounded-xl h-10 px-4 text-sm">
                          <Brain className="mr-1.5 h-4 w-4" />
                          Unsichere üben
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                <div className="hidden lg:block text-center min-w-[110px]">
                  <div className="text-3xl mb-1">{currentLevel.icon}</div>
                  <p className="font-semibold text-sm">{currentLevel.title}</p>
                  {nextLevel && (
                    <>
                      <Progress value={levelProgress} className="h-1 mt-2 bg-muted" />
                      <p className="text-[9px] text-muted-foreground mt-1">{xpToNext} XP bis {nextLevel.title}</p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={fadeUp}>
          <div className="grid grid-cols-3 gap-3">
            <motion.div whileHover={{ y: -2 }} className="rounded-xl bg-card/50 backdrop-blur-lg border border-border/30 p-3 text-center">
              <Flame className="h-5 w-5 text-orange-400 mx-auto mb-1 drop-shadow-[0_0_6px_rgba(251,146,60,0.5)]" />
              <p className="text-lg font-bold"><AnimatedCounter value={stats?.currentStreak ?? 0} /></p>
              <p className="text-[10px] text-muted-foreground">Tage Streak</p>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} className="rounded-xl bg-card/50 backdrop-blur-lg border border-border/30 p-3 text-center">
              <Trophy className="h-5 w-5 text-xp mx-auto mb-1 drop-shadow-[0_0_6px_var(--xp)]" />
              <p className="text-lg font-bold"><AnimatedCounter value={stats?.xp ?? 0} /></p>
              <p className="text-[10px] text-muted-foreground">XP {currentLevel.icon}</p>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} className="rounded-xl bg-card/50 backdrop-blur-lg border border-border/30 p-3 text-center">
              <Target className="h-5 w-5 text-primary mx-auto mb-1 drop-shadow-[0_0_6px_var(--primary)]" />
              <p className="text-lg font-bold"><AnimatedCounter value={Math.round(overall.correctRate * 100)} /><span className="text-xs font-normal text-muted-foreground">%</span></p>
              <p className="text-[10px] text-muted-foreground">Richtig</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Themenbereiche */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Themenbereiche</h2>
            <Badge variant="secondary" className="text-[10px]">{overall.mastered}/{overall.total} gemeistert</Badge>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(Object.entries(HANDLUNGSFELDER) as [Handlungsfeld, typeof HANDLUNGSFELDER.HF1][]).map(([hf, info]) => {
            const hfProgress = getHFProgress(hf);
            const percent = hfProgress.total > 0 ? Math.round((hfProgress.mastered / hfProgress.total) * 100) : 0;
            const Icon = HF_ICONS[info.icon] ?? BookOpen;
            return (
              <motion.div key={hf} variants={fadeUp} whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Link href={`/lernen?hf=${hf}`}>
                  <Card className={`border-border/30 bg-gradient-to-br ${HF_COLORS[hf]} backdrop-blur-lg hover:border-primary/30 transition-all group cursor-pointer overflow-hidden`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-background/50 flex items-center justify-center shrink-0">
                          <Icon className={`h-5 w-5 ${HF_ACCENTS[hf]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{info.title}</h3>
                          <p className="text-muted-foreground text-[10px] mt-0.5">{info.subtitle}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      </div>
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">{hfProgress.mastered} gemeistert · {hfProgress.notStarted} neu</span>
                          <span className="font-medium">{percent}%</span>
                        </div>
                        <Progress value={percent} className="h-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions: Prüfung + Pause */}
        <motion.div variants={fadeUp}>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/pruefung">
              <Card className="border-border/30 bg-card/50 backdrop-blur-lg hover:border-destructive/30 transition-all cursor-pointer group">
                <CardContent className="p-4 text-center">
                  <ClipboardCheck className="h-6 w-6 text-destructive mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium">Prüfung simulieren</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Teste dein Wissen</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/pause">
              <Card className="border-border/30 bg-card/50 backdrop-blur-lg hover:border-xp/30 transition-all cursor-pointer group">
                <CardContent className="p-4 text-center">
                  <Gamepad2 className="h-6 w-6 text-xp mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium">Lernpause</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Mini-Games spielen</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </motion.div>

        {/* Gast-Hinweis */}
        {user.uid === "guest-user" && (
          <motion.div variants={fadeUp}>
            <div className="rounded-xl bg-warning/5 border border-warning/15 p-3 flex items-center gap-3">
              <span className="text-lg shrink-0">⚠️</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground/70">Dein Fortschritt ist <strong>nur auf diesem Gerät</strong> gespeichert.</p>
              </div>
              <Link href="/login">
                <Button variant="outline" size="sm" className="text-[10px] rounded-lg h-7 px-2.5 shrink-0">
                  Konto erstellen
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        <motion.div variants={fadeUp} className="flex justify-center pt-2 pb-2">
          <ClawbuisBadge />
        </motion.div>
      </motion.main>
    </div>
  );
}
