// ─── Question Types ─────────────────────────────────────────────────────────

export type Handlungsfeld = "HF1" | "HF2" | "HF3" | "HF4";
export type QuestionType = "mc" | "open" | "order" | "truefalse";
export type Difficulty = 1 | 2 | 3 | 4 | 5;

export interface Question {
  id: string;
  handlungsfeld: Handlungsfeld;
  topic: string;
  type: QuestionType;
  source: string;
  difficulty: Difficulty;
  prompt: string;
  context?: string;
  options?: string[];
  correctAnswer: string | number | number[];
  explanation: string;
  hint: string;
  tags: string[];
  // Open question fields
  solution?: string;
  solutionPoints?: string[];
}

export const HANDLUNGSFELDER: Record<Handlungsfeld, { title: string; subtitle: string; icon: string }> = {
  HF1: {
    title: "Ausbildungsvoraussetzungen",
    subtitle: "Prüfen & Planen",
    icon: "ClipboardCheck",
  },
  HF2: {
    title: "Ausbildung vorbereiten",
    subtitle: "Einstellen & Vertrag",
    icon: "FileText",
  },
  HF3: {
    title: "Ausbildung durchführen",
    subtitle: "Methoden & Didaktik",
    icon: "GraduationCap",
  },
  HF4: {
    title: "Ausbildung abschließen",
    subtitle: "Prüfung & Zeugnis",
    icon: "Award",
  },
};

// ─── User Progress Types ────────────────────────────────────────────────────

export type LeitnerBox = 0 | 1 | 2 | 3 | 4 | 5;

export const LEITNER_INTERVALS: Record<LeitnerBox, number> = {
  0: 0,        // Sofort wieder
  1: 1,        // 1 Tag
  2: 3,        // 3 Tage
  3: 7,        // 7 Tage
  4: 14,       // 14 Tage
  5: 30,       // 30 Tage (gemeistert)
};

export interface QuestionProgress {
  questionId: string;
  box: LeitnerBox;
  lastSeen: number;
  nextReview: number;
  timesCorrect: number;
  timesWrong: number;
  avgResponseTime: number;
}

// ─── Gamification Types ─────────────────────────────────────────────────────

export interface UserStats {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  xp: number;
  dailyGoalTarget: number;
  dailyGoalProgress: number;
  lastActiveDate: string;
  achievements: string[];
  totalQuestionsAnswered: number;
  totalCorrect: number;
  totalTimeSpent: number;
}

export interface Level {
  level: number;
  title: string;
  xpRequired: number;
  icon: string;
}

export const LEVELS: Level[] = [
  { level: 1, title: "Praktikant",      xpRequired: 0,      icon: "👶" },
  { level: 2, title: "Lehrling",        xpRequired: 500,    icon: "🔨" },
  { level: 3, title: "Geselle",         xpRequired: 2000,   icon: "⚒️" },
  { level: 4, title: "Altgeselle",      xpRequired: 5000,   icon: "🛠️" },
  { level: 5, title: "Meisterschüler",  xpRequired: 10000,  icon: "📚" },
  { level: 6, title: "Meister",         xpRequired: 20000,  icon: "🏆" },
  { level: 7, title: "Obermeister",     xpRequired: 35000,  icon: "👑" },
  { level: 8, title: "Großmeister",     xpRequired: 50000,  icon: "🌟" },
];

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-step",      title: "Erster Schritt",      description: "Erste Frage beantwortet",            icon: "🎯", condition: "totalAnswered >= 1" },
  { id: "ten-streak",      title: "Auf Kurs",            description: "10 Fragen in Folge richtig",         icon: "🔥", condition: "streak >= 10" },
  { id: "perfect-session", title: "Perfektionist",       description: "Session ohne Fehler abgeschlossen",  icon: "💎", condition: "sessionPerfect" },
  { id: "week-streak",     title: "Streak-König",        description: "7 Tage am Stück gelernt",            icon: "👑", condition: "dayStreak >= 7" },
  { id: "hf1-clear",       title: "HF1 Durchblicker",    description: "Alle HF1-Fragen mindestens 1x richtig", icon: "✅", condition: "hf1Complete" },
  { id: "hf2-clear",       title: "HF2 Durchblicker",    description: "Alle HF2-Fragen mindestens 1x richtig", icon: "✅", condition: "hf2Complete" },
  { id: "hf3-clear",       title: "HF3 Durchblicker",    description: "Alle HF3-Fragen mindestens 1x richtig", icon: "✅", condition: "hf3Complete" },
  { id: "hf4-clear",       title: "HF4 Durchblicker",    description: "Alle HF4-Fragen mindestens 1x richtig", icon: "✅", condition: "hf4Complete" },
  { id: "night-owl",       title: "Nachtschicht",        description: "Nach 22 Uhr gelernt",                icon: "🦉", condition: "nightOwl" },
  { id: "weekend-warrior", title: "Wochenend-Lerner",    description: "Am Wochenende gelernt",              icon: "💪", condition: "weekend" },
  { id: "speed-demon",     title: "Blitzmerker",         description: "10 Fragen unter 5 Sekunden richtig", icon: "⚡", condition: "speedDemon" },
  { id: "exam-ready",      title: "Prüfungsreif",        description: "Alle HF auf >80% Korrektheit",       icon: "🎓", condition: "examReady" },
  { id: "hundred-club",    title: "100er Club",          description: "100 Fragen beantwortet",             icon: "💯", condition: "totalAnswered >= 100" },
  { id: "paragraph-pro",   title: "Paragraph-Profi",     description: "Alle Rechtsfragen gemeistert",       icon: "⚖️", condition: "legalMastered" },
];

// ─── Session Types ──────────────────────────────────────────────────────────

export type SessionMode = "spaced" | "handlungsfeld" | "exam" | "weakTopics";

export interface SessionConfig {
  mode: SessionMode;
  handlungsfeld?: Handlungsfeld;
  questionCount: number;
}

export interface SessionResult {
  totalQuestions: number;
  correct: number;
  wrong: number;
  xpEarned: number;
  timeSpent: number;
  newAchievements: string[];
  streakCount: number;
}

// ─── Auth Types ─────────────────────────────────────────────────────────────

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
