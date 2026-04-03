"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClawbuisLogo } from "@/components/clawbuis-badge";
import {
  Trophy,
  RotateCcw,
  ShoppingCart,
  Crosshair,
  Check,
  Lock,
  Sparkles,
  ChevronRight,
} from "lucide-react";

// ─── Upgrades (10 tiers) ─────────────────────────────
const UPGRADES = [
  { id: "click1", name: "Mech. Keyboard", desc: "+2 pro Klick", emoji: "⌨️", baseCost: 15, perSec: 0, clickBonus: 2 },
  { id: "auto1", name: "KI-Assistent", desc: "+1/s", emoji: "🤖", baseCost: 25, perSec: 1, clickBonus: 0 },
  { id: "auto2", name: "Cloud Server", desc: "+8/s", emoji: "☁️", baseCost: 200, perSec: 8, clickBonus: 0 },
  { id: "click2", name: "Neurolink", desc: "+10 pro Klick", emoji: "🧠", baseCost: 500, perSec: 0, clickBonus: 10 },
  { id: "auto3", name: "Agent Swarm", desc: "+50/s", emoji: "🐝", baseCost: 3000, perSec: 50, clickBonus: 0 },
  { id: "auto4", name: "Clawbuis HQ", desc: "+200/s", emoji: "🏢", baseCost: 15000, perSec: 200, clickBonus: 0 },
  { id: "click3", name: "Quantum Core", desc: "+25 pro Klick", emoji: "⚛️", baseCost: 25000, perSec: 0, clickBonus: 25 },
  { id: "auto5", name: "Neural Network", desc: "+500/s", emoji: "🕸️", baseCost: 75000, perSec: 500, clickBonus: 0 },
  { id: "auto6", name: "Multiverse Engine", desc: "+2.000/s", emoji: "🌀", baseCost: 500000, perSec: 2000, clickBonus: 0 },
  { id: "auto7", name: "Singularity", desc: "+10.000/s", emoji: "✨", baseCost: 5000000, perSec: 10000, clickBonus: 0 },
];

// ─── Levels ──────────────────────────────────────────
const LEVELS = [
  { lines: 0, title: "Praktikant", icon: "👶" },
  { lines: 100, title: "Junior Dev", icon: "🐣" },
  { lines: 500, title: "Developer", icon: "💻" },
  { lines: 2500, title: "Senior Dev", icon: "🔥" },
  { lines: 10000, title: "Tech Lead", icon: "⚡" },
  { lines: 50000, title: "CTO", icon: "👑" },
  { lines: 250000, title: "Clawbuis Partner", icon: "🌟" },
  { lines: 1000000, title: "Code God", icon: "✨" },
  { lines: 10000000, title: "Singularity", icon: "🔮" },
];

// ─── Milestones ──────────────────────────────────────
const MILESTONES = [
  { id: "m1", name: "Hello World", desc: "100 Zeilen geschrieben", threshold: 100, reward: "+1 Klick", clickBonus: 1, perSecBonus: 0 },
  { id: "m2", name: "First Commit", desc: "1.000 Zeilen", threshold: 1000, reward: "+5/s", clickBonus: 0, perSecBonus: 5 },
  { id: "m3", name: "Code Ninja", desc: "10.000 Zeilen", threshold: 10000, reward: "+5 Klick", clickBonus: 5, perSecBonus: 0 },
  { id: "m4", name: "Open Source Hero", desc: "100.000 Zeilen", threshold: 100000, reward: "+100/s", clickBonus: 0, perSecBonus: 100 },
  { id: "m5", name: "Unicorn Dev", desc: "1M Zeilen – Prestige!", threshold: 1000000, reward: "Prestige freigeschaltet", clickBonus: 0, perSecBonus: 0 },
  { id: "m6", name: "Clawbuis Elite", desc: "10M Zeilen", threshold: 10000000, reward: "+50 Klick, +1.000/s", clickBonus: 50, perSecBonus: 1000 },
];

