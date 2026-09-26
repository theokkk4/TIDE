"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { StatusBadge } from "@/components/ui/status-badge";
import { statusFromCode, TONE_CLASSES, type StatusMeta } from "@/lib/status";
import type { IucnCode } from "@/lib/types";
import { cn } from "@/lib/utils";

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

/* ─────────────  Chapter 02 · three species, three answers  ───────────── */

export function SpeciesSplit({ cards }: { cards: SpeciesCardData[] }) {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const allRevealed = revealed.size === cards.length;
  const toggle = (slug: string) =>
    setRevealed((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });

  return (
    <div>
      <div className="grid gap-5 md:grid-cols-3">
        {cards.map((card) => {
          const open = revealed.has(card.slug);
          return (
            <motion.article
              key={card.slug}
              layout
              className="glass flex flex-col overflow-hidden rounded-[28px]"
            >
              <div className="relative h-52 w-full">
                {card.image && (
                  <Image src={card.image} alt={card.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_30%,rgba(2,8,20,0.85))]" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="text-[22px] font-semibold tracking-tight text-foam">{card.name}</h3>
                  <p className="text-[13px] text-mist italic">{card.scientificName}</p>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-4 p-5">
                <div>
                  <p className="mb-2 font-mono text-[10px] tracking-[0.16em] text-mist/60 uppercase">IUCN Red List</p>
                  <StatusBadge status={statusFromCode(card.status)} />
                </div>
                <p className="text-[14px] leading-relaxed text-mist">{card.context}</p>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="mb-2 font-mono text-[10px] tracking-[0.16em] text-mist/60 uppercase">
                        TIDE&apos;s verdict
                      </p>
                      <VerdictChip headline={card.verdictHeadline} tone={card.verdictTone} />
                      <p className="mt-3 text-[13px] leading-relaxed text-foam/85">{card.verdictSummary}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="button"
                  onClick={() => toggle(card.slug)}
                  aria-expanded={open}
                  className="mt-auto rounded-full border border-turquoise/40 px-4 py-2.5 text-[14px] font-medium text-turquoise transition-colors hover:bg-turquoise/10"
                >
                  {open ? "Hide verdict" : "Reveal TIDE's verdict"}
                </button>
              </div>
            </motion.article>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        {!allRevealed && (
          <button
            type="button"
            onClick={() => setRevealed(new Set(cards.map((c) => c.slug)))}
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
        className="mt-14 text-center font-serif text-[clamp(40px,7vw,88px)] leading-[1] text-foam italic"
      >
        Not endangered ≠ safe to eat.
      </motion.p>
    </div>
  );
}

/* ─────────────  Chapter 03 · four scattered sources converge  ───────────── */

const SOURCES = [
  { name: "IUCN Red List", answers: "How likely is extinction?", x: -1, y: -1 },
  { name: "NOAA & fisheries agencies", answers: "Is the local stock healthy?", x: 1, y: -1 },
  { name: "CITES & wildlife law", answers: "Is it legal to take?", x: -1, y: 1 },
  { name: "Certifications & seafood guides", answers: "Is it a sustainable buy?", x: 1, y: 1 },
];

export function SourceConverge() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const animatedSpread = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const staticSpread = useMotionValue(0.55);
  const tideScale = useTransform(scrollYProgress, [0.55, 1], [0.6, 1]);
  const tideOpacity = useTransform(scrollYProgress, [0.55, 1], [0, 1]);

  return (
    <div ref={ref} className="relative mx-auto h-[520px] w-full max-w-3xl md:h-[560px]">
      {SOURCES.map((source) => (
        <SourceChip key={source.name} source={source} spread={reduced ? staticSpread : animatedSpread} />
      ))}
      <motion.div
        style={reduced ? undefined : { scale: tideScale, opacity: tideOpacity }}
        className="absolute top-1/2 left-1/2 flex h-40 w-40 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-[radial-gradient(circle,rgba(46,230,197,0.35),rgba(46,230,197,0.05)_70%)] text-center shadow-[0_0_80px_rgba(46,230,197,0.35)]"
      >
        <span className="text-[26px] font-semibold tracking-[0.36em] text-foam">TIDE</span>
        <span className="mt-1 text-[11px] text-mist">one photo, one answer</span>
      </motion.div>
    </div>
  );
}

function SourceChip({ source, spread }: { source: (typeof SOURCES)[number]; spread: MotionValue<number> }) {
  // --spread-scale narrows the horizontal travel on small screens so chips stay on-screen.
  const x = useTransform(spread, (s) => `calc(-50% + ${source.x * s * 34}vw * var(--spread-scale))`);
  const y = useTransform(spread, (s) => `calc(-50% + ${source.y * s * 190}px)`);
  // Chips are absorbed as they reach the centre, leaving TIDE as the single answer.
  const opacity = useTransform(spread, [0, 0.35, 0.6], [0, 0.4, 1]);
  const scale = useTransform(spread, [0, 0.6], [0.5, 1]);

  return (
    <motion.div
      style={{ x, y, opacity, scale }}
      className="glass absolute top-1/2 left-1/2 w-[min(78vw,240px)] rounded-[20px] px-4 py-3 [--spread-scale:0.55] md:[--spread-scale:0.42]"
    >
      <p className="text-[14px] font-semibold text-foam">{source.name}</p>
      <p className="mt-0.5 text-[12px] text-mist">{source.answers}</p>
    </motion.div>
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

/* ─────────────  Chapter 04 · sticky phone story  ───────────── */

export interface StoryStep {
  title: string;
  body: string;
  image: string;
  alt: string;
}

export function PhoneStory({ steps }: { steps: StoryStep[] }) {
  const [active, setActive] = useState(0);

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_minmax(280px,360px)] md:gap-20">
      <ol>
        {steps.map((step, index) => (
          <motion.li
            key={step.title}
            onViewportEnter={() => setActive(index)}
            viewport={{ amount: 0.6 }}
            className="flex min-h-[46vh] flex-col justify-center py-8 md:min-h-[72vh]"
          >
            <p className="font-mono text-[12px] text-turquoise">0{index + 1}</p>
            <h3
              className={cn(
                "mt-2 text-[clamp(30px,4vw,52px)] leading-tight font-semibold tracking-tight transition-colors duration-500",
                active === index ? "text-foam" : "text-foam/35",
              )}
            >
              {step.title}
            </h3>
            <p className="mt-4 max-w-md text-[18px] leading-relaxed text-mist">{step.body}</p>
            <div className="mt-8 w-[min(70vw,300px)] md:hidden">
              <PhoneFrame>
                <Image src={step.image} alt={step.alt} fill sizes="300px" className="object-cover object-top" />
              </PhoneFrame>
            </div>
          </motion.li>
        ))}
      </ol>

      <div className="relative hidden md:block">
        <div className="sticky top-[14vh]">
          <PhoneFrame>
            <AnimatePresence initial={false}>
              <motion.div
                key={active}
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <Image
                  src={steps[active].image}
                  alt={steps[active].alt}
                  fill
                  sizes="360px"
                  className="object-cover object-top"
                />
              </motion.div>
            </AnimatePresence>
          </PhoneFrame>
        </div>
      </div>
    </div>
  );
}

/* ─────────────  Chapter 05 · verdict explorer across all 30 species  ───────────── */

export function VerdictExplorer({ species }: { species: SpeciesCardData[] }) {
  const categories = ["All", ...Array.from(new Set(species.map((s) => s.category)))];
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(species[0]?.slug);
  const visible = category === "All" ? species : species.filter((s) => s.category === category);
  const current = species.find((s) => s.slug === selected) ?? species[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
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

        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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

/* ─────────────  Chapter 08 · the live app, or the demo recording  ───────────── */

export function DemoPhone({ videoSrc }: { videoSrc: string | null }) {
  const [mode, setMode] = useState<"live" | "video">(videoSrc ? "video" : "live");
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.85);

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / 390));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col items-center">
      {videoSrc && (
        <div className="mb-6 inline-flex rounded-full border border-foam/15 p-1" role="tablist" aria-label="Demo view">
          {(["video", "live"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={mode === option}
              onClick={() => setMode(option)}
              className={cn(
                "rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors",
                mode === option ? "bg-turquoise text-abyss" : "text-mist hover:text-foam",
              )}
            >
              {option === "video" ? "Watch the demo" : "Try it live"}
            </button>
          ))}
        </div>
      )}

      {/* Width is capped by viewport height too, so the whole phone fits on a laptop screen. */}
      <PhoneFrame className="w-[min(82vw,340px,calc((100dvh-200px)*0.462))]">
        <div ref={frameRef} className="absolute inset-0">
          {mode === "video" && videoSrc ? (
            <video src={videoSrc} className="h-full w-full object-cover" autoPlay muted loop playsInline controls />
          ) : (
            <iframe
              src="/"
              title="TIDE — live app"
              loading="lazy"
              className="absolute top-0 left-0 origin-top-left border-0"
              style={{ width: 390, height: 844, transform: `scale(${scale})` }}
            />
          )}
        </div>
      </PhoneFrame>
    </div>
  );
}
