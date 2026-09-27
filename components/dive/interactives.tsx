"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, animate, motion, useInView, useReducedMotion } from "framer-motion";
import { StatusBadge } from "@/components/ui/status-badge";
import { statusFromCode, TONE_CLASSES, type StatusMeta } from "@/lib/status";
import type { IucnCode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SELECT_SPECIES_EVENT } from "./creature-layer";

type Tone = StatusMeta["tone"];

export interface SpeciesCardData {
  slug: string;
  name: string;
  scientificName: string;
  emoji: string;
  category: string;
  image: string | null;
  status: IucnCode;
  context?: string;
  verdictHeadline: string;
  verdictTone: Tone;
  verdictSummary: string;
  fishingStatus?: string;
  showRecipes: boolean;
  protectedSpecies: boolean;
}

function VerdictChip({ headline, tone, className }: { headline: string; tone: Tone; className?: string }) {
  const classes = TONE_CLASSES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold",
        classes.bg,
        classes.border,
        classes.text,
        className,
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", classes.dot)} aria-hidden />
      {headline}
    </span>
  );
}

/* ─────────────  Shared phone frame  ───────────── */

export function PhoneFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative rounded-[48px] border border-foam/15 bg-[#05070c] p-[10px] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9),0_0_60px_-10px_rgba(46,230,197,0.25)]",
        className,
      )}
    >
      <div className="relative aspect-[390/844] w-full overflow-hidden rounded-[38px] bg-abyss">{children}</div>
    </div>
  );
}

/* ─────────────  Verdict explorer across every species  ───────────── */

export function VerdictExplorer({ species }: { species: SpeciesCardData[] }) {
  const categories = ["All", ...Array.from(new Set(species.map((s) => s.category)))];
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(species[0]?.slug);
  const visible = category === "All" ? species : species.filter((s) => s.category === category);
  const current = species.find((s) => s.slug === selected) ?? species[0];

  // The species river and the background creatures both pick a species here.
  useEffect(() => {
    const pick = (event: Event) => {
      const slug = (event as CustomEvent<string>).detail;
      if (!species.some((s) => s.slug === slug)) return;
      setCategory("All");
      setSelected(slug);
    };
    window.addEventListener(SELECT_SPECIES_EVENT, pick);
    return () => window.removeEventListener(SELECT_SPECIES_EVENT, pick);
  }, [species]);

  return (
    <div id="verdict-explorer" className="grid scroll-mt-32 gap-6 lg:grid-cols-[1.1fr_1fr]">
      {/* min-w-0 lets the scrollable filter row shrink instead of widening the page. */}
      <div className="min-w-0">
        <div className="no-scrollbar -mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Filter by group">
          {categories.map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={category === name}
              onClick={() => setCategory(name)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] capitalize transition-colors",
                category === name
                  ? "border-turquoise/60 bg-turquoise/10 text-turquoise"
                  : "border-foam/15 text-mist hover:text-foam",
              )}
            >
              {name}
            </button>
          ))}
        </div>

        {/* On a slide the list scrolls inside itself, so the whole explorer fits on one screen. */}
        <ul data-lenis-prevent className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:max-h-[440px] lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
          {visible.map((s) => {
            const status = statusFromCode(s.status);
            return (
              <li key={s.slug}>
                <button
                  type="button"
                  onClick={() => setSelected(s.slug)}
                  aria-pressed={s.slug === current.slug}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition-colors",
                    s.slug === current.slug
                      ? "border-turquoise/60 bg-turquoise/10"
                      : "border-foam/10 bg-foam/[0.04] hover:border-foam/25",
                  )}
                >
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", TONE_CLASSES[status.tone].dot)} aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-foam">{s.name}</span>
                    <span className="block truncate text-[11px] text-mist/70">{status.label}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <AnimatePresence mode="wait">
        <motion.article
          key={current.slug}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="glass overflow-hidden rounded-[28px]"
          aria-live="polite"
        >
          <div className="relative h-56 w-full">
            {current.image && (
              <Image src={current.image} alt={current.name} fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" />
            )}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(2,8,20,0.9))]" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <h3 className="text-[26px] font-semibold tracking-tight text-foam">{current.name}</h3>
              <p className="text-[13px] text-mist italic">{current.scientificName}</p>
            </div>
          </div>
          <div className="space-y-5 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={statusFromCode(current.status)} />
              <VerdictChip headline={current.verdictHeadline} tone={current.verdictTone} />
            </div>
            <p className="text-[15px] leading-relaxed text-foam/85">{current.verdictSummary}</p>
            {current.fishingStatus && (
              <p className="border-l-2 border-turquoise/40 pl-4 text-[13px] leading-relaxed text-mist">
                {current.fishingStatus}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-foam/10 pt-4">
              <p className="text-[13px] text-mist">
                Recipes:{" "}
                <span className={current.showRecipes ? "text-status-safe" : "text-status-alert"}>
                  {current.showRecipes ? "shown" : "withheld"}
                </span>
                {current.protectedSpecies && " · alternatives offered"}
              </p>
              <Link href={`/species/${current.slug}`} className="text-[13px] font-medium text-turquoise hover:underline">
                Open in TIDE ↗
              </Link>
            </div>
          </div>
        </motion.article>
      </AnimatePresence>
    </div>
  );
}

/* ─────────────  Count-up statistic  ───────────── */

export function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || !inView) return;
    const format = (v: number) =>
      `${prefix}${v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
    if (reduced) {
      node.textContent = format(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        node.textContent = format(v);
      },
    });
    return () => controls.stop();
  }, [inView, value, decimals, prefix, suffix, reduced]);

  return (
    <span ref={ref}>
      {prefix}
      {(0).toFixed(decimals)}
      {suffix}
    </span>
  );
}
