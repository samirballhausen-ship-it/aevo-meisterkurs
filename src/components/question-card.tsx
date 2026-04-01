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
  MessageSquareText,
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
  const [showExplanation, setShowExplanation] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
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

  const handleHint = useCallback(() => {
    if (hintLevel === 0) {
      setHintLevel(1);
      setShowHint(true);
    }
  }, [hintLevel]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          "border-border/50 transition-shadow duration-500",
          showResult && isCorrect && "glow-success border-success/30",
          showResult && !isCorrect && "glow-error border-destructive/30"
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

          {/* Hint */}
          <AnimatePresence>
            {showHint && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg bg-warning/10 border border-warning/20 p-3"
              >
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                  <p className="text-sm text-warning-foreground">{question.hint}</p>
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
                onClick={handleHint}
                disabled={showHint}
                className="text-warning hover:text-warning"
              >
                <HelpCircle className="mr-1.5 h-4 w-4" />
                {showHint ? "Tipp angezeigt" : "Tipp anzeigen"}
              </Button>
            )}

            {showResult && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExplanation(!showExplanation)}
                >
                  <MessageSquareText className="mr-1.5 h-4 w-4" />
                  {showExplanation ? "Erklärung ausblenden" : "Erklärung anzeigen"}
                </Button>

                <div className="flex-1" />

                <Button onClick={handleNext} className="rounded-xl">
                  Weiter
                  <ChevronRight className="ml-1.5 h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Explanation */}
          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl bg-primary/5 border border-primary/10 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Lightbulb className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Erklärung</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {question.explanation}
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
