"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import type { CreatureGuide } from "@/lib/dive/creatures";
import { startOcean } from "./ocean/engine";
import { useDepth } from "./depth";
import { useSmoothScroll } from "./smooth-scroll";

export const SELECT_SPECIES_EVENT = "tide:select-species";

/**
 * The living ocean: creatures on two canvases (behind the story, and a few in front of it).
 * Click or tap one and the page glides to the field guide — straight to its verdict when
 * TIDE covers that species.
 */
export function CreatureLayer({ guide }: { guide: CreatureGuide[] }) {
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const { depth } = useDepth();
  const smooth = useSmoothScroll();
  const guideRef = useRef(guide);

  useEffect(() => {
    guideRef.current = guide;
  }, [guide]);

  useEffect(() => {
    const back = backRef.current;
    const front = frontRef.current;
    if (!back || !front) return;

    return startOcean(back, front, {
      depth: () => depth.get(),
      reduced: !!reduced,
      view: {
        onActivate: (id) => {
          const entry = guideRef.current.find((g) => g.id === id);
          if (entry?.slug) window.dispatchEvent(new CustomEvent(SELECT_SPECIES_EVENT, { detail: entry.slug }));
          const explorer = entry?.slug ? document.getElementById("verdict-explorer") : null;
          const catalog = explorer ?? document.getElementById("field-guide");
          if (catalog) smooth.scrollTo(catalog, { offset: explorer ? -140 : -60 });
        },
      },
    });
  }, [depth, reduced, smooth]);

  return (
    <>
      <canvas ref={backRef} aria-hidden className="pointer-events-none fixed inset-0 z-0 h-full w-full" />
      <canvas ref={frontRef} aria-hidden className="pointer-events-none fixed inset-0 z-20 h-full w-full" />
    </>
  );
}
