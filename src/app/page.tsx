"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  FileText, GraduationCap, Award, Brain, Gamepad2, Sparkles, LogIn, UserCircle, ChevronDown, ChevronUp,
  Flag, Send, CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Card as CardUI, CardContent as CardContentUI } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClawbuisBadge, ClawbuisFooter } from "@/components/clawbuis-badge";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Textarea } from "@/components/ui/textarea";

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
  const { user, stats, loading: authLoading, signInAsGuest } = useAuth();
  const { getHFProgress, getOverallProgress, getDueQuestions, getWeakQuestions, getMasteryStats, progress } = useProgress();
  const router = useRouter();

  if (authLoading) {
    return <div className="min-h-screen p-4 space-y-4"><Skeleton className="h-48 w-full rounded-2xl" /><div className="grid grid-cols-3 gap-3"><Skeleton className="h-20 rounded-xl" /><Skeleton className="h-20 rounded-xl" /><Skeleton className="h-20 rounded-xl" /></div></div>;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NICHT EINGELOGGT → Willkommen + Direkt loslegen / Anmelden
  // ═══════════════════════════════════════════════════════════════════════════
  if (!user) {
    return <LandingScreen signInAsGuest={signInAsGuest} />;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EINGELOGGT → Dashboard
  // ═══════════════════════════════════════════════════════════════════════════
  const overall = getOverallProgress();
  const masteryStats = getMasteryStats();
  const avgMastery = masteryStats.avgMastery;
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
  const hasAnswered = (stats?.totalQuestionsAnswered ?? 0) > 0;

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
                      {!hasAnswered ? "Beantworte deine erste Frage und starte durch!" :
                       dueCount > 0 ? `${dueCount} Fragen zur Wiederholung bereit` :
                       "Lerne neue Fragen und werde Meister"}
                    </p>
                  </div>
                  <div className="flex gap-2.5 justify-center md:justify-start">
                    <Link href="/lernen">
                      <Button size="lg" className="rounded-xl h-10 px-5 text-sm">
                        <Zap className="mr-1.5 h-4 w-4" />
                        {!hasAnswered ? "Erste Frage" : dueCount > 0 ? "Wiederholen" : "Jetzt lernen"}
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
                    <><Progress value={levelProgress} className="h-1 mt-2 bg-muted" /><p className="text-[9px] text-muted-foreground mt-1">{xpToNext} XP bis {nextLevel.title}</p></>
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

        {/* Mastery Score Widget */}
        {hasAnswered && (
          <motion.div variants={fadeUp}>
            <Card className="border-border/30 bg-card/50 backdrop-blur-xl overflow-hidden">
              <CardContent className="p-5 relative">
                {/* Animated glow */}
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full blur-3xl pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${avgMastery >= 80 ? "rgba(34,197,94,0.3)" : avgMastery >= 60 ? "rgba(52,211,153,0.25)" : avgMastery >= 40 ? "rgba(234,179,8,0.25)" : avgMastery >= 20 ? "rgba(249,115,22,0.2)" : "rgba(239,68,68,0.2)"}, transparent)` }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />

                <div className="relative flex items-center justify-center gap-6">
                  {/* Score Ring */}
                  <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 120, delay: 0.15 }}>
                    <ProgressRing progress={avgMastery} size={110} strokeWidth={8}>
                      <div className="text-center">
                        <motion.span
                          className={`text-3xl font-black ${avgMastery >= 80 ? "text-success" : avgMastery >= 60 ? "text-emerald-400" : avgMastery >= 40 ? "text-warning" : avgMastery >= 20 ? "text-orange-500" : "text-destructive"}`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", delay: 0.3 }}
                        >
                          <AnimatedCounter value={avgMastery} />
                        </motion.span>
                        <p className="text-[9px] text-muted-foreground mt-0.5">Lern-Score</p>
                      </div>
                    </ProgressRing>
                  </motion.div>

                  {/* Right side info */}
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-bold">
                        {avgMastery >= 80 ? "Prüfungsreif!" : avgMastery >= 60 ? "Fast geschafft!" : avgMastery >= 40 ? "Auf gutem Weg" : avgMastery >= 20 ? "Weitermachen!" : "Los geht's!"}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {progress.size} von {masteryStats.totalQuestions} bearbeitet · {masteryStats.mastered + masteryStats.secure} sicher
                      </p>
                    </div>
                    {/* Mini HF bars */}
                    <div className="space-y-1 w-32">
                      {(["HF1", "HF2", "HF3", "HF4"] as Handlungsfeld[]).map((hf) => {
                        const p = getHFProgress(hf);
                        const pct = p.total > 0 ? Math.round(((p.mastered + p.inProgress) / p.total) * 100) : 0;
                        return (
                          <div key={hf} className="flex items-center gap-1.5">
                            <span className="text-[8px] text-muted-foreground w-6">{hf}</span>
                            <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${pct >= 70 ? "bg-success" : pct >= 40 ? "bg-warning" : "bg-destructive/60"}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

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
            const seen = hfProgress.mastered + hfProgress.inProgress;
            const percent = hfProgress.total > 0 ? Math.round((seen / hfProgress.total) * 100) : 0;
            const Icon = HF_ICONS[info.icon] ?? BookOpen;
            return (
              <motion.div key={hf} variants={fadeUp} whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Link href={`/lernen?hf=${hf}`}>
                  <Card className={`border-border/30 bg-gradient-to-br ${HF_COLORS[hf]} backdrop-blur-lg hover:border-primary/30 transition-all group cursor-pointer`}>
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
                          <span className="text-muted-foreground">{seen} von {hfProgress.total} bearbeitet</span>
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

        {/* Quick Actions */}
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

        {/* Fehler melden Banner */}
        <motion.div variants={fadeUp}>
          <FeedbackBanner />
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

// ═══════════════════════════════════════════════════════════════════════════
// Landing Screen (nicht eingeloggt)
// ═══════════════════════════════════════════════════════════════════════════

function LandingScreen({ signInAsGuest }: { signInAsGuest: () => Promise<void> }) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleGoogle() {
    try { setLoading(true); setError(""); await signInWithGoogle(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Google Login fehlgeschlagen"); }
    finally { setLoading(false); }
  }
  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    try { setLoading(true); setError(""); await signInWithEmail(email, password); }
    catch { setError("Login fehlgeschlagen. E-Mail oder Passwort falsch."); }
    finally { setLoading(false); }
  }
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    try { setLoading(true); setError(""); await signUpWithEmail(email, password, name); }
    catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      setError(msg.includes("email-already-in-use") ? "E-Mail bereits registriert." : msg.includes("weak-password") ? "Passwort zu schwach (min. 6 Zeichen)." : "Registrierung fehlgeschlagen.");
    }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-background" />
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[100px] animate-pulse" />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10 space-y-5">
          {/* Logo */}
          <div className="text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
              className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
              <GraduationCap className="h-8 w-8 text-primary" />
            </motion.div>
            <h1 className="text-2xl font-bold tracking-tight text-gradient">AEVO Meisterkurs</h1>
            <p className="text-muted-foreground text-sm mt-1">298 Fragen · 4 Themenbereiche</p>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <Button onClick={async () => { await signInAsGuest(); }} size="lg" disabled={loading}
              className="w-full h-14 rounded-2xl text-base font-semibold shadow-lg shadow-primary/20">
              <Sparkles className="mr-2 h-5 w-5" />
              Direkt loslegen
            </Button>
            <Button variant="outline" size="lg" onClick={() => setShowLogin(!showLogin)} disabled={loading}
              className="w-full h-12 rounded-2xl text-sm">
              <LogIn className="mr-2 h-4 w-4" />
              Anmelden / Registrieren
              {showLogin ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
            </Button>
          </div>

          {/* Inline Login Form */}
          {showLogin && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.3 }}>
              <Card className="border-border/30 bg-card/60 backdrop-blur-xl">
                <CardContent className="p-5 space-y-3">
                  <Button variant="outline" className="w-full h-11" onClick={handleGoogle} disabled={loading}>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Mit Google anmelden
                  </Button>
                  <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">oder per E-Mail</span></div></div>
                  {error && <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs">{error}</div>}
                  <Tabs defaultValue="login">
                    <TabsList className="grid w-full grid-cols-2 mb-3">
                      <TabsTrigger value="login">Anmelden</TabsTrigger>
                      <TabsTrigger value="register">Registrieren</TabsTrigger>
                    </TabsList>
                    <TabsContent value="login">
                      <form onSubmit={handleEmailLogin} className="space-y-2.5">
                        <div><Label htmlFor="h-email" className="text-xs">E-Mail</Label><Input id="h-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                        <div><Label htmlFor="h-pass" className="text-xs">Passwort</Label><Input id="h-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                        <Button type="submit" className="w-full" disabled={loading}>Anmelden</Button>
                      </form>
                    </TabsContent>
                    <TabsContent value="register">
                      <form onSubmit={handleRegister} className="space-y-2.5">
                        <div><Label htmlFor="h-name" className="text-xs">Name</Label><Input id="h-name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
                        <div><Label htmlFor="h-remail" className="text-xs">E-Mail</Label><Input id="h-remail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                        <div><Label htmlFor="h-rpass" className="text-xs">Passwort</Label><Input id="h-rpass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div>
                        <Button type="submit" className="w-full" disabled={loading}>Account erstellen</Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Disclaimer */}
          <div className="rounded-xl bg-card/40 backdrop-blur-lg border border-border/20 p-3 space-y-1.5">
            <div className="flex items-start gap-2.5">
              <UserCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-[11px] text-muted-foreground space-y-1">
                <p><strong className="text-foreground/80">Ohne Anmeldung:</strong> Fortschritt nur auf diesem Gerät.</p>
                <p><strong className="text-foreground/80">Mit Anmeldung:</strong> Fortschritt sicher in der Cloud, auf jedem Gerät.</p>
              </div>
            </div>
          </div>

          <ClawbuisFooter />
        </motion.div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Fehler melden Banner (Dashboard)
// ═══════════════════════════════════════════════════════════════════════════

function FeedbackBanner() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, "reports"), {
        questionId: "general",
        questionPrompt: "Allgemeines Feedback vom Dashboard",
        message: message.trim(),
        userId: user?.uid ?? "anonym",
        userName: user?.displayName ?? "Gast",
        createdAt: serverTimestamp(),
        status: "new",
      });
    } catch {
      const reports = JSON.parse(localStorage.getItem("lernapp-reports") ?? "[]");
      reports.push({ questionId: "general", message: message.trim(), date: new Date().toISOString() });
      localStorage.setItem("lernapp-reports", JSON.stringify(reports));
    }
    setSending(false);
    setSent(true);
    setTimeout(() => { setSent(false); setOpen(false); setMessage(""); }, 2500);
  }

  return (
    <Card className="border-destructive/20 bg-gradient-to-r from-destructive/8 to-destructive/3 backdrop-blur-lg overflow-hidden">
      <div className="h-0.5 bg-gradient-to-r from-destructive/40 via-destructive/60 to-destructive/40" />
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0 animate-pulse-glow">
            <Flag className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Fehler gefunden?</h3>
            <p className="text-muted-foreground text-[10px] mt-0.5">
              Falsche Antwort, Tippfehler, fehlender Kontext – melde es direkt!
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(!open)}
            className="shrink-0 rounded-lg text-[10px] h-8 px-3 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50"
          >
            <Flag className="h-3 w-3 mr-1" />
            {open ? "Schließen" : "Jetzt melden"}
          </Button>
        </div>

        <AnimatePresence>
          {open && !sent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-2"
            >
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="z.B. 'Frage zu Moritz Petersen: Antwort B ist falsch markiert' oder 'Tippfehler in Handlungsfeld 3, Frage 12'"
                rows={3}
                className="text-xs resize-none"
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={!message.trim() || sending}
                  className="flex-1 h-9 text-xs rounded-lg bg-destructive hover:bg-destructive/90 text-white"
                >
                  <Send className="h-3 w-3 mr-1.5" />
                  {sending ? "Wird gesendet..." : "Fehler melden"}
                </Button>
                <p className="text-[9px] text-muted-foreground shrink-0">
                  Du kannst auch bei jeder Frage direkt melden
                </p>
              </div>
            </motion.div>
          )}
          {sent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-3 rounded-lg bg-success/10 border border-success/20 p-2.5 flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              <p className="text-xs text-success">Danke! Wird schnellstmöglich korrigiert.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
