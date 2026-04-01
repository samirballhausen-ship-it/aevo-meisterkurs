"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Handlungsfeld } from "@/lib/types";

interface HFData {
  hf: Handlungsfeld;
  label: string;
  mastered: number;
  inProgress: number;
  notStarted: number;
  total: number;
  correctRate: number;
}

interface DashboardVisualProps {
  hfData: HFData[];
  overallCorrectRate: number;
  totalMastered: number;
  totalQuestions: number;
}

const HF_COLORS = {
  HF1: { main: "#34d399", glow: "rgba(52,211,153,0.4)" },  // emerald
  HF2: { main: "#60a5fa", glow: "rgba(96,165,250,0.4)" },  // blue
  HF3: { main: "#a78bfa", glow: "rgba(167,139,250,0.4)" }, // violet
  HF4: { main: "#fbbf24", glow: "rgba(251,191,36,0.4)" },  // amber
};

/**
 * Radial progress chart – 4 concentric arcs (one per HF)
 * Each arc shows coverage %. Center shows overall %.
 */
export function DashboardVisual({ hfData, overallCorrectRate, totalMastered, totalQuestions }: DashboardVisualProps) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;

  const arcs = useMemo(() => {
    return hfData.map((hf, i) => {
      const radius = 42 + i * 18;
      const strokeWidth = 10;
      const circumference = 2 * Math.PI * radius;
      const coverage = hf.total > 0 ? (hf.mastered + hf.inProgress) / hf.total : 0;
      const offset = circumference - coverage * circumference;
      const color = HF_COLORS[hf.hf as keyof typeof HF_COLORS];

      return { ...hf, radius, strokeWidth, circumference, offset, coverage, color };
    });
  }, [hfData]);

  const overallPct = Math.round(overallCorrectRate * 100);

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background rings */}
        {arcs.map((arc) => (
          <circle
            key={`bg-${arc.hf}`}
            cx={cx}
            cy={cy}
            r={arc.radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={arc.strokeWidth}
            className="text-muted/15"
          />
        ))}

        {/* Progress arcs */}
        {arcs.map((arc, i) => (
          <motion.circle
            key={arc.hf}
            cx={cx}
            cy={cy}
            r={arc.radius}
            fill="none"
            stroke={arc.color.main}
            strokeWidth={arc.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={arc.circumference}
            initial={{ strokeDashoffset: arc.circumference }}
            animate={{ strokeDashoffset: arc.offset }}
            transition={{ duration: 1.2, delay: 0.2 + i * 0.15, ease: "easeOut" }}
            style={{
              filter: `drop-shadow(0 0 6px ${arc.color.glow})`,
            }}
          />
        ))}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8, type: "spring" }}
          className="text-center"
        >
          <span className="text-3xl font-bold">{overallPct}%</span>
          <p className="text-[9px] text-muted-foreground mt-0.5">Korrekt</p>
        </motion.div>
      </div>

      {/* HF Labels around the chart */}
      {arcs.map((arc, i) => {
        // Position labels at 4 corners
        const positions = [
          { x: -8, y: -8, align: "text-right" },   // top-left
          { x: size + 8, y: -8, align: "text-left" }, // top-right
          { x: size + 8, y: size - 8, align: "text-left" }, // bottom-right
          { x: -8, y: size - 8, align: "text-right" }, // bottom-left
        ];
        const pos = positions[i];
        const coveragePct = Math.round(arc.coverage * 100);

        return (
          <motion.div
            key={`label-${arc.hf}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 + i * 0.1 }}
            className={`absolute ${pos.align}`}
            style={{ left: pos.x, top: pos.y }}
          >
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: arc.color.main, boxShadow: `0 0 6px ${arc.color.glow}` }} />
              <span className="text-[10px] font-medium" style={{ color: arc.color.main }}>{coveragePct}%</span>
            </div>
            <p className="text-[8px] text-muted-foreground max-w-[80px] leading-tight">{arc.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
