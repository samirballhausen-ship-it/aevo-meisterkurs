"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { ClawbuisFooter } from "@/components/clawbuis-badge";

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInAsGuest } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAccountOptions, setShowAccountOptions] = useState(false);

  async function handleGuest() {
    setLoading(true);
    await signInAsGuest();
    router.push("/");
  }

  async function handleGoogle() {
    try {
      setLoading(true);
      setError("");
      await signInWithGoogle();
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("auth/unauthorized-domain")) {
        setError("Google Login: Diese Domain muss in der Firebase Console freigegeben werden. Nutze 'Direkt loslegen' als Alternative.");
      } else {
        setError(`Google Login fehlgeschlagen: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      await signInWithEmail(email, password);
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("user-not-found") || msg.includes("invalid-credential")) {
        setError("Kein Account gefunden. Bitte zuerst registrieren.");
      } else if (msg.includes("wrong-password")) {
        setError("Falsches Passwort.");
      } else {
        setError(`Login fehlgeschlagen: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      await signUpWithEmail(email, password, name);
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("email-already-in-use")) {
        setError("Diese E-Mail ist bereits registriert.");
      } else if (msg.includes("weak-password")) {
        setError("Passwort zu schwach (min. 6 Zeichen).");
      } else {
        setError(`Registrierung fehlgeschlagen: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-background" />
      <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] rounded-full bg-xp/6 blur-[80px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4"
          >
            <GraduationCap className="h-8 w-8 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight text-gradient">AEVO Meisterkurs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Berufs- und Arbeitspädagogik – Teil IV
          </p>
        </div>

        {/* HAUPTAKTION: Direkt loslegen */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleGuest}
            disabled={loading}
            size="lg"
            className="w-full h-14 rounded-2xl text-base font-semibold mb-4 shadow-lg shadow-primary/20"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Direkt loslegen
          </Button>
          <p className="text-center text-xs text-muted-foreground mb-6">
            Sofort lernen – kein Account nötig
          </p>
        </motion.div>

        {/* Account-Optionen (zugeklappt) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={() => setShowAccountOptions(!showAccountOptions)}
            className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            {showAccountOptions ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {showAccountOptions ? "Weniger Optionen" : "Ich habe ein Konto / Fortschritt sichern"}
          </button>

          {showAccountOptions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-border/30 bg-card/60 backdrop-blur-xl mt-3">
                <CardContent className="p-5">
                  {/* Google */}
                  <Button
                    variant="outline"
                    className="w-full mb-3 h-11"
                    onClick={handleGoogle}
                    disabled={loading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Mit Google anmelden
                  </Button>

                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">oder per E-Mail</span>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-3 p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs">
                      {error}
                    </div>
                  )}

                  <Tabs defaultValue="login">
                    <TabsList className="grid w-full grid-cols-2 mb-3">
                      <TabsTrigger value="login">Anmelden</TabsTrigger>
                      <TabsTrigger value="register">Registrieren</TabsTrigger>
                    </TabsList>
                    <TabsContent value="login">
                      <form onSubmit={handleEmailLogin} className="space-y-2.5">
                        <div><Label htmlFor="l-email" className="text-xs">E-Mail</Label><Input id="l-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                        <div><Label htmlFor="l-pass" className="text-xs">Passwort</Label><Input id="l-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                        <Button type="submit" className="w-full" disabled={loading}>Anmelden</Button>
                      </form>
                    </TabsContent>
                    <TabsContent value="register">
                      <form onSubmit={handleRegister} className="space-y-2.5">
                        <div><Label htmlFor="r-name" className="text-xs">Name</Label><Input id="r-name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
                        <div><Label htmlFor="r-email" className="text-xs">E-Mail</Label><Input id="r-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                        <div><Label htmlFor="r-pass" className="text-xs">Passwort</Label><Input id="r-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div>
                        <Button type="submit" className="w-full" disabled={loading}>Account erstellen</Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>

        <ClawbuisFooter />
      </motion.div>
    </div>
  );
}
