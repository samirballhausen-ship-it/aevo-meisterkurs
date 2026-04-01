"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, RotateCcw, Trophy, Timer } from "lucide-react";

const SPEED_QUESTIONS = [
  { q: "Wie viele Stufen hat die Vier-Stufen-Methode?", a: "4", wrong: ["3", "5", "6"] },
  { q: "Maximale tägliche Arbeitszeit Jugendlicher?", a: "8h", wrong: ["9h", "10h", "7h"] },
  { q: "BBiG steht für...?", a: "Berufsbildungsgesetz", wrong: ["Bundesbildungsgesetz", "Berufsberatungsgesetz", "Betriebsbildungsgesetz"] },
  { q: "Probezeit im Ausbildungsverhältnis?", a: "1-4 Monate", wrong: ["6 Monate", "3 Wochen", "1 Jahr"] },
  { q: "Wer führt die Lehrlingsrolle?", a: "HWK", wrong: ["IHK", "Innung", "Berufsschule"] },
  { q: "AEVO = ?", a: "Ausbilder-Eignungsverordnung", wrong: ["Ausbildungs-Erlaubnis-VO", "Arbeits-Erziehungs-VO", "Azubi-Einstellungs-VO"] },
  { q: "Kündigungsfrist Azubi nach Probezeit?", a: "4 Wochen", wrong: ["2 Wochen", "1 Monat", "Sofort"] },
  { q: "Modell der vollständigen Handlung beginnt mit?", a: "Informieren", wrong: ["Planen", "Entscheiden", "Bewerten"] },
  { q: "Urlaub für 17-Jährige Azubis?", a: "25 Werktage", wrong: ["24 Tage", "30 Tage", "20 Tage"] },
  { q: "Olfaktorisch = welcher Sinn?", a: "Geruch", wrong: ["Geschmack", "Tasten", "Hören"] },
  { q: "Lernziel: Gelerntes auf Neues übertragen?", a: "Transfer", wrong: ["Reproduktion", "Reorganisation", "Kreativität"] },
  { q: "Schlichtung vor dem Arbeitsgericht ist...?", a: "Pflicht", wrong: ["Freiwillig", "Optional", "Verboten"] },
  { q: "Berufsbildungsausschuss: wie viele Lehrer?", a: "6", wrong: ["3", "4", "12"] },
  { q: "Schulgesetzgebung zuständig?", a: "Bundesländer", wrong: ["Bund", "Kommunen", "EU"] },
  { q: "Ausbildender = wer...?", a: "Einstellt", wrong: ["Ausbildet", "Prüft", "Berät"] },
  { q: "Zentraltendenz bei Beurteilung = ?", a: "Alles Mitte", wrong: ["Zu streng", "Zu mild", "Halo-Effekt"] },
  { q: "Pause bei 8h Arbeit (Jugendliche)?", a: "60 Min", wrong: ["30 Min", "45 Min", "90 Min"] },
  { q: "Wer erstellt Ausbildungsordnungen?", a: "Bundesministerium", wrong: ["HWK", "Berufsschule", "Innung"] },
  { q: "Verbundausbildung bedeutet...?", a: "Mehrere Betriebe", wrong: ["Mehr Azubis", "Doppelstudium", "Teilzeit"] },
  { q: "LKW-Formel: L = K × ...?", a: "W (Wollen)", wrong: ["A (Arbeit)", "Z (Zeit)", "F (Fähigkeit)"] },
];

