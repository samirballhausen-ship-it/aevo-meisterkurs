"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClawbuisLogo } from "@/components/clawbuis-badge";

// ─── Upgrades ───────────────────────────────────────────────────────────────
const UPGRADES = [
  { id: "auto1", name: "KI-Assistent", desc: "+1/s automatisch", icon: "🤖", baseCost: 25, perSec: 1 },
  { id: "auto2", name: "Code-Generator", desc: "+5/s automatisch", icon: "⚡", baseCost: 150, perSec: 5 },
  { id: "auto3", name: "Cloud Server", desc: "+20/s automatisch", icon: "☁️", baseCost: 800, perSec: 20 },
  { id: "auto4", name: "AI Agent Swarm", desc: "+100/s automatisch", icon: "🐝", baseCost: 5000, perSec: 100 },
  { id: "click1", name: "Bessere Maus", desc: "+1 pro Klick", icon: "🖱️", baseCost: 15, clickBonus: 1 },
  { id: "click2", name: "Mechanische KB", desc: "+3 pro Klick", icon: "⌨️", baseCost: 100, clickBonus: 3 },
  { id: "click3", name: "Neurolink", desc: "+10 pro Klick", icon: "🧠", baseCost: 600, clickBonus: 10 },
];

interface GameState {
  codeLines: number;
  totalEarned: number;
  clickPower: number;
  perSecond: number;
  upgrades: Record<string, number>;
  level: number;
  started: boolean;
}

const LEVELS = [
  { lines: 0, title: "Praktikant", icon: "👶" },
  { lines: 100, title: "Junior Dev", icon: "🐣" },
  { lines: 500, title: "Developer", icon: "💻" },
  { lines: 2000, title: "Senior Dev", icon: "🔥" },
  { lines: 10000, title: "Tech Lead", icon: "⚡" },
  { lines: 50000, title: "CTO", icon: "👑" },
  { lines: 200000, title: "Clawbuis Partner", icon: "🌟" },
];

const SAVE_KEY = "clawbuis-clicker-save";

function loadGame(): GameState {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return { codeLines: 0, totalEarned: 0, clickPower: 1, perSecond: 0, upgrades: {}, level: 0, started: false };
}

