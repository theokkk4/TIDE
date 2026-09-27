"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { NEXT_KEYS, PREV_KEYS, PRESENTATION_KEY_MESSAGE, ownsArrowKeys } from "@/lib/dive/presentation";
import { useSmoothScroll } from "./smooth-scroll";

type Direction = 1 | -1 | "first" | "last";

interface Stop {
  top: number;
  /** The chapter a stop belongs to. Moving to another chapter gets the full tide. */
  chapter: Element;
}

/** Height of each wave edge on the tide curtain, in px. */
const WAVE = 90;
const TIDE_IN = { duration: 440, easing: "cubic-bezier(0.55, 0, 0.8, 0.3)" };
const TIDE_OUT = { duration: 700, easing: "cubic-bezier(0.16, 1, 0.3, 1)" };

/** Two animation frames: long enough for the page to paint where it just jumped to. */
const settle = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

/**
 * Presentation controls for /dive. → ↓ PageDown go forward, ← ↑ PageUp go back — which is
 * also what a presentation clicker sends — and every press is one slide. Moving to a new
 * chapter, a wave sweeps across the screen and the page changes underneath it; within a
 * chapter the screen dips to dark. Wheel and touch scrolling are left completely alone, so
 * the page looks and reads the same for anyone just scrolling.
 *
 * Cheap on memory: two plain overlays that stay display:none until a transition runs, animated
 * with the Web Animations API on the compositor.
 */
export function PresentationKeys() {
  const smooth = useSmoothScroll();
  const reduced = useReducedMotion();
  const tideRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let busy = false;
    let queued: Direction | null = null;

    const stops = () => {
      const viewport = window.innerHeight;
      const list: Stop[] = [];
      for (const slide of document.querySelectorAll<HTMLElement>("[data-slide]")) {
        const top = Math.round(slide.getBoundingClientRect().top + window.scrollY);
        const chapter = slide.closest("[data-depth]") ?? slide;
        list.push({ top, chapter });
        // A chapter split into slides steps through those.
        if (slide.querySelector("[data-slide]")) continue;
        // A slide still taller than the screen (on a phone) gets extra stops so nothing is skipped.
        const end = top + slide.offsetHeight - viewport;
        for (let at = top + viewport * 0.8; at < end - viewport * 0.2; at += viewport * 0.8) {
          list.push({ top: Math.round(at), chapter });
        }
        if (end > top + 40) list.push({ top: Math.round(end), chapter });
      }
      const max = document.documentElement.scrollHeight - viewport;
      const sorted = list
        .map((stop) => ({ ...stop, top: Math.max(0, Math.min(max, stop.top)) }))
        .sort((a, b) => a.top - b.top);
      // Stops a few pixels apart would feel like a missed press.
      return sorted.filter((stop, index) => index === 0 || stop.top - sorted[index - 1].top > 60);
    };

    const tide = async (top: number, down: boolean) => {
      const node = tideRef.current;
      if (!node) return smooth.jumpTo(top);
      const viewport = window.innerHeight;
      const below = `translate3d(0, ${viewport}px, 0)`;
      const covered = `translate3d(0, ${-WAVE}px, 0)`;
      const above = `translate3d(0, ${-(viewport + WAVE * 2)}px, 0)`;
      node.style.display = "flex";
      await node.animate([{ transform: down ? below : above }, { transform: covered }], {
        ...TIDE_IN,
        fill: "forwards",
      }).finished;
      smooth.jumpTo(top);
      await settle();
      await node.animate([{ transform: covered }, { transform: down ? above : below }], {
        ...TIDE_OUT,
        fill: "forwards",
      }).finished;
      // Hide first: cancelling first would paint one frame of the overlay at rest, on screen.
      node.style.display = "none";
      node.getAnimations().forEach((animation) => animation.cancel());
    };

    const dip = async (top: number) => {
      const node = veilRef.current;
      if (!node) return smooth.jumpTo(top);
      node.style.display = "block";
      await node.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: reduced ? 120 : 230,
        easing: "ease-in",
        fill: "forwards",
      }).finished;
      smooth.jumpTo(top);
      await settle();
      await node.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: reduced ? 180 : 440,
        easing: "ease-out",
        fill: "forwards",
      }).finished;
      node.style.display = "none";
      node.getAnimations().forEach((animation) => animation.cancel());
    };

    const go = async (direction: Direction) => {
      if (busy) {
        // One press can wait its turn; more than that is a clicker bouncing.
        queued = direction;
        return;
      }
      const list = stops();
      if (!list.length) return;
      const y = window.scrollY;
      const target =
        direction === "first"
          ? list[0]
          : direction === "last"
            ? list[list.length - 1]
            : direction === 1
              ? list.find((stop) => stop.top > y + 4)
              : [...list].reverse().find((stop) => stop.top < y - 4);
      if (!target) return;
      const current = [...list].reverse().find((stop) => stop.top <= y + 4) ?? list[0];

      busy = true;
      try {
        if (reduced || current.chapter === target.chapter) await dip(target.top);
        else await tide(target.top, target.top > y);
      } finally {
        busy = false;
      }
      if (queued !== null) {
        const next = queued;
        queued = null;
        void go(next);
      }
    };

    const handle = (key: string, shift = false) => {
      if (NEXT_KEYS.has(key)) void go(1);
      else if (PREV_KEYS.has(key)) void go(-1);
      else if (key === " ") void go(shift ? -1 : 1);
      else if (key === "Home") void go("first");
      else if (key === "End") void go("last");
      else return false;
      return true;
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (ownsArrowKeys(event.target)) return;
      // Space still presses a focused button or link.
      if (event.key === " " && event.target instanceof Element && event.target.closest("button, a, [role='button']"))
        return;
      if (handle(event.key, event.shiftKey)) event.preventDefault();
    };

    // The live app inside the phone forwards the clicker once someone has tapped into it.
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; key?: string } | null;
      if (data?.type === PRESENTATION_KEY_MESSAGE && typeof data.key === "string") handle(data.key);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("message", onMessage);
    };
  }, [smooth, reduced]);

  return (
    <>
      {/* The tide: a wall of water with a wave on each edge, so it reads the same going up or down. */}
      <div
        ref={tideRef}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[35] hidden w-full flex-col"
        style={{ height: `calc(100dvh + ${WAVE * 2}px)` }}
      >
        <TideEdge />
        <div className="-my-px flex-1 bg-[#07304d]" />
        <TideEdge flip />
      </div>
      {/* Between slides of the same chapter, a quick dip to the dark. */}
      <div ref={veilRef} aria-hidden className="pointer-events-none fixed inset-0 z-[35] hidden bg-[#020c19]" />
    </>
  );
}

function TideEdge({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 1200 90"
      preserveAspectRatio="none"
      className="block w-full shrink-0"
      style={{ height: WAVE, transform: flip ? "scaleY(-1)" : undefined }}
    >
      {/* A lighter swell running just ahead of the wave, out of phase with it. */}
      <path fill="#2ee6c5" fillOpacity={0.18} d="M0 38 C180 8 360 10 560 36 C760 62 960 62 1200 30 V90 H0 Z" />
      <path fill="#07304d" d="M0 56 C150 28 300 26 450 50 C600 74 750 76 900 52 C1050 28 1130 30 1200 42 V90 H0 Z" />
      {/* The foam line along the crest. */}
      <path
        fill="none"
        stroke="#5fe3ef"
        strokeOpacity={0.75}
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        d="M0 56 C150 28 300 26 450 50 C600 74 750 76 900 52 C1050 28 1130 30 1200 42"
      />
    </svg>
  );
}
