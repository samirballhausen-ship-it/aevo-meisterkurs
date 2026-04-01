"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { LEVELS, ACHIEVEMENTS } from "@/lib/types";
import { User, LogOut, Trophy, Flame, Target, Sparkles, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { ClawbuisFooter } from "@/components/clawbuis-badge";

export default function ProfilPage() {
  const { user, stats, signOut, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  const currentLevel = LEVELS.findLast((l) => (stats?.xp ?? 0) >= l.xpRequired) ?? LEVELS[0];
  const nextLevel = LEVELS.find((l) => l.xpRequired > (stats?.xp ?? 0));
  const xpToNext = nextLevel ? nextLevel.xpRequired - (stats?.xp ?? 0) : 0;
  const levelProgress = nextLevel
    ? ((stats?.xp ?? 0) - currentLevel.xpRequired) / (nextLevel.xpRequired - currentLevel.xpRequired) * 100
    : 100;

  const earnedAchievements = ACHIEVEMENTS.filter((a) =>
    stats?.achievements?.includes(a.id)
  );
  const lockedAchievements = ACHIEVEMENTS.filter(
    (a) => !stats?.achievements?.includes(a.id)
  );

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <NavBar />
      <main className="max-w-lg mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Profile Card */}
        <Card className="border-border/50">
          <CardContent className="p-6 text-center">
            <Avatar className="h-20 w-20 mx-auto mb-4">
              <AvatarImage src={user.photoURL ?? undefined} />
              <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                {user.displayName?.charAt(0) ?? "?"}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-xl font-bold">{user.displayName ?? "Meisterschüler"}</h1>
            <p className="text-muted-foreground text-sm">{user.email}</p>

            <div className="mt-4">
              <div className="text-4xl mb-1">{currentLevel.icon}</div>
              <p className="font-semibold">{currentLevel.title}</p>
              <p className="text-sm text-xp font-medium">{stats?.xp ?? 0} XP</p>
              {nextLevel && (
                <div className="mt-3 max-w-xs mx-auto">
                  <Progress value={levelProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Noch {xpToNext} XP bis {nextLevel.icon} {nextLevel.title}
                  </p>
                </div>
              )}
            </div>

            <Separator className="my-5" />

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{stats?.currentStreak ?? 0}</p>
                <p className="text-xs text-muted-foreground">Streak</p>
              </div>
              <div>
                <Trophy className="h-5 w-5 text-xp mx-auto mb-1" />
                <p className="text-lg font-bold">{stats?.longestStreak ?? 0}</p>
                <p className="text-xs text-muted-foreground">Rekord</p>
              </div>
              <div>
                <Target className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">{stats?.totalQuestionsAnswered ?? 0}</p>
                <p className="text-xs text-muted-foreground">Fragen</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-warning" />
              Achievements ({earnedAchievements.length}/{ACHIEVEMENTS.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {earnedAchievements.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-success/5 border border-success/10">
                <span className="text-xl">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.description}</p>
                </div>
                <Badge variant="secondary" className="text-[10px] shrink-0">Freigeschaltet</Badge>
              </div>
            ))}
            {lockedAchievements.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg opacity-40">
                <span className="text-xl grayscale">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.description}</p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">Gesperrt</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Einstellungen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Design</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                {theme === "dark" ? "Hell" : "Dunkel"}
              </Button>
            </div>
            <Separator />
            <Button
              variant="destructive"
              className="w-full"
              onClick={async () => { await signOut(); router.push("/login"); }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Abmelden
            </Button>
          </CardContent>
        </Card>
        <ClawbuisFooter />
      </main>
    </div>
  );
}
