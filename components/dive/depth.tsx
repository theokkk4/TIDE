"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { DrawLine, EXPO_OUT } from "./reveal";
import { useSmoothScroll } from "./smooth-scroll";

export interface ChapterMarker {
  id: string;
  number: string;
  title: string;
  depth: number;
}

interface DepthState {
  depth: MotionValue<number>;
  /** Fractional chapter index, so the gauge marker moves smoothly between ticks. */
  progress: MotionValue<number>;
  chapter: number;
}

const DepthContext = createContext<DepthState | null>(null);

export function useDepth() {
  const value = useContext(DepthContext);
  if (!value) throw new Error("useDepth must be used inside DepthProvider");
  return value;
}

/**
 * Turns scroll position into ocean depth. Each chapter declares the depth it sits at
 * (data-depth); between two chapters the depth interpolates, so the readout sinks
 * continuously as you scroll and rises again when the story resurfaces.
 */
export function DepthProvider({ children }: { children: ReactNode }) {
  const depth = useMotionValue(0);
  const progress = useMotionValue(0);
  const [chapter, setChapter] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-depth]"));
      if (!sections.length) return;
      const tops = sections.map((section) => section.getBoundingClientRect().top + window.scrollY);
      const probe = window.scrollY + window.innerHeight * 0.45;

      let index = 0;
      for (let i = 0; i < tops.length; i++) if (tops[i] <= probe) index = i;

      const from = Number(sections[index].dataset.depth);
      const nextTop = tops[index + 1];
      const t = nextTop === undefined ? 0 : Math.min(1, Math.max(0, (probe - tops[index]) / (nextTop - tops[index])));
      const to = nextTop === undefined ? from : Number(sections[index + 1].dataset.depth);
      // Sinking is continuous, but the ascent is held until the reader leaves the deep
      // chapter — otherwise the readout starts rising the moment Challenger Deep arrives.
      const eased = to < from ? Math.max(0, (t - 0.65) / 0.35) : t;

      depth.set(from + (to - from) * eased);
      progress.set((index + t) / Math.max(1, sections.length - 1));
      setChapter(index);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [depth, progress]);

  return <DepthContext.Provider value={{ depth, progress, chapter }}>{children}</DepthContext.Provider>;
}

const ZONE_NOTES: Record<string, string> = {
  Surface: "Back in the light",
  "Sunlight zone": "0–200 m · enough light for photosynthesis",
  "Twilight zone": "200–1,000 m · sunlight fades to blue, then black",
  "Midnight zone": "1,000–4,000 m · the only light is living light",
  "Abyssal zone": "4,000–6,000 m · near freezing, crushing pressure",
  "Hadal zone": "6,000 m+ · the ocean's deepest trenches",
  "Challenger Deep": "10,935 m · the deepest point on Earth",
};

export function zoneFor(depth: number) {
  if (depth < 10) return "Surface";
  if (depth < 200) return "Sunlight zone";
  if (depth < 1000) return "Twilight zone";
  if (depth < 4000) return "Midnight zone";
  if (depth < 6000) return "Abyssal zone";
  if (depth < 10900) return "Hadal zone";
  return "Challenger Deep";
}

const DEPTH_STOPS = [0, 200, 1000, 4000, 6000, 10935];
const WATER = ["#0d5570", "#0a3a5c", "#072044", "#04101f", "#020a16", "#010409"];

/** The water itself: colour, surface light and drifting particles all follow depth. */
export function AbyssBackground() {
  const { depth } = useDepth();
  const background = useTransform(depth, DEPTH_STOPS, WATER);
  const rays = useTransform(depth, [0, 250, 900], [1, 0.35, 0]);
  const glow = useTransform(depth, [0, 1500, 6000], [0.35, 0.12, 0.28]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div className="absolute inset-0" style={{ backgroundColor: background }} />
      <motion.div className="absolute inset-0" style={{ opacity: rays }}>
        <div className="absolute -top-[30vh] left-[18%] h-[130vh] w-[22vw] animate-sweep bg-[linear-gradient(180deg,rgba(95,227,239,0.28),transparent_70%)] blur-2xl" />
        <div
          className="absolute -top-[30vh] left-[52%] h-[120vh] w-[14vw] animate-sweep bg-[linear-gradient(180deg,rgba(255,255,255,0.18),transparent_65%)] blur-2xl"
          style={{ animationDelay: "-5s" }}
        />
        <div
          className="absolute -top-[30vh] right-[10%] h-[110vh] w-[18vw] animate-sweep bg-[linear-gradient(180deg,rgba(95,227,239,0.2),transparent_70%)] blur-2xl"
          style={{ animationDelay: "-9s" }}
        />
      </motion.div>
      <motion.div
        className="absolute top-1/3 left-1/2 h-[70vh] w-[90vw] -translate-x-1/2 animate-drift rounded-full bg-[radial-gradient(ellipse_at_center,rgba(46,230,197,0.35),transparent_65%)] blur-3xl"
        style={{ opacity: glow }}
      />
      <ParticleField depth={depth} />
      <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22/></filter><rect width=%22120%22 height=%22120%22 filter=%22url(%23n)%22/></svg>')]" />
    </div>
  );
}

