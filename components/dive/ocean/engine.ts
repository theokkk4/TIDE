import { onTick } from "@/lib/dive/ticker";
import { Creature, smoothstep, type Frame } from "./kit";
import { CombJelly, HumpbackWhale, MantaRay, MoonJelly, SardineSchool, SeaTurtle } from "./shallow";
import { DeepJelly, LanternfishSchool, Siphonophore, SpermWhale } from "./twilight";
import { Amphipods, Anglerfish, DumboOctopus, Snailfish } from "./deep";

/**
 * Who lives where. Each creature sits in the chapter whose depth matches its real habitat,
 * so the cast changes as you dive: bait balls and turtles near the surface, lanternfish and
 * siphonophores in the twilight, the anglerfish and Atolla in the midnight zone, snailfish
 * and amphipods at the bottom — and a manta overhead when you come back up.
 */
function cast(): Creature[] {
  return [
    new SardineSchool({ section: "surface", at: 0.82, x: 0.74, parallax: 0.9 }, 64, 3, "front"),
    new SeaTurtle({ section: "question", at: 0.12, x: 0.82, parallax: 0.72 }),
    new HumpbackWhale({ section: "question", at: 0.95, x: 0.5, parallax: 0.34 }),
    new MoonJelly({ section: "question", at: 0.42, x: 0.9, parallax: 0.95 }, 38, 11),
    new MoonJelly({ section: "question", at: 0.78, x: 0.08, parallax: 1.1 }, 28, 12),
    new CombJelly({ section: "question", at: 0.62, x: 0.93, parallax: 1.05 }, 4),
    new SardineSchool({ section: "split", at: 0.05, x: 0.8, parallax: 1 }, 48, 8),
    new LanternfishSchool({ section: "split", at: 0.5, x: 0.2, parallax: 1.05 }, 16, 5),
    new DeepJelly({ section: "split", at: 0.9, x: 0.9, parallax: 0.95 }, "helmet", 30, 21),
    new Siphonophore({ section: "scatter", at: 0.3, x: 0.7, parallax: 0.8 }, 6),
    new LanternfishSchool({ section: "scatter", at: 0.78, x: 0.78, parallax: 0.9 }, 18, 9),
    new DeepJelly({ section: "scatter", at: 0.95, x: 0.1, parallax: 1.1 }, "helmet", 24, 22),
    new SpermWhale({ section: "lens", at: 0.3, x: 0.5, parallax: 0.3 }),
    new Siphonophore({ section: "lens", at: 0.85, x: 0.12, parallax: 0.75 }, 13, 34),
    new DeepJelly({ section: "verdict", at: 0.25, x: 0.92, parallax: 0.9 }, "atolla", 34, 31),
    new Siphonophore({ section: "verdict", at: 0.8, x: 0.08, parallax: 0.8 }, 17),
    new DeepJelly({ section: "evidence", at: 0.2, x: 0.07, parallax: 1 }, "atolla", 28, 32),
    new DumboOctopus({ section: "evidence", at: 0.6, x: 0.9, parallax: 0.9 }, 2),
    new Snailfish({ section: "evidence", at: 0.95, x: 0.2, parallax: 0.85 }, 3),
    new Snailfish({ section: "deep", at: 0.12, x: 0.8, parallax: 1 }, 4),
    new Amphipods({ section: "deep", at: 0.9, x: 0.3, parallax: 1 }, 7, 44),
    new MantaRay({ section: "resurface", at: 0.25, x: 0.78, parallax: 0.6 }),
    new SardineSchool({ section: "resurface", at: 0.62, x: 0.78, parallax: 0.95 }, 56, 15, "back", true),
    new Anglerfish(),
  ];
}

/** Anything a reader is reading or clicking. Scanning only happens over open water. */
const CONTENT = "a, button, input, iframe, video, img, p, h1, h2, h3, li, article, figure, [data-content], .glass";

export interface ScanView {
  onTarget: (guide: string | null) => void;
  onFrame: (target: { x: number; y: number; r: number } | null, lock: number) => void;
  onActivate: (guide: string) => void;
}

