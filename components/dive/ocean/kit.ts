/* Shared maths, drawing helpers and the base class for the creatures on /dive. */

export const TAU = Math.PI * 2;
export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const wrap = (v: number, min: number, max: number) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
/** Fraction of the remaining gap to close this frame, independent of frame rate. */
export const approach = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);

/** Deterministic random numbers, so every visitor sees the same ocean. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface PointerState {
  x: number;
  y: number;
  /** Mouse or pen present and moving recently. Touch sets this briefly after a tap. */
  active: boolean;
}

export interface Frame {
  dpr: number;
  width: number;
  height: number;
  time: number;
  dt: number;
  scroll: number;
  depth: number;
  pointer: PointerState;
  /** The anglerfish lure, which lights up everything near it in the deep. */
  light: { x: number; y: number; strength: number };
  /** How much daylight reaches this depth: 1 at the surface, a faint floor in the deep. */
  ambient: number;
  small: boolean;
  reduced: boolean;
}

export type Layer = "back" | "front";

export interface Anchor {
  /** Chapter id the creature lives in. */
  section: string;
  /** How far down that chapter, 0–1. */
  at: number;
  /** Horizontal home, as a fraction of the viewport width. */
  x: number;
  /** Below 1 drifts slower than the page and reads as far away; above 1, close by. */
  parallax: number;
}

export abstract class Creature {
  layer: Layer = "back";
  anchorY = 0;
  baseY = 0;
  /** Screen position and size the scanner locks on to. */
  x = 0;
  y = 0;
  radius = 30;
  visible = false;
  placed = false;
  /** How far past the viewport edge the creature is still simulated. */
  reach = 260;
  /** Sunlit-water animals that meet you on the way back up stay out of the deep. */
  surfaceOnly = false;

  constructor(
    public anchor: Anchor,
    public guide: string | null,
  ) {}

  place(sectionTop: number, sectionHeight: number) {
    this.anchorY = sectionTop + this.anchor.at * sectionHeight;
    this.placed = true;
  }

  project(f: Frame) {
    const center = f.scroll + f.height / 2;
    this.baseY = f.height / 2 + (this.anchorY - center) * this.anchor.parallax;
    this.visible =
      this.placed &&
      this.baseY > -this.reach &&
      this.baseY < f.height + this.reach &&
      !(this.surfaceOnly && f.depth > 1500);
  }

  /** How lit a point is: daylight near the surface, the anglerfish lure in the deep. */
  protected lit(f: Frame, x: number, y: number) {
    const dx = x - f.light.x;
    const dy = y - f.light.y;
    const lure = f.light.strength * Math.exp(-(dx * dx + dy * dy) / (2 * 230 * 230));
    return Math.min(1, Math.max(f.ambient, lure));
  }

  abstract update(f: Frame): void;
  abstract draw(f: Frame, ctx: CanvasRenderingContext2D): void;
}

/** Sets a transform in CSS pixels: translate, rotate, then scale (flip with a negative sx). */
export function place(
  ctx: CanvasRenderingContext2D,
  dpr: number,
  x: number,
  y: number,
  angle = 0,
  sx = 1,
  sy = 1,
) {
  const c = Math.cos(angle) * dpr;
  const s = Math.sin(angle) * dpr;
  ctx.setTransform(c * sx, s * sx, -s * sy, c * sy, x * dpr, y * dpr);
}

const sprites = new Map<string, HTMLCanvasElement>();

/** A soft radial glow, rendered once per colour and stamped with drawImage. */
export function glowSprite(rgb: string) {
  let sprite = sprites.get(rgb);
  if (sprite) return sprite;
  sprite = document.createElement("canvas");
  sprite.width = sprite.height = 64;
  const g = sprite.getContext("2d")!;
  const gradient = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, `rgba(${rgb},1)`);
  gradient.addColorStop(0.22, `rgba(${rgb},0.6)`);
  gradient.addColorStop(0.55, `rgba(${rgb},0.16)`);
  gradient.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gradient;
  g.fillRect(0, 0, 64, 64);
  sprites.set(rgb, sprite);
  return sprite;
}

