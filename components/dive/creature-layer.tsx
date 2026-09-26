"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { StatusBadge } from "@/components/ui/status-badge";
import { statusFromCode } from "@/lib/status";
import type { CreatureGuide } from "@/lib/dive/creatures";
import { startOcean } from "./ocean/engine";
import { useDepth } from "./depth";
import { easeOutExpo, useSmoothScroll } from "./smooth-scroll";

export const SELECT_SPECIES_EVENT = "tide:select-species";

/**
 * The living ocean: creatures on two canvases (behind the story, and a few in front of
 * it), plus TIDE's scanner — hover open water near a creature and it gets identified.
 */
export function CreatureLayer({ guide }: { guide: CreatureGuide[] }) {
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const cornersRef = useRef<(HTMLSpanElement | null)[]>([]);
  const [active, setActive] = useState<string | null>(null);
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
        onTarget: (id) => setActive(id),
        onFrame: (target, lock) => {
          const reticle = reticleRef.current;
          const label = labelRef.current;
          if (!reticle || !label) return;
          reticle.style.opacity = target ? "1" : "0";
          label.style.opacity = target ? "1" : "0";
          if (!target) return;
          // Brackets start wide and snap in as TIDE locks on.
          const spread = target.r + 10 + (1 - easeOutExpo(lock)) * 34;
          const offsets = [
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ];
          cornersRef.current.forEach((corner, i) => {
            if (!corner) return;
            const [sx, sy] = offsets[i];
            corner.style.transform = `translate3d(${target.x + sx * spread}px, ${target.y + sy * spread}px, 0)`;
          });
          const width = label.offsetWidth || 260;
          const right = target.x + spread + 16 + width < window.innerWidth - 12;
          const lx = right ? target.x + spread + 16 : Math.max(12, target.x - spread - 16 - width);
          const ly = Math.min(window.innerHeight - label.offsetHeight - 12, Math.max(76, target.y - spread));
          label.style.transform = `translate3d(${lx}px, ${ly}px, 0)`;
        },
        onActivate: (id) => {
          const entry = guideRef.current.find((g) => g.id === id);
          if (!entry?.slug) return;
          window.dispatchEvent(new CustomEvent(SELECT_SPECIES_EVENT, { detail: entry.slug }));
          const explorer = document.getElementById("verdict-explorer");
          if (explorer) smooth.scrollTo(explorer, { offset: -140 });
        },
      },
    });
  }, [depth, reduced, smooth]);

  const entry = guide.find((g) => g.id === active) ?? null;
  const status = entry ? statusFromCode(entry.iucn) : null;

  return (
    <>
      <canvas ref={backRef} aria-hidden className="pointer-events-none fixed inset-0 z-0 h-full w-full" />
      <canvas ref={frontRef} aria-hidden className="pointer-events-none fixed inset-0 z-20 h-full w-full" />

      <div aria-hidden ref={reticleRef} className="pointer-events-none fixed inset-0 z-30 opacity-0 transition-opacity duration-300">
        {/* Tailwind's translate utilities compose with the inline transform set each frame. */}
        {[
          "border-t-2 border-l-2",
          "border-t-2 border-r-2 -translate-x-full",
          "border-b-2 border-l-2 -translate-y-full",
          "border-b-2 border-r-2 -translate-x-full -translate-y-full",
        ].map((classes, i) => (
          <span
            key={classes}
            ref={(node) => {
              cornersRef.current[i] = node;
            }}
            className={`absolute top-0 left-0 h-4 w-4 border-turquoise ${classes}`}
          />
        ))}
      </div>

      {/* Announced politely so the identification is available to screen readers too. */}
      <div
        ref={labelRef}
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed top-0 left-0 z-30 w-[260px] opacity-0 transition-opacity duration-300"
      >
        {entry && status && (
          <div className="glass-strong rounded-2xl p-4 shadow-[0_0_40px_-10px_rgba(46,230,197,0.5)]">
            <p className="font-mono text-[10px] tracking-[0.18em] text-turquoise uppercase">TIDE · Field ID</p>
            <p className="mt-1.5 text-[16px] leading-tight font-semibold text-foam">{entry.name}</p>
            <p className="text-[12px] text-mist italic">{entry.scientificName}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={status} size="sm" />
              <span className="font-mono text-[10px] text-mist/80">{entry.zone}</span>
            </div>
            <p className="mt-3 text-[12.5px] leading-snug text-foam/85">{entry.fact}</p>
            {entry.slug && <p className="mt-2 text-[11px] text-turquoise/90">Click to see TIDE&apos;s verdict →</p>}
          </div>
        )}
      </div>
    </>
  );
}
