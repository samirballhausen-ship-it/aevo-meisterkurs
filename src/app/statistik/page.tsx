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
import { Progress } from "@/components/ui/progress";
import { HANDLUNGSFELDER, type Handlungsfeld } from "@/lib/types";
import { BarChart3, Target, BookOpen, Trophy, CheckCircle2, XCircle, Clock, TrendingUp } from "lucide-react";

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
  const { getHFProgress, getOverallProgress } = useProgress();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  const overall = getOverallProgress();
  const totalAnswered = stats?.totalQuestionsAnswered ?? 0;
  const totalCorrect = stats?.totalCorrect ?? 0;
  const overallAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const avgTimePerQuestion = totalAnswered > 0 ? Math.round((stats?.totalTimeSpent ?? 0) / totalAnswered) : 0;

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
            { label: "Fragen beantwortet", value: totalAnswered.toString(), icon: BookOpen, color: "text-primary" },
            { label: "Genauigkeit", value: `${overallAccuracy}%`, icon: Target, color: "text-success" },
            { label: "Längste Streak", value: `${stats?.longestStreak ?? 0} Tage`, icon: Trophy, color: "text-orange-500" },
            { label: "Gemeistert", value: `${overall.mastered}/${overall.total}`, icon: CheckCircle2, color: "text-xp" },
          ].map((stat) => (
            <motion.div key={stat.label} variants={item}>
              <Card className="border-border/50">
                <CardContent className="p-4 text-center">
                  <stat.icon className={`h-5 w-5 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* HF Breakdown */}
        <motion.div variants={item}>
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Fortschritt pro Handlungsfeld</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {(Object.entries(HANDLUNGSFELDER) as [Handlungsfeld, typeof HANDLUNGSFELDER.HF1][]).map(
                ([hf, info]) => {
                  const hfProg = getHFProgress(hf);
                  const percent = hfProg.total > 0 ? Math.round((hfProg.mastered / hfProg.total) * 100) : 0;
                  const accuracy = Math.round(hfProg.correctRate * 100);

                  return (
                    <div key={hf} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{hf}</Badge>
                          <span className="text-sm font-medium">{info.title}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{accuracy}% richtig</span>
                          <span className="font-medium text-foreground">{percent}%</span>
                        </div>
                      </div>
                      <Progress value={percent} className="h-2" />
                      <div className="flex gap-4 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-success" />
                          {hfProg.mastered} gemeistert
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-warning" />
                          {hfProg.inProgress} in Arbeit
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3 text-muted-foreground" />
                          {hfProg.notStarted} neu
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Exam Readiness */}
        <motion.div variants={item}>
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Prüfungsbereitschaft
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-6">
                <ProgressRing progress={overallAccuracy} size={160} strokeWidth={12}>
                  <div className="text-center">
                    <span className="text-3xl font-bold">{overallAccuracy}%</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {overallAccuracy >= 80 ? "Prüfungsreif!" :
                       overallAccuracy >= 60 ? "Fast geschafft" :
                       "Weiter üben"}
                    </p>
                  </div>
                </ProgressRing>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Für die AEVO-Prüfung solltest du mindestens 70% erreichen.
                {overallAccuracy >= 70 ? " Du bist auf einem guten Weg!" : " Bleib dran!"}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.main>
    </div>
  );
}
