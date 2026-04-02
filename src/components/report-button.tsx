"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Flag, Send, CheckCircle2, X } from "lucide-react";

interface ReportButtonProps {
  questionId: string;
  questionPrompt: string;
}

export function ReportButton({ questionId, questionPrompt }: ReportButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = useCallback(async () => {
    if (!message.trim()) return;
    setSending(true);

    try {
      await addDoc(collection(db, "reports"), {
        questionId,
        questionPrompt: questionPrompt.substring(0, 200),
        message: message.trim(),
        userId: user?.uid ?? "anonym",
        userName: user?.displayName ?? "Gast",
        createdAt: serverTimestamp(),
        status: "new",
      });
    } catch (err) {
      // Fallback: localStorage wenn Firestore nicht verfügbar
      console.error("Report save error:", err);
      const reports = JSON.parse(localStorage.getItem("lernapp-reports") ?? "[]");
      reports.push({
        questionId,
        message: message.trim(),
        date: new Date().toISOString(),
      });
      localStorage.setItem("lernapp-reports", JSON.stringify(reports));
    }

    setSending(false);
    setSent(true);
    setTimeout(() => { setSent(false); setOpen(false); setMessage(""); }, 2000);
  }, [message, questionId, questionPrompt, user]);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="text-muted-foreground/50 hover:text-destructive text-[10px] h-6 px-2"
      >
        <Flag className="h-3 w-3 mr-1" />
        Fehler melden
      </Button>

      <AnimatePresence>
        {open && !sent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2"
          >
            <div className="rounded-xl bg-card border border-border/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">Was stimmt nicht?</p>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="z.B. Falsche Antwort markiert, Tippfehler, fehlender Kontext..."
                rows={2}
                className="text-xs resize-none"
              />
              <Button
                size="sm"
                onClick={handleSend}
                disabled={!message.trim() || sending}
                className="w-full h-8 text-xs rounded-lg"
              >
                <Send className="h-3 w-3 mr-1.5" />
                {sending ? "Wird gesendet..." : "Absenden"}
              </Button>
            </div>
          </motion.div>
        )}

        {sent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mt-2 rounded-xl bg-success/10 border border-success/20 p-3 flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4 text-success" />
            <p className="text-xs text-success">Danke! Dein Feedback wurde gesendet.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
