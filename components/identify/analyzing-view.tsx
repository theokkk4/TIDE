"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const ANALYSIS_STAGES = [
  "Analysing image",
  "Identifying species",
  "Checking biodiversity data",
  "Checking conservation status",
  "Preparing results",
] as const;

export function AnalyzingView({ photo, stage }: { photo: string; stage: number }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative aspect-square w-full max-w-[320px] overflow-hidden rounded-[32px] border border-foam/15"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt="The photo being analysed" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-abyss/25" />

        {/* Scanning sweep */}
        <div
          aria-hidden
          className="absolute inset-x-0 h-24 animate-scan bg-[linear-gradient(180deg,transparent,rgba(46,230,197,0.35),transparent)]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 h-[2px] animate-scan bg-turquoise shadow-[0_0_18px_4px_rgba(46,230,197,0.55)]"
        />

        {/* Rising bubbles over the capture */}
        {[15, 34, 52, 71, 88].map((left, index) => (
          <span
            key={left}
            aria-hidden
            className="absolute bottom-0 animate-rise rounded-full bg-foam/50"
            style={
              {
                left: `${left}%`,
                width: 4 + (index % 3) * 2,
                height: 4 + (index % 3) * 2,
                animationDuration: `${5 + index}s`,
                animationDelay: `-${index * 1.4}s`,
                "--bubble-drift": index % 2 === 0 ? "10px" : "-8px",
                "--bubble-opacity": 0.5,
              } as React.CSSProperties
            }
          />
        ))}
      </motion.div>

      <h1 className="mt-8 text-[22px] font-semibold tracking-tight text-foam">Analysing your discovery…</h1>

      <ul className="mt-6 w-full max-w-[320px] space-y-2.5" aria-live="polite">
        {ANALYSIS_STAGES.map((label, index) => {
          const done = index < stage;
          const active = index === stage;
          return (
            <li
              key={label}
              className={cn(
                "flex items-center gap-3 text-[14px] transition-colors duration-300",
                done && "text-mist/60",
                active && "text-foam",
                !done && !active && "text-mist/30",
              )}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                <AnimatePresence mode="wait" initial={false}>
                  {done ? (
                    <motion.span key="done" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                      <Check className="h-4 w-4 text-turquoise" strokeWidth={2.6} aria-hidden />
                    </motion.span>
                  ) : active ? (
                    <motion.span key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Loader2 className="h-4 w-4 animate-spin text-turquoise" strokeWidth={2.2} aria-hidden />
                    </motion.span>
                  ) : (
                    <span key="idle" className="h-1.5 w-1.5 rounded-full bg-current" />
                  )}
                </AnimatePresence>
              </span>
              {label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
