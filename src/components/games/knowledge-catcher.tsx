"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, RotateCcw, Trophy, Zap, Heart } from "lucide-react";

// AEVO terms that float as orbs
const GOOD_TERMS = [
  "BBiG", "JArbSchG", "AEVO", "HwO", "Leittext", "Vier-Stufen",
  "Lernauftrag", "Didaktik", "Kompetenz", "Handlung", "Azubi",
  "Prüfung", "Meister", "Geselle", "Ausbilder", "Lehrgespräch",
  "Motivation", "Feedback", "Transfer", "Kognitiv", "Affektiv",
  "Probezeit", "Vertrag", "Innung", "HWK", "BIBB",
  "Schlichtung", "Fortbildung", "Umschulung", "Beurteilung",
];

const BAD_TERMS = [
  "Fehler", "Stress", "Chaos", "Panik", "Vergessen", "Schwänzen",
  "Abbruch", "Kündigung", "Durchfall", "Blackout",
];

interface Orb {
  id: number;
  x: number;
  y: number;
  term: string;
  isGood: boolean;
  speed: number;
  size: number;
  hue: number;
  glow: number;
  rotation: number;
  rotSpeed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
  isGood: boolean;
}

interface GameState {
  score: number;
  lives: number;
  combo: number;
  maxCombo: number;
  caught: number;
  missed: number;
  level: number;
  gameOver: boolean;
  started: boolean;
}

