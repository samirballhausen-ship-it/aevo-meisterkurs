"use client";

import { motion } from "framer-motion";

/**
 * Echtes Clawbuis Logo: 5 Klauen mit Teal→Gold Gradient + goldener Core
 */
export function ClawbuisLogo({ className, mono }: { className?: string; mono?: boolean }) {
  return (
    <svg
      viewBox="0 0 64 76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className ?? "h-6 w-6"}
    >
      {!mono && (
        <defs>
          <linearGradient id="clawGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#c29b62" />
          </linearGradient>
        </defs>
      )}
      <g fill="none" stroke={mono ? "currentColor" : "url(#clawGrad)"} strokeLinecap="round">
        <path d="M 20 52 C 16 44, 9 34, 7 24 C 5 16, 7 10, 11 10" strokeWidth="2.2" />
        <path d="M 23 46 C 21 36, 18 22, 19 12 C 20 6, 22 2, 25 4" strokeWidth="2.4" />
        <path d="M 30 44 C 29 32, 30 18, 32 6 C 33 1, 35 0, 36 3" strokeWidth="2.6" />
        <path d="M 38 46 C 40 36, 43 22, 44 12 C 45 6, 43 2, 40 4" strokeWidth="2.4" />
        <path d="M 44 52 C 48 44, 55 34, 57 24 C 59 16, 57 12, 53 12" strokeWidth="2" />
      </g>
      <path d="M 18 54 C 20 60, 26 64, 32 64 C 38 64, 44 60, 46 54" fill="none" stroke="#c29b62" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <circle cx="32" cy="50" r="2.8" fill="#ffd700" opacity="0.85" />
      <circle cx="32" cy="50" r="1.2" fill="#fffde8" opacity="0.9" />
    </svg>
  );
}

/**
 * Compact badge for NavBar
 */
export function ClawbuisBadge({ className }: { className?: string }) {
  return (
    <motion.a
      href="https://clawbuis.com"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-card/50 backdrop-blur-xl border border-border/20 text-muted-foreground hover:text-foreground hover:border-[#c29b62]/40 transition-all group shadow-lg shadow-[#c29b62]/5 hover:shadow-[#c29b62]/15 ${className ?? ""}`}
      whileHover={{ scale: 1.04, y: -1 }}
      whileTap={{ scale: 0.97 }}
    >
      <ClawbuisLogo className="h-5 w-5" />
      <span className="text-[11px] font-medium tracking-wide">
        Powered by <span className="font-bold bg-gradient-to-r from-[#2dd4bf] to-[#c29b62] bg-clip-text text-transparent">CLAWBUIS</span>
      </span>
    </motion.a>
  );
}

/**
 * Full branded footer with animated logo, name, slogan
 */
export function ClawbuisFooter() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.8 }}
      className="relative overflow-hidden mt-8"
    >
      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#c29b62]/30 to-transparent mb-8" />

      <div className="max-w-md mx-auto text-center px-6 pb-8">
        {/* Animated logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 120, delay: 0.7 }}
          className="mb-5 inline-block"
        >
          <div className="relative">
            {/* Outer glow ring */}
            <div className="absolute -inset-4 blur-3xl opacity-40">
              <div className="w-full h-full bg-gradient-to-br from-[#2dd4bf] to-[#c29b62] rounded-full" />
            </div>
            {/* Inner glow */}
            <div className="absolute -inset-2 blur-xl opacity-25">
              <div className="w-full h-full bg-[#ffd700] rounded-full" />
            </div>
            <div className="relative h-20 w-20 flex items-center justify-center">
              <ClawbuisLogo className="h-14 w-14 drop-shadow-[0_0_20px_rgba(194,155,98,0.6)] drop-shadow-[0_0_40px_rgba(45,212,191,0.3)]" />
            </div>
          </div>
        </motion.div>

        {/* Brand name - Cormorant Garamond style */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <h3 className="text-xl font-bold tracking-[0.12em] uppercase">
            <span className="bg-gradient-to-r from-[#d4b483] to-[#c29b62] bg-clip-text text-transparent">
              CLAWBUIS
            </span>
          </h3>
          <p className="text-[10px] tracking-[0.25em] uppercase mt-1.5" style={{ color: "rgba(245,244,240,0.25)" }}>
            AI-Powered Software Studio
          </p>
        </motion.div>

        {/* Slogan */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="text-xs mt-3 italic"
          style={{ color: "rgba(245,244,240,0.15)" }}
        >
          &ldquo;Die Zukunft der Arbeit&rdquo;
        </motion.p>

        {/* Subtle link */}
        <motion.a
          href="https://clawbuis.com"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="inline-flex items-center gap-1.5 mt-4 px-4 py-1.5 rounded-full text-[10px] border border-transparent hover:border-[#c29b62]/20 hover:bg-[#c29b62]/5 transition-all"
          style={{ color: "rgba(194,155,98,0.4)" }}
        >
          <ClawbuisLogo className="h-3 w-3" mono />
          clawbuis.com
        </motion.a>
      </div>
    </motion.footer>
  );
}
