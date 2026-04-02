"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useProgress } from "@/lib/progress-context";
import { NavBar } from "@/components/nav-bar";
import { ProgressRing } from "@/components/progress-ring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { HANDLUNGSFELDER, type Handlungsfeld } from "@/lib/types";
import Link from "next/link";
import {
  BarChart3, Target, BookOpen, Trophy, CheckCircle2,
  TrendingUp, AlertTriangle, Brain, Zap, Flame,
} from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
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

function getMasteryBg(m: number) {
  if (m >= 80) return "bg-success";
  if (m >= 60) return "bg-emerald-400";
  if (m >= 40) return "bg-warning";
  if (m >= 20) return "bg-orange-500";
  return "bg-destructive";
}

export default function StatistikPage() {
  const { user, stats, loading } = useAuth();
  const { getHFProgress, getOverallProgress, progress, getMasteryStats } = useProgress();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  const overall = getOverallProgress();
  const masteryStats = getMasteryStats();
  const totalAnswered = stats?.totalQuestionsAnswered ?? 0;
  const totalCorrect = stats?.totalCorrect ?? 0;
  const overallAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  const hfScores = (["HF1", "HF2", "HF3", "HF4"] as Handlungsfeld[]).map((hf) => {
    const p = getHFProgress(hf);
    const coverage = p.total > 0 ? (p.mastered + p.inProgress) / p.total : 0;
    return { hf, coverage, accuracy: p.correctRate, total: p.total, mastered: p.mastered, inProgress: p.inProgress };
  });

  const totalQuestions = overall.total;
  const questionsAttempted = progress.size;
  const coveragePercent = totalQuestions > 0 ? Math.round((questionsAttempted / totalQuestions) * 100) : 0;
  const avgMastery = masteryStats.avgMastery;

  const hfMinCoverage = Math.min(...hfScores.map((h) => h.coverage));
  const hfBalancePercent = Math.round(hfMinCoverage * 100);
  const masteryPercent = totalQuestions > 0 ? Math.round(((masteryStats.mastered + masteryStats.secure) / totalQuestions) * 100) : 0;

  const examReadiness = Math.round(
    coveragePercent * 0.25 +
    overallAccuracy * 0.30 +
    avgMastery * 0.30 +
    hfBalancePercent * 0.15
  );

  const readinessLabel =
    examReadiness >= 80 ? "Prüfungsreif!" :
    examReadiness >= 60 ? "Fast geschafft!" :
    examReadiness >= 40 ? "Auf gutem Weg" :
    examReadiness >= 20 ? "Weitermachen!" : "Los geht's!";

  const readinessColor =
    examReadiness >= 70 ? "text-success" :
    examReadiness >= 40 ? "text-warning" : "text-muted-foreground";

  const weakestHF = hfScores.reduce((a, b) =>
    (a.coverage * 0.5 + a.accuracy * 0.5) < (b.coverage * 0.5 + b.accuracy * 0.5) ? a : b
  );

  // Mastery distribution for bar chart
  const masteryDist = [
    { label: "Gemeistert", range: "80-100", count: masteryStats.mastered, color: "bg-success" },
    { label: "Sicher", range: "60-79", count: masteryStats.secure, color: "bg-emerald-400" },
    { label: "Lernend", range: "40-59", count: masteryStats.learning, color: "bg-warning" },
    { label: "Anfänger", range: "20-39", count: masteryStats.beginner, color: "bg-orange-500" },
    { label: "Unsicher", range: "0-19", count: masteryStats.unknown, color: "bg-destructive" },
    { label: "Nicht gestartet", range: "—", count: masteryStats.notStarted, color: "bg-muted" },
  ];
  const maxDistCount = Math.max(...masteryDist.map((d) => d.count), 1);

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <NavBar />
      <motion.main variants={container} initial="hidden" animate="show" className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <motion.div variants={item}>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Statistik
          </h1>
        </motion.div>

        {/* ═══ Overview Cards ═══ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Fragen gesehen", value: `${questionsAttempted}/${totalQuestions}`, icon: BookOpen, color: "text-primary" },
            { label: "Genauigkeit", value: `${overallAccuracy}%`, icon: Target, color: "text-success" },
            { label: "Ø Mastery", value: `${avgMastery}`, icon: Brain, color: getMasteryColor(avgMastery) },
            { label: "Längste Streak", value: `${stats?.longestStreak ?? 0} Tage`, icon: Trophy, color: "text-orange-500" },
          ].map((stat) => (
            <motion.div key={stat.label} variants={item}>
              <Card className="border-border/50 bg-card/50 backdrop-blur-lg">
                <CardContent className="p-4 text-center">
                  <stat.icon className={`h-5 w-5 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ═══ Mastery Distribution ═══ */}
        <motion.div variants={item}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                Mastery-Verteilung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {masteryDist.map((d) => (
                <div key={d.label} className="flex items-center gap-3">
                  <div className="w-28 shrink-0 text-right">
                    <span className="text-[10px] text-muted-foreground">{d.label}</span>
                    <span className="text-[9px] text-muted-foreground/60 ml-1">({d.range})</span>
                  </div>
                  <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(d.count / maxDistCount) * 100}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className={cn("h-full rounded-full", d.color)}
                    />
                  </div>
                  <span className="text-xs font-medium tabular-nums w-8 text-right">{d.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══ Exam Readiness ═══ */}
        <motion.div variants={item}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Prüfungsbereitschaft
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex items-center justify-center">
                  <ProgressRing progress={examReadiness} size={150} strokeWidth={12}>
                    <div className="text-center">
                      <span className={`text-3xl font-bold ${readinessColor}`}>{examReadiness}%</span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{readinessLabel}</p>
                    </div>
                  </ProgressRing>
                </div>

                <div className="flex-1 space-y-2.5 w-full">
                  <p className="text-xs text-muted-foreground mb-2">Score-Zusammensetzung:</p>
                  {[
                    { label: "Abdeckung", value: coveragePercent, weight: "25%" },
                    { label: "Korrektheit", value: overallAccuracy, weight: "30%" },
                    { label: "Mastery-Score", value: avgMastery, weight: "30%" },
                    { label: "HF-Balance", value: hfBalancePercent, weight: "15%" },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{row.label} <span className="text-muted-foreground/50">×{row.weight}</span></span>
                        <span className="font-medium">{row.value}%</span>
                      </div>
                      <Progress value={row.value} className="h-1.5" />
                    </div>
                  ))}

                  {questionsAttempted > 0 && weakestHF.coverage < 0.3 && (
                    <div className="flex items-start gap-2 rounded-lg bg-warning/10 border border-warning/20 p-2.5 mt-3">
                      <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{weakestHF.hf}</span> ist dein schwächstes Handlungsfeld. Konzentriere dich darauf!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {questionsAttempted > 0 && weakestHF.coverage < 0.5 && (
                <div className="mt-4">
                  <Link href={`/lernen?hf=${weakestHF.hf}`}>
                    <Button variant="outline" className="w-full rounded-xl text-xs">
                      Jetzt {HANDLUNGSFELDER[weakestHF.hf as Handlungsfeld].title} üben →
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══ Weakest Topics ═══ */}
        {masteryStats.weakestTopics.length > 0 && (
          <motion.div variants={item}>
            <Card className="border-destructive/20 bg-destructive/5 backdrop-blur-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Flame className="h-4 w-4 text-destructive" />
                  Deine Top 5 Schwächen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {masteryStats.weakestTopics.map((topic, i) => (
                  <div key={`${topic.hf}-${topic.topic}`} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-destructive/60 w-4">{i + 1}.</span>
                    <Badge variant="outline" className="text-[9px] shrink-0">{topic.hf}</Badge>
                    <span className="text-xs flex-1 truncate">{topic.topic}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-16 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", getMasteryBg(topic.avgMastery))} style={{ width: `${topic.avgMastery}%` }} />
                      </div>
                      <span className={cn("text-xs font-bold tabular-nums w-6 text-right", getMasteryColor(topic.avgMastery))}>
                        {topic.avgMastery}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <Link href="/lernen">
                    <Button size="sm" variant="outline" className="w-full rounded-xl text-xs border-destructive/20 text-destructive hover:bg-destructive/10">
                      <Zap className="mr-1.5 h-3.5 w-3.5" />
                      Schwächen gezielt üben
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ═══ HF Breakdown ═══ */}
        <motion.div variants={item}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Fortschritt pro Themenbereich</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {hfScores.map(({ hf, coverage, accuracy, total, mastered, inProgress }) => {
                const info = HANDLUNGSFELDER[hf];
                const coveragePct = Math.round(coverage * 100);
                const accuracyPct = Math.round(accuracy * 100);
                const notStarted = total - mastered - inProgress;

                return (
                  <div key={hf} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{hf}</Badge>
                        <span className="text-sm font-medium">{info.title}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{accuracyPct}% richtig</span>
                        <span className="font-medium text-foreground">{coveragePct}% gesehen</span>
                      </div>
                    </div>
                    <Progress value={coveragePct} className="h-2" />
                    <div className="flex gap-4 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-success" />
                        {mastered} gemeistert
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-warning" />
                        {inProgress} in Arbeit
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3 text-muted-foreground" />
                        {notStarted} neu
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </motion.main>
    </div>
  );
}
