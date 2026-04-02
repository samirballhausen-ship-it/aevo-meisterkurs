"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, RotateCcw } from "lucide-react";
import { ClawbuisLogo } from "@/components/clawbuis-badge";

// ─── Constants ───────────────────────────────────────
const GRAVITY = 0.38;
const JUMP_VEL = -10.5;
const BOOST_VEL = -16;
const ACCEL = 0.8;
const FRICTION = 0.88;
const PLAYER_W = 30;
const PLAYER_H = 34;
const PLAT_W = 65;
const PLAT_H = 12;
const SCROLL_LINE_PCT = 0.35;
const GAP_MIN = 55;
const GAP_MAX = 105;
const HS_KEY = "clawbuis-jump-high";

// ─── Types ───────────────────────────────────────────
interface Plat {
  x: number;
  y: number;
  w: number;
  type: "normal" | "moving" | "breaking" | "boost";
  broken: boolean;
  dx: number;
}

interface GameData {
  player: { x: number; y: number; vx: number; vy: number };
  platforms: Plat[];
  topY: number;
  score: number;
  keys: Set<string>;
  touchDir: number; // -1 left, 0 none, 1 right
}

// ─── Draw the Clawbuis claw on Canvas ────────────────
function drawClaw(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  const s = size / 64;
  ctx.save();
  ctx.translate(cx - 32 * s, cy - 40 * s);
  ctx.scale(s, s);

  // Create gradient for claws
  const grad = ctx.createLinearGradient(0, 0, 64, 76);
  grad.addColorStop(0, "#2dd4bf");
  grad.addColorStop(1, "#c29b62");

  ctx.strokeStyle = grad;
  ctx.lineCap = "round";

  // Left outer claw
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(20, 52);
  ctx.bezierCurveTo(16, 44, 9, 34, 7, 24);
  ctx.bezierCurveTo(5, 16, 7, 10, 11, 10);
  ctx.stroke();

  // Left inner
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(23, 46);
  ctx.bezierCurveTo(21, 36, 18, 22, 19, 12);
  ctx.bezierCurveTo(20, 6, 22, 2, 25, 4);
  ctx.stroke();

  // Center
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(30, 44);
  ctx.bezierCurveTo(29, 32, 30, 18, 32, 6);
  ctx.bezierCurveTo(33, 1, 35, 0, 36, 3);
  ctx.stroke();

  // Right inner
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(38, 46);
  ctx.bezierCurveTo(40, 36, 43, 22, 44, 12);
  ctx.bezierCurveTo(45, 6, 43, 2, 40, 4);
  ctx.stroke();

  // Right outer
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(44, 52);
  ctx.bezierCurveTo(48, 44, 55, 34, 57, 24);
  ctx.bezierCurveTo(59, 16, 57, 12, 53, 12);
  ctx.stroke();

  // Gold gem
  ctx.fillStyle = "rgba(194, 155, 98, 0.7)";
  ctx.beginPath();
  ctx.arc(32, 50, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 253, 232, 0.85)";
  ctx.beginPath();
  ctx.arc(32, 50, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ─── Platform rendering ──────────────────────────────
function drawPlatform(ctx: CanvasRenderingContext2D, p: Plat) {
  if (p.broken) return;
  const r = 5;

  // Glow for boost platforms
  if (p.type === "boost") {
    ctx.fillStyle = "rgba(194, 155, 98, 0.15)";
    ctx.beginPath();
    ctx.roundRect(p.x - 4, p.y - 4, p.w + 8, PLAT_H + 8, r + 2);
    ctx.fill();
  }

  // Main platform
  switch (p.type) {
    case "normal":
      ctx.fillStyle = "rgba(101, 163, 126, 0.85)";
      break;
    case "moving":
      ctx.fillStyle = "rgba(45, 212, 191, 0.85)";
      break;
    case "breaking":
      ctx.fillStyle = "rgba(200, 100, 80, 0.85)";
      break;
    case "boost":
      ctx.fillStyle = "rgba(194, 155, 98, 0.95)";
      break;
  }

  ctx.beginPath();
  ctx.roundRect(p.x, p.y, p.w, PLAT_H, r);
  ctx.fill();

  // Indicator icons
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "9px sans-serif";
  ctx.textAlign = "center";
  if (p.type === "boost") ctx.fillText("▲", p.x + p.w / 2, p.y + PLAT_H - 2);
  if (p.type === "moving") ctx.fillText("◆", p.x + p.w / 2, p.y + PLAT_H - 2);
  if (p.type === "breaking") ctx.fillText("✕", p.x + p.w / 2, p.y + PLAT_H - 2);
}

// ─── Random platform type ────────────────────────────
function randomType(score: number): Plat["type"] {
  const diff = Math.min(score / 5000, 1);
  const r = Math.random();
  if (r < 0.04 + diff * 0.04) return "boost";
  if (r < 0.14 + diff * 0.14) return "breaking";
  if (r < 0.24 + diff * 0.1) return "moving";
  return "normal";
}

// ─── Component ───────────────────────────────────────
export function DoodleJump() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dataRef = useRef<GameData | null>(null);
  const rafRef = useRef(0);
  const dprRef = useRef(1);

  const [phase, setPhase] = useState<"menu" | "play" | "over">("menu");
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [displayScore, setDisplayScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Load high score
  useEffect(() => {
    setHighScore(parseInt(localStorage.getItem(HS_KEY) ?? "0", 10));
    dprRef.current = window.devicePixelRatio || 1;
  }, []);

  // Measure container — uses ResizeObserver so it works when tab becomes visible
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) {
        const h = Math.min(440, window.innerHeight - 260);
        setDims((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ─── Init game ───
  const startGame = useCallback(() => {
    // Fallback measure if dims are still 0
    let W = dims.w;
    let H = dims.h;
    if (W === 0 && containerRef.current) {
      W = containerRef.current.clientWidth;
      H = Math.min(440, window.innerHeight - 260);
      setDims({ w: W, h: H });
    }
    if (W === 0) return;

    const platforms: Plat[] = [];
    let y = H - 40;

    // Generate initial platforms
    for (let i = 0; i < 18; i++) {
      platforms.push({
        x: Math.random() * (W - PLAT_W),
        y,
        w: PLAT_W,
        type: i < 4 ? "normal" : randomType(0),
        broken: false,
        dx: i > 3 && Math.random() < 0.15 ? (Math.random() > 0.5 ? 1.5 : -1.5) : 0,
      });
      y -= GAP_MIN + Math.random() * (GAP_MAX - GAP_MIN);
    }

    // Ensure first platform type is normal and player starts on it
    platforms[0].type = "normal";
    platforms[0].x = W / 2 - PLAT_W / 2;

    dataRef.current = {
      player: {
        x: platforms[0].x + PLAT_W / 2 - PLAYER_W / 2,
        y: platforms[0].y - PLAYER_H,
        vx: 0,
        vy: 0,
      },
      platforms,
      topY: y,
      score: 0,
      keys: new Set(),
      touchDir: 0,
    };

    setDisplayScore(0);
    setPhase("play");
  }, [dims]);

  // ─── Input handlers ───
  useEffect(() => {
    if (phase !== "play") return;
    const g = () => dataRef.current;

    const onKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "a", "d"].includes(e.key)) {
        e.preventDefault();
        g()?.keys.add(e.key);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      g()?.keys.delete(e.key);
    };

    const onTouchStart = (e: TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const d = g();
      if (d) d.touchDir = x < rect.width / 2 ? -1 : 1;
    };
    const onTouchEnd = () => {
      const d = g();
      if (d) d.touchDir = 0;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    const canvas = canvasRef.current;
    canvas?.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas?.addEventListener("touchend", onTouchEnd);
    canvas?.addEventListener("touchcancel", onTouchEnd);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas?.removeEventListener("touchstart", onTouchStart);
      canvas?.removeEventListener("touchend", onTouchEnd);
      canvas?.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [phase]);

  // ─── Game loop ───
  useEffect(() => {
    if (phase !== "play" || dims.w === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = dprRef.current;
    const W = dims.w;
    const H = dims.h;

    canvas.width = W * dpr;
    canvas.height = H * dpr;

    function loop() {
      const g = dataRef.current;
      if (!g) return;

      const p = g.player;
      const scrollLine = H * SCROLL_LINE_PCT;

      // ── Input ──
      let inputX = 0;
      if (g.keys.has("ArrowLeft") || g.keys.has("a")) inputX -= 1;
      if (g.keys.has("ArrowRight") || g.keys.has("d")) inputX += 1;
      if (g.touchDir !== 0) inputX = g.touchDir;
      p.vx += inputX * ACCEL;
      p.vx *= FRICTION;

      // ── Physics ──
      p.vy += GRAVITY;
      p.x += p.vx;
      p.y += p.vy;

      // Wrap horizontally
      if (p.x > W) p.x = -PLAYER_W;
      if (p.x + PLAYER_W < 0) p.x = W;

      // ── Camera scroll ──
      if (p.y < scrollLine) {
        const delta = scrollLine - p.y;
        p.y = scrollLine;
        for (const pl of g.platforms) pl.y += delta;
        g.topY += delta;
        g.score += delta;
        setDisplayScore(Math.floor(g.score / 10));
      }

      // ── Collision (only when falling) ──
      if (p.vy > 0) {
        for (const pl of g.platforms) {
          if (pl.broken) continue;
          const feet = p.y + PLAYER_H;
          const prevFeet = feet - p.vy;
          if (
            prevFeet <= pl.y + 2 &&
            feet >= pl.y &&
            p.x + PLAYER_W > pl.x + 4 &&
            p.x < pl.x + pl.w - 4
          ) {
            p.y = pl.y - PLAYER_H;
            if (pl.type === "boost") {
              p.vy = BOOST_VEL;
            } else if (pl.type === "breaking") {
              pl.broken = true;
              // No jump from breaking platforms
            } else {
              p.vy = JUMP_VEL;
            }
          }
        }
      }

      // ── Update moving platforms ──
      for (const pl of g.platforms) {
        if (pl.type === "moving" && !pl.broken) {
          pl.x += pl.dx;
          if (pl.x <= 0 || pl.x + pl.w >= W) pl.dx *= -1;
        }
      }

      // ── Remove platforms below + generate above ──
      g.platforms = g.platforms.filter((pl) => pl.y < H + 60);

      while (g.topY > -30) {
        g.topY -= GAP_MIN + Math.random() * (GAP_MAX - GAP_MIN);
        const type = randomType(g.score);
        g.platforms.push({
          x: Math.random() * (W - PLAT_W),
          y: g.topY,
          w: PLAT_W,
          type,
          broken: false,
          dx: type === "moving" ? (Math.random() > 0.5 ? 1.5 : -1.5) : 0,
        });
      }

      // ── Game over ──
      if (p.y > H + 20) {
        const finalScore = Math.floor(g.score / 10);
        setDisplayScore(finalScore);
        const hs = parseInt(localStorage.getItem(HS_KEY) ?? "0", 10);
        if (finalScore > hs) {
          localStorage.setItem(HS_KEY, finalScore.toString());
          setHighScore(finalScore);
        }
        setPhase("over");
        return;
      }

      // ── Render ──
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#0a1a15");
      bg.addColorStop(1, "#0f2520");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Background particles (stars)
      ctx.fillStyle = "rgba(45, 212, 191, 0.08)";
      for (let i = 0; i < 35; i++) {
        const sx = ((i * 137.508) % W);
        const sy = ((i * 73.251 + g.score * 0.05) % (H + 40)) - 20;
        ctx.beginPath();
        ctx.arc(sx, sy, i % 3 === 0 ? 1.5 : 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Platforms
      for (const pl of g.platforms) {
        drawPlatform(ctx, pl);
      }

      // Player (claw character)
      ctx.save();
      // Slight tilt based on horizontal velocity
      ctx.translate(p.x + PLAYER_W / 2, p.y + PLAYER_H / 2);
      ctx.rotate(p.vx * 0.03);
      ctx.translate(-(p.x + PLAYER_W / 2), -(p.y + PLAYER_H / 2));

      drawClaw(ctx, p.x + PLAYER_W / 2, p.y + PLAYER_H / 2, PLAYER_W + 4);

      // Boost trail
      if (p.vy < JUMP_VEL) {
        ctx.fillStyle = "rgba(194, 155, 98, 0.3)";
        for (let i = 1; i <= 3; i++) {
          ctx.beginPath();
          ctx.arc(p.x + PLAYER_W / 2, p.y + PLAYER_H + i * 8, 3 - i * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // Score HUD
      ctx.fillStyle = "rgba(45, 212, 191, 0.8)";
      ctx.font = "bold 15px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Höhe: ${Math.floor(g.score / 10)}`, 10, 24);

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, dims]);

  // ─── Menu screen ───
  if (phase === "menu") {
    return (
      <div ref={containerRef} className="text-center py-6 space-y-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring" }}
          className="relative w-24 h-24 mx-auto flex items-center justify-center"
        >
          <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-br from-[#2dd4bf] to-[#c29b62] rounded-full" />
          <ClawbuisLogo className="h-16 w-16 drop-shadow-[0_0_15px_rgba(45,212,191,0.4)]" />
        </motion.div>

        <div>
          <h3 className="text-lg font-bold bg-gradient-to-r from-[#2dd4bf] to-[#c29b62] bg-clip-text text-transparent">
            Clawbuis Jump
          </h3>
          <p className="text-muted-foreground text-xs mt-1">
            Spring so hoch du kannst! Steuere mit ← → oder Touch.
          </p>
        </div>

        {highScore > 0 && (
          <Badge variant="outline" className="border-[#c29b62]/30 text-[#c29b62]">
            Highscore: {highScore}
          </Badge>
        )}

        <Button
          onClick={startGame}
          className="rounded-xl bg-gradient-to-r from-[#2dd4bf]/80 to-[#c29b62]/80 hover:from-[#2dd4bf] hover:to-[#c29b62]"
        >
          <Rocket className="h-4 w-4 mr-1.5" />
          Spiel starten
        </Button>
      </div>
    );
  }

  // ─── Game over overlay ───
  if (phase === "over") {
    return (
      <div className="space-y-3">
        <div
          ref={containerRef}
          className="relative w-full rounded-xl overflow-hidden bg-[#0a1a15]"
          style={{ height: dims.h || 440 }}
        >
          <canvas ref={canvasRef} className="w-full h-full" style={{ width: dims.w, height: dims.h }} />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="text-center space-y-3">
              <p className="text-2xl font-bold bg-gradient-to-r from-[#2dd4bf] to-[#c29b62] bg-clip-text text-transparent">
                Game Over
              </p>
              <div>
                <p className="text-3xl font-bold text-white tabular-nums">{displayScore}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Höhe erreicht</p>
              </div>
              {displayScore >= highScore && displayScore > 0 && (
                <Badge className="bg-[#c29b62]/20 text-[#c29b62] border-[#c29b62]/30">
                  🏆 Neuer Highscore!
                </Badge>
              )}
              <div className="flex gap-2 justify-center pt-1">
                <Button
                  size="sm"
                  onClick={startGame}
                  className="rounded-xl bg-gradient-to-r from-[#2dd4bf]/80 to-[#c29b62]/80 hover:from-[#2dd4bf] hover:to-[#c29b62]"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Nochmal
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPhase("menu")}
                  className="rounded-xl border-border/30"
                >
                  Menü
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
        <p className="text-center text-[9px] text-muted-foreground">Highscore: {highScore}</p>
      </div>
    );
  }

  // ─── Playing ───
  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="relative w-full rounded-xl overflow-hidden"
        style={{ height: dims.h || 440 }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none"
          style={{ width: dims.w, height: dims.h }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
        <span>← → oder Touch zum Steuern</span>
        <span>Höhe: {displayScore}</span>
      </div>
    </div>
  );
}
