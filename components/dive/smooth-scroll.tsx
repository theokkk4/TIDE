"use client";

import "lenis/dist/lenis.css";
import Lenis from "lenis";
import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { onTick } from "@/lib/dive/ticker";

export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeInOutExpo = (t: number) =>
  t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

interface ScrollOptions {
  offset?: number;
  /** Seconds. Defaults to longer for longer jumps, so the depth readout visibly races. */
  duration?: number;
  easing?: (t: number) => number;
}

interface SmoothScroll {
  /** Glides to an element or offset. */
  scrollTo: (target: HTMLElement | number, options?: ScrollOptions) => void;
  /** Moves there at once — for a cut hidden behind a slide transition. */
  jumpTo: (top: number) => void;
}

function destinationOf(target: HTMLElement | number, offset = 0) {
  return typeof target === "number" ? target : target.getBoundingClientRect().top + window.scrollY + offset;
}

const SmoothScrollContext = createContext<SmoothScroll>({
  scrollTo: (target, options) => window.scrollTo({ top: destinationOf(target, options?.offset) }),
  jumpTo: (top) => window.scrollTo({ top, behavior: "instant" }),
});

export function useSmoothScroll() {
  return useContext(SmoothScrollContext);
}

/**
 * Inertial scrolling for the story page, the same technique bright-avenue.jp uses (Lenis).
 * Touch keeps native momentum, and reduced-motion users keep native scrolling entirely.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1, autoRaf: false });
    lenisRef.current = lenis;
    const stop = onTick((time) => lenis.raf(time), -100);
    return () => {
      stop();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reduced]);

  const api = useMemo<SmoothScroll>(
    () => ({
      scrollTo(target, options = {}) {
        const destination = destinationOf(target, options.offset);
        const lenis = lenisRef.current;
        if (!lenis) {
          window.scrollTo({ top: destination, behavior: "smooth" });
          return;
        }
        const distance = Math.abs(destination - window.scrollY);
        lenis.scrollTo(destination, {
          duration: options.duration ?? Math.min(3.2, 1.1 + distance / 5000),
          easing: options.easing ?? easeInOutExpo,
        });
      },
      jumpTo(top) {
        const lenis = lenisRef.current;
        if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
        else window.scrollTo({ top, behavior: "instant" });
      },
    }),
    [],
  );

  return <SmoothScrollContext.Provider value={api}>{children}</SmoothScrollContext.Provider>;
}
