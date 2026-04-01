"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useProgress } from "@/lib/progress-context";
import { NavBar } from "@/components/nav-bar";
import { ProgressRing } from "@/components/progress-ring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { HANDLUNGSFELDER, LEVELS, type Handlungsfeld } from "@/lib/types";
import { AnimatedCounter } from "@/components/animated-counter";
import {
  BookOpen,
  Flame,
  Trophy,
  Target,
  Zap,
  ChevronRight,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Award,
  Sparkles,
  Brain,
} from "lucide-react";
import Link from "next/link";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HF_ICONS: Record<string, any> = {
  ClipboardCheck,
  FileText,
  GraduationCap,
  Award,
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const { user, stats, loading: authLoading } = useAuth();
  const { getHFProgress, getOverallProgress, getDueQuestions, getWeakQuestions } = useProgress();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen p-6 space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
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
  const levelProgress = nextLevel
    ? ((stats?.xp ?? 0) - currentLevel.xpRequired) / (nextLevel.xpRequired - currentLevel.xpRequired) * 100
    : 100;

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <NavBar />
      <motion.main
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6"
      >
        {/* Hero Section */}
        <motion.div variants={item}>
          <Card className="border-border/30 bg-card/60 backdrop-blur-xl overflow-hidden relative shadow-xl shadow-primary/5">
            <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
              <ProgressRing progress={dailyPercent} size={130} strokeWidth={10}>
                <div className="text-center">
                  <span className="text-2xl font-bold">{dailyProgress}</span>
                  <span className="text-muted-foreground text-xs">/{dailyTarget}</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Tagesziel</p>
                </div>
              </ProgressRing>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-xl font-bold tracking-tight">
                  Hallo, {user.displayName?.split(" ")[0] ?? "Meisterschüler"}!
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {dueCount > 0
                    ? `${dueCount} Fragen warten auf deine Wiederholung`
                    : "Lerne neue Fragen um dein Wissen zu erweitern"}
                </p>

                <div className="flex items-center gap-4 mt-4 justify-center md:justify-start">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Flame className="h-4 w-4 text-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.5)]" />
                    <AnimatedCounter value={stats?.currentStreak ?? 0} className="font-medium" />
                    <span className="text-muted-foreground text-xs">Tage</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Trophy className="h-4 w-4 text-xp drop-shadow-[0_0_6px_var(--xp)]" />
                    <AnimatedCounter value={stats?.xp ?? 0} className="font-medium" />
                    <span className="text-muted-foreground text-xs">XP</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Target className="h-4 w-4 text-primary drop-shadow-[0_0_6px_var(--primary)]" />
                    <AnimatedCounter value={Math.round(overall.correctRate * 100)} className="font-medium" />
                    <span className="text-muted-foreground text-xs">% Richtig</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-5 justify-center md:justify-start">
                  <Link href="/lernen">
                    <Button size="lg" className="rounded-xl h-11 px-6">
                      <Zap className="mr-2 h-4 w-4" />
                      {dueCount > 0 ? "Wiederholung starten" : "Jetzt lernen"}
                    </Button>
                  </Link>
                  {weakCount > 0 && (
                    <Link href="/lernen?mode=weakTopics">
                      <Button variant="outline" size="lg" className="rounded-xl h-11 px-6">
                        <Brain className="mr-2 h-4 w-4" />
                        Schwächen üben
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              <div className="hidden lg:block text-center min-w-[140px]">
                <div className="text-4xl mb-1">{currentLevel.icon}</div>
                <p className="font-semibold text-sm">{currentLevel.title}</p>
                {nextLevel && (
                  <>
                    <Progress value={levelProgress} className="h-1.5 mt-2 bg-muted" />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Noch {xpToNext} XP bis {nextLevel.title}
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Handlungsfelder */}
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Handlungsfelder</h2>
            <Badge variant="secondary" className="text-xs">
              {overall.mastered}/{overall.total} gemeistert
            </Badge>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(Object.entries(HANDLUNGSFELDER) as [Handlungsfeld, typeof HANDLUNGSFELDER.HF1][]).map(
            ([hf, info]) => {
              const hfProgress = getHFProgress(hf);
              const percent = hfProgress.total > 0
                ? Math.round((hfProgress.mastered / hfProgress.total) * 100)
                : 0;
              const Icon = HF_ICONS[info.icon] ?? BookOpen;

              return (
                <motion.div key={hf} variants={item}>
                  <Link href={`/lernen?hf=${hf}`}>
                    <Card className="border-border/30 bg-card/50 backdrop-blur-lg hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5 group cursor-pointer">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <Badge variant="outline" className="text-xs">{hf}</Badge>
                        </div>
                        <h3 className="font-semibold text-sm">{info.title}</h3>
                        <p className="text-muted-foreground text-xs mt-0.5">{info.subtitle}</p>
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Fortschritt</span>
                            <span className="font-medium">{percent}%</span>
                          </div>
                          <Progress value={percent} className="h-1.5" />
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>{hfProgress.mastered} gemeistert</span>
                            <span>{hfProgress.inProgress} in Arbeit</span>
                            <span>{hfProgress.notStarted} neu</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                          <span className="text-xs text-muted-foreground">
                            {Math.round(hfProgress.correctRate * 100)}% Korrektheit
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            }
          )}
        </div>

        {/* Achievements Preview */}
        {(stats?.achievements?.length ?? 0) > 0 && (
          <motion.div variants={item}>
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-warning" />
                  Letzte Erfolge
                </CardTitle>
              </CardHeader>
              <CardContent className="flex gap-3 overflow-x-auto pb-3">
                {stats?.achievements.slice(-5).map((id) => (
                  <Badge key={id} variant="secondary" className="shrink-0">{id}</Badge>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.main>
    </div>
  );
}