function saveGame(state: GameState) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function ClawbuisClicker() {
  const [game, setGame] = useState<GameState>(loadGame);
  const [clicks, setClicks] = useState<{ id: number; x: number; y: number; amount: number }[]>([]);
  const [pulse, setPulse] = useState(false);
  const clickIdRef = useRef(0);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save every 5 seconds
  useEffect(() => {
    saveTimerRef.current = setInterval(() => saveGame(game), 5000);
    return () => { if (saveTimerRef.current) clearInterval(saveTimerRef.current); };
  }, [game]);

  // Auto-generate per second
  useEffect(() => {
    if (game.perSecond <= 0) return;
    const interval = setInterval(() => {
      setGame((prev) => {
        const newLines = prev.codeLines + prev.perSecond;
        const newTotal = prev.totalEarned + prev.perSecond;
        const newLevel = LEVELS.findLastIndex((l) => newTotal >= l.lines);
        return { ...prev, codeLines: newLines, totalEarned: newTotal, level: Math.max(prev.level, newLevel) };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [game.perSecond]);

  // Save on unload
  useEffect(() => {
    const handleUnload = () => saveGame(game);
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [game]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = ++clickIdRef.current;

    setPulse(true);
    setTimeout(() => setPulse(false), 150);

    setClicks((prev) => [...prev.slice(-8), { id, x, y, amount: game.clickPower }]);
    setGame((prev) => {
      const newLines = prev.codeLines + prev.clickPower;
      const newTotal = prev.totalEarned + prev.clickPower;
      const newLevel = LEVELS.findLastIndex((l) => newTotal >= l.lines);
      return { ...prev, codeLines: newLines, totalEarned: newTotal, level: Math.max(prev.level, newLevel), started: true };
    });
  }, [game.clickPower]);

  const buyUpgrade = useCallback((upgradeId: string) => {
    const upgrade = UPGRADES.find((u) => u.id === upgradeId);
    if (!upgrade) return;

    const owned = game.upgrades[upgradeId] ?? 0;
    const cost = Math.round(upgrade.baseCost * Math.pow(1.4, owned));

    if (game.codeLines < cost) return;

    setGame((prev) => {
      const newUpgrades = { ...prev.upgrades, [upgradeId]: (prev.upgrades[upgradeId] ?? 0) + 1 };
      const clickBonus = "clickBonus" in upgrade ? (upgrade as { clickBonus: number }).clickBonus : 0;
      const perSecBonus = "perSec" in upgrade ? (upgrade as { perSec: number }).perSec : 0;
      return {
        ...prev,
        codeLines: prev.codeLines - cost,
        clickPower: prev.clickPower + clickBonus,
        perSecond: prev.perSecond + perSecBonus,
        upgrades: newUpgrades,
      };
    });
  }, [game]);

  const currentLevel = LEVELS[game.level] ?? LEVELS[0];
  const nextLevel = LEVELS[game.level + 1];

  const formatNum = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return Math.floor(n).toString();
  };

  if (!game.started) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="relative inline-block">
          <div className="absolute -inset-4 blur-2xl opacity-30 bg-gradient-to-br from-[#2dd4bf] to-[#c29b62] rounded-full" />
          <ClawbuisLogo className="h-16 w-16 relative drop-shadow-[0_0_15px_rgba(194,155,98,0.5)]" />
        </div>
        <h3 className="text-lg font-bold bg-gradient-to-r from-[#2dd4bf] to-[#c29b62] bg-clip-text text-transparent">
          Clawbuis Code Empire
        </h3>
        <p className="text-muted-foreground text-xs max-w-[250px] mx-auto">
          Baue dein eigenes Software-Imperium! Klicke Code, kaufe Upgrades, werde zum CTO.
        </p>
        <Button onClick={(e) => handleClick(e as any)} className="rounded-xl">
          Spiel starten
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold tabular-nums">{formatNum(game.codeLines)}</p>
          <p className="text-[10px] text-muted-foreground">Zeilen Code</p>
        </div>
        <div className="text-right">
          <Badge variant="secondary" className="gap-1 text-xs">
            {currentLevel.icon} {currentLevel.title}
          </Badge>
          {game.perSecond > 0 && (
            <p className="text-[10px] text-muted-foreground mt-1">{formatNum(game.perSecond)}/s</p>
          )}
        </div>
      </div>

      {/* Level Progress */}
      {nextLevel && (
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#2dd4bf] to-[#c29b62]"
            animate={{ width: `${Math.min(((game.totalEarned - LEVELS[game.level].lines) / (nextLevel.lines - LEVELS[game.level].lines)) * 100, 100)}%` }}
          />
        </div>
      )}

      {/* Click Button */}
      <div className="flex justify-center py-2">
        <motion.button
          onClick={handleClick}
          whileTap={{ scale: 0.92 }}
          className="relative h-28 w-28 rounded-3xl bg-gradient-to-br from-[#2dd4bf]/20 to-[#c29b62]/20 border border-[#c29b62]/30 flex items-center justify-center cursor-pointer active:border-[#c29b62]/60 transition-colors"
        >
          <motion.div animate={pulse ? { scale: [1, 1.15, 1] } : {}} transition={{ duration: 0.15 }}>
            <ClawbuisLogo className="h-14 w-14 drop-shadow-[0_0_12px_rgba(194,155,98,0.4)]" />
          </motion.div>

          {/* Click Popups */}
          <AnimatePresence>
            {clicks.map((c) => (
              <motion.span
                key={c.id}
                initial={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                animate={{ opacity: 0, y: -50, scale: 0.7 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute text-sm font-bold pointer-events-none"
                style={{ left: c.x, top: c.y, color: "#c29b62" }}
              >
                +{c.amount}
              </motion.span>
            ))}
          </AnimatePresence>
        </motion.button>
      </div>

      <p className="text-center text-[10px] text-muted-foreground">
        +{game.clickPower} pro Klick
      </p>

      {/* Upgrades */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Upgrades</p>
        {UPGRADES.map((upgrade) => {
          const owned = game.upgrades[upgrade.id] ?? 0;
          const cost = Math.round(upgrade.baseCost * Math.pow(1.4, owned));
          const canBuy = game.codeLines >= cost;

          return (
            <button
              key={upgrade.id}
              onClick={() => buyUpgrade(upgrade.id)}
              disabled={!canBuy}
              className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                canBuy
                  ? "border-[#c29b62]/30 bg-[#c29b62]/5 hover:bg-[#c29b62]/10 cursor-pointer"
                  : "border-border/20 opacity-40"
              }`}
            >
              <span className="text-lg shrink-0">{upgrade.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{upgrade.name}</span>
                  {owned > 0 && <Badge variant="outline" className="text-[9px] h-4">{owned}x</Badge>}
                </div>
                <p className="text-[10px] text-muted-foreground">{upgrade.desc}</p>
              </div>
              <span className="text-xs font-mono shrink-0" style={{ color: canBuy ? "#c29b62" : undefined }}>
                {formatNum(cost)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Clawbuis CTA */}
      <motion.a
        href="https://clawbuis.com"
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl bg-gradient-to-r from-[#2dd4bf]/10 to-[#c29b62]/10 border border-[#c29b62]/20 p-3 text-center hover:border-[#c29b62]/40 transition-all"
        whileHover={{ scale: 1.02 }}
      >
        <p className="text-xs font-medium bg-gradient-to-r from-[#2dd4bf] to-[#c29b62] bg-clip-text text-transparent">
          Echte Software statt Klicker?
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Entdecke Clawbuis → clawbuis.com
        </p>
      </motion.a>
    </div>
  );
}
