"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trophy, Clock } from "lucide-react";

const PAIRS = [
  { term: "BBiG", match: "Berufsbildungsgesetz" },
  { term: "JArbSchG", match: "Jugendarbeitsschutz" },
  { term: "HwO", match: "Handwerksordnung" },
  { term: "AEVO", match: "Ausbildereignung" },
  { term: "BIBB", match: "Bundesinstitut" },
  { term: "HWK", match: "Handwerkskammer" },
  { term: "4-Stufen", match: "Vormachen-Nachmachen" },
  { term: "Leittext", match: "Selbstständig lernen" },
  { term: "Kognitiv", match: "Wissen & Denken" },
  { term: "Affektiv", match: "Einstellung & Werte" },
  { term: "I-P-E-D-K-B", match: "Vollständige Handlung" },
  { term: "§22 BBiG", match: "Kündigung Azubi" },
];

interface Card {
  id: number;
  text: string;
  pairId: number;
  flipped: boolean;
  matched: boolean;
}

export function TermMemory() {
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matched, setMatched] = useState(0);
  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const pairCount = 8;

  const startGame = useCallback(() => {
    const selected = PAIRS.sort(() => Math.random() - 0.5).slice(0, pairCount);
    const cardList: Card[] = [];

    selected.forEach((pair, i) => {
      cardList.push({ id: i * 2, text: pair.term, pairId: i, flipped: false, matched: false });
      cardList.push({ id: i * 2 + 1, text: pair.match, pairId: i, flipped: false, matched: false });
    });

    // Shuffle
    for (let i = cardList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardList[i], cardList[j]] = [cardList[j], cardList[i]];
    }

    setCards(cardList);
    setFlipped([]);
    setMoves(0);
    setMatched(0);
    setTime(0);
    setGameOver(false);
    setStarted(true);
  }, []);

  // Timer
  useEffect(() => {
    if (!started || gameOver) return;
    const interval = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [started, gameOver]);

  const handleFlip = useCallback((id: number) => {
    if (flipped.length >= 2) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);
    setCards(prev => prev.map(c => c.id === id ? { ...c, flipped: true } : c));

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped.map(fid => cards.find(c => c.id === fid)!);

      if (first.pairId === second.pairId) {
        // Match!
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.pairId === first.pairId ? { ...c, matched: true } : c
          ));
          setFlipped([]);
          setMatched(m => {
            const newM = m + 1;
            if (newM >= pairCount) setGameOver(true);
            return newM;
          });
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            newFlipped.includes(c.id) ? { ...c, flipped: false } : c
          ));
          setFlipped([]);
        }, 1000);
      }
    }
  }, [flipped, cards]);

  if (!started) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">🃏</div>
        <h3 className="text-lg font-bold mb-2">AEVO Memory</h3>
        <p className="text-muted-foreground text-sm mb-4">Finde die passenden Begriffspaare!</p>
        <Button onClick={startGame} className="rounded-xl">Spiel starten</Button>
      </div>
    );
  }

  if (gameOver) {
    const stars = moves <= pairCount + 2 ? 3 : moves <= pairCount + 5 ? 2 : 1;
    return (
      <div className="text-center py-6">
        <div className="text-5xl mb-3">{"⭐".repeat(stars)}</div>
        <h3 className="text-lg font-bold mb-1">Alle Paare gefunden!</h3>
        <p className="text-muted-foreground text-sm mb-4">
          {moves} Züge in {time}s
        </p>
        <div className="flex gap-3 justify-center">
          <Badge variant="secondary" className="gap-1">
            <Trophy className="h-3.5 w-3.5 text-xp" />
            {moves} Züge
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3.5 w-3.5" />
            {time}s
          </Badge>
        </div>
        <Button onClick={startGame} className="rounded-xl mt-4">
          <RotateCcw className="mr-2 h-4 w-4" />
          Nochmal
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Badge variant="secondary" className="gap-1 text-xs">
          Züge: {moves}
        </Badge>
        <Badge variant="secondary" className="gap-1 text-xs">
          <Clock className="h-3 w-3" />
          {time}s
        </Badge>
        <Badge variant="outline" className="gap-1 text-xs">
          {matched}/{pairCount}
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {cards.map((card) => (
          <motion.button
            key={card.id}
            onClick={() => handleFlip(card.id)}
            className={`aspect-square rounded-xl border text-xs font-medium p-1 transition-all flex items-center justify-center text-center leading-tight ${
              card.matched
                ? "bg-success/20 border-success/40 text-success"
                : card.flipped
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-card/50 border-border/30 hover:border-primary/30 hover:bg-primary/5 cursor-pointer"
            }`}
            whileHover={!card.flipped && !card.matched ? { scale: 1.05 } : {}}
            whileTap={!card.flipped && !card.matched ? { scale: 0.95 } : {}}
          >
            <AnimatePresence mode="wait">
              {card.flipped || card.matched ? (
                <motion.span
                  key="text"
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {card.text}
                </motion.span>
              ) : (
                <motion.span
                  key="back"
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: 90, opacity: 0 }}
                  className="text-lg"
                >
                  ?
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
