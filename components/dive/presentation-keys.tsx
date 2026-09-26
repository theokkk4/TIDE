"use client";

import { useEffect } from "react";
import { NEXT_KEYS, PREV_KEYS, PRESENTATION_KEY_MESSAGE, ownsArrowKeys } from "@/lib/dive/presentation";
import { easeInOutCubic, useSmoothScroll } from "./smooth-scroll";

/**
 * Presentation controls for /dive: → ↓ PageDown go forward, ← ↑ PageUp go back — which is
 * also what a presentation clicker sends. Every chapter marked `data-slide` is a stop; a
 * chapter taller than the screen gets extra stops so nothing is skipped. Wheel and touch
 * scrolling are left completely alone.
 */
export function PresentationKeys() {
  const smooth = useSmoothScroll();

  useEffect(() => {
    // Where a glide is heading, so quick presses keep advancing instead of re-reading
    // a scroll position that's still moving.
    let heading: { to: number; until: number } | null = null;

    const stops = () => {
      const viewport = window.innerHeight;
      const step = viewport * 0.8;
      const list: number[] = [];
      for (const slide of document.querySelectorAll<HTMLElement>("[data-slide]")) {
        // A sub-stop (one person, one block) lands just below the fixed header.
        const top = Math.round(slide.getBoundingClientRect().top + window.scrollY) - (slide.dataset.slide === "sub" ? 96 : 0);
        list.push(top);
        // A chapter split into sub-stops steps through those instead of by screenfuls.
        if (slide.querySelector("[data-slide]")) continue;
        const end = top + slide.offsetHeight - viewport + (slide.dataset.slide === "sub" ? 96 : 0);
        for (let at = top + step; at < end - viewport * 0.2; at += step) list.push(Math.round(at));
        if (end > top + 40) list.push(Math.round(end));
      }
      const max = document.documentElement.scrollHeight - viewport;
      const sorted = list.map((value) => Math.max(0, Math.min(max, value))).sort((a, b) => a - b);
      // Stops a few pixels apart would feel like a missed press.
      return sorted.filter((value, index) => index === 0 || value - sorted[index - 1] > 60);
    };

    const go = (direction: 1 | -1 | "first" | "last") => {
      const list = stops();
      if (!list.length) return;
      const now = performance.now();
      const from = heading && now < heading.until ? heading.to : window.scrollY;
      const target =
        direction === "first"
          ? list[0]
          : direction === "last"
            ? list[list.length - 1]
            : direction === 1
              ? list.find((stop) => stop > from + 4)
              : [...list].reverse().find((stop) => stop < from - 4);
      if (target === undefined) return;
      const duration = Math.min(1.5, 0.85 + Math.abs(target - from) / 4000);
      heading = { to: target, until: now + duration * 1000 };
      smooth.scrollTo(target, { duration, easing: easeInOutCubic });
    };

    const handle = (key: string, shift = false) => {
      if (NEXT_KEYS.has(key)) go(1);
      else if (PREV_KEYS.has(key)) go(-1);
      else if (key === " ") go(shift ? -1 : 1);
      else if (key === "Home") go("first");
      else if (key === "End") go("last");
      else return false;
      return true;
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (ownsArrowKeys(event.target)) return;
      // Space still presses a focused button or link.
      if (event.key === " " && event.target instanceof Element && event.target.closest("button, a, [role='button']")) return;
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
  }, [smooth]);

  return null;
}
