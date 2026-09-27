"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Camera, Fingerprint, Leaf, Scale, ShieldCheck, Sparkles } from "lucide-react";
import { QUINT_OUT } from "./reveal";

const STEPS = [
  { label: "Photo", icon: Camera, body: "Snap it on the dock or the trail. Any phone browser — nothing to install.", tag: "Camera or upload" },
  { label: "AI", icon: Sparkles, body: "Google Gemini names the animal, with a confidence score and look-alikes.", tag: "Gemini Flash" },
  { label: "Species", icon: Fingerprint, body: "Matched to TIDE's field guide of the species people actually run into here.", tag: "Field guide" },
  { label: "Conservation", icon: ShieldCheck, body: "Its IUCN Red List status, checked live through GBIF.", tag: "IUCN · GBIF" },
  { label: "Sustainability", icon: Scale, body: "Your state's size limits, seasons and egg rules — each one cited and dated.", tag: "NJ · PA · MD" },
  { label: "Action", icon: Leaf, body: "Keep it, release it, leave it or report it. A recipe only for a legal keeper.", tag: "The call" },
];

/** The whole idea in one line of six steps, lighting up left to right as it scrolls in. */
export function Pipeline() {
  const reduced = useReducedMotion();
  return (
    <div className="relative">
      {/* The current running through every step. */}
      <div aria-hidden className="absolute top-[27px] right-[8%] left-[8%] hidden h-px bg-foam/10 lg:block">
        <motion.div
          className="h-full origin-left bg-[linear-gradient(90deg,#5fe3ef,#2ee6c5)] shadow-[0_0_12px_rgba(46,230,197,0.6)]"
          initial={reduced ? false : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "0px 0px -15% 0px" }}
          transition={{ duration: 1.5, ease: QUINT_OUT, delay: 0.1 }}
        />
      </div>
      <ol className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-6 lg:gap-5">
        {STEPS.map((step, index) => (
          <motion.li
            key={step.label}
            className="flex gap-4 lg:flex-col lg:items-center lg:gap-0 lg:text-center"
            initial={reduced ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -15% 0px" }}
            transition={{ duration: 0.8, ease: QUINT_OUT, delay: 0.15 + index * 0.16 }}
          >
            <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-turquoise/40 bg-abyss/80 text-turquoise shadow-[0_0_30px_-8px_rgba(46,230,197,0.7)] backdrop-blur-sm">
              <step.icon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
              {index < STEPS.length - 1 && (
                <span aria-hidden className="absolute top-full left-1/2 h-8 w-px -translate-x-1/2 bg-foam/10 sm:hidden" />
              )}
            </span>
            <div className="lg:mt-5">
              <p className="font-mono text-[11px] tracking-[0.14em] text-mist/60 uppercase">
                {String(index + 1).padStart(2, "0")} · {step.tag}
              </p>
              <h3 className="mt-1 text-[22px] font-semibold tracking-tight text-foam">{step.label}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-mist">{step.body}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
