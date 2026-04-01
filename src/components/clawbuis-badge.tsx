"use client";

import { motion } from "framer-motion";

export function ClawbuisBadge({ className }: { className?: string }) {
  return (
    <motion.a
      href="https://clawbuis.com"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/40 backdrop-blur-lg border border-border/20 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all group ${className ?? ""}`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Clawbuis Logo SVG */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="group-hover:drop-shadow-[0_0_6px_var(--primary)] transition-all"
      >
        {/* Claw mark - stylized C */}
        <path
          d="M70 25C55 15 35 18 25 35C15 52 20 72 37 82C54 92 74 87 82 70"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          className="group-hover:stroke-primary transition-colors"
        />
        {/* Three claw scratches */}
        <path d="M45 30L35 55" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="group-hover:stroke-primary transition-colors" />
        <path d="M55 25L48 52" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="group-hover:stroke-primary transition-colors" />
        <path d="M65 28L60 50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="group-hover:stroke-primary transition-colors" />
        {/* Dot accent */}
        <circle cx="75" cy="65" r="4" fill="currentColor" className="group-hover:fill-primary transition-colors" />
      </svg>
      <span className="text-[11px] font-medium tracking-wide">
        Built by <span className="group-hover:text-primary transition-colors font-semibold">Clawbuis</span>
      </span>
    </motion.a>
  );
}
