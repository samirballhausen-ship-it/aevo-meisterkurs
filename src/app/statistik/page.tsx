"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
import { BarChart3, Target, BookOpen, Trophy, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function StatistikPage() {
  const { user, stats, loading } = useAuth();
  const { getHFProgress, getOverallProgress, progress } = useProgress();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  const overall = getOverallProgress();
  const totalAnswered = stats?.totalQuestionsAnswered ?? 0;
  const totalCorrect = stats?.totalCorrect ?? 0;
  const overallAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  // Compute real exam readiness score
  const hfScores = (["HF1", "HF2", "HF3", "HF4"] as Handlungsfeld[]).map((hf) => {
    const p = getHFProgress(hf);
    const coverage = p.total > 0 ? (p.mastered + p.inProgress) / p.total : 0;
    const accuracy = p.correctRate;
    return { hf, coverage, accuracy, total: p.total, mastered: p.mastered, inProgress: p.inProgress };
  });

  // Coverage: % of all questions attempted at least once
  const totalQuestions = overall.total;
  const questionsAttempted = progress.size;
  const coveragePercent = totalQuestions > 0 ? Math.round((questionsAttempted / totalQuestions) * 100) : 0;

  // Mastery: % of questions in box >= 3 (solid knowledge)
  let solidKnowledge = 0;
  for (const [, p] of progress) {
    if (p.box >= 3) solidKnowledge++;
  }
  const masteryPercent = totalQuestions > 0 ? Math.round((solidKnowledge / totalQuestions) * 100) : 0;

  // HF Balance: minimum coverage across all HFs (weakest link)
  const hfMinCoverage = Math.min(...hfScores.map((h) => h.coverage));
  const hfBalancePercent = Math.round(hfMinCoverage * 100);

  // Composite exam readiness: weighted average
  // 30% coverage + 35% accuracy + 20% mastery + 15% HF balance
  const examReadiness = Math.round(
    coveragePercent * 0.30 +
    overallAccuracy * 0.35 +
    masteryPercent * 0.20 +
    hfBalancePercent * 0.15
  );

  const readinessLabel =
    examReadiness >= 80 ? "Prüfungsreif!" :
    examReadiness >= 60 ? "Fast geschafft!" :
    examReadiness >= 40 ? "Auf gutem Weg" :
    examReadiness >= 20 ? "Weitermachen!" :
    "Los geht's!";

  const readinessColor =
    examReadiness >= 70 ? "text-success" :
    examReadiness >= 40 ? "text-warning" :
    "text-muted-foreground";

  // Find weakest HF
  const weakestHF = hfScores.reduce((a, b) =>
    (a.coverage * 0.5 + a.accuracy * 0.5) < (b.coverage * 0.5 + b.accuracy * 0.5) ? a : b
  );

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <NavBar />
      <motion.main
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-6"
      >
        <motion.div variants={item}>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Statistik
          </h1>
        </motion.div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Fragen gesehen", value: `${questionsAttempted}/${totalQuestions}`, icon: BookOpen, color: "text-primary" },
            { label: "Genauigkeit", value: `${overallAccuracy}%`, icon: Target, color: "text-success" },
            { label: "Solides Wissen", value: `${solidKnowledge}`, icon: CheckCircle2, color: "text-xp" },
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

        {/* Exam Readiness - COMPOSITE SCORE */}
        <motion.div variants={item}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Wie gut bin ich vorbereitet?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Main Ring */}
                <div className="flex items-center justify-center">
                  <ProgressRing progress={examReadiness} size={150} strokeWidth={12}>
                    <div className="text-center">
                      <span className={`text-3xl font-bold ${readinessColor}`}>{examReadiness}%</span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{readinessLabel}</p>
                    </div>
                  </ProgressRing>
                </div>

                {/* Score Breakdown */}
                <div className="flex-1 space-y-3 w-full">
                  <p className="text-xs text-muted-foreground mb-2">Zusammensetzung des Scores:</p>

                  <div className="space-y-2.5">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Abdeckung (Fragen gesehen)</span>
                        <span className="font-medium">{coveragePercent}%</span>
                      </div>
                      <Progress value={coveragePercent} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Korrektheit (richtige Antworten)</span>
                        <span className="font-medium">{overallAccuracy}%</span>
                      </div>
                      <Progress value={overallAccuracy} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Solides Wissen (Box 3+)</span>
                        <span className="font-medium">{masteryPercent}%</span>
                      </div>
                      <Progress value={masteryPercent} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>HF-Balance (schwächstes HF)</span>
                        <span className="font-medium">{hfBalancePercent}%</span>
                      </div>
                      <Progress value={hfBalancePercent} className="h-1.5" />
                    </div>
                  </div>

                  {/* Weakness warning */}
                  {questionsAttempted > 0 && weakestHF.coverage < 0.3 && (
                    <div className="flex items-start gap-2 rounded-lg bg-warning/10 border border-warning/20 p-2.5 mt-3">
                      <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{weakestHF.hf}</span> ist dein schwächstes Handlungsfeld ({Math.round(weakestHF.coverage * 100)}% bearbeitet). Konzentriere dich darauf!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Klare Handlungsempfehlung statt Formel */}
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

        {/* HF Breakdown */}
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
