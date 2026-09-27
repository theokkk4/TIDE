"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
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

/**
 * The reel on the last slide, in order; after the last clip it starts over. To add a clip,
 * put <id>.mp4, <id>.webm and a <id>.jpg poster in public/dive/app and list the id here.
 */
const QUEUE = ["questions", "blue-crab", "striped-bass", "box-turtle"];

/**
 * Plays QUEUE back to back, forever, for the Q&A. Two video elements take turns: while one
 * plays, the other quietly loads the next clip, so each cut is instant — and there are never
 * more than two decoders alive. Like the clips above, it only plays while it's on screen.
 */
export function ClipQueue({ className }: { className?: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLVideoElement>(null);
  const secondRef = useRef<HTMLVideoElement>(null);
  const control = useRef({ toggle: () => {} });
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const box = boxRef.current;
    const players = [firstRef.current, secondRef.current];
    if (!box || !players[0] || !players[1]) return;
    const [a, b] = players as [HTMLVideoElement, HTMLVideoElement];
    const probe = document.createElement("video");
    const type = probe.canPlayType('video/mp4; codecs="avc1.640028"') ? "mp4" : "webm";
    const source = (index: number) => `/dive/app/${QUEUE[index % QUEUE.length]}.${type}`;

    let index = 0;
    let front = a;
    let back = b;
    let inView = false;
    let userPaused = !!reduced;

    for (const player of [a, b]) player.muted = true;
    a.src = source(0);
    b.src = source(1);
    b.preload = "auto";

    const show = () => {
      front.style.opacity = "1";
      back.style.opacity = "0";
    };
    const play = () => {
      if (inView && !userPaused) void front.play().catch(() => undefined);
    };
    const onEnded = (event: Event) => {
      if (event.target !== front) return;
      index = (index + 1) % QUEUE.length;
      [front, back] = [back, front];
      front.currentTime = 0;
      show();
      play();
      setCurrent(index);
      // The one that just finished loads the clip after this one.
      back.src = source(index + 1);
      back.load();
    };
    const onPlay = (event: Event) => event.target === front && setPlaying(true);
    const onPause = (event: Event) => event.target === front && setPlaying(false);
    for (const player of [a, b]) {
      player.addEventListener("ended", onEnded);
      player.addEventListener("play", onPlay);
      player.addEventListener("pause", onPause);
    }
    show();

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) play();
        else front.pause();
      },
      { threshold: 0.4 },
    );
    observer.observe(box);

    control.current.toggle = () => {
      if (front.paused) {
        userPaused = false;
        inView = true;
        play();
      } else {
        userPaused = true;
        front.pause();
      }
    };

    return () => {
      observer.disconnect();
      for (const player of [a, b]) {
        player.removeEventListener("ended", onEnded);
        player.removeEventListener("play", onPlay);
        player.removeEventListener("pause", onPause);
        player.pause();
        player.removeAttribute("src");
        player.load();
      }
    };
  }, [reduced]);

  return (
    <div className={className}>
      <div
        ref={boxRef}
        className="relative mx-auto aspect-[3/5] w-full overflow-hidden rounded-[34px] border border-foam/15 bg-abyss p-2 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9),0_0_70px_-20px_rgba(46,230,197,0.35)]"
      >
        <div className="relative h-full w-full overflow-hidden rounded-[26px]">
          <video
            ref={firstRef}
            poster={`/dive/app/${QUEUE[0]}.jpg`}
            muted
            playsInline
            preload="metadata"
            aria-label="Screen recordings of TIDE identifying animals, playing one after another"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
          />
          {/* The one waiting in the wings, loading the next clip. */}
          <video
            ref={secondRef}
            muted
            playsInline
            preload="none"
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300"
          />
        </div>
        <button
          type="button"
          onClick={() => control.current.toggle()}
          aria-label={playing ? "Pause the recordings" : "Play the recordings"}
          className="absolute right-4 bottom-4 flex h-9 w-9 items-center justify-center rounded-full bg-abyss/70 text-foam backdrop-blur-sm transition hover:bg-abyss/90 hover:text-turquoise"
        >
          {playing ? (
            <Pause className="h-3.5 w-3.5" fill="currentColor" aria-hidden />
          ) : (
            <Play className="h-3.5 w-3.5 translate-x-px" fill="currentColor" aria-hidden />
          )}
        </button>
      </div>
      {/* Which recording is on, as a row of dots. */}
      <div aria-hidden className="mt-4 flex justify-center gap-1.5">
        {QUEUE.map((id, index) => (
          <span
            key={id}
            className={cn("h-1.5 rounded-full transition-all duration-300", index === current ? "w-5 bg-turquoise" : "w-1.5 bg-foam/25")}
          />
        ))}
      </div>
    </div>
  );
}
