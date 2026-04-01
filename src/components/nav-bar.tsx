"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Trophy,
  ClipboardCheck,
  User,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LEVELS } from "@/lib/types";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/lernen", label: "Lernen", icon: BookOpen },
  { href: "/statistik", label: "Statistik", icon: BarChart3 },
  { href: "/pruefung", label: "Prüfung", icon: ClipboardCheck },
];

export function NavBar() {
  const pathname = usePathname();
  const { user, stats, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  if (!user) return null;

  const currentLevel = LEVELS.findLast((l) => (stats?.xp ?? 0) >= l.xpRequired) ?? LEVELS[0];

  return (
    <>
      {/* Desktop Nav */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 border-b border-border/20 bg-background/60 backdrop-blur-2xl">
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm tracking-tight">AEVO Meisterkurs</span>
            </Link>

            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* XP Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-xp/10 text-xp text-xs font-medium shadow-[0_0_12px_var(--xp)/20]">
              <Trophy className="h-3.5 w-3.5 drop-shadow-[0_0_4px_var(--xp)]" />
              <span>{stats?.xp ?? 0} XP</span>
            </div>

            {/* Level */}
            <div className="text-xs text-muted-foreground">
              {currentLevel.icon} {currentLevel.title}
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="h-8 w-8 rounded-full p-0 outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL ?? undefined} />
                  <AvatarFallback className="text-xs bg-primary/20 text-primary">
                    {user.displayName?.charAt(0) ?? user.email?.charAt(0) ?? "?"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.displayName ?? "User"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.href = "/profil"}>
                  <User className="mr-2 h-4 w-4" />
                  Profil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Abmelden
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/20 bg-background/60 backdrop-blur-2xl safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_8px_var(--primary)]")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          <Link
            href="/profil"
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
              pathname === "/profil" ? "text-primary" : "text-muted-foreground"
            )}
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">Profil</span>
          </Link>
        </div>
      </nav>

      {/* Spacers */}
      <div className="hidden md:block h-16" />
      <div className="md:hidden h-16 fixed bottom-0" />
    </>
  );
}
