"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { QUINT_OUT } from "./reveal";

/**
 * An iPhone Live Photo on the web: the still shows first, and the one-second clip plays
 * once as it scrolls into view — or again on hover or tap.
 */
export function LivePhoto({
  still,
  video,
  alt,
  caption,
  className,
}: {
  still: string;
  video: string;
  alt: string;
  caption: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(false);

  const play = () => {
    const node = videoRef.current;
    if (!node || reduced) return;
    node.currentTime = 0;
    void node.play().catch(() => undefined);
  };

  useEffect(() => {
    if (!inView || reduced) return;
    const node = videoRef.current;
    if (!node) return;
    node.currentTime = 0;
    void node.play().catch(() => undefined);
  }, [inView, reduced]);

  return (
    <motion.figure
      ref={ref}
      initial={reduced ? false : { opacity: 0, y: 90, rotateX: 40, scale: 0.92 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 1.5, ease: QUINT_OUT }}
      style={{ transformPerspective: 1300, transformOrigin: "50% 100%" }}
      className={className}
      onMouseEnter={play}
      onClick={play}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-[28px] border border-foam/10 bg-abyss shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)]">
        <Image src={still} alt={alt} fill sizes="(max-width: 768px) 90vw, 420px" className="object-cover" />
        <video
          ref={videoRef}
          src={video}
          muted
          playsInline
          preload="metadata"
          aria-hidden
          onPlay={() => setPlaying(true)}
          onEnded={() => setPlaying(false)}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: playing ? 1 : 0, transition: "opacity 200ms" }}
        />
        <span className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-abyss/60 px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-foam backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-foam" aria-hidden />
          LIVE
        </span>
      </div>
      <figcaption className="mt-3 font-mono text-[12px] text-mist/70">{caption}</figcaption>
    </motion.figure>
  );
}

/** Extra photos from the field, shown only when the files exist in public/dive/story. */
export function FieldPhoto({ src, caption, index }: { src: string; caption: string; index: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.figure
      initial={reduced ? false : { opacity: 0, y: 70, rotate: index % 2 ? 3 : -3 }}
      whileInView={{ opacity: 1, y: 0, rotate: index % 2 ? 1.5 : -1.5 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 1.3, ease: QUINT_OUT, delay: index * 0.1 }}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-[22px] border border-foam/10">
        <Image src={src} alt={caption} fill sizes="(max-width: 768px) 45vw, 260px" className="object-cover" />
      </div>
      <figcaption className="mt-2 font-mono text-[11px] text-mist/70">{caption}</figcaption>
    </motion.figure>
  );
}