export function glow(ctx: CanvasRenderingContext2D, rgb: string, x: number, y: number, r: number, alpha: number) {
  if (alpha <= 0.004 || r <= 0) return;
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.drawImage(glowSprite(rgb), x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
}

/**
 * Traces a body outline around a spine running from snout (s = 0, at +length/2) to tail
 * (s = 1, at −length/2). `top`/`bottom` give the half-thickness either side of the spine,
 * and `bend` shifts the spine vertically so the body can undulate as it swims.
 */
export function spinePath(
  ctx: CanvasRenderingContext2D,
  length: number,
  top: (s: number) => number,
  bottom: (s: number) => number,
  bend: (s: number) => number,
  samples = 28,
) {
  ctx.beginPath();
  for (let i = 0; i <= samples; i++) {
    const s = i / samples;
    const x = length / 2 - s * length;
    const y = bend(s) - top(s);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  for (let i = samples; i >= 0; i--) {
    const s = i / samples;
    ctx.lineTo(length / 2 - s * length, bend(s) + bottom(s));
  }
  ctx.closePath();
}

/** Just the upper edge of a spine body, for rim light from above. */
export function spineTop(
  ctx: CanvasRenderingContext2D,
  length: number,
  top: (s: number) => number,
  bend: (s: number) => number,
  from = 0,
  to = 1,
  samples = 24,
) {
  ctx.beginPath();
  for (let i = 0; i <= samples; i++) {
    const s = from + ((to - from) * i) / samples;
    const x = length / 2 - s * length;
    const y = bend(s) - top(s);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
}

/** A hanging strand simulated with verlet integration: tentacles, stems, oral arms. */
export class Strand {
  xs: Float32Array;
  ys: Float32Array;
  px: Float32Array;
  py: Float32Array;

  constructor(
    public count: number,
    public segment: number,
    x: number,
    y: number,
  ) {
    this.xs = new Float32Array(count);
    this.ys = new Float32Array(count);
    this.px = new Float32Array(count);
    this.py = new Float32Array(count);
    this.reset(x, y);
  }

  reset(x: number, y: number) {
    for (let i = 0; i < this.count; i++) {
      this.xs[i] = this.px[i] = x;
      this.ys[i] = this.py[i] = y + i * this.segment;
    }
  }

  /** Pins the root at (x, y), lets the rest trail under gravity and a sideways current. */
  step(x: number, y: number, gravity: number, current: number, damping = 0.94) {
    const { xs, ys, px, py, count, segment } = this;
    // Anything that jumped a long way (a fast scroll) snaps rather than stretching.
    if (Math.abs(xs[0] - x) + Math.abs(ys[0] - y) > 220) this.reset(x, y);
    xs[0] = px[0] = x;
    ys[0] = py[0] = y;
    for (let i = 1; i < count; i++) {
      const vx = (xs[i] - px[i]) * damping;
      const vy = (ys[i] - py[i]) * damping;
      px[i] = xs[i];
      py[i] = ys[i];
      xs[i] += vx + current;
      ys[i] += vy + gravity;
    }
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 1; i < count; i++) {
        const dx = xs[i] - xs[i - 1];
        const dy = ys[i] - ys[i - 1];
        const d = Math.hypot(dx, dy) || 0.001;
        const k = (d - segment) / d;
        xs[i] -= dx * k;
        ys[i] -= dy * k;
      }
    }
  }

  trace(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.moveTo(this.xs[0], this.ys[0]);
    for (let i = 1; i < this.count - 1; i++) {
      const mx = (this.xs[i] + this.xs[i + 1]) / 2;
      const my = (this.ys[i] + this.ys[i + 1]) / 2;
      ctx.quadraticCurveTo(this.xs[i], this.ys[i], mx, my);
    }
    ctx.lineTo(this.xs[this.count - 1], this.ys[this.count - 1]);
  }
}