// ─── Prestige ────────────────────────────────────────
const PRESTIGE_THRESHOLD = 1_000_000;
function getPrestigeMultiplier(level: number) {
  return Math.pow(1.5, level);
}

// ─── Computed helpers ────────────────────────────────
function getMilestoneBonus(milestones: string[]) {
  let click = 0,
    perSec = 0;
  for (const id of milestones) {
    const m = MILESTONES.find((ms) => ms.id === id);
    if (m) {
      click += m.clickBonus;
      perSec += m.perSecBonus;
    }
  }
  return { click, perSec };
}

function getEffective(game: GameState) {
  const mult = getPrestigeMultiplier(game.prestigeLevel);
  const bonus = getMilestoneBonus(game.milestones);
  return {
    click: Math.max(1, Math.floor((game.clickPower + bonus.click) * mult)),
    perSec: Math.floor((game.perSecond + bonus.perSec) * mult),
    mult,
  };
}

// ─── Game State ──────────────────────────────────────
interface GameState {
  codeLines: number;
  totalEarned: number;
  clickPower: number;
  perSecond: number;
  upgrades: Record<string, number>;
  level: number;
  started: boolean;
  prestigeLevel: number;
  milestones: string[];
}

const SAVE_KEY = "clawbuis-clicker-save";

function loadGame(): GameState {
  try {
    const s = localStorage.getItem(SAVE_KEY);
    if (s) {
      const p = JSON.parse(s);
      return {
        codeLines: p.codeLines ?? 0,
        totalEarned: p.totalEarned ?? 0,
        clickPower: p.clickPower ?? 1,
        perSecond: p.perSecond ?? 0,
        upgrades: p.upgrades ?? {},
        level: p.level ?? 0,
        started: p.started ?? false,
        prestigeLevel: p.prestigeLevel ?? 0,
        milestones: p.milestones ?? [],
      };
    }
  } catch {}
  return {
    codeLines: 0,
    totalEarned: 0,
    clickPower: 1,
    perSecond: 0,
    upgrades: {},
    level: 0,
    started: false,
    prestigeLevel: 0,
    milestones: [],
  };
}

function formatNum(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return Math.floor(n).toString();
}