export function KnowledgeCatcher() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState<GameState>({
    score: 0, lives: 3, combo: 0, maxCombo: 0, caught: 0, missed: 0, level: 1, gameOver: false, started: false,
  });
  const gameRef = useRef(game);
  gameRef.current = game;

  const orbsRef = useRef<Orb[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const paddleXRef = useRef(0.5);
  const frameRef = useRef(0);
  const animRef = useRef<number>(0);
  const nextOrbRef = useRef(0);
  const scorePopupsRef = useRef<{ x: number; y: number; text: string; life: number; isGood: boolean }[]>([]);

  const startGame = useCallback(() => {
    orbsRef.current = [];
    particlesRef.current = [];
    scorePopupsRef.current = [];
    frameRef.current = 0;
    nextOrbRef.current = 0;
    setGame({
      score: 0, lives: 3, combo: 0, maxCombo: 0, caught: 0, missed: 0, level: 1, gameOver: false, started: true,
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !game.started || game.gameOver) return;

    const ctx = canvas.getContext("2d")!;
    let w = canvas.width = canvas.offsetWidth * 2;
    let h = canvas.height = canvas.offsetHeight * 2;

    const paddleW = w * 0.18;
    const paddleH = h * 0.025;

    // Mouse/touch tracking
    function handleMove(clientX: number) {
      const rect = canvas!.getBoundingClientRect();
      paddleXRef.current = (clientX - rect.left) / rect.width;
    }

    function onMouse(e: MouseEvent) { handleMove(e.clientX); }
    function onTouch(e: TouchEvent) { e.preventDefault(); handleMove(e.touches[0].clientX); }

    canvas.addEventListener("mousemove", onMouse);
    canvas.addEventListener("touchmove", onTouch, { passive: false });
    canvas.addEventListener("touchstart", onTouch, { passive: false });

    function spawnOrb() {
      const isGood = Math.random() > 0.2;
      const terms = isGood ? GOOD_TERMS : BAD_TERMS;
      const orb: Orb = {
        id: Date.now() + Math.random(),
        x: 0.05 + Math.random() * 0.9,
        y: -0.05,
        term: terms[Math.floor(Math.random() * terms.length)],
        isGood,
        speed: (0.001 + Math.random() * 0.001) * (1 + gameRef.current.level * 0.15),
        size: 0.035 + Math.random() * 0.015,
        hue: isGood ? 140 + Math.random() * 30 : 0 + Math.random() * 20,
        glow: 0,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.03,
      };
      orbsRef.current.push(orb);
    }

    function spawnParticles(x: number, y: number, isGood: boolean, count: number) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        particlesRef.current.push({
          x: x * w, y: y * h,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          life: 1, maxLife: 30 + Math.random() * 20,
          size: 2 + Math.random() * 4,
          hue: isGood ? 140 + Math.random() * 30 : 0 + Math.random() * 20,
          isGood,
        });
      }
    }

    function draw() {
      if (gameRef.current.gameOver) return;

      frameRef.current++;
      ctx.clearRect(0, 0, w, h);

      // Background gradient
      const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
      bgGrad.addColorStop(0, "rgba(20, 30, 22, 0.3)");
      bgGrad.addColorStop(1, "rgba(10, 15, 12, 0.1)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Spawn orbs
      const spawnRate = Math.max(40, 80 - gameRef.current.level * 5);
      if (frameRef.current >= nextOrbRef.current) {
        spawnOrb();
        nextOrbRef.current = frameRef.current + spawnRate;
      }

      // Update & draw orbs
      const paddleY = 0.9;
      const px = paddleXRef.current;
      const catchZone = paddleW / w / 2;

      for (let i = orbsRef.current.length - 1; i >= 0; i--) {
        const orb = orbsRef.current[i];
        orb.y += orb.speed;
        orb.rotation += orb.rotSpeed;
        orb.glow = Math.sin(frameRef.current * 0.05 + orb.id) * 0.3 + 0.7;

        // Check catch
        if (orb.y > paddleY - 0.03 && orb.y < paddleY + 0.03) {
          if (Math.abs(orb.x - px) < catchZone + orb.size * 0.5) {
            // CAUGHT!
            orbsRef.current.splice(i, 1);
            spawnParticles(orb.x, orb.y, orb.isGood, orb.isGood ? 25 : 15);

            if (orb.isGood) {
              const comboBonus = Math.min(gameRef.current.combo, 10);
              const points = 10 + comboBonus * 2;
              scorePopupsRef.current.push({ x: orb.x, y: orb.y, text: `+${points}`, life: 40, isGood: true });
              setGame(prev => {
                const newCombo = prev.combo + 1;
                const newLevel = Math.floor(prev.caught / 10) + 1;
                return {
                  ...prev,
                  score: prev.score + points,
                  combo: newCombo,
                  maxCombo: Math.max(prev.maxCombo, newCombo),
                  caught: prev.caught + 1,
                  level: newLevel,
                };
              });
            } else {
              scorePopupsRef.current.push({ x: orb.x, y: orb.y, text: "-1 ❤️", life: 40, isGood: false });
              setGame(prev => {
                const newLives = prev.lives - 1;
                return {
                  ...prev,
                  lives: newLives,
                  combo: 0,
                  gameOver: newLives <= 0,
                };
              });
            }
            continue;
          }
        }

        // Missed
        if (orb.y > 1.05) {
          orbsRef.current.splice(i, 1);
          if (orb.isGood) {
            setGame(prev => ({ ...prev, missed: prev.missed + 1, combo: 0 }));
          }
          continue;
        }

        // Draw orb
        const ox = orb.x * w;
        const oy = orb.y * h;
        const or2 = orb.size * w * 0.5;

        ctx.save();
        ctx.translate(ox, oy);
        ctx.rotate(orb.rotation);

        // Glow
        const glowSize = or2 * (1.5 + orb.glow * 0.5);
        const grad = ctx.createRadialGradient(0, 0, or2 * 0.3, 0, 0, glowSize);
        if (orb.isGood) {
          grad.addColorStop(0, `hsla(${orb.hue}, 70%, 60%, 0.9)`);
          grad.addColorStop(0.4, `hsla(${orb.hue}, 60%, 50%, 0.4)`);
          grad.addColorStop(1, `hsla(${orb.hue}, 50%, 40%, 0)`);
        } else {
          grad.addColorStop(0, `hsla(${orb.hue}, 80%, 55%, 0.9)`);
          grad.addColorStop(0.4, `hsla(${orb.hue}, 70%, 45%, 0.4)`);
          grad.addColorStop(1, `hsla(${orb.hue}, 60%, 35%, 0)`);
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Inner orb
        ctx.fillStyle = orb.isGood ? `hsla(${orb.hue}, 60%, 70%, 0.95)` : `hsla(${orb.hue}, 70%, 60%, 0.95)`;
        ctx.beginPath();
        ctx.arc(0, 0, or2, 0, Math.PI * 2);
        ctx.fill();

        // Term text
        ctx.fillStyle = orb.isGood ? "#fff" : "#fff";
        ctx.font = `bold ${or2 * 0.7}px system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(orb.term, 0, 0);

        ctx.restore();
      }

      // Update & draw particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const pt = particlesRef.current[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.1;
        pt.life++;

        if (pt.life >= pt.maxLife) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        const alpha = 1 - pt.life / pt.maxLife;
        const s = pt.size * alpha;
        ctx.fillStyle = `hsla(${pt.hue}, 70%, 65%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, s, 0, Math.PI * 2);
        ctx.fill();
      }

      // Score popups
      for (let i = scorePopupsRef.current.length - 1; i >= 0; i--) {
        const pop = scorePopupsRef.current[i];
        pop.life--;
        pop.y -= 0.005;

        if (pop.life <= 0) {
          scorePopupsRef.current.splice(i, 1);
          continue;
        }

        const alpha = pop.life / 40;
        ctx.fillStyle = pop.isGood ? `rgba(100, 220, 120, ${alpha})` : `rgba(240, 80, 80, ${alpha})`;
        ctx.font = `bold ${w * 0.025}px system-ui`;
        ctx.textAlign = "center";
        ctx.fillText(pop.text, pop.x * w, pop.y * h);
      }

      // Draw paddle
      const pyPx = paddleY * h;
      const pxPx = px * w;

      // Paddle glow
      const pGrad = ctx.createRadialGradient(pxPx, pyPx, 0, pxPx, pyPx, paddleW);
      pGrad.addColorStop(0, "rgba(100, 180, 110, 0.15)");
      pGrad.addColorStop(1, "rgba(100, 180, 110, 0)");
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(pxPx, pyPx, paddleW, 0, Math.PI * 2);
      ctx.fill();

      // Paddle bar
      ctx.fillStyle = "rgba(100, 180, 110, 0.8)";
      ctx.shadowColor = "rgba(100, 200, 120, 0.6)";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.roundRect(pxPx - paddleW / 2, pyPx - paddleH / 2, paddleW, paddleH, paddleH / 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Combo indicator on paddle
      if (gameRef.current.combo >= 3) {
        ctx.fillStyle = `rgba(255, 200, 50, ${0.5 + Math.sin(frameRef.current * 0.1) * 0.3})`;
        ctx.font = `bold ${w * 0.018}px system-ui`;
        ctx.textAlign = "center";
        ctx.fillText(`${gameRef.current.combo}x COMBO`, pxPx, pyPx - paddleH * 2);
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("mousemove", onMouse);
      canvas.removeEventListener("touchmove", onTouch);
      canvas.removeEventListener("touchstart", onTouch);
    };
  }, [game.started, game.gameOver]);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* HUD */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1.5 text-sm">
            <Trophy className="h-3.5 w-3.5 text-xp" />
            {game.score}
          </Badge>
          <Badge variant="secondary" className="gap-1.5 text-sm">
            <Zap className="h-3.5 w-3.5 text-warning" />
            Lv.{game.level}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              className={`h-5 w-5 transition-all ${i < game.lives ? "text-destructive fill-destructive drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]" : "text-muted-foreground/30"}`}
            />
          ))}
        </div>
      </div>

      {/* Game Canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-border/30 bg-background/30 backdrop-blur-sm" style={{ aspectRatio: "4/3" }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-none"
          style={{ touchAction: "none" }}
        />

        {/* Start Screen */}
        <AnimatePresence>
          {!game.started && !game.gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="text-6xl mb-4"
              >
                🧠
              </motion.div>
              <h2 className="text-2xl font-bold mb-2 text-gradient">Wissens-Fang</h2>
              <p className="text-muted-foreground text-sm mb-1">Fange die grünen AEVO-Begriffe!</p>
              <p className="text-muted-foreground text-xs mb-6">Weiche den roten Begriffen aus</p>
              <Button onClick={startGame} size="lg" className="rounded-xl h-12 px-8">
                <Play className="mr-2 h-5 w-5" />
                Spiel starten
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Over Screen */}
        <AnimatePresence>
          {game.gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="text-5xl mb-3"
              >
                {game.score >= 200 ? "🌟" : game.score >= 100 ? "🎯" : game.score >= 50 ? "💪" : "📚"}
              </motion.div>
              <h2 className="text-2xl font-bold mb-1">Spiel vorbei!</h2>
              <p className="text-muted-foreground text-sm mb-4">
                {game.score >= 200 ? "Meisterlich!" : game.score >= 100 ? "Sehr gut!" : game.score >= 50 ? "Gut gemacht!" : "Weiter üben!"}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6 text-center">
                <div className="rounded-xl bg-card/50 p-3">
                  <p className="text-2xl font-bold text-xp">{game.score}</p>
                  <p className="text-xs text-muted-foreground">Punkte</p>
                </div>
                <div className="rounded-xl bg-card/50 p-3">
                  <p className="text-2xl font-bold text-primary">{game.caught}</p>
                  <p className="text-xs text-muted-foreground">Gefangen</p>
                </div>
                <div className="rounded-xl bg-card/50 p-3">
                  <p className="text-2xl font-bold text-warning">{game.maxCombo}x</p>
                  <p className="text-xs text-muted-foreground">Max Combo</p>
                </div>
                <div className="rounded-xl bg-card/50 p-3">
                  <p className="text-2xl font-bold">Lv.{game.level}</p>
                  <p className="text-xs text-muted-foreground">Erreicht</p>
                </div>
              </div>

              <Button onClick={startGame} size="lg" className="rounded-xl h-12 px-8">
                <RotateCcw className="mr-2 h-5 w-5" />
                Nochmal spielen
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Instructions */}
      {game.started && !game.gameOver && (
        <p className="text-center text-xs text-muted-foreground mt-2">
          Bewege die Maus / den Finger um den Fänger zu steuern
        </p>
      )}
    </div>
  );
}
