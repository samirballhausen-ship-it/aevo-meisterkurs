"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Question } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  ChevronRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";

interface QuestionCardProps {
  question: Question;
  onAnswer: (correct: boolean, responseTime: number) => void;
  questionNumber: number;
  totalQuestions: number;
}

export function QuestionCard({ question, onAnswer, questionNumber, totalQuestions }: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [startTime] = useState(Date.now());

  const isCorrect = selectedAnswer === question.correctAnswer;

  const handleSelect = useCallback(
    (index: number) => {
      if (showResult) return;
      setSelectedAnswer(index);
      setShowResult(true);
    },
    [showResult]
  );

  const handleNext = useCallback(() => {
    const responseTime = (Date.now() - startTime) / 1000;
    onAnswer(isCorrect, responseTime);
  }, [isCorrect, onAnswer, startTime]);

  // Check if explanation/hint are generic (from auto-import)
  const hasRealHint = question.hint && !question.hint.startsWith("Überlege, welche Antwort");
  const hasRealExplanation = question.explanation && !question.explanation.startsWith("Die richtige Antwort ergibt sich");

  // Build a useful hint from available data
  const displayHint = hasRealHint
    ? question.hint
    : question.context
      ? `Lies die Ausgangssituation nochmal genau. Es geht um: ${question.topic}.`
      : `Themenbereich: ${question.topic}. Überlege, welche Antwort im Kontext der AEVO am sinnvollsten ist.`;

  // Build explanation - show correct answer text if no real explanation
  const correctOptionText = question.options?.[question.correctAnswer as number] ?? "";
  const displayExplanation = hasRealExplanation
    ? question.explanation
    : `Die richtige Antwort ist: "${correctOptionText}"${question.tags.length > 0 ? ` (Thema: ${question.tags.join(", ")})` : ""}. Diese Frage stammt aus dem Bereich ${question.topic} im ${question.handlungsfeld}.`;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          "border-border/30 bg-card/50 backdrop-blur-xl transition-all duration-500",
          showResult && isCorrect && "glow-success border-success/40",
          showResult && !isCorrect && "glow-error border-destructive/40",
          !showResult && "shadow-lg shadow-primary/5"
        )}
      >
        <CardContent className="p-5 md:p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {question.handlungsfeld}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {question.topic}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {questionNumber}/{totalQuestions}
            </span>
          </div>

          {/* Context */}
          {question.context && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground border border-border/30">
              <p className="italic">{question.context}</p>
            </div>
          )}

          {/* Question */}
          <h2 className="text-base md:text-lg font-semibold leading-relaxed">
            {question.prompt}
          </h2>

          {/* Hint - shown BEFORE answering */}
          <AnimatePresence>
            {showHint && !showResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg bg-warning/10 border border-warning/20 p-3"
              >
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground/80">{displayHint}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Options */}
          <div className="space-y-2.5">
            {question.options?.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectOption = index === question.correctAnswer;

              return (
                <motion.button
                  key={index}
                  whileHover={!showResult ? { scale: 1.01 } : {}}
                  whileTap={!showResult ? { scale: 0.99 } : {}}
                  onClick={() => handleSelect(index)}
                  disabled={showResult}
                  className={cn(
                    "w-full text-left p-3.5 rounded-xl border transition-all duration-300",
                    "flex items-start gap-3 text-sm",
                    !showResult && "hover:border-primary/40 hover:bg-primary/5 cursor-pointer border-border/50",
                    !showResult && "active:bg-primary/10",
                    showResult && isCorrectOption && "border-success/50 bg-success/10",
                    showResult && isSelected && !isCorrectOption && "border-destructive/50 bg-destructive/10",
                    showResult && !isSelected && !isCorrectOption && "opacity-50",
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium border",
                      !showResult && "border-border bg-muted text-muted-foreground",
                      showResult && isCorrectOption && "border-success bg-success text-success-foreground",
                      showResult && isSelected && !isCorrectOption && "border-destructive bg-destructive text-destructive-foreground",
                    )}
                  >
                    {showResult && isCorrectOption ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : showResult && isSelected && !isCorrectOption ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      String.fromCharCode(65 + index)
                    )}
                  </span>
                  <span className="flex-1 leading-relaxed">{option}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            {!showResult && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHint(true)}
                disabled={showHint}
                className="text-warning hover:text-warning"
              >
                <HelpCircle className="mr-1.5 h-4 w-4" />
                {showHint ? "Tipp angezeigt" : "Tipp anzeigen"}
              </Button>
            )}

            {showResult && (
              <div className="flex-1" />
            )}

            {showResult && (
              <Button onClick={handleNext} className="rounded-xl ml-auto">
                Weiter
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Explanation - shown AUTOMATICALLY after answering */}
          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: 0.3 }}
                className={cn(
                  "rounded-xl border p-4",
                  isCorrect ? "bg-success/5 border-success/20" : "bg-primary/5 border-primary/10"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                    isCorrect ? "bg-success/10" : "bg-primary/10"
                  )}>
                    {isCorrect ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <Lightbulb className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">
                      {isCorrect ? "Richtig!" : "Erklärung"}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {displayExplanation}
                    </p>
                    {question.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {question.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