/**
 * Bubbles near the surface, marine snow in the twilight, bioluminescent sparks in the
 * deep. One canvas, read from the depth value every frame rather than re-rendering React.
 */
function ParticleField({ depth }: { depth: MotionValue<number> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || reduced) return;

    let width = 0;
    let height = 0;
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const random = (seed: number) => {
      const x = Math.sin(seed * 9301 + 49297) * 233280;
      return x - Math.floor(x);
    };
    const bubbles = Array.from({ length: 26 }, (_, i) => ({
      x: random(i + 1),
      y: random(i + 50),
      r: 1.5 + random(i + 99) * 3.5,
      speed: 0.00018 + random(i + 7) * 0.0003,
      wobble: random(i + 3) * Math.PI * 2,
    }));
    const snow = Array.from({ length: 90 }, (_, i) => ({
      x: random(i + 200),
      y: random(i + 400),
      r: 0.6 + random(i + 600) * 1.4,
      speed: 0.00003 + random(i + 800) * 0.00006,
      spark: i % 7 === 0,
      phase: random(i + 900) * Math.PI * 2,
    }));

    let frame = 0;
    let last = performance.now();
    const draw = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      const d = depth.get();
      const shallow = Math.max(0, 1 - d / 450);
      const deep = Math.min(1, Math.max(0, (d - 300) / 1500));
      const bio = Math.min(1, Math.max(0, (d - 2500) / 3500));

      context.clearRect(0, 0, width, height);

      if (shallow > 0) {
        context.lineWidth = 1;
        for (const b of bubbles) {
          b.y -= b.speed * dt;
          if (b.y < -0.05) b.y = 1.05;
          const x = (b.x + Math.sin(now / 1400 + b.wobble) * 0.006) * width;
          context.strokeStyle = `rgba(238,248,252,${0.28 * shallow})`;
          context.beginPath();
          context.arc(x, b.y * height, b.r, 0, Math.PI * 2);
          context.stroke();
        }
      }

      if (deep > 0) {
        for (const s of snow) {
          s.y += s.speed * dt;
          if (s.y > 1.02) s.y = -0.02;
          const x = s.x * width;
          const y = s.y * height;
          if (s.spark && bio > 0) {
            const pulse = 0.5 + 0.5 * Math.sin(now / 900 + s.phase);
            const alpha = bio * pulse * 0.9;
            const gradient = context.createRadialGradient(x, y, 0, x, y, 10);
            gradient.addColorStop(0, `rgba(46,230,197,${alpha})`);
            gradient.addColorStop(1, "rgba(46,230,197,0)");
            context.fillStyle = gradient;
            context.beginPath();
            context.arc(x, y, 10, 0, Math.PI * 2);
            context.fill();
          } else {
            context.fillStyle = `rgba(214,232,240,${0.32 * deep})`;
            context.beginPath();
            context.arc(x, y, s.r, 0, Math.PI * 2);
            context.fill();
          }
        }
      }

      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [depth, reduced]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}

