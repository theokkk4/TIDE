"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { StatusBadge } from "@/components/ui/status-badge";
import { statusFromCode } from "@/lib/status";
import { onTick } from "@/lib/dive/ticker";
import { cn } from "@/lib/utils";
import { SELECT_SPECIES_EVENT } from "./creature-layer";
import type { SpeciesCardData } from "./interactives";
import { QUINT_OUT } from "./reveal";
import { useSmoothScroll } from "./smooth-scroll";

const DRIFT = 26; // px per second, like a slow current

/**
 * All thirty species as a current you can grab: it drifts on its own, speeds up when you
 * scroll, can be dragged and flung, and each photo shifts inside its frame as it passes
 * (bright-avenue.jp's loop gallery, underwater). Tap a card to check its verdict.
 */
export function SpeciesRiver({ species }: { species: SpeciesCardData[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const smooth = useSmoothScroll();
  const dragged = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    const section = sectionRef.current;
    if (!track || !section || reduced) return;

    let offset = 0;
    let velocity = 0;
    let dragging = false;
    let lastX = 0;
    let startX = 0;
    let lastScroll = window.scrollY;
    let boost = 0;
    let inView = false;

    const observer = new IntersectionObserver(([entry]) => (inView = entry.isIntersecting), { rootMargin: "200px" });
    observer.observe(section);

    const cards = Array.from(track.querySelectorAll<HTMLElement>("[data-card]"));
    const images = cards.map((card) => card.querySelector<HTMLElement>("[data-parallax]"));

    const stop = onTick((_, delta) => {
      const dt = delta / 1000;
      const scroll = window.scrollY;
      // Scrolling the page pushes the current along.
      boost += (Math.abs(scroll - lastScroll) * 6 - boost) * Math.min(1, dt * 4);
      lastScroll = scroll;
      if (!inView) return;
      if (!dragging) {
        velocity *= Math.exp(-2.6 * dt);
        offset += (DRIFT + boost) * dt + velocity * dt;
      }
      const half = track.scrollWidth / 2;
      if (half > 0) offset = ((offset % half) + half) % half;
      track.style.transform = `translate3d(${-offset}px,0,0)`;
      // Each photo slides against its frame depending on where it is across the screen.
      const mid = window.innerWidth / 2;
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const center = card.offsetLeft - offset + card.offsetWidth / 2;
        const shift = ((center - mid) / window.innerWidth) * -44;
        const image = images[i];
        if (image) image.style.transform = `translate3d(${shift}px,0,0) scale(1.18)`;
      }
    }, 20);

    const down = (event: PointerEvent) => {
      dragging = true;
      dragged.current = false;
      startX = lastX = event.clientX;
      velocity = 0;
    };
    const move = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - lastX;
      lastX = event.clientX;
      offset -= dx;
      velocity = -dx * 60;
      // Capture only once it's clearly a drag, so a plain tap still clicks the card.
      if (!dragged.current && Math.abs(event.clientX - startX) > 6) {
        dragged.current = true;
        track.setPointerCapture(event.pointerId);
      }
    };
    const up = () => {
      dragging = false;
    };
    track.addEventListener("pointerdown", down);
    track.addEventListener("pointermove", move);
    track.addEventListener("pointerup", up);
    track.addEventListener("pointercancel", up);

    return () => {
      stop();
      observer.disconnect();
      track.removeEventListener("pointerdown", down);
      track.removeEventListener("pointermove", move);
      track.removeEventListener("pointerup", up);
      track.removeEventListener("pointercancel", up);
    };
  }, [reduced]);

  const select = (slug: string) => {
    if (dragged.current) return;
    window.dispatchEvent(new CustomEvent(SELECT_SPECIES_EVENT, { detail: slug }));
    const explorer = document.getElementById("verdict-explorer");
    if (explorer) smooth.scrollTo(explorer, { offset: -140 });
  };

  // Rendered twice so the loop is seamless; the second copy is decorative.
  const loop = reduced ? species : [...species, ...species];

  return (
    <div ref={sectionRef} className="relative z-10 overflow-hidden py-6">
      <div
        ref={trackRef}
        className={cn(
          "flex w-max gap-5 px-5 will-change-transform select-none md:px-10",
          reduced ? "no-scrollbar w-auto overflow-x-auto" : "cursor-grab touch-pan-y active:cursor-grabbing",
        )}
      >
        {loop.map((s, i) => {
          const copy = i >= species.length;
          const status = statusFromCode(s.status);
          return (
            <motion.button
              key={`${s.slug}-${i}`}
              type="button"
              data-card
              tabIndex={copy ? -1 : 0}
              aria-hidden={copy || undefined}
              onClick={() => select(s.slug)}
              initial={reduced ? false : { opacity: 0, y: 90, rotateX: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
              viewport={{ once: true, margin: "0px -4% 0px -4%" }}
              transition={{
                default: { duration: 1.5, ease: QUINT_OUT, delay: (i % 6) * 0.07 },
                opacity: { duration: 0.7, delay: (i % 6) * 0.07 },
              }}
              style={{ transformPerspective: 1200, transformOrigin: "50% 100%" }}
              className="group relative h-[300px] w-[210px] shrink-0 overflow-hidden rounded-[26px] border border-foam/10 bg-trench text-left md:h-[360px] md:w-[260px]"
            >
              {s.image && (
                <div data-parallax className="absolute inset-0 will-change-transform">
                  <Image
                    src={s.image}
                    alt={copy ? "" : s.name}
                    fill
                    draggable={false}
                    sizes="260px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              )}
              {/* Deep-water grade so daylight photos sit in the dark. */}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,20,0.1)_30%,rgba(2,8,20,0.92))]" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <StatusBadge status={status} size="sm" />
                <p className="mt-2 text-[17px] leading-tight font-semibold text-foam">{s.name}</p>
                <p className="text-[12px] text-mist italic">{s.scientificName}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