export function startOcean(
  back: HTMLCanvasElement,
  front: HTMLCanvasElement,
  options: { depth: () => number; reduced: boolean; view: ScanView },
) {
  const contexts = { back: back.getContext("2d")!, front: front.getContext("2d")! };
  const creatures = cast();
  const angler = creatures.find((c): c is Anglerfish => c instanceof Anglerfish)!;
  // Far creatures first so near ones draw over them.
  const order = [...creatures].sort((a, b) => a.anchor.parallax - b.anchor.parallax);

  const frame: Frame = {
    dpr: 1,
    width: window.innerWidth,
    height: window.innerHeight,
    time: 0,
    dt: 0,
    scroll: window.scrollY,
    depth: 0,
    pointer: { x: -9999, y: -9999, active: false },
    light: { x: -9999, y: -9999, strength: 0 },
    ambient: 1,
    small: false,
    reduced: options.reduced,
  };

  const resize = () => {
    frame.width = window.innerWidth;
    frame.height = window.innerHeight;
    frame.small = frame.width < 768;
    frame.dpr = Math.min(window.devicePixelRatio || 1, frame.small ? 1.5 : 2);
    for (const canvas of [back, front]) {
      canvas.width = Math.round(frame.width * frame.dpr);
      canvas.height = Math.round(frame.height * frame.dpr);
    }
    layout();
  };

  const layout = () => {
    for (const creature of creatures) {
      if (!creature.anchor.section) continue;
      const section = document.getElementById(creature.anchor.section);
      if (!section) continue;
      const rect = section.getBoundingClientRect();
      creature.place(rect.top + window.scrollY, rect.height);
    }
  };

  /* Pointer: raw position for scanning, flagged when it's over something being read. */
  let pointerKind = "mouse";
  let lastMove = -1e9;
  let touchUntil = 0;
  let overContent = false;
  let left = true;
  const onMove = (event: PointerEvent) => {
    pointerKind = event.pointerType;
    frame.pointer.x = event.clientX;
    frame.pointer.y = event.clientY;
    overContent = !!(event.target as Element | null)?.closest?.(CONTENT);
    if (event.pointerType === "mouse" || event.pointerType === "pen") {
      lastMove = performance.now();
      left = false;
    }
  };
  const onDown = (event: PointerEvent) => {
    onMove(event);
    if (event.pointerType === "touch") touchUntil = performance.now() + 3500;
  };
  const onLeave = () => {
    left = true;
  };
  const onClick = () => {
    if (target && !overContent && pointerKind !== "touch" && target.guide) options.view.onActivate(target.guide);
  };

  /* Scanner state. */
  let target: Creature | null = null;
  let lockedAt = 0;
  let announced = false;
  let announceUntil = 0;

  const pick = (now: number) => {
    const touch = pointerKind === "touch";
    if (!announced && angler.strength > 0.85 && angler.visible) {
      announced = true;
      announceUntil = now + 4500;
    }
    if (now < announceUntil) return angler;
    const scanning = touch ? now < touchUntil : frame.pointer.active && !overContent;
    if (!scanning) return null;
    const { x, y } = frame.pointer;
    if (target && target.visible && target !== angler && Math.hypot(target.x - x, target.y - y) < target.radius * 1.5) {
      return target;
    }
    let best: Creature | null = null;
    let bestScore = Infinity;
    for (const creature of creatures) {
      if (!creature.visible || !creature.guide || creature === angler) continue;
      const d = Math.hypot(creature.x - x, creature.y - y);
      const reach = creature.radius * 1.1 + (touch ? 40 : 14);
      if (d < reach && d / reach < bestScore) {
        best = creature;
        bestScore = d / reach;
      }
    }
    return best;
  };

  const tick = (time: number, delta: number) => {
    const now = performance.now();
    const scroll = window.scrollY;
    const moved = scroll !== frame.scroll;
    frame.scroll = scroll;
    frame.time = options.reduced ? 0 : time / 1000;
    frame.dt = options.reduced ? 0 : delta / 1000;
    frame.depth = options.depth();
    frame.ambient = 1 - smoothstep(150, 1800, frame.depth) * 0.88;
    frame.pointer.active =
      pointerKind === "touch" ? now < touchUntil : !left && now - lastMove < 8000;

    // Reduced motion: a still ocean, redrawn only when the page moves.
    if (options.reduced && !moved && time > 500) return;

    for (const creature of creatures) creature.project(frame);
    if (angler.visible) angler.update(frame);
    frame.light.x = angler.lureX;
    frame.light.y = angler.lureY;
    frame.light.strength = angler.visible ? angler.strength : 0;

    for (const ctx of [contexts.back, contexts.front]) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, frame.width * frame.dpr, frame.height * frame.dpr);
    }
    for (const creature of order) {
      if (!creature.visible) continue;
      if (creature !== angler) creature.update(frame);
      creature.draw(frame, contexts[creature.layer]);
    }

    const next = pick(now);
    if (next !== target) {
      target = next;
      lockedAt = now;
      options.view.onTarget(target?.guide ?? null);
      document.documentElement.classList.toggle("dive-scan", !!target && pointerKind !== "touch");
    }
    const lock = Math.min(1, (now - lockedAt) / 420);
    options.view.onFrame(target ? { x: target.x, y: target.y, r: Math.min(target.radius, 220) } : null, lock);
  };

  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });
  window.addEventListener("click", onClick);
  document.documentElement.addEventListener("pointerleave", onLeave);
  // Revealed verdicts and images loading shift the chapters; keep anchors in step.
  const observer = new ResizeObserver(() => layout());
  observer.observe(document.body);
  const stop = onTick(tick, 10);

  return () => {
    stop();
    observer.disconnect();
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("click", onClick);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    document.documentElement.classList.remove("dive-scan");
  };
}
