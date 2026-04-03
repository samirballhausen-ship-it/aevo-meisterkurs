"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Question } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Lightbulb,
  ChevronRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  CircleMinus,
  Send,
  PenLine,
} from "lucide-react";
import { ReportButton } from "./report-button";

interface QuestionCardProps {
  question: Question;
  onAnswer: (correct: boolean, responseTime: number, partial?: boolean) => void;
  questionNumber: number;
  totalQuestions: number;
  examMode?: boolean;
  questionStreak?: number;  // consecutive correct for THIS question
}

function shuffleOptions(options: string[], correctIndex: number) {
  const entries = options.map((opt, i) => ({ opt, isCorrect: i === correctIndex }));
  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }
  return {
    shuffled: entries.map((e) => e.opt),
    newCorrectIndex: entries.findIndex((e) => e.isCorrect),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MC Question Card (existing)
// ═══════════════════════════════════════════════════════════════════════════

function MCQuestionCard({ question, onAnswer, questionNumber, totalQuestions, examMode, questionStreak }: QuestionCardProps) {
  const { shuffled: shuffledOptions, newCorrectIndex } = useMemo(
    () => shuffleOptions(question.options ?? [], question.correctAnswer as number),
    [question.id] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [startTime] = useState(Date.now());

  const isCorrect = selectedAnswer === newCorrectIndex;

  const handleSelect = useCallback(
    (index: number) => {
      if (showResult) return;
      setSelectedAnswer(index);
      setShowResult(true);
    },
    [showResult]
  );

  const handleNext = useCallback(() => {
    onAnswer(isCorrect, (Date.now() - startTime) / 1000);
  }, [isCorrect, onAnswer, startTime]);

  const hasRealHint = question.hint && !question.hint.startsWith("Überlege, welche Antwort") && !question.hint.startsWith("Themenbereich:");
  const hasRealExplanation = question.explanation && !question.explanation.startsWith("Die richtige Antwort ergibt sich") && !question.explanation.startsWith("Richtige Antwort:");

  const displayHint = hasRealHint
    ? question.hint
    : question.context
      ? `Lies die Ausgangssituation nochmal genau. Es geht um: ${question.topic}.`
      : `Themenbereich: ${question.topic}. Überlege, welche Antwort im Kontext der AEVO am sinnvollsten ist.`;

  const correctOptionText = shuffledOptions[newCorrectIndex] ?? "";
  const displayExplanation = hasRealExplanation
    ? question.explanation
    : `Die richtige Antwort ist: "${correctOptionText}"${question.tags.length > 0 ? ` (Thema: ${question.tags.join(", ")})` : ""}. ${question.handlungsfeld}.`;

  return (
    <CardContent className="p-5 md:p-6 space-y-5">
      <QuestionHeader question={question} num={questionNumber} total={totalQuestions} streak={questionStreak} />

      {question.context && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground border border-border/30">
          <p className="italic">{question.context}</p>
        </div>
      )}

      <h2 className="text-base md:text-lg font-semibold leading-relaxed">{question.prompt}</h2>

      {!examMode && (
        <AnimatePresence>
          {showHint && !showResult && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="rounded-lg bg-warning/10 border border-warning/20 p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                <p className="text-sm text-foreground/80">{displayHint}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <div className="space-y-2.5">
        {shuffledOptions.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrectOption = index === newCorrectIndex;
          return (
            <motion.button
              key={index}
              whileHover={!showResult ? { scale: 1.01 } : {}}
              whileTap={!showResult ? { scale: 0.99 } : {}}
              onClick={() => handleSelect(index)}
              disabled={showResult}
              className={cn(
                "w-full text-left p-3.5 rounded-xl border transition-all duration-300 flex items-start gap-3 text-sm",
                !showResult && "hover:border-primary/40 hover:bg-primary/5 cursor-pointer border-border/50 active:bg-primary/10",
                showResult && isCorrectOption && "border-success/50 bg-success/10",
                showResult && isSelected && !isCorrectOption && "border-destructive/50 bg-destructive/10",
                showResult && !isSelected && !isCorrectOption && "opacity-50",
              )}
            >
              <span className={cn(
                "shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium border",
                !showResult && "border-border bg-muted text-muted-foreground",
                showResult && isCorrectOption && "border-success bg-success text-success-foreground",
                showResult && isSelected && !isCorrectOption && "border-destructive bg-destructive text-destructive-foreground",
              )}>
                {showResult && isCorrectOption ? <CheckCircle2 className="h-4 w-4" /> :
                 showResult && isSelected && !isCorrectOption ? <XCircle className="h-4 w-4" /> :
                 String.fromCharCode(65 + index)}
              </span>
              <span className="flex-1 leading-relaxed">{option}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 pt-2">
        {!showResult && !examMode && (
          <Button variant="ghost" size="sm" onClick={() => setShowHint(true)} disabled={showHint} className="text-warning hover:text-warning">
            <HelpCircle className="mr-1.5 h-4 w-4" />
            {showHint ? "Tipp angezeigt" : "Tipp anzeigen"}
          </Button>
        )}
        {showResult && <div className="flex-1" />}
        {showResult && (
          <Button onClick={handleNext} className="rounded-xl ml-auto">
            Weiter <ChevronRight className="ml-1.5 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Exam mode: nur kurzes Feedback (richtig/falsch), keine Erklärung */}
      {examMode && showResult && (
        <div className={cn("rounded-lg p-3 text-center text-sm font-medium", isCorrect ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
          {isCorrect ? "✓ Richtig" : "✗ Falsch"}
        </div>
      )}

      {/* Normal mode: volle Erklärung */}
      <AnimatePresence>
        {showResult && !examMode && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ delay: 0.3 }}
            className={cn("rounded-xl border p-4", isCorrect ? "bg-success/5 border-success/20" : "bg-primary/5 border-primary/10")}>
            <div className="flex items-start gap-3">
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", isCorrect ? "bg-success/10" : "bg-primary/10")}>
                {isCorrect ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Lightbulb className="h-4 w-4 text-primary" />}
              </div>
              <div>
                <p className="text-sm font-medium mb-1">{isCorrect ? "Richtig!" : "Erklärung"}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{displayExplanation}</p>
                {question.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {question.tags.map((tag) => <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>)}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Eselsbrücke – nach dem Beantworten */}
      <AnimatePresence>
        {showResult && !examMode && hasRealHint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ delay: 0.6 }}
            className="rounded-xl border border-xp/20 bg-xp/5 p-3"
          >
            <div className="flex items-start gap-2.5">
              <span className="text-base shrink-0 mt-0.5">🧠</span>
              <div>
                <p className="text-[10px] font-semibold text-xp mb-0.5">Eselsbrücke</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{displayHint}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showResult && (
        <ReportButton questionId={question.id} questionPrompt={question.prompt} />
      )}
    </CardContent>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Open Question Card (NEW)
// ═══════════════════════════════════════════════════════════════════════════

function OpenQuestionCard({ question, onAnswer, questionNumber, totalQuestions, examMode, questionStreak }: QuestionCardProps) {
  const [userAnswer, setUserAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [startTime] = useState(Date.now());

  const handleSubmit = useCallback(() => {
    if (!userAnswer.trim()) return;
    setSubmitted(true);
  }, [userAnswer]);

  const handleSelfRate = useCallback((rating: "correct" | "partial" | "wrong") => {
    const responseTime = (Date.now() - startTime) / 1000;
    const correct = rating !== "wrong";
    const partial = rating === "partial";
    onAnswer(correct, responseTime, partial);
  }, [onAnswer, startTime]);

  const hintText = question.solutionPoints?.length
    ? `Denke an folgende Punkte: ${question.solutionPoints.slice(0, 2).join(", ")}...`
    : question.hint && !question.hint.startsWith("Themenbereich:")
      ? question.hint
      : `Themenbereich: ${question.topic}. Überlege, was du aus dem Unterricht zu diesem Thema weißt.`;

  return (
    <CardContent className="p-5 md:p-6 space-y-5">
      <QuestionHeader question={question} num={questionNumber} total={totalQuestions} streak={questionStreak} />

      {question.context && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground border border-border/30">
          <p className="italic">{question.context}</p>
        </div>
      )}

      <h2 className="text-base md:text-lg font-semibold leading-relaxed">{question.prompt}</h2>

      {/* Hint (not in exam mode) */}
      {!examMode && (
        <AnimatePresence>
          {showHint && !submitted && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="rounded-lg bg-warning/10 border border-warning/20 p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                <div className="text-sm text-foreground/80">
                  <p>{hintText}</p>
                  {question.solutionPoints && question.solutionPoints.length > 2 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ({question.solutionPoints.length} Punkte erwartet)
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Answer Textarea */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <PenLine className="h-3.5 w-3.5" />
          <span>Deine Antwort</span>
        </div>
        <Textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Schreibe deine Antwort hier..."
          disabled={submitted}
          rows={4}
          className={cn(
            "resize-none text-sm transition-all",
            submitted && "opacity-70 bg-muted/30"
          )}
        />
      </div>

      {/* Actions before submit */}
      {!submitted && (
        <div className="flex items-center gap-3 pt-1">
          {!examMode && (
            <Button variant="ghost" size="sm" onClick={() => setShowHint(true)} disabled={showHint} className="text-warning hover:text-warning">
              <HelpCircle className="mr-1.5 h-4 w-4" />
              {showHint ? "Tipp angezeigt" : "Tipp"}
            </Button>
          )}
          <div className="flex-1" />
          <Button onClick={handleSubmit} disabled={!userAnswer.trim()} className="rounded-xl">
            <Send className="mr-1.5 h-4 w-4" />
            Antwort prüfen
          </Button>
        </div>
      )}

      {/* Solution + Self-Rating after submit */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {/* Solution */}
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Lightbulb className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium mb-2">Musterantwort</p>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {question.solution || question.explanation}
                  </p>

                  {question.solutionPoints && question.solutionPoints.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Wichtige Punkte:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {question.solutionPoints.map((point) => (
                          <Badge key={point} variant="secondary" className="text-[10px]">
                            {point}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Self-Rating */}
            <div className="rounded-xl bg-card border border-border/30 p-4">
              <p className="text-sm font-medium text-center mb-3">
                Vergleiche deine Antwort – wie hast du abgeschnitten?
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 max-w-[130px] rounded-xl border-success/30 hover:bg-success/10 hover:border-success/50 text-success"
                  onClick={() => handleSelfRate("correct")}
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  Richtig
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 max-w-[130px] rounded-xl border-warning/30 hover:bg-warning/10 hover:border-warning/50 text-warning"
                  onClick={() => handleSelfRate("partial")}
                >
                  <CircleMinus className="mr-1.5 h-4 w-4" />
                  Teilweise
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 max-w-[130px] rounded-xl border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50 text-destructive"
                  onClick={() => handleSelfRate("wrong")}
                >
                  <XCircle className="mr-1.5 h-4 w-4" />
                  Falsch
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Eselsbrücke – nach dem Beantworten */}
      <AnimatePresence>
        {submitted && !examMode && hintText && !hintText.startsWith("Themenbereich:") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-xp/20 bg-xp/5 p-3"
          >
            <div className="flex items-start gap-2.5">
              <span className="text-base shrink-0 mt-0.5">🧠</span>
              <div>
                <p className="text-[10px] font-semibold text-xp mb-0.5">Eselsbrücke</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{hintText}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {submitted && (
        <ReportButton questionId={question.id} questionPrompt={question.prompt} />
      )}
    </CardContent>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Shared Header
// ═══════════════════════════════════════════════════════════════════════════

function QuestionHeader({ question, num, total, streak }: { question: Question; num: number; total: number; streak?: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">{question.handlungsfeld}</Badge>
        <Badge variant="secondary" className="text-xs">{question.topic}</Badge>
        {question.type === "open" && (
          <Badge variant="secondary" className="text-[9px] bg-primary/10 text-primary border-primary/20">
            <PenLine className="mr-1 h-3 w-3" />
            Freitext
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        {streak != null && streak > 0 && (
          <div className={cn(
            "flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
            streak >= 3 ? "bg-success/15 text-success" : streak >= 2 ? "bg-warning/15 text-warning" : "bg-muted/50 text-muted-foreground",
          )}>
            {streak >= 3 ? "✓✓✓" : streak >= 2 ? "✓✓" : "✓"}
            <span className="text-[8px] ml-0.5">{streak >= 3 ? "sicher" : `${streak}/3`}</span>
          </div>
        )}
        <span className="text-xs text-muted-foreground">{num}/{total}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Export – Routes to MC or Open
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// Review Card – Read-only view of previously answered questions
// ═══════════════════════════════════════════════════════════════════════════

interface ReviewCardProps {
  question: Question;
  correct: boolean;
  questionNumber: number;
  totalQuestions: number;
}

export function ReviewCard({ question, correct, questionNumber, totalQuestions }: ReviewCardProps) {
  const correctIdx = question.correctAnswer as number;
  const hasExplanation = question.explanation && !question.explanation.startsWith("Die richtige Antwort ergibt sich");

  return (
    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
      <Card className="border-border/30 bg-card/50 backdrop-blur-xl shadow-lg shadow-primary/5">
        <CardContent className="p-5 md:p-6 space-y-4">
          {/* Header + Result Badge */}
          <div className="flex items-center justify-between">
            <QuestionHeader question={question} num={questionNumber} total={totalQuestions} />
            <Badge
              className={cn(
                "text-xs gap-1",
                correct
                  ? "bg-success/15 text-success border-success/30"
                  : "bg-destructive/15 text-destructive border-destructive/30"
              )}
              variant="outline"
            >
              {correct ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              {correct ? "Richtig" : "Falsch"}
            </Badge>
          </div>

          {question.context && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground border border-border/30">
              <p className="italic">{question.context}</p>
            </div>
          )}

          <h2 className="text-base md:text-lg font-semibold leading-relaxed">{question.prompt}</h2>

          {/* MC Options (correct highlighted) */}
          {question.type !== "open" && (
            <div className="space-y-2">
              {(question.options ?? []).map((option, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-3 rounded-xl border flex items-start gap-3 text-sm",
                    i === correctIdx && "border-success/50 bg-success/10",
                    i !== correctIdx && "border-border/20 opacity-40",
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium border",
                      i === correctIdx ? "border-success bg-success text-success-foreground" : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {i === correctIdx ? <CheckCircle2 className="h-4 w-4" /> : String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1 leading-relaxed">{option}</span>
                </div>
              ))}
            </div>
          )}

          {/* Open question solution */}
          {question.type === "open" && (question.solution || question.explanation) && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
              <p className="text-sm font-medium mb-2">Musterantwort</p>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {question.solution || question.explanation}
              </p>
              {question.solutionPoints && question.solutionPoints.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {question.solutionPoints.map((p) => (
                    <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Explanation */}
          {hasExplanation && (
            <div className={cn("rounded-xl border p-4", correct ? "bg-success/5 border-success/20" : "bg-primary/5 border-primary/10")}>
              <div className="flex items-start gap-3">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", correct ? "bg-success/10" : "bg-primary/10")}>
                  {correct ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Lightbulb className="h-4 w-4 text-primary" />}
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">{correct ? "Richtig beantwortet" : "Erklärung"}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{question.explanation}</p>
                  {question.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {question.tags.map((tag) => <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <ReportButton questionId={question.id} questionPrompt={question.prompt} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function QuestionCard(props: QuestionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        "border-border/30 bg-card/50 backdrop-blur-xl transition-all duration-500 shadow-lg shadow-primary/5"
      )}>
        {props.question.type === "open"
          ? <OpenQuestionCard {...props} />
          : <MCQuestionCard {...props} />
        }
      </Card>
    </motion.div>
  );
}
