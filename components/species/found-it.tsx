"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Car, ExternalLink, Footprints, Hand, PhoneCall, ShieldAlert, TreePine, TriangleAlert } from "lucide-react";
import type { Species } from "@/lib/types";
import { REGIONS, RULES_CHECKED, type RegionCode } from "@/lib/data/regulations";
import { decideFind, type FindAction } from "@/lib/decision";
import { TONE_CLASSES } from "@/lib/status";
import { useRegion } from "@/lib/storage";
import { cn } from "@/lib/utils";

const ACTION_ICON: Record<FindAction, typeof Car> = {
  LEAVE: Hand,
  HELP_ACROSS: Footprints,
  CALL: PhoneCall,
};

/**
 * For animals people find rather than catch — a box turtle on a trail, a snapper on the
 * road, a salamander on a rainy night. Leads with what to do right now.
 */
export function FoundIt({ species }: { species: Species }) {
  const [region, setRegion] = useRegion();
  const [onRoad, setOnRoad] = useState(false);
  const roadRelevant = (species.category === "turtle" && !species.slug.includes("sea-turtle")) || species.category === "amphibian";
  const decision = decideFind(species, region, roadRelevant && onRoad);
  const tone = TONE_CLASSES[decision.tone];
  const Icon = ACTION_ICON[decision.action];

  return (
    <section aria-labelledby="found-heading" className="glass mx-6 overflow-hidden rounded-[28px]">
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <p id="found-heading" className="font-mono text-[11px] tracking-[0.16em] text-turquoise uppercase">
          Found one? Here&apos;s what to do
        </p>
        <div role="radiogroup" aria-label="Which state are you in?" className="flex gap-1">
          {REGIONS.map((option) => (
            <button
              key={option.code}
              type="button"
              role="radio"
              aria-checked={region === option.code}
              title={option.name}
              onClick={() => setRegion(option.code as RegionCode)}
              className={cn(
                "h-8 min-w-[40px] rounded-full border px-2.5 font-mono text-[12px] font-semibold transition-colors",
                region === option.code
                  ? "border-turquoise/70 bg-turquoise/15 text-turquoise"
                  : "border-foam/15 text-mist hover:text-foam",
              )}
            >
              {option.code}
            </button>
          ))}
        </div>
      </div>

      {roadRelevant && (
        <div role="radiogroup" aria-label="Where is it?" className="mx-5 mt-4 flex gap-1.5">
          {[
            { value: false, label: "In the wild", icon: TreePine },
            { value: true, label: "On a road", icon: Car },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={onRoad === option.value}
              onClick={() => setOnRoad(option.value)}
              className={cn(
                "flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-full border text-[13px] font-medium transition-colors",
                onRoad === option.value
                  ? "border-turquoise/70 bg-turquoise/15 text-turquoise"
                  : "border-foam/15 text-mist hover:text-foam",
              )}
            >
              <option.icon className="h-4 w-4" aria-hidden />
              {option.label}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={decision.headline}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className={cn("mx-5 mt-4 flex items-start gap-3 rounded-2xl border p-4", tone.bg, tone.border)}
          aria-live="polite"
        >
          <Icon className={cn("mt-0.5 h-7 w-7 shrink-0", tone.text)} strokeWidth={2.2} aria-hidden />
          <div className="min-w-0">
            <p className={cn("text-[21px] leading-tight font-semibold tracking-tight", tone.text)}>{decision.headline}</p>
            <p className="mt-1 text-[14px] leading-relaxed text-foam/90">{decision.summary}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {decision.legal && (
        <p className="mx-5 mt-4 flex gap-2.5 text-[13.5px] leading-snug text-mist">
          <ShieldAlert
            className={cn("mt-0.5 h-4 w-4 shrink-0", decision.legal.state === "fail" ? "text-status-alert" : "text-mist")}
            aria-hidden
          />
          <span>
            <span className="font-semibold text-foam">{decision.legal.label}: </span>
            {decision.legal.detail}
          </span>
        </p>
      )}

      {species.findSteps && species.findSteps.length > 0 && (
        <ol className="mx-5 mt-5 space-y-2.5 border-t border-foam/10 pt-4">
          {species.findSteps.map((step, index) => (
            <li key={step} className="flex gap-3 text-[13.5px] leading-snug text-foam/90">
              <span className="font-mono text-[12px] text-turquoise">0{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      )}

      {species.safety && species.safety.length > 0 && (
        <div className="mx-5 mt-4 rounded-2xl border border-status-warn/25 bg-status-warn/[0.07] p-4">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-status-warn">
            <TriangleAlert className="h-3.5 w-3.5" aria-hidden />
            Stay safe
          </p>
          <ul className="mt-2 space-y-1.5">
            {species.safety.map((line) => (
              <li key={line} className="text-[12.5px] leading-snug text-mist">
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 border-t border-foam/10 bg-abyss/30 px-5 py-4 text-[12px] leading-relaxed text-mist/80">
        {species.report && (
          <a
            href={species.report.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-2 inline-flex items-center gap-1 font-medium text-turquoise hover:underline"
          >
            {species.report.label}
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        )}
        {decision.rule ? (
          <p>
            Source:{" "}
            <a href={decision.rule.source.url} target="_blank" rel="noopener noreferrer" className="text-turquoise hover:underline">
              {decision.rule.source.label} ↗
            </a>{" "}
            · checked {new Date(`${RULES_CHECKED}T12:00:00`).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </p>
        ) : (
          <p>Pick your state for the local rules. TIDE covers New Jersey, Pennsylvania and Maryland.</p>
        )}
      </div>
    </section>
  );
}
