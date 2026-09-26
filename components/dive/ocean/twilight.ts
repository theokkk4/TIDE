/* Twilight and midnight creatures: the light is gone, so most of what you see is their own. */

import {
  Creature,
  Strand,
  TAU,
  clamp,
  glow,
  lerp,
  place,
  seeded,
  smoothstep,
  spinePath,
  spineTop,
  wrap,
  type Anchor,
  type Frame,
} from "./kit";

/* ─────────────  Lanternfish: dark bodies, rows of blue photophores  ───────────── */

interface Lantern {
  ox: number;
  oy: number;
  speed: number;
  phase: number;
  size: number;
  startle: number;
}

export class LanternfishSchool extends Creature {
  private fish: Lantern[];
  private dir: number;

  constructor(
    anchor: Anchor,
    count: number,
    seed: number,
  ) {
    super(anchor, "spotted-lanternfish");
    const rand = seeded(seed);
    this.dir = seed % 2 ? 1 : -1;
    this.reach = 320;
    this.fish = Array.from({ length: count }, () => ({
      ox: rand(),
      oy: (rand() - 0.5) * 2,
      speed: 18 + rand() * 16,
      phase: rand() * TAU,
      size: 20 + rand() * 10,
      startle: 0,
    }));
  }

  update(f: Frame) {
    let sx = 0;
    let sy = 0;
    const spread = f.small ? 90 : 150;
    for (const a of this.fish) {
      a.startle = Math.max(0, a.startle - f.dt * 1.5);
      const x = this.fishX(f, a);
      const y = this.fishY(f, a, spread);
      const p = f.pointer;
      if (p.active && !f.reduced && Math.hypot(x - p.x, y - p.y) < 120) a.startle = 1;
      a.ox += (this.dir * (a.speed + a.startle * 160) * f.dt) / f.width;
      sx += x;
      sy += y;
    }
    this.x = sx / this.fish.length;
    this.y = sy / this.fish.length;
    this.radius = spread * 1.1;
  }

  private fishX(f: Frame, a: Lantern) {
    const span = f.width * 0.5;
    return f.width * this.anchor.x + wrap(a.ox, -0.5, 0.5) * span;
  }

  private fishY(f: Frame, a: Lantern, spread: number) {
    return this.baseY + a.oy * spread * 0.45 + Math.sin(f.time * 0.8 + a.phase) * 6;
  }

  draw(f: Frame, ctx: CanvasRenderingContext2D) {
    const spread = f.small ? 90 : 150;
    for (const a of this.fish) {
      const x = this.fishX(f, a);
      const y = this.fishY(f, a, spread);
      // Fade at the ends of the band so wrap-around is never visible.
      const edge = 1 - smoothstep(0.38, 0.5, Math.abs(wrap(a.ox, -0.5, 0.5)));
      if (edge <= 0) continue;
      const L = a.size;
      const light = this.lit(f, x, y);
      place(ctx, f.dpr, x, y, Math.sin(f.time * 0.8 + a.phase) * 0.06, this.dir, 1);
      ctx.globalAlpha = edge * lerp(0.45, 0.9, light);
      ctx.fillStyle = "#2a4a66";
      ctx.beginPath();
      ctx.moveTo(L * 0.5, 0);
      ctx.quadraticCurveTo(L * 0.1, -L * 0.24, -L * 0.36, -L * 0.02);
      ctx.lineTo(-L * 0.55, -L * 0.16);
      ctx.lineTo(-L * 0.5, 0);
      ctx.lineTo(-L * 0.55, L * 0.16);
      ctx.lineTo(-L * 0.36, L * 0.02);
      ctx.quadraticCurveTo(L * 0.1, L * 0.2, L * 0.5, 0);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "lighter";
      // Big eye.
      glow(ctx, "200,240,255", L * 0.34, -L * 0.03, L * 0.12, edge * 0.8);
      // Photophores along the belly, twinkling.
      for (let k = 0; k < 5; k++) {
        const twinkle = 0.55 + 0.45 * Math.sin(f.time * 3 + a.phase + k * 1.3);
        glow(ctx, "110,200,255", L * (0.22 - k * 0.14), L * 0.11, L * 0.2, edge * twinkle * (0.9 + a.startle));
      }
      ctx.globalCompositeOperation = "source-over";
    }
  }
}

/* ─────────────  Giant siphonophore: a string of lights, a wave travelling down it  ───────────── */

export class Siphonophore extends Creature {
  private xs: Float32Array;
  private ys: Float32Array;
  private count: number;
  private gap: number;
  private seed: number;
  private started = false;

