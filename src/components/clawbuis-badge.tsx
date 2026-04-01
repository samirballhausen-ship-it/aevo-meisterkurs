"use client";

import { motion } from "framer-motion";

export function ClawbuisBadge({ className }: { className?: string }) {
  return (
    <motion.a
      href="https://clawbuis.com"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-card/50 backdrop-blur-xl border border-border/20 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all group shadow-lg shadow-primary/5 hover:shadow-primary/15 ${className ?? ""}`}
      whileHover={{ scale: 1.04, y: -1 }}
      whileTap={{ scale: 0.97 }}
    >
      <ClawbuisLogo className="h-4 w-4" />
      <span className="text-[11px] font-medium tracking-wide">
        Built by <span className="group-hover:text-primary transition-colors font-bold">Clawbuis</span>
      </span>
    </motion.a>
  );
}

export function ClawbuisFooter() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.8 }}
      className="relative overflow-hidden"
    >
      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent mb-8" />

      <div className="max-w-md mx-auto text-center px-6 pb-8">
        {/* Animated logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 150, delay: 0.7 }}
          className="mb-4"
        >
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 via-card/80 to-primary/5 border border-primary/20 shadow-lg shadow-primary/10 group-hover:shadow-primary/20 animate-pulse-glow">
            <ClawbuisLogo className="h-7 w-7 text-primary" />
          </div>
        </motion.div>

        {/* Brand name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <h3 className="text-lg font-bold tracking-tight">
            <span className="text-gradient">Clawbuis</span>
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 tracking-widest uppercase">
            AI-Powered Software Studio
          </p>
        </motion.div>

        {/* Slogan */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="text-xs text-muted-foreground/60 mt-3 italic"
        >
          &ldquo;Wir bauen Software die begeistert&rdquo;
        </motion.p>

        {/* Subtle link */}
        <motion.a
          href="https://clawbuis.com"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="inline-flex items-center gap-1.5 mt-4 px-4 py-1.5 rounded-full text-[10px] text-muted-foreground/50 hover:text-primary border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all"
        >
          <ClawbuisLogo className="h-3 w-3" />
          clawbuis.com
        </motion.a>
      </div>
    </motion.footer>
  );
}

export function ClawbuisLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className ?? "h-5 w-5"} group-hover:drop-shadow-[0_0_8px_var(--primary)] transition-all duration-300`}
    >
      {/* Outer ring - the "C" of Clawbuis */}
      <path
        d="M72 22C55 10 32 14 20 32C8 50 14 74 32 86C50 98 74 92 86 74"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        className="group-hover:stroke-primary transition-colors duration-300"
      />
      {/* Three claw marks - the signature */}
      <path
        d="M42 28L30 58"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        className="group-hover:stroke-primary transition-colors duration-300"
      />
      <path
        d="M54 22L44 56"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        className="group-hover:stroke-primary transition-colors duration-300"
      />
      <path
        d="M66 26L58 54"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        className="group-hover:stroke-primary transition-colors duration-300"
      />
      {/* Accent dot - the eye/spark */}
      <circle
        cx="76"
        cy="66"
        r="5"
        fill="currentColor"
        className="group-hover:fill-primary transition-colors duration-300"
      />
    </svg>
  );
}
