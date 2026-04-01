"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Clock, AlertTriangle, BookOpen, Zap } from "lucide-react";
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
      <main className="max-w-lg mx-auto px-4 md:px-6 py-6 space-y-4">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          Prüfung simulieren
        </h1>

        {/* Kurztest */}
        <Card className="border-border/30 bg-card/50 backdrop-blur-lg">
          <CardContent className="p-5 space-y-4">
            <div className="text-center">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-base font-semibold">Kurztest</h2>
              <p className="text-muted-foreground text-xs mt-1">
                Schnelle Standort-Bestimmung
              </p>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><BookOpen className="h-3.5 w-3.5 shrink-0" /> 30 Fragen aus allen Themenbereichen</div>
              <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 shrink-0" /> 60 Minuten</div>
              <div className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" /> Ohne Tipps und Erklärungen</div>
            </div>
            <Link href="/lernen?mode=exam">
              <Button className="w-full h-10 rounded-xl" size="lg">
                Kurztest starten
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Info echte Prüfung */}
        <Card className="border-border/30 bg-card/50 backdrop-blur-lg">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-2">Gut zu wissen: Die echte AEVO-Prüfung</h3>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p>• Schriftlicher Teil: ca. 70–80 Aufgaben in 180 Minuten</p>
              <p>• Praktischer Teil: Unterweisung oder Präsentation</p>
              <p>• Bestehensgrenze: 50% der Punkte</p>
              <p>• Alle 4 Themenbereiche werden geprüft</p>
            </div>
            <p className="text-[10px] text-muted-foreground/60 mt-3">
              Der Kurztest oben simuliert einen Ausschnitt der schriftlichen Prüfung.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
