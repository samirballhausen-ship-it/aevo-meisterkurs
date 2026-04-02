"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClawbuisLogo } from "@/components/clawbuis-badge";

const UPGRADES = [
  { id: "auto1", name: "KI-Assistent", desc: "+1/s", img: "/clicker/robot.webp", baseCost: 25, perSec: 1, clickBonus: 0 },
  { id: "click1", name: "Mech. Keyboard", desc: "+2 pro Klick", img: "/clicker/keyboard.webp", baseCost: 15, perSec: 0, clickBonus: 2 },
  { id: "auto2", name: "Cloud Server", desc: "+8/s", img: "/clicker/server.webp", baseCost: 200, perSec: 8, clickBonus: 0 },
  { id: "click2", name: "Neurolink", desc: "+10 pro Klick", img: "/clicker/brain.webp", baseCost: 500, perSec: 0, clickBonus: 10 },
  { id: "auto3", name: "Agent Swarm", desc: "+50/s", img: "/clicker/swarm.webp", baseCost: 3000, perSec: 50, clickBonus: 0 },
  { id: "auto4", name: "Clawbuis HQ", desc: "+200/s", img: "/clicker/hq.webp", baseCost: 15000, perSec: 200, clickBonus: 0 },
];

const LEVELS = [
  { lines: 0, title: "Praktikant", icon: "👶" },
  { lines: 100, title: "Junior Dev", icon: "🐣" },
  { lines: 500, title: "Developer", icon: "💻" },
  { lines: 2500, title: "Senior Dev", icon: "🔥" },
  { lines: 10000, title: "Tech Lead", icon: "⚡" },
  { lines: 50000, title: "CTO", icon: "👑" },
  { lines: 250000, title: "Clawbuis Partner", icon: "🌟" },
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

const SAVE_KEY = "clawbuis-clicker-save";

function loadGame(): GameState {
  try {
    const s = localStorage.getItem(SAVE_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return { codeLines: 0, totalEarned: 0, clickPower: 1, perSecond: 0, upgrades: {}, level: 0, started: false };
}

function formatNum(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return Math.floor(n).toString();
}

export function ClawbuisClicker() {
  const [game, setGame] = useState<GameState>(loadGame);
  const [clicks, setClicks] = useState<{ id: number; x: number; y: number; amount: number }[]>([]);
  const [pulse, setPulse] = useState(false);
  const [levelUp, setLevelUp] = useState(false);
  const clickIdRef = useRef(0);

  // Auto-save
  useEffect(() => {
    const t = setInterval(() => localStorage.setItem(SAVE_KEY, JSON.stringify(game)), 3000);
    return () => clearInterval(t);
  }, [game]);

  // Auto-generate
  useEffect(() => {
    if (game.perSecond <= 0) return;
    const t = setInterval(() => {
      setGame((p) => {
        const nl = p.codeLines + p.perSecond;
        const nt = p.totalEarned + p.perSecond;
        const newLvl = LEVELS.findLastIndex((l) => nt >= l.lines);
        if (newLvl > p.level) setLevelUp(true);
        return { ...p, codeLines: nl, totalEarned: nt, level: Math.max(p.level, newLvl) };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [game.perSecond, game.level]);

  // Save on unload
  useEffect(() => {
    const h = () => localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [game]);

  // Level up dismiss
  useEffect(() => {
    if (levelUp) {
      const t = setTimeout(() => setLevelUp(false), 2500);
      return () => clearTimeout(t);
    }
  }, [levelUp]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = ++clickIdRef.current;
    setPulse(true);
    setTimeout(() => setPulse(false), 120);
    setClicks((p) => [...p.slice(-6), { id, x, y, amount: game.clickPower }]);
    setGame((p) => {
      const nl = p.codeLines + p.clickPower;
      const nt = p.totalEarned + p.clickPower;
      const newLvl = LEVELS.findLastIndex((l) => nt >= l.lines);
      if (newLvl > p.level) setLevelUp(true);
      return { ...p, codeLines: nl, totalEarned: nt, level: Math.max(p.level, newLvl), started: true };
    });
  }, [game.clickPower, game.level]);

  const buyUpgrade = useCallback((id: string) => {
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
  }, [game]);

  const currentLevel = LEVELS[game.level] ?? LEVELS[0];
  const nextLevel = LEVELS[game.level + 1];
  const levelPct = nextLevel ? Math.min(((game.totalEarned - LEVELS[game.level].lines) / (nextLevel.lines - LEVELS[game.level].lines)) * 100, 100) : 100;

  // Start screen
  if (!game.started) {
    return (
      <div className="text-center py-4 space-y-4">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}
          className="relative w-32 h-32 mx-auto">
          <div className="absolute -inset-4 blur-3xl opacity-30 bg-gradient-to-br from-[#2dd4bf] to-[#c29b62] rounded-full" />
          <Image src="/clicker/core.webp" alt="Clawbuis Core" fill className="object-contain drop-shadow-[0_0_20px_rgba(45,212,191,0.4)]" />
        </motion.div>
        <div>
          <h3 className="text-lg font-bold bg-gradient-to-r from-[#2dd4bf] to-[#c29b62] bg-clip-text text-transparent">
            Clawbuis Code Empire
          </h3>
          <p className="text-muted-foreground text-xs mt-1">Baue dein Software-Imperium. Klicke. Upgrade. Wachse.</p>
        </div>
        <Button onClick={(e) => handleClick(e)} className="rounded-xl bg-gradient-to-r from-[#2dd4bf]/80 to-[#c29b62]/80 hover:from-[#2dd4bf] hover:to-[#c29b62]">
          Empire starten
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Level Up Celebration */}
      <AnimatePresence>
        {levelUp && (
          <motion.div initial={{ opacity: 0, scale: 0.8, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="absolute inset-x-4 top-4 z-50 rounded-xl bg-gradient-to-r from-[#2dd4bf]/20 to-[#c29b62]/20 border border-[#c29b62]/40 p-3 text-center backdrop-blur-xl">
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
          {game.perSecond > 0 && (
            <p className="text-[9px] text-muted-foreground">{formatNum(game.perSecond)}/s · +{game.clickPower}/klick</p>
          )}
        </div>
      </div>

      {/* Level Bar */}
      <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <motion.div className="h-full bg-gradient-to-r from-[#2dd4bf] to-[#c29b62]" animate={{ width: `${levelPct}%` }} />
      </div>

      {/* Click Area with Core Image */}
      <div className="flex justify-center py-1">
        <motion.button
          onClick={handleClick}
          whileTap={{ scale: 0.9 }}
          className="relative h-32 w-32 rounded-3xl cursor-pointer"
        >
          <motion.div animate={pulse ? { scale: [1, 1.08, 1], filter: ["brightness(1)", "brightness(1.4)", "brightness(1)"] } : {}} transition={{ duration: 0.12 }}
            className="relative h-full w-full">
            <Image src="/clicker/core.webp" alt="Click" fill className="object-contain drop-shadow-[0_0_15px_rgba(45,212,191,0.3)]" />
          </motion.div>

          <AnimatePresence>
            {clicks.map((c) => (
              <motion.span key={c.id} initial={{ opacity: 1, y: 0, scale: 1.2 }} animate={{ opacity: 0, y: -45, scale: 0.6 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }} className="absolute text-sm font-bold pointer-events-none"
                style={{ left: c.x, top: c.y, color: "#c29b62", textShadow: "0 0 8px rgba(194,155,98,0.6)" }}>
                +{c.amount}
              </motion.span>
            ))}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Upgrades */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-medium text-muted-foreground">Upgrades</p>
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
                canBuy ? "border-[#c29b62]/30 bg-[#c29b62]/5 hover:bg-[#c29b62]/10 cursor-pointer" : "border-border/20 opacity-30"
              }`}
            >
              <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden">
                <Image src={u.img} alt={u.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium">{u.name}</span>
                  {owned > 0 && <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-[#c29b62]/30 text-[#c29b62]">{owned}</Badge>}
                </div>
                <p className="text-[9px] text-muted-foreground">{u.desc}</p>
              </div>
              <span className={`text-xs font-mono shrink-0 ${canBuy ? "text-[#c29b62]" : ""}`}>{formatNum(cost)}</span>
            </motion.button>
          );
        })}
      </div>

      {/* CTA */}
      <motion.a href="https://clawbuis.com" target="_blank" rel="noopener noreferrer"
        className="block rounded-xl bg-gradient-to-r from-[#2dd4bf]/10 to-[#c29b62]/10 border border-[#c29b62]/20 p-3 text-center hover:border-[#c29b62]/40 transition-all"
        whileHover={{ scale: 1.02 }}>
        <div className="flex items-center justify-center gap-2">
          <ClawbuisLogo className="h-4 w-4" />
          <p className="text-xs font-medium bg-gradient-to-r from-[#2dd4bf] to-[#c29b62] bg-clip-text text-transparent">
            Echte Software statt Klicker? → clawbuis.com
          </p>
        </div>
      </motion.a>
    </div>
  );
}
