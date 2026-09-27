"use client";

import { useEffect } from "react";

/** Below this width the story is read by scrolling, so nothing is scaled. */
const WIDE = "(min-width: 768px)";
/** Never shrink a slide past this — small type is worse than a slide that scrolls a little. */
const MIN_SCALE = 0.6;
/** Breathing room kept between a scaled slide and the edges of the screen. */
const SLACK = 16;

/**
 * Makes every slide fit the screen it's shown on. Each `[data-fit]` block is measured at full
 * size and, if it's taller than the space its frame leaves below the header, zoomed down
 * until it fits — what presentation software does for a projector with fewer pixels than the
 * laptop the slides were made on. CSS zoom re-lays the page out, so nothing extra is kept
 * in memory the way a transformed layer would be.
 */
export function SlideFit() {
  useEffect(() => {
    const wide = window.matchMedia(WIDE);
    let frame = 0;

    const fit = () => {
      frame = 0;
      const blocks = Array.from(document.querySelectorAll<HTMLElement>("[data-fit]"));
      for (const block of blocks) block.style.zoom = "";
      if (!wide.matches) return;

      // Read every size first, then write, so the page lays out once.
      const viewport = window.innerHeight;
      const scales = blocks.map((block) => {
        const style = getComputedStyle(block.parentElement ?? block);
        const room = viewport - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - SLACK;
        return room / block.offsetHeight;
      });
      blocks.forEach((block, index) => {
        if (scales[index] < 0.99) block.style.zoom = String(Math.max(MIN_SCALE, Math.floor(scales[index] * 100) / 100));
      });
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(fit);
    };

    schedule();
    // Web fonts and late images can change a slide's height after the first pass.
    void document.fonts?.ready.then(schedule);
    window.addEventListener("load", schedule);
    window.addEventListener("resize", schedule);
    wide.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("load", schedule);
      window.removeEventListener("resize", schedule);
      wide.removeEventListener("change", schedule);
    };
  }, []);

  return null;
}
