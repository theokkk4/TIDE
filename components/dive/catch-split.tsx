"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { Species } from "@/lib/types";
import type { RegionCode } from "@/lib/data/regulations";
import { decideCatch, type CatchInput } from "@/lib/decision";
import { TONE_CLASSES } from "@/lib/status";
import { cn } from "@/lib/utils";
import { PlaneReveal } from "./reveal";

export interface CatchScenario {
  species: Species;
  image: string | null;
  edible: boolean;
  /** What's in the bucket, in plain words. */
  setup: string;
  input: Omit<CatchInput, "region" | "date">;
}

const STATES: { code: RegionCode; name: string }[] = [
  { code: "NJ", name: "New Jersey" },
  { code: "MD", name: "Maryland" },
];

/**
 * Three real catches, judged by the app's own engine against the cited state rules, so
 * the story site can never say something the app wouldn't.
 */
export function CatchSplit({ scenarios }: { scenarios: CatchScenario[] }) {
  const [region, setRegion] = useState<RegionCode>("NJ");
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const allRevealed = revealed.size === scenarios.length;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <p className="font-mono text-[12px] tracking-[0.14em] text-mist/70 uppercase">You&apos;re fishing in</p>
        <div role="radiogroup" aria-label="State" className="inline-flex rounded-full border border-foam/15 p-1">
          {STATES.map((state) => (
            <button
              key={state.code}
              type="button"
              role="radio"
              aria-checked={region === state.code}
              onClick={() => setRegion(state.code)}
              className={cn(
                "rounded-full px-4 py-1.5 text-[14px] font-medium transition-colors",
                region === state.code ? "bg-turquoise text-abyss" : "text-mist hover:text-foam",
              )}
            >
              {state.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {scenarios.map((scenario, index) => {
          const open = revealed.has(scenario.species.slug);
          const decision = open
            ? decideCatch(scenario.species, { ...scenario.input, region, date: new Date() }, scenario.edible)
            : null;
          const tone = decision ? TONE_CLASSES[decision.tone] : null;
          return (
            <PlaneReveal key={scenario.species.slug} index={index}>
              <article className="glass flex h-full flex-col overflow-hidden rounded-[28px]">
                <div className="relative h-48 w-full">
                  {scenario.image && (
                    <Image src={scenario.image} alt={scenario.species.commonName} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                  )}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_30%,rgba(2,8,20,0.88))]" />
                  <p className="absolute bottom-4 left-5 text-[21px] font-semibold tracking-tight text-foam">
                    {scenario.species.commonName}
                  </p>
                </div>
                <div className="flex flex-1 flex-col gap-4 p-5">
                  <p className="text-[15px] leading-relaxed text-foam/90">{scenario.setup}</p>
                  <AnimatePresence mode="wait" initial={false}>
                    {decision && tone ? (
                      <motion.div
                        key={`${region}-${decision.headline}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className={cn("rounded-2xl border p-4", tone.bg, tone.border)}
                        aria-live="polite"
                      >
                        <p className={cn("text-[20px] font-semibold tracking-tight", tone.text)}>{decision.headline}</p>
                        <p className="mt-1 text-[13px] leading-relaxed text-foam/85">{decision.summary}</p>
                        {decision.checks
                          .filter((check) => (check.state === "fail" || check.state === "pass") && check.detail !== decision.summary)
                          .slice(0, 2)
                          .map((check) => (
                            <p key={check.label} className="mt-2 text-[12px] text-mist">
                              {check.state === "pass" ? "✓" : "✕"} {check.detail}
                            </p>
                          ))}
                      </motion.div>
                    ) : (
                      <motion.div key="closed" exit={{ opacity: 0 }} className="rounded-2xl border border-dashed border-foam/15 p-4 text-[13px] text-mist/70">
                        Keep it or let it go?
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <button
                    type="button"
                    onClick={() =>
                      setRevealed((current) => {
                        const next = new Set(current);
                        if (next.has(scenario.species.slug)) next.delete(scenario.species.slug);
                        else next.add(scenario.species.slug);
                        return next;
                      })
                    }
                    aria-expanded={open}
                    className="mt-auto rounded-full border border-turquoise/40 px-4 py-2.5 text-[14px] font-medium text-turquoise transition-colors hover:bg-turquoise/10"
                  >
                    {open ? "Hide the call" : "What's the call?"}
                  </button>
                </div>
              </article>
            </PlaneReveal>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        {!allRevealed && (
          <button
            type="button"
            onClick={() => setRevealed(new Set(scenarios.map((s) => s.species.slug)))}
            className="text-[14px] text-mist underline-offset-4 hover:text-foam hover:underline"
          >
            Reveal all three
          </button>
        )}
      </div>

      <motion.p
        initial={false}
        animate={{ opacity: allRevealed ? 1 : 0.25, y: allRevealed ? 0 : 8 }}
        transition={{ duration: 0.6 }}
        className="mt-12 text-center font-serif text-[clamp(36px,6vw,80px)] leading-[1.02] text-foam italic"
      >
        Same fish. Different water. Different answer.
      </motion.p>
      <p className="mt-4 text-center text-[14px] text-mist">
        Flip between New Jersey and Maryland — the striped bass changes its answer.
      </p>
    </div>
  );
}