// ─── Component ───────────────────────────────────────
export function ClawbuisClicker() {
  const { user } = useAuth();
  const [game, setGame] = useState<GameState>(loadGame);
  const [tab, setTab] = useState<"click" | "shop" | "goals">("click");
  const [clicks, setClicks] = useState<{ id: number; x: number; y: number; amount: number }[]>([]);
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number; dx: number; dy: number; color: string }[]>([]);
  const [pulse, setPulse] = useState(false);
  const [levelUp, setLevelUp] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [confirmPrestige, setConfirmPrestige] = useState(false);
  const clickIdRef = useRef(0);
  const sparkleIdRef = useRef(0);
  const isGuest = !user || user.uid === "guest-user";

  const eff = getEffective(game);
  const canPrestige = game.milestones.includes("m5") && game.totalEarned >= PRESTIGE_THRESHOLD;

  // ─── Firestore load ───
  useEffect(() => {
    if (isGuest || loaded) return;
    async function loadCloud() {
      try {
        const snap = await getDoc(doc(db, "clicker", user!.uid));
        if (snap.exists()) {
          const cloud = snap.data() as GameState;
          const local = loadGame();
          if (cloud.totalEarned > local.totalEarned) {
            setGame({
              ...cloud,
              prestigeLevel: cloud.prestigeLevel ?? 0,
              milestones: cloud.milestones ?? [],
            });
          }
        }
      } catch {}
      setLoaded(true);
    }
    loadCloud();
  }, [user, isGuest, loaded]);

  // ─── Auto-save ───
  useEffect(() => {
    const t = setInterval(() => {
      localStorage.setItem(SAVE_KEY, JSON.stringify(game));
      if (!isGuest && user) {
        setDoc(doc(db, "clicker", user.uid), game).catch(() => {});
      }
    }, 5000);
    return () => clearInterval(t);
  }, [game, user, isGuest]);

  // ─── Auto-generate ───
  useEffect(() => {
    if (eff.perSec <= 0) return;
    const t = setInterval(() => {
      setGame((p) => {
        const effPs = getEffective(p).perSec;
        const nl = p.codeLines + effPs;
        const nt = p.totalEarned + effPs;
        const newLvl = LEVELS.findLastIndex((l) => nt >= l.lines);
        if (newLvl > p.level) setLevelUp(true);
        return { ...p, codeLines: nl, totalEarned: nt, level: Math.max(p.level, newLvl) };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [eff.perSec]);

  // ─── Milestone check ───
  useEffect(() => {
    const newMilestones = MILESTONES.filter(
      (m) => game.totalEarned >= m.threshold && !game.milestones.includes(m.id)
    ).map((m) => m.id);

    if (newMilestones.length > 0) {
      setGame((p) => ({ ...p, milestones: [...p.milestones, ...newMilestones] }));
    }
  }, [game.totalEarned, game.milestones]);

  // ─── Save on unload ───
  useEffect(() => {
    const h = () => {
      localStorage.setItem(SAVE_KEY, JSON.stringify(game));
      if (!isGuest && user) {
        try { setDoc(doc(db, "clicker", user.uid), game); } catch {}
      }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [game, user, isGuest]);

  // ─── Level up dismiss ───
  useEffect(() => {
    if (levelUp) {
      const t = setTimeout(() => setLevelUp(false), 2500);
      return () => clearTimeout(t);
    }
  }, [levelUp]);

  // ─── Prestige confirm timeout ───
  useEffect(() => {
    if (confirmPrestige) {
      const t = setTimeout(() => setConfirmPrestige(false), 3000);
      return () => clearTimeout(t);
    }
  }, [confirmPrestige]);

  // ─── Click handler ───
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = ++clickIdRef.current;

      setPulse(true);
      setTimeout(() => setPulse(false), 120);

      // Floating number
      setClicks((p) => [...p.slice(-6), { id, x, y, amount: eff.click }]);

      // Sparkle particles
      const newSparkles = Array.from({ length: 5 }, () => {
        const angle = Math.random() * Math.PI * 2;
        const dist = 25 + Math.random() * 35;
        return {
          id: ++sparkleIdRef.current,
          x,
          y,
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
          color: Math.random() > 0.5 ? "#2dd4bf" : "#c29b62",
        };
      });
      setSparkles((p) => [...p, ...newSparkles].slice(-20));

      setGame((p) => {
        const effClick = getEffective(p).click;
        const nl = p.codeLines + effClick;
        const nt = p.totalEarned + effClick;
        const newLvl = LEVELS.findLastIndex((l) => nt >= l.lines);
        if (newLvl > p.level) setLevelUp(true);
        return { ...p, codeLines: nl, totalEarned: nt, level: Math.max(p.level, newLvl), started: true };
      });
    },
    [eff.click]
  );

  // ─── Buy upgrade ───
  const buyUpgrade = useCallback(
    (id: string) => {
      const u = UPGRADES.find((u) => u.id === id)!;
      const owned = game.upgrades[id] ?? 0;
      const cost = Math.round(u.baseCost * Math.pow(1.35, owned));
      if (game.codeLines < cost) return;
      setGame((p) => ({
        ...p,
        codeLines: p.codeLines - cost,
        clickPower: p.clickPower + u.clickBonus,
        perSecond: p.perSecond + u.perSec,
        upgrades: { ...p.upgrades, [id]: owned + 1 },
      }));
    },
    [game]
  );

  // ─── Prestige ───
  const handlePrestige = useCallback(() => {
    if (!canPrestige) return;
    if (!confirmPrestige) {
      setConfirmPrestige(true);
      return;
    }
    setGame((p) => ({
      ...p,
      codeLines: 0,
      clickPower: 1,
      perSecond: 0,
      upgrades: {},
      prestigeLevel: p.prestigeLevel + 1,
      // Keep: totalEarned, milestones, level, started
    }));
    setConfirmPrestige(false);
    setTab("click");
  }, [canPrestige, confirmPrestige]);

  const currentLevel = LEVELS[game.level] ?? LEVELS[0];
  const nextLevel = LEVELS[game.level + 1];
  const levelPct = nextLevel
    ? Math.min(((game.totalEarned - LEVELS[game.level].lines) / (nextLevel.lines - LEVELS[game.level].lines)) * 100, 100)
    : 100;

  // ─── Start screen ───
  if (!game.started) {
    return (
      <div className="text-center py-4 space-y-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring" }}
          className="relative w-32 h-32 mx-auto flex items-center justify-center"
        >
          <div className="absolute inset-0 blur-xl opacity-30 bg-gradient-to-br from-[#2dd4bf] to-[#c29b62] rounded-full" />
          <ClawbuisLogo className="h-20 w-20 drop-shadow-[0_0_20px_rgba(45,212,191,0.4)]" />
        </motion.div>
        <div>
          <h3 className="text-lg font-bold bg-gradient-to-r from-[#2dd4bf] to-[#c29b62] bg-clip-text text-transparent">
            Clawbuis Code Empire
          </h3>
          <p className="text-muted-foreground text-xs mt-1">Baue dein Software-Imperium. Klicke. Upgrade. Prestige.</p>
        </div>
        <Button
          onClick={(e) => handleClick(e)}
          className="rounded-xl bg-gradient-to-r from-[#2dd4bf]/80 to-[#c29b62]/80 hover:from-[#2dd4bf] hover:to-[#c29b62]"
        >
          Empire starten
        </Button>
      </div>
    );
  }

  // ─── Main game ───
  return (
    <div className="space-y-3">
      {/* Level Up Celebration */}
      <AnimatePresence>
        {levelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-x-4 top-4 z-50 rounded-xl bg-gradient-to-r from-[#2dd4bf]/20 to-[#c29b62]/20 border border-[#c29b62]/40 p-3 text-center backdrop-blur-xl"
          >
            <p className="text-sm font-bold">{currentLevel.icon} Level Up!</p>
            <p className="text-xs text-[#c29b62]">{currentLevel.title}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xl font-bold tabular-nums bg-gradient-to-r from-[#2dd4bf] to-[#c29b62] bg-clip-text text-transparent">
            {formatNum(game.codeLines)}
          </p>
          <p className="text-[9px] text-muted-foreground">Zeilen Code</p>
        </div>
        <div className="text-right space-y-0.5">
          <Badge variant="outline" className="text-[10px] border-[#c29b62]/30 text-[#c29b62]">
            {currentLevel.icon} {currentLevel.title}
          </Badge>
          <div className="flex items-center gap-1.5 justify-end">
            {eff.perSec > 0 && (
              <span className="text-[9px] text-muted-foreground">{formatNum(eff.perSec)}/s</span>
            )}
            <span className="text-[9px] text-muted-foreground">+{eff.click}/klick</span>
            {game.prestigeLevel > 0 && (
              <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-purple-500/30 text-purple-400">
                P{game.prestigeLevel} · {eff.mult.toFixed(1)}x
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Level Bar */}
      <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <motion.div className="h-full bg-gradient-to-r from-[#2dd4bf] to-[#c29b62]" animate={{ width: `${levelPct}%` }} />
      </div>

      {/* Inner Tabs */}
      <div className="flex gap-1 p-1 bg-muted/30 rounded-xl">
        {(
          [
            { id: "click" as const, label: "Klick", Icon: Crosshair },
            { id: "shop" as const, label: "Shop", Icon: ShoppingCart },
            { id: "goals" as const, label: "Ziele", Icon: Trophy },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
              tab === t.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground/60"
            }`}
          >
            <t.Icon className="h-3 w-3" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ CLICK TAB ═══ */}
      {tab === "click" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          {/* Click Area with SVG Logo + Shader Effects */}
          <div className="flex justify-center py-2">
            <motion.button
              onClick={handleClick}
              whileTap={{ scale: 0.88 }}
              className="relative h-36 w-36 rounded-3xl cursor-pointer select-none"
            >
              {/* Ambient glow */}
              <motion.div
                className="absolute inset-0 rounded-full blur-xl"
                animate={{
                  opacity: pulse ? 0.5 : 0.2,
                  scale: pulse ? 1.2 : 1,
                }}
                transition={{ duration: 0.15 }}
                style={{
                  background: "radial-gradient(circle, rgba(45,212,191,0.4), rgba(194,155,98,0.1), transparent)",
                }}
              />

              {/* Pulsing ring */}
              <motion.div
                className="absolute inset-3 rounded-full border-2 border-[#2dd4bf]/15"
                animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.05, 0.2] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Second ring (offset timing) */}
              <motion.div
                className="absolute inset-5 rounded-full border border-[#c29b62]/10"
                animate={{ scale: [1.05, 0.95, 1.05], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* SVG Logo */}
              <motion.div
                animate={
                  pulse
                    ? { scale: [1, 1.15, 1], filter: ["brightness(1)", "brightness(1.6)", "brightness(1)"] }
                    : {}
                }
                transition={{ duration: 0.15 }}
                className="relative h-full w-full flex items-center justify-center"
              >
                <ClawbuisLogo className="h-24 w-24 drop-shadow-[0_0_20px_rgba(45,212,191,0.4)] drop-shadow-[0_0_40px_rgba(194,155,98,0.2)]" />
              </motion.div>

              {/* Sparkle particles */}
              <AnimatePresence>
                {sparkles.map((s) => (
                  <motion.div
                    key={s.id}
                    initial={{ scale: 1, opacity: 0.9, x: 0, y: 0 }}
                    animate={{ scale: 0, opacity: 0, x: s.dx, y: s.dy }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
                    style={{ left: s.x, top: s.y, background: s.color, boxShadow: `0 0 4px ${s.color}` }}
                  />
                ))}
              </AnimatePresence>

              {/* Floating +N numbers */}
              <AnimatePresence>
                {clicks.map((c) => (
                  <motion.span
                    key={c.id}
                    initial={{ opacity: 1, y: 0, scale: 1.2 }}
                    animate={{ opacity: 0, y: -50, scale: 0.5 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.55 }}
                    className="absolute text-sm font-bold pointer-events-none"
                    style={{ left: c.x, top: c.y, color: "#c29b62", textShadow: "0 0 8px rgba(194,155,98,0.6)" }}
                  >
                    +{c.amount}
                  </motion.span>
                ))}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Quick stats under click area */}
          <div className="text-center text-[10px] text-muted-foreground">
            {eff.perSec > 0 && <span>{formatNum(eff.perSec)} Zeilen/Sek</span>}
            {eff.perSec > 0 && " · "}
            <span>Gesamt: {formatNum(game.totalEarned)}</span>
          </div>
        </motion.div>
      )}

      {/* ═══ SHOP TAB ═══ */}
      {tab === "shop" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5">
          <p className="text-[10px] font-medium text-muted-foreground">
            {UPGRADES.length} Upgrades · {Object.values(game.upgrades).reduce((a, b) => a + b, 0)} gekauft
          </p>
          {UPGRADES.map((u) => {
            const owned = game.upgrades[u.id] ?? 0;
            const cost = Math.round(u.baseCost * Math.pow(1.35, owned));
            const canBuy = game.codeLines >= cost;

            return (
              <motion.button
                key={u.id}
                onClick={() => buyUpgrade(u.id)}
                disabled={!canBuy}
                whileHover={canBuy ? { scale: 1.01 } : {}}
                whileTap={canBuy ? { scale: 0.98 } : {}}
                className={`w-full flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                  canBuy
                    ? "border-[#c29b62]/30 bg-[#c29b62]/5 hover:bg-[#c29b62]/10 cursor-pointer"
                    : "border-border/20 opacity-30 cursor-not-allowed"
                }`}
              >
                <div className="h-10 w-10 shrink-0 rounded-lg bg-muted/30 flex items-center justify-center text-lg">
                  {u.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium">{u.name}</span>
                    {owned > 0 && (
                      <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-[#c29b62]/30 text-[#c29b62]">
                        {owned}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[9px] text-muted-foreground">{u.desc}</p>
                </div>
                <span className={`text-xs font-mono shrink-0 ${canBuy ? "text-[#c29b62]" : ""}`}>
                  {formatNum(cost)}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {/* ═══ GOALS TAB ═══ */}
      {tab === "goals" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Milestones */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Meilensteine · {game.milestones.length}/{MILESTONES.length}
            </p>
            {MILESTONES.map((m) => {
              const achieved = game.milestones.includes(m.id);
              const progress = Math.min(game.totalEarned / m.threshold, 1);
              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                    achieved
                      ? "border-[#2dd4bf]/30 bg-[#2dd4bf]/5"
                      : "border-border/20 opacity-60"
                  }`}
                >
                  <div
                    className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center ${
                      achieved ? "bg-[#2dd4bf]/20 text-[#2dd4bf]" : "bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    {achieved ? <Check className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium">{m.name}</span>
                      {achieved && (
                        <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-[#2dd4bf]/30 text-[#2dd4bf]">
                          ✓
                        </Badge>
                      )}
                    </div>
                    <p className="text-[9px] text-muted-foreground">{m.desc}</p>
                    {!achieved && (
                      <div className="h-1 rounded-full bg-muted/30 mt-1 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#2dd4bf]/50 to-[#c29b62]/50 transition-all"
                          style={{ width: `${progress * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-muted-foreground shrink-0">{m.reward}</span>
                </div>
              );
            })}
          </div>

          {/* Prestige Section */}
          <div className="space-y-2">
            <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
              <RotateCcw className="h-3 w-3" />
              Prestige
            </p>
            <div
              className={`rounded-xl border p-3 space-y-2 ${
                canPrestige
                  ? "border-purple-500/30 bg-purple-500/5"
                  : "border-border/20 opacity-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium">
                    Prestige Level: <span className="text-purple-400">{game.prestigeLevel}</span>
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    Multiplikator: {eff.mult.toFixed(1)}x → {getPrestigeMultiplier(game.prestigeLevel + 1).toFixed(1)}x
                  </p>
                </div>
                {canPrestige ? (
                  <Button
                    size="sm"
                    onClick={handlePrestige}
                    className={`text-[10px] h-7 rounded-lg ${
                      confirmPrestige
                        ? "bg-red-500/80 hover:bg-red-500 text-white"
                        : "bg-purple-500/80 hover:bg-purple-500 text-white"
                    }`}
                  >
                    {confirmPrestige ? "Sicher?" : "Prestige!"}
                    <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                ) : (
                  <Badge variant="outline" className="text-[9px] border-border/30">
                    <Lock className="h-2.5 w-2.5 mr-1" />
                    {game.milestones.includes("m5") ? `${formatNum(PRESTIGE_THRESHOLD)} nötig` : "Milestone: 1M"}
                  </Badge>
                )}
              </div>
              <p className="text-[8px] text-muted-foreground">
                Prestige setzt Zeilen & Upgrades zurück. Meilensteine und Level bleiben. Alle Einnahmen werden mit {getPrestigeMultiplier(game.prestigeLevel + 1).toFixed(1)}x multipliziert.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* CTA */}
      <motion.a
        href="https://clawbuis.com"
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl bg-gradient-to-r from-[#2dd4bf]/10 to-[#c29b62]/10 border border-[#c29b62]/20 p-3 text-center hover:border-[#c29b62]/40 transition-all"
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex items-center justify-center gap-2">
          <ClawbuisLogo className="h-4 w-4 text-[#c29b62]" mono />
          <p className="text-xs font-medium bg-gradient-to-r from-[#2dd4bf] to-[#c29b62] bg-clip-text text-transparent">
            Echte Software statt Klicker? → clawbuis.com
          </p>
        </div>
      </motion.a>
    </div>
  );
}
