"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Clock, AlertTriangle, BookOpen } from "lucide-react";
import Link from "next/link";

export default function PruefungPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <NavBar />
      <main className="max-w-lg mx-auto px-4 md:px-6 py-6 space-y-6">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          Prüfungs-Simulation
        </h1>

        <Card className="border-border/50 border-destructive/20">
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <ClipboardCheck className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold">AEVO Prüfungs-Simulation</h2>
              <p className="text-muted-foreground text-sm mt-2">
                Simuliere die schriftliche AEVO-Prüfung unter realen Bedingungen.
              </p>
            </div>

            <div className="space-y-3 rounded-xl bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">30 Fragen aus allen 4 Handlungsfeldern</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">60 Minuten Zeitlimit</span>
              </div>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm">Keine Tipps oder Erklärungen während der Prüfung</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">HF1</Badge>
              <Badge variant="outline">HF2</Badge>
              <Badge variant="outline">HF3</Badge>
              <Badge variant="outline">HF4</Badge>
              <span>Zufällige Mischung</span>
            </div>

            <Link href="/lernen?mode=exam">
              <Button className="w-full h-11 rounded-xl" size="lg">
                Prüfung starten
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
