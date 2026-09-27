"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { QUINT_OUT } from "./reveal";

const CLIPS = [
  {
    id: "blue-crab",
    name: "Blue crab",
    note: "94% sure. Pick your state for the verdict, then the recipes.",
    alt: "Screen recording: TIDE identifies a blue crab and scrolls through its rules and recipes",
  },
  {
    id: "striped-bass",
    name: "Striped bass",
    note: "92% sure. Least Concern, but check your state's slot.",
    alt: "Screen recording: TIDE identifies a striped bass and shows its conservation status",
  },
  {
    id: "box-turtle",
    name: "Eastern box turtle",
    note: "95% sure. Vulnerable, so leave it where it is.",
    alt: "Screen recording: TIDE identifies an eastern box turtle and says to leave it where it is",
  },
];

/**
 * One recorded scan. It loops while it's on screen and pauses the moment it leaves, so only
 * what you're looking at downloads and plays. Reduced motion shows the still until you press play.
 */
function Clip({ clip, index }: { clip: (typeof CLIPS)[number]; index: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const userPaused = useRef(false);
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduced) return;
    // React doesn't always reflect `muted` onto the element, and browsers only autoplay muted video.
    video.muted = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !userPaused.current) void video.play().catch(() => undefined);
        else if (!entry.isIntersecting) video.pause();
      },
      { threshold: 0.45 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [reduced]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      userPaused.current = false;
      video.muted = true;
      void video.play().catch(() => undefined);
    } else {
      userPaused.current = true;
      video.pause();
    }
  };

  return (
    <motion.figure
      initial={reduced ? false : { opacity: 0, y: 70 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 1.2, ease: QUINT_OUT, delay: index * 0.12 }}
      className="w-[68vw] max-w-[300px] shrink-0 snap-center md:w-auto md:max-w-none"
    >
      {/* Sized by the viewport's height too, so the row always fits on one slide. */}
      <div className="relative mx-auto aspect-[3/5] w-full overflow-hidden rounded-[30px] border border-foam/15 bg-abyss p-1.5 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9),0_0_50px_-20px_rgba(46,230,197,0.3)] md:w-[min(100%,calc((100dvh-300px)*0.6))]">
        <video
          ref={videoRef}
          poster={`/dive/app/${clip.id}.jpg`}
          muted
          loop
          playsInline
          preload="none"
          aria-label={clip.alt}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          className="h-full w-full rounded-[24px] object-cover"
        >
          {/* Most browsers take the H.264 file; builds without H.264 fall back to VP9. */}
          <source src={`/dive/app/${clip.id}.mp4`} type="video/mp4" />
          <source src={`/dive/app/${clip.id}.webm`} type="video/webm" />
        </video>
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? `Pause the ${clip.name.toLowerCase()} recording` : `Play the ${clip.name.toLowerCase()} recording`}
          className="absolute right-3.5 bottom-3.5 flex h-9 w-9 items-center justify-center rounded-full bg-abyss/70 text-foam backdrop-blur-sm transition hover:bg-abyss/90 hover:text-turquoise"
        >
          {playing ? <Pause className="h-3.5 w-3.5" fill="currentColor" aria-hidden /> : <Play className="h-3.5 w-3.5 translate-x-px" fill="currentColor" aria-hidden />}
        </button>
      </div>
      <figcaption className="mx-auto mt-4 md:w-[min(100%,calc((100dvh-300px)*0.6))]">
        <p className="font-mono text-[11px] tracking-[0.16em] text-turquoise/80 uppercase">
          0{index + 1} · {clip.name}
        </p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-mist">{clip.note}</p>
      </figcaption>
    </motion.figure>
  );
}

/** Three real scans, recorded in the app, looping side by side — a swipeable row on phones. */
export function AppClips() {
  return (
    <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:snap-none md:grid-cols-3 md:gap-8 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden">
      {CLIPS.map((clip, index) => (
        <Clip key={clip.id} clip={clip} index={index} />
      ))}
    </div>
  );
}