  constructor(anchor: Anchor, seed: number, count = 42) {
    super(anchor, "giant-siphonophore");
    this.seed = seed;
    this.count = count;
    this.gap = 10;
    this.xs = new Float32Array(count);
    this.ys = new Float32Array(count);
    this.reach = 480;
  }

  update(f: Frame) {
    const t = f.time * 0.09 + this.seed;
    const hx = f.width * this.anchor.x + Math.sin(t) * f.width * 0.12;
    const hy = this.baseY + Math.sin(t * 1.7) * 60;
    this.gap = f.small ? 7 : 10;
    if (!this.started) {
      for (let i = 0; i < this.count; i++) {
        this.xs[i] = hx - i * this.gap * 0.7;
        this.ys[i] = hy - i * this.gap * 0.7;
      }
      this.started = true;
    }
    this.xs[0] = hx;
    this.ys[0] = hy;
    // Follow-the-leader with a gentle side-to-side sway down the stem.
    for (let i = 1; i < this.count; i++) {
      const sway = Math.sin(f.time * 0.7 - i * 0.25) * 0.35;
      const dx = this.xs[i] - this.xs[i - 1] + sway;
      const dy = this.ys[i] - this.ys[i - 1] - 0.9;
      const d = Math.hypot(dx, dy) || 0.001;
      this.xs[i] = this.xs[i - 1] + (dx / d) * this.gap;
      this.ys[i] = this.ys[i - 1] + (dy / d) * this.gap;
    }
    const mid = Math.floor(this.count / 2);
    this.x = this.xs[mid];
    this.y = this.ys[mid];
    this.radius = this.count * this.gap * 0.45;
  }

