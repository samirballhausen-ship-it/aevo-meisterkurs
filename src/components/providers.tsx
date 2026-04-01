"use client";

import dynamic from "next/dynamic";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import { ProgressProvider } from "@/lib/progress-context";

const ParticlesBg = dynamic(() => import("./particles-bg").then((m) => m.ParticlesBg), {
  ssr: false,
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <AuthProvider>
          <ProgressProvider>
            <ParticlesBg />
            {children}
          </ProgressProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
