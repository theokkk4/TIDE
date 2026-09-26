"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const OPTIONS = [
  {
    id: "home",
    label: "Take it home — it'll be safer",
    right: false,
    why: "Illegal in Pennsylvania and New Jersey, and wild box turtles rarely do well in captivity.",
  },
  {
    id: "woods",
    label: "Drop it in the nearest woods",
    right: false,
    why: "Box turtles spend their lives in one small home range. Moved ones wander trying to get back — often across more roads.",
  },
  {
    id: "back",
    label: "Turn it around, back where it came from",
    right: false,
    why: "It was going somewhere on purpose. Turn it back and it just tries again.",
  },
  {
    id: "across",
    label: "Carry it across, the way it was heading",
    right: true,
    why: "Right — only if it's safe for you. Set it down off the road on the side it was walking toward, then let it be.",
  },
];

/** A tiny quiz: the most common good-intentioned mistake is the wrong answer here. */
export function FoundQuiz({ image }: { image: string | null }) {
  const [picked, setPicked] = useState<string | null>(null);
  const choice = OPTIONS.find((option) => option.id === picked);

  return (
    <div className="grid items-start gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] border border-foam/10">
        {image && <Image src={image} alt="Eastern box turtle" fill sizes="(max-width: 768px) 100vw, 45vw" className="object-cover" />}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(2,8,20,0.85))]" />
        <p className="absolute bottom-4 left-5 max-w-[80%] text-[15px] leading-snug text-foam">
          You&apos;re driving to the shore. An eastern box turtle is halfway across the road.
        </p>
      </div>

      <div>
        <p className="text-[20px] font-semibold tracking-tight text-foam">What do you do?</p>
        <div className="mt-4 space-y-2.5" role="radiogroup" aria-label="What do you do?">
          {OPTIONS.map((option) => {
            const active = picked === option.id;
            const reveal = picked !== null;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPicked(option.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left text-[15px] transition-colors",
                  reveal && option.right
                    ? "border-status-safe/60 bg-status-safe/10 text-foam"
                    : active
                      ? "border-status-alert/60 bg-status-alert/10 text-foam"
                      : "border-foam/12 bg-foam/[0.03] text-mist hover:border-foam/30 hover:text-foam",
                )}
              >
                {option.label}
                {reveal && (option.right || active) && (
                  <span className={option.right ? "text-status-safe" : "text-status-alert"} aria-hidden>
                    {option.right ? "✓" : "✕"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <AnimatePresence mode="wait">
          {choice && (
            <motion.p
              key={choice.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="mt-5 text-[15px] leading-relaxed text-foam/90"
              aria-live="polite"
            >
              {choice.why}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