/** Top bar with the live depth readout, plus a clickable depth gauge on wide screens. */
export function DepthHud({ chapters }: { chapters: ChapterMarker[] }) {
  const { depth, progress, chapter } = useDepth();
  const readoutRef = useRef<HTMLSpanElement>(null);
  const zoneRef = useRef<HTMLSpanElement>(null);
  const markerTop = useTransform(progress, (p) => `${p * 100}%`);

  useMotionValueEvent(depth, "change", (value) => {
    if (readoutRef.current) readoutRef.current.textContent = `${Math.round(value).toLocaleString("en-US")} m`;
    if (zoneRef.current) zoneRef.current.textContent = zoneFor(value);
  });

  const smooth = useSmoothScroll();
  const zoneSeen = useRef<string | null>(null);
  const [toast, setToast] = useState<{ zone: string; key: number } | null>(null);

  // Crossing into a new zone gets a brief title card, the dive's chapter breaks.
  useMotionValueEvent(depth, "change", (value) => {
    const zone = zoneFor(value);
    if (zoneSeen.current === null) zoneSeen.current = zone;
    if (zone === zoneSeen.current) return;
    zoneSeen.current = zone;
    setToast({ zone, key: Date.now() });
  });

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const current = chapters[chapter];
  const jump = (id: string) => {
    const target = document.getElementById(id);
    if (target) smooth.scrollTo(target);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-4 bg-abyss/40 px-5 py-4 backdrop-blur-md md:px-10">
        <button
          type="button"
          onClick={() => jump(chapters[0].id)}
          className="text-[15px] font-semibold tracking-[0.36em] text-foam"
          aria-label="Back to the surface"
        >
          TIDE
        </button>

        <p className="hidden font-mono text-[12px] text-mist/80 md:block" aria-live="polite">
          {current ? `${current.number} / ${String(chapters.length - 1).padStart(2, "0")} · ${current.title}` : null}
        </p>

        <div className="flex items-center gap-4">
          <p className="text-right font-mono text-[12px] leading-tight text-mist">
            <span className="text-turquoise">▼ </span>
            <span ref={readoutRef}>0 m</span>
            <span className="block text-[10px] tracking-[0.14em] text-mist/60 uppercase" ref={zoneRef}>
              Surface
            </span>
          </p>
          <Link
            href="/"
            className="hidden rounded-full border border-foam/20 px-4 py-2 text-[13px] font-medium text-foam transition-colors hover:border-turquoise/60 hover:text-turquoise sm:inline-flex"
          >
            Open the app ↗
          </Link>
        </div>
      </header>

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.key}
            aria-hidden
            initial={{ opacity: 0, x: -24, filter: "blur(8px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 16, filter: "blur(6px)" }}
            transition={{ duration: 0.9, ease: EXPO_OUT }}
            className="pointer-events-none fixed top-24 left-5 z-40 md:top-1/2 md:left-10 md:-translate-y-1/2"
          >
            <p className="font-mono text-[10px] tracking-[0.24em] text-turquoise/90 uppercase">
              {toast.zone === "Surface" ? "▲ Surfacing" : "▼ Entering"}
            </p>
            <p className="mt-1 text-[22px] font-semibold tracking-tight text-foam md:text-[28px]">{toast.zone}</p>
            <motion.span
              className="mt-2 block h-px w-40 origin-left bg-turquoise/60"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.2, ease: EXPO_OUT, delay: 0.1 }}
            />
            <p className="mt-2 font-mono text-[11px] text-mist/80">{ZONE_NOTES[toast.zone]}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <nav
        aria-label="Chapters"
        className="fixed top-1/2 right-6 z-40 hidden h-[56vh] -translate-y-1/2 lg:block"
      >
        <div className="absolute top-0 right-[5px] h-full w-px bg-foam/15" />
        <motion.div
          className="absolute right-0 h-[11px] w-[11px] -translate-y-1/2 rounded-full bg-turquoise shadow-[0_0_14px_rgba(46,230,197,0.9)]"
          style={{ top: markerTop }}
        />
        <ol className="relative h-full">
          {chapters.map((marker, index) => (
            <li
              key={marker.id}
              className="absolute right-0 -translate-y-1/2"
              style={{ top: `${(index / (chapters.length - 1)) * 100}%` }}
            >
              <button
                type="button"
                onClick={() => jump(marker.id)}
                className={cn(
                  "group flex items-center gap-3 pr-6 font-mono text-[10px] whitespace-nowrap transition-colors",
                  index === chapter ? "text-turquoise" : "text-mist/40 hover:text-foam",
                )}
              >
                <span className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  {marker.title}
                </span>
                <span>{marker.depth.toLocaleString("en-US")} m</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

/** A chapter of the dive. `depth` is where in the water column this chapter sits. */
export function Chapter({
  id,
  depth,
  number,
  title,
  children,
  className,
}: {
  id: string;
  depth: number;
  number?: string;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      data-depth={depth}
      className={cn("relative z-10 mx-auto w-full max-w-6xl px-5 py-28 md:px-10 md:py-40", className)}
    >
      {number && title && (
        <p className="mb-6 flex items-center gap-3 font-mono text-[12px] tracking-[0.16em] text-turquoise/80 uppercase">
          <span>{number}</span>
          <DrawLine className="h-px w-10 bg-turquoise/40" />
          <span>{title}</span>
          <span className="text-mist/40">· {depth.toLocaleString("en-US")} m</span>
        </p>
      )}
      {children}
    </section>
  );
}