  draw(f: Frame, ctx: CanvasRenderingContext2D) {
    const { dpr } = f;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(140,210,255,0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.xs[0], this.ys[0]);
    for (let i = 1; i < this.count; i++) ctx.lineTo(this.xs[i], this.ys[i]);
    ctx.stroke();
    // A pulse of bioluminescence runs from head to tail every few seconds.
    const wave = wrap(f.time * 14, 0, this.count + 30);
    for (let i = 0; i < this.count; i++) {
      const pulse = Math.exp(-((i - wave) ** 2) / 10);
      const base = 0.18 + 0.1 * Math.sin(i * 1.7 + f.time);
      const r = (i % 3 === 0 ? 7 : 4.5) * (f.small ? 0.8 : 1);
      glow(ctx, i % 3 === 0 ? "120,230,255" : "90,160,255", this.xs[i], this.ys[i], r + pulse * 6, base + pulse * 0.8);
    }
    // The swimming bells at the front.
    const light = this.lit(f, this.xs[0], this.ys[0]);
    for (let k = 0; k < 2; k++) {
      const bx = this.xs[0] + (k ? 7 : -5);
      const by = this.ys[0] - 10 + k * 6;
      ctx.strokeStyle = `rgba(180,230,255,${0.3 + 0.3 * light})`;
      ctx.fillStyle = `rgba(150,210,255,${0.06 + 0.1 * light})`;
      ctx.beginPath();
      ctx.ellipse(bx, by, 7, 10, 0.3 * (k ? 1 : -1), 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
  }
}

/* ─────────────  Deep jellies: the helmet jelly, and Atolla with its burglar alarm  ───────────── */

export class DeepJelly extends Creature {
  private vx = 0;
  private vy = 0;
  private phase: number;
  private period: number;
  private tentacles: Strand[] = [];
  private long: Strand | null = null;
  private alarm = 0;
  private alarmSpin = 0;
  private nextAlarm: number;

  constructor(
    anchor: Anchor,
    private kind: "helmet" | "atolla",
    private size: number,
    seed: number,
  ) {
    super(anchor, kind === "helmet" ? "helmet-jellyfish" : "atolla-jellyfish");
    const rand = seeded(seed);
    this.phase = rand();
    this.period = 2.6 + rand() * 1.4;
    this.nextAlarm = 4 + rand() * 8;
  }

  private contraction() {
    const p = this.phase;
    return p < 0.25 ? Math.sin((p / 0.25) * (Math.PI / 2)) : 1 - smoothstep(0.25, 1, p);
  }

  update(f: Frame) {
    const R = f.small ? this.size * 0.75 : this.size;
    if (!this.tentacles.length) {
      this.x = f.width * this.anchor.x;
      this.y = this.baseY;
      const n = this.kind === "atolla" ? 18 : 12;
      this.tentacles = Array.from({ length: n }, () => new Strand(this.kind === "atolla" ? 5 : 7, R * 0.13, this.x, this.y));
      if (this.kind === "atolla") this.long = new Strand(16, R * 0.28, this.x, this.y);
    }
    const dt = f.dt;
    const before = this.phase;
    this.phase = wrap(this.phase + dt / this.period, 0, 1);
    if (before < 0.1 && this.phase >= 0.1) this.vy -= 22;
    this.vx += (f.width * this.anchor.x + 24 * Math.sin(f.time * 0.08 + this.period) - this.x) * 0.3 * dt;
    this.vy += ((this.baseY - this.y) * 0.45 + 5) * dt;
    const drag = Math.exp(-1.2 * dt);
    this.vx *= drag;
    this.vy *= drag;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.radius = R * 1.4;

    // Atolla's alarm: a spinning ring of blue light when something comes close.
    if (this.kind === "atolla") {
      const threats = [f.pointer.active ? f.pointer : null, f.light.strength > 0.3 ? f.light : null];
      const threatened = threats.some((p) => p && Math.hypot(p.x - this.x, p.y - this.y) < R * 3.2);
      this.nextAlarm -= dt;
      if ((threatened || this.nextAlarm <= 0) && this.alarm < 0.2 && !f.reduced) {
        this.alarm = 1;
        this.nextAlarm = 10 + Math.random() * 8;
      }
      this.alarm = Math.max(0, this.alarm - dt * 0.4);
      this.alarmSpin += dt * 5;
    }

    const c = this.contraction();
    const w = R * (1 - 0.12 * c);
    const gravity = f.reduced ? 0 : 0.14;
    this.tentacles.forEach((strand, i) => {
      const a = (i / this.tentacles.length) * TAU;
      strand.step(this.x + Math.cos(a) * w * 0.95, this.y + Math.sin(a) * R * 0.08, gravity, 0);
    });
    this.long?.step(this.x + w * 0.4, this.y, gravity * 0.9, Math.sin(f.time * 0.6) * 0.1);
  }

  draw(f: Frame, ctx: CanvasRenderingContext2D) {
    const R = f.small ? this.size * 0.75 : this.size;
    const c = this.contraction();
    const w = R * (1 - 0.12 * c);
    const light = this.lit(f, this.x, this.y);
    const { dpr } = f;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = `rgba(150,40,60,${0.25 + 0.5 * light})`;
    ctx.lineWidth = 1;
    for (const strand of this.tentacles) {
      strand.trace(ctx);
      ctx.stroke();
    }
    if (this.long) {
      ctx.strokeStyle = `rgba(200,120,140,${0.2 + 0.4 * light})`;
      this.long.trace(ctx);
      ctx.stroke();
    }

    place(ctx, dpr, this.x, this.y);
    const bell = ctx.createRadialGradient(0, -R * 0.4, R * 0.1, 0, -R * 0.2, R * 1.2);
    // Deep red: invisible down here unless something lights it.
    bell.addColorStop(0, `rgba(${Math.round(lerp(60, 190, light))},${Math.round(lerp(10, 50, light))},${Math.round(lerp(24, 70, light))},${lerp(0.35, 0.85, light)})`);
    bell.addColorStop(1, `rgba(40,6,16,${lerp(0.2, 0.6, light)})`);
    ctx.fillStyle = bell;
    ctx.beginPath();
    if (this.kind === "helmet") {
      // Tall conical helmet.
      ctx.moveTo(-w * 0.75, 0);
      ctx.bezierCurveTo(-w * 0.8, -R * 1.2, -w * 0.2, -R * 1.9, 0, -R * 1.9);
      ctx.bezierCurveTo(w * 0.2, -R * 1.9, w * 0.8, -R * 1.2, w * 0.75, 0);
      ctx.quadraticCurveTo(0, R * 0.18, -w * 0.75, 0);
    } else {
      // Flat crowned disc with its coronal groove.
      ctx.moveTo(-w, 0);
      ctx.bezierCurveTo(-w, -R * 0.75, w, -R * 0.75, w, 0);
      ctx.quadraticCurveTo(0, R * 0.2, -w, 0);
    }
    ctx.fill();
    ctx.globalCompositeOperation = "lighter";
    if (this.kind === "atolla") {
      ctx.strokeStyle = `rgba(255,120,150,${0.15 + 0.3 * light})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, -R * 0.2, w * 0.7, R * 0.14, 0, Math.PI, TAU);
      ctx.stroke();
      // The alarm: a pinwheel of blue flashes chasing round the rim.
      const beads = 16;
      for (let k = 0; k < beads; k++) {
        const a = (k / beads) * TAU;
        const chase = Math.pow(0.5 + 0.5 * Math.cos(a - this.alarmSpin), 6);
        const x = Math.cos(a) * w * 0.92;
        const y = Math.sin(a) * R * 0.14 - R * 0.05;
        glow(ctx, "80,170,255", x, y, R * 0.28, this.alarm * (0.25 + chase));
      }
      glow(ctx, "80,150,255", 0, 0, R * 2.6, this.alarm * 0.35);
    } else {
      // Helmet jellies sparkle with small luminous flashes.
      for (let k = 0; k < 6; k++) {
        const flicker = Math.max(0, Math.sin(f.time * 2.3 + k * 2.1 + this.period * 3));
        glow(ctx, "90,180,255", Math.sin(k * 1.9) * w * 0.5, -R * (0.3 + (k % 3) * 0.45), R * 0.25, flicker ** 4 * 0.9);
      }
    }
    ctx.globalCompositeOperation = "source-over";
  }
}

/* ─────────────  Sperm whale: a vast shape passing in the dark, diving  ───────────── */

export class SpermWhale extends Creature {
  private length = 800;

  constructor(anchor: Anchor) {
    super(anchor, "sperm-whale");
    this.reach = 600;
  }

  update(f: Frame) {
    this.length = Math.max(f.small ? 320 : 520, f.width * (f.small ? 0.95 : 0.62));
    const through = clamp((this.baseY + this.reach) / (f.height + this.reach * 2));
    this.x = lerp(f.width + this.length * 0.45, -this.length * 0.45, through) + 30 * Math.sin(f.time * 0.06);
    this.y = this.baseY + 16 * Math.sin(f.time * 0.2);
    this.radius = this.length * 0.3;
  }

  draw(f: Frame, ctx: CanvasRenderingContext2D) {
    const L = this.length;
    const t = f.time * 0.7;
    const bend = (s: number) => L * 0.02 * s ** 2.6 * Math.sin(t - s * 2.4);
    // The blunt, box-like head is a third of the body.
    const top = (s: number) =>
      L * (s < 0.03 ? 0.06 + (s / 0.03) * 0.04 : s < 0.34 ? 0.1 - 0.012 * (s / 0.34) : s < 0.9 ? 0.088 - 0.074 * smoothstep(0.34, 0.9, s) : 0.014 - 0.009 * ((s - 0.9) / 0.1)) +
      L * 0.012 * Math.exp(-(((s - 0.62) / 0.04) ** 2));
    const bottom = (s: number) =>
      L * (s < 0.03 ? 0.05 + (s / 0.03) * 0.03 : s < 0.36 ? 0.08 + 0.02 * Math.sin((s / 0.36) * Math.PI) : s < 0.9 ? 0.08 - 0.068 * smoothstep(0.36, 0.9, s) : 0.012 - 0.008 * ((s - 0.9) / 0.1));
    const light = this.lit(f, this.x, this.y);

    // Nose down and heading left: diving past you.
    place(ctx, f.dpr, this.x, this.y, 0.14, -1, 1);
    ctx.globalAlpha = lerp(0.55, 0.85, light);
    const tailY = bend(1);
    const beat = Math.cos(t - 2.4);
    ctx.fillStyle = "#081a2b";
    ctx.beginPath();
    ctx.moveTo(-L * 0.48, tailY);
    ctx.quadraticCurveTo(-L * 0.54, tailY - L * 0.04 * beat, -L * 0.6, tailY - L * 0.07 * beat);
    ctx.quadraticCurveTo(-L * 0.57, tailY, -L * 0.6, tailY + L * 0.07 * beat);
    ctx.quadraticCurveTo(-L * 0.54, tailY + L * 0.04 * beat, -L * 0.48, tailY);
    ctx.fill();

    const body = ctx.createLinearGradient(0, -L * 0.1, 0, L * 0.1);
    body.addColorStop(0, "#132b40");
    body.addColorStop(1, "#050f1b");
    ctx.fillStyle = body;
    spinePath(ctx, L, top, bottom, bend);
    ctx.fill();

    // Narrow underslung jaw, small eye, wrinkled skin behind the head.
    ctx.strokeStyle = "rgba(150,190,210,0.18)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(L * 0.44, bend(0.06) + bottom(0.06) * 0.75);
    ctx.lineTo(L * 0.2, bend(0.3) + bottom(0.3) * 0.7);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k < 7; k++) {
      const s = 0.4 + k * 0.05;
      const x = L / 2 - s * L;
      ctx.moveTo(x, bend(s) - top(s) * 0.6);
      ctx.quadraticCurveTo(x - L * 0.01, bend(s), x, bend(s) + bottom(s) * 0.5);
    }
    ctx.stroke();
    ctx.fillStyle = "rgba(170,210,230,0.35)";
    ctx.beginPath();
    ctx.arc(L * 0.2, bend(0.3) + L * 0.01, L * 0.005, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = `rgba(95,227,239,${0.1 + 0.2 * light})`;
    ctx.lineWidth = 1.4;
    spineTop(ctx, L, top, bend, 0.01, 0.92);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
