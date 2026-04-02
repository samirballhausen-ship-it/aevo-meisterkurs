"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coffee, Gamepad2, Brain, Zap, Code } from "lucide-react";

const KnowledgeCatcher = dynamic(
  () => import("@/components/games/knowledge-catcher").then((m) => m.KnowledgeCatcher),
  { ssr: false }
);
const TermMemory = dynamic(
  () => import("@/components/games/term-memory").then((m) => m.TermMemory),
  { ssr: false }
);
const SpeedQuiz = dynamic(
  () => import("@/components/games/speed-quiz").then((m) => m.SpeedQuiz),
  { ssr: false }
);
const ClawbuisClicker = dynamic(
  () => import("@/components/games/clawbuis-clicker").then((m) => m.ClawbuisClicker),
  { ssr: false }
);

export default function PausePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <NavBar />
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-xp/10 flex items-center justify-center animate-pulse-glow">
              <Coffee className="h-5 w-5 text-xp" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Lernpause</h1>
              <p className="text-muted-foreground text-sm">
                4 Mini-Games zum Abschalten und Auffrischen
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/30 bg-card/50 backdrop-blur-xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-xp to-warning" />
            <CardContent className="p-4 md:p-6">
              <Tabs defaultValue="clicker">
                <TabsList className="grid w-full grid-cols-4 mb-5">
                  <TabsTrigger value="clicker" className="gap-1 text-[10px]">
                    <Code className="h-3.5 w-3.5" />
                    Code Empire
                  </TabsTrigger>
                  <TabsTrigger value="catcher" className="gap-1 text-[10px]">
                    <Gamepad2 className="h-3.5 w-3.5" />
                    Fang
                  </TabsTrigger>
                  <TabsTrigger value="memory" className="gap-1 text-[10px]">
                    <Brain className="h-3.5 w-3.5" />
                    Memory
                  </TabsTrigger>
                  <TabsTrigger value="speed" className="gap-1 text-[10px]">
                    <Zap className="h-3.5 w-3.5" />
                    Speed
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="clicker">
                  <ClawbuisClicker />
                </TabsContent>

                <TabsContent value="catcher">
                  <KnowledgeCatcher />
                </TabsContent>

                <TabsContent value="memory">
                  <TermMemory />
                </TabsContent>

                <TabsContent value="speed">
                  <SpeedQuiz />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <Brain className="h-3.5 w-3.5" />
            Kurze Pausen verbessern die Merkfähigkeit – gönn dir 5 Minuten!
          </p>
        </motion.div>
      </main>
    </div>
  );
}
