"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Home, ScanSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import { PhoneFrame } from "./interactives";

const HOME = "/";
const CRAB = "/identify?sample=crab";

interface LiveDemo {
  src: string;
  /** Bumped on every run so the same address still reloads the app. */
  run: number;
  mode: "live" | "video";
  videoSrc: string | null;
  open: (src: string) => void;
  setMode: (mode: "live" | "video") => void;
}

const LiveDemoContext = createContext<LiveDemo | null>(null);

function useLiveDemo() {
  const demo = useContext(LiveDemoContext);
  if (!demo) throw new Error("useLiveDemo must be used inside LiveDemoProvider");
  return demo;
}

/** One live copy of the app, shared by the "The app" and "Live identification" chapters. */
export function LiveDemoProvider({ videoSrc, children }: { videoSrc: string | null; children: ReactNode }) {
  const [src, setSrc] = useState(HOME);
  const [run, setRun] = useState(0);
  const [mode, setMode] = useState<"live" | "video">(videoSrc ? "video" : "live");
  const open = (next: string) => {
    setMode("live");
    setSrc(next);
    setRun((count) => count + 1);
  };
  return (
    <LiveDemoContext.Provider value={{ src, run, mode, videoSrc, open, setMode }}>{children}</LiveDemoContext.Provider>
  );
}

/** The real app in a phone — not a recording — plus the demo video if the team adds one. */
export function LivePhone() {
  const demo = useLiveDemo();
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.85);
  const [ready, setReady] = useState(false);

  // Load the app quietly a moment after the story opens, so it's already running by the
  // time a presenter reaches it — not loading while everyone watches.
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 2500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / 390));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col items-center">
      {/* Width is capped by viewport height too, so the whole phone fits on a laptop screen. */}
      <PhoneFrame className="w-[min(82vw,330px,calc((100dvh-190px)*0.462))]">
        <div ref={frameRef} className="absolute inset-0">
          {demo.mode === "video" && demo.videoSrc ? (
            <video src={demo.videoSrc} className="h-full w-full object-cover" autoPlay muted loop playsInline controls />
          ) : ready || demo.run > 0 ? (
            <iframe
              key={demo.run}
              src={demo.src}
              title="TIDE — the live app"
              className="absolute top-0 left-0 origin-top-left border-0"
              style={{ width: 390, height: 844, transform: `scale(${scale})` }}
            />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(180deg,#0d5570,#020814_70%)]" />
          )}
        </div>
      </PhoneFrame>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[13px]">
        {demo.videoSrc && (
          <div className="inline-flex rounded-full border border-foam/15 p-1" role="tablist" aria-label="Demo view">
            {(["video", "live"] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={demo.mode === option}
                onClick={() => demo.setMode(option)}
                className={cn(
                  "rounded-full px-3.5 py-1 font-medium transition-colors",
                  demo.mode === option ? "bg-turquoise text-abyss" : "text-mist hover:text-foam",
                )}
              >
                {option === "video" ? "Recording" : "Live app"}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => demo.open(HOME)}
          className="inline-flex items-center gap-1.5 rounded-full border border-foam/15 px-3.5 py-1.5 text-mist transition-colors hover:border-turquoise/50 hover:text-foam"
        >
          <Home className="h-3.5 w-3.5" aria-hidden />
          Home
        </button>
        <a
          href={demo.src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-foam/15 px-3.5 py-1.5 text-mist transition-colors hover:border-turquoise/50 hover:text-foam"
        >
          Full screen
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>
    </div>
  );
}

/**
 * Sends the crab photo through the real pipeline. On a laptop it runs in the phone beside
 * it; on a phone, where that phone would be tiny, it opens the app full screen instead.
 */
export function IdentifyCrabButton() {
  const demo = useLiveDemo();
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (window.matchMedia("(min-width: 768px)").matches) demo.open(CRAB);
        else router.push(CRAB);
      }}
      className="inline-flex items-center gap-2.5 rounded-full bg-[linear-gradient(145deg,#5fe3ef,#2ee6c5)] px-6 py-3.5 text-[16px] font-semibold text-abyss shadow-[0_10px_30px_-10px_rgba(46,230,197,0.8)] transition hover:brightness-105"
    >
      <ScanSearch className="h-5 w-5" strokeWidth={2.2} aria-hidden />
      Identify this crab
    </button>
  );
}