export function SpeedQuiz() {
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [shuffled, setShuffled] = useState<typeof SPEED_QUESTIONS>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = useCallback(() => {
    const s = [...SPEED_QUESTIONS].sort(() => Math.random() - 0.5);
    setShuffled(s);
    setQuestionIdx(0);
    setScore(0);
    setTimeLeft(60);
    setStreak(0);
    setMaxStreak(0);
    setFeedback(null);
    setGameOver(false);
    setStarted(true);
    prepareOptions(s[0]);
  }, []);

  function prepareOptions(q: typeof SPEED_QUESTIONS[0]) {
    const opts = [q.a, ...q.wrong].sort(() => Math.random() - 0.5);
    setOptions(opts);
  }

  // Timer
  useEffect(() => {
    if (!started || gameOver) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setGameOver(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started, gameOver]);

  const handleAnswer = useCallback((answer: string) => {
    if (feedback) return;
    const correct = answer === shuffled[questionIdx].a;

    setFeedback(correct ? "correct" : "wrong");

    if (correct) {
      const bonus = Math.min(streak, 5);
      setScore(s => s + 10 + bonus * 3);
      setStreak(s => {
        const n = s + 1;
        setMaxStreak(m => Math.max(m, n));
        return n;
      });
      setTimeLeft(t => Math.min(t + 2, 60)); // Bonus time!
    } else {
      setStreak(0);
      setTimeLeft(t => Math.max(t - 3, 0)); // Penalty!
    }

    setTimeout(() => {
      setFeedback(null);
      const next = questionIdx + 1;
      if (next >= shuffled.length) {
        setGameOver(true);
      } else {
        setQuestionIdx(next);
        prepareOptions(shuffled[next]);
      }
    }, 600);
  }, [feedback, shuffled, questionIdx, streak]);

  if (!started) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">⚡</div>
        <h3 className="text-lg font-bold mb-2">Speed-Quiz</h3>
        <p className="text-muted-foreground text-sm mb-1">60 Sekunden – so viele Fragen wie möglich!</p>
        <p className="text-muted-foreground text-xs mb-4">Richtig = +2s Bonus | Falsch = -3s Strafe</p>
        <Button onClick={startGame} className="rounded-xl">
          <Zap className="mr-2 h-4 w-4" />
          Los geht&apos;s!
        </Button>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="text-center py-6">
        <div className="text-5xl mb-3">{score >= 150 ? "🏆" : score >= 100 ? "🌟" : score >= 50 ? "🎯" : "💪"}</div>
        <h3 className="text-lg font-bold mb-1">Zeit abgelaufen!</h3>
        <div className="flex gap-3 justify-center mb-4">
          <Badge variant="secondary" className="gap-1">
            <Trophy className="h-3.5 w-3.5 text-xp" />
            {score} Punkte
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Zap className="h-3.5 w-3.5 text-warning" />
            {maxStreak}x Streak
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{questionIdx} Fragen beantwortet</p>
        <Button onClick={startGame} className="rounded-xl">
          <RotateCcw className="mr-2 h-4 w-4" />
          Nochmal
        </Button>
      </div>
    );
  }

  const q = shuffled[questionIdx];
  const timerPct = (timeLeft / 60) * 100;

  return (
    <div>
      {/* Timer bar */}
      <div className="relative h-2 rounded-full bg-muted mb-4 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${timeLeft > 20 ? "bg-primary" : timeLeft > 10 ? "bg-warning" : "bg-destructive"}`}
          animate={{ width: `${timerPct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex items-center justify-between mb-3">
        <Badge variant="secondary" className="gap-1">
          <Trophy className="h-3 w-3 text-xp" />
          {score}
        </Badge>
        <Badge variant={timeLeft <= 10 ? "destructive" : "secondary"} className="gap-1">
          <Timer className="h-3 w-3" />
          {timeLeft}s
        </Badge>
        {streak >= 2 && (
          <Badge variant="outline" className="gap-1 text-warning">
            <Zap className="h-3 w-3" />
            {streak}x
          </Badge>
        )}
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={questionIdx}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-sm font-semibold mb-4 text-center leading-relaxed">
            {q.q}
          </p>

          <div className="grid grid-cols-2 gap-2">
            {options.map((opt) => (
              <motion.button
                key={opt}
                onClick={() => handleAnswer(opt)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-3 rounded-xl border text-xs font-medium text-center transition-all ${
                  feedback && opt === q.a
                    ? "bg-success/20 border-success/50 text-success"
                    : feedback === "wrong" && opt !== q.a
                      ? "opacity-50"
                      : "bg-card/50 border-border/30 hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
                }`}
              >
                {opt}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
