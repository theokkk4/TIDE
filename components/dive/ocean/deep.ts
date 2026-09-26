/* The deep: no daylight at all. The anglerfish's lure is the only light, and it follows you. */

import { Creature, TAU, clamp, glow, lerp, place, seeded, smoothstep, spinePath, wrap, type Anchor, type Frame } from "./kit";

/* ─────────────  Humpback anglerfish: its lure follows the cursor and lights the dark  ───────────── */

export class Anglerfish extends Creature {
  lureX = 0;
  lureY = 0;
  strength = 0;
  scannable = false;
  private lvx = 0;
  private lvy = 0;
  private bx = 0;
  private by = 0;
  private facing = 1;
  private started = false;

  constructor() {
    super({ section: "", at: 0, x: 0, parallax: 1 }, "humpback-anglerfish");
    this.layer = "back";
  }

  // Lives in screen space rather than at an anchor: it stays with you through the deep.
  project(f: Frame) {
    this.strength = smoothstep(1800, 3000, f.depth);
    this.visible = this.strength > 0.01;
  }

  update(f: Frame) {
    const wanderX = f.width * (0.7 + 0.14 * Math.sin(f.time * 0.21));
    const wanderY = f.height * (0.6 + 0.16 * Math.sin(f.time * 0.29 + 1));
    const follow = f.pointer.active && !f.reduced;
    const tx = follow ? f.pointer.x : wanderX;
    const ty = follow ? f.pointer.y : wanderY;
    if (!this.started) {
      this.lureX = tx;
      this.lureY = ty + 200;
      this.bx = this.lureX - 70;
      this.by = this.lureY + 40;
      this.started = true;
    }
    const dt = f.dt;
    // A springy lure: it overshoots slightly and settles, like something alive on a line.
    this.lvx += ((tx - this.lureX) * 16 - this.lvx * 6.5) * dt;
    this.lvy += ((ty - this.lureY) * 16 - this.lvy * 6.5) * dt;
    this.lureX += this.lvx * dt;
    this.lureY += this.lvy * dt;
    if (Math.abs(this.lvx) > 40) this.facing += (Math.sign(this.lvx) - this.facing) * Math.min(1, dt * 3);
    const size = f.small ? 0.75 : 1;
    const targetX = this.lureX - this.facing * 78 * size;
    const targetY = this.lureY + 46 * size + Math.sin(f.time * 1.3) * 4;
    this.bx += (targetX - this.bx) * Math.min(1, dt * 2.6);
    this.by += (targetY - this.by) * Math.min(1, dt * 2.6);
    this.x = this.bx;
    this.y = this.by;
    this.radius = 60 * size;
  }

  draw(f: Frame, ctx: CanvasRenderingContext2D) {
    const k = f.small ? 0.75 : 1;
    const a = this.strength;
    const { dpr } = f;

    // The light itself.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "lighter";
    const flicker = 0.9 + 0.1 * Math.sin(f.time * 7) * Math.sin(f.time * 3.1);
    glow(ctx, "70,200,230", this.lureX, this.lureY, 190 * k, 0.22 * a * flicker);
    glow(ctx, "150,245,255", this.lureX, this.lureY, 30 * k, 0.8 * a * flicker);
    glow(ctx, "255,255,255", this.lureX, this.lureY, 7 * k, a);
    ctx.globalCompositeOperation = "source-over";

    // Body, lit only on the side that faces its own lure.
    const flip = this.facing < 0 ? -1 : 1;
    const squash = Math.max(0.15, Math.abs(this.facing));
    place(ctx, dpr, this.bx, this.by, Math.sin(f.time * 1.3) * 0.05, flip * squash * k, k);
    const localLx = ((this.lureX - this.bx) / (squash * k)) * flip;
    const localLy = (this.lureY - this.by) / k;
    ctx.globalAlpha = a;

    // Rod from the forehead to the lure.
    ctx.strokeStyle = "rgba(120,170,185,0.55)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(18, -26);
    ctx.quadraticCurveTo(localLx * 0.35, localLy - 30, localLx, localLy);
    ctx.stroke();

    const body = ctx.createRadialGradient(localLx * 0.6, localLy * 0.6, 4, 0, 0, 80);
    body.addColorStop(0, "#39586a");
    body.addColorStop(0.45, "#16242f");
    body.addColorStop(1, "#070d13");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(36, -10);
    ctx.bezierCurveTo(30, -40, -30, -44, -44, -8);
    ctx.quadraticCurveTo(-58, -4, -70, -16);
    ctx.lineTo(-64, 0);
    ctx.lineTo(-72, 14);
    ctx.quadraticCurveTo(-56, 6, -42, 12);
    ctx.bezierCurveTo(-26, 40, 26, 40, 40, 18);
    ctx.closePath();
    ctx.fill();

    // Gaping jaw and needle teeth.
    const gape = 4 + Math.sin(f.time * 0.9) * 3;
    ctx.fillStyle = "#020508";
    ctx.beginPath();
    ctx.moveTo(38, -8);
    ctx.quadraticCurveTo(20, 2, 40, 16 + gape);
    ctx.lineTo(44, 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(230,240,245,0.85)";
    for (let i = 0; i < 5; i++) {
      const x = 26 + i * 3.2;
      ctx.beginPath();
      ctx.moveTo(x, -6 + i * 0.6);
      ctx.lineTo(x + 1.2, 2 + i * 0.6);
      ctx.lineTo(x + 2.2, -6 + i * 0.6);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 1, 14 + gape * 0.8 - i * 0.4);
      ctx.lineTo(x + 2.2, 7 + gape * 0.5 - i * 0.4);
      ctx.lineTo(x + 3.2, 14 + gape * 0.8 - i * 0.4);
      ctx.fill();
    }
    // Eye with a glint of the lure.
    ctx.fillStyle = "#0a1016";
    ctx.beginPath();
    ctx.arc(16, -18, 4.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(170,240,255,0.9)";
    ctx.beginPath();
    ctx.arc(17.4, -19.2, 1.3, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

/* ─────────────  Dumbo octopus: ear-fins flapping, webbed arms opening and closing  ───────────── */

export class DumboOctopus extends Creature {
  private seed: number;

  constructor(anchor: Anchor, seed: number) {
    super(anchor, "dumbo-octopus");
    this.seed = seed;
  }

  update(f: Frame) {
    const t = f.time + this.seed;
    const flap = Math.sin(t * 5.2);
    this.x = f.width * this.anchor.x + 50 * Math.sin(t * 0.12);
    this.y = this.baseY + 26 * Math.sin(t * 0.3) - flap * 3;
    this.radius = f.small ? 40 : 54;
  }

  draw(f: Frame, ctx: CanvasRenderingContext2D) {
    const t = f.time + this.seed;
    const k = f.small ? 0.75 : 1;
    const flap = Math.sin(t * 5.2);
    const light = this.lit(f, this.x, this.y);
    place(ctx, f.dpr, this.x, this.y, Math.sin(t * 0.5) * 0.12, k, k);
    ctx.globalAlpha = lerp(0.18, 0.95, light);

    const skin = (alpha: number) => `rgba(244,${Math.round(lerp(150, 190, light))},${Math.round(lerp(140, 170, light))},${alpha})`;
    // Ear fins.
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * 20, -26);
      ctx.rotate(side * (0.5 + flap * 0.45));
      ctx.fillStyle = skin(0.8);
      ctx.beginPath();
      ctx.ellipse(side * 12, 0, 14, 8, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    // Webbed arm skirt, opening on the fin downstroke.
    const open = 0.75 + 0.25 * flap;
    ctx.fillStyle = skin(0.55);
    ctx.beginPath();
    ctx.moveTo(-24, 0);
    const lobes = 6;
    for (let i = 0; i <= lobes; i++) {
      const u = i / lobes;
      const x = lerp(-34 * open, 34 * open, u);
      const y = 28 + Math.sin(u * Math.PI) * 10 * open;
      ctx.quadraticCurveTo(x - 4, y + 8, x, y);
    }
    ctx.lineTo(24, 0);
    ctx.closePath();
    ctx.fill();
    // Mantle.
    const mantle = ctx.createRadialGradient(-8, -30, 4, 0, -10, 40);
    mantle.addColorStop(0, skin(0.95));
    mantle.addColorStop(1, `rgba(170,90,95,0.9)`);
    ctx.fillStyle = mantle;
    ctx.beginPath();
    ctx.moveTo(-24, 6);
    ctx.bezierCurveTo(-30, -44, 30, -44, 24, 6);
    ctx.quadraticCurveTo(0, 14, -24, 6);
    ctx.fill();
    // Eyes.
    ctx.fillStyle = "#1a0d10";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(side * 9, -6, 4.2, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(side * 9 + 1.3, -7.3, 1.2, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

/* ─────────────  Mariana snailfish: pale, gelatinous, unhurried  ───────────── */

export class Snailfish extends Creature {
  private dir: number;
  private seed: number;

  constructor(anchor: Anchor, seed: number) {
    super(anchor, "mariana-snailfish");
    this.seed = seed;
    this.dir = seed % 2 ? 1 : -1;
  }

  update(f: Frame) {
    const L = f.small ? 70 : 96;
    this.x = wrap(f.width * this.anchor.x + this.dir * (f.time + this.seed * 10) * 14, -L, f.width + L);
    this.y = this.baseY + 18 * Math.sin(f.time * 0.4 + this.seed);
    this.radius = L * 0.6;
  }

  draw(f: Frame, ctx: CanvasRenderingContext2D) {
    const L = f.small ? 70 : 96;
    const t = f.time * 2.2 + this.seed;
    const light = this.lit(f, this.x, this.y);
    const bend = (s: number) => L * 0.05 * s * s * Math.sin(t - s * 4);
    const top = (s: number) => L * (s < 0.25 ? 0.1 + 0.08 * Math.sin((s / 0.25) * (Math.PI / 2)) : 0.18 * (1 - smoothstep(0.25, 1, s)) + 0.012);
    const bottom = (s: number) => L * (s < 0.3 ? 0.08 + 0.1 * Math.sin((s / 0.3) * (Math.PI / 2)) : 0.18 * (1 - smoothstep(0.3, 1, s)) + 0.012);
    place(ctx, f.dpr, this.x, this.y, Math.sin(t * 0.3) * 0.04, this.dir, 1);
    ctx.globalAlpha = lerp(0.12, 0.85, light);
    const body = ctx.createLinearGradient(L / 2, 0, -L / 2, 0);
    body.addColorStop(0, "rgba(250,222,222,0.85)");
    body.addColorStop(1, "rgba(250,222,230,0.25)");
    ctx.fillStyle = body;
    spinePath(ctx, L, top, bottom, bend, 20);
    ctx.fill();
    // Translucent fin fringe along the tail.
    ctx.strokeStyle = "rgba(255,235,240,0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#2a1418";
    ctx.beginPath();
    ctx.arc(L * 0.34, bend(0.12) - L * 0.04, L * 0.028, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

/* ─────────────  Hadal amphipods: scavengers on the floor of Challenger Deep  ───────────── */

interface Hopper {
  ox: number;
  oy: number;
  hop: number;
  phase: number;
  dir: number;
}

export class Amphipods extends Creature {
  private crew: Hopper[];

  constructor(anchor: Anchor, count: number, seed: number) {
    super(anchor, "hadal-amphipod");
    const rand = seeded(seed);
    this.crew = Array.from({ length: count }, () => ({
      ox: (rand() - 0.5) * 2,
      oy: rand(),
      hop: rand() * 3,
      phase: rand() * TAU,
      dir: rand() > 0.5 ? 1 : -1,
    }));
  }

  update(f: Frame) {
    const spread = f.small ? 110 : 190;
    for (const h of this.crew) {
      h.hop -= f.dt;
      if (h.hop < 0) {
        h.hop = 1.5 + ((h.phase * 7) % 2.5);
        h.dir = Math.sin(f.time + h.phase) > 0 ? 1 : -1;
      }
      const hopping = h.hop > 1.2;
      h.ox = clamp(h.ox + (hopping ? h.dir * 0.5 : h.dir * 0.02) * f.dt, -1, 1);
    }
    this.x = f.width * this.anchor.x;
    this.y = this.baseY;
    this.radius = spread;
  }

  draw(f: Frame, ctx: CanvasRenderingContext2D) {
    const spread = f.small ? 110 : 190;
    for (const h of this.crew) {
      const hopping = h.hop > 1.2;
      const x = this.x + h.ox * spread;
      const y = this.y + h.oy * 40 - (hopping ? Math.sin(((h.hop - 1.2) / 0.3) * Math.PI) * 14 : 0);
      const light = this.lit(f, x, y);
      const scale = f.small ? 1.2 : 1.6;
      place(ctx, f.dpr, x, y, 0, h.dir * scale, scale);
      ctx.globalAlpha = lerp(0.2, 0.9, light);
      ctx.fillStyle = "rgba(236,214,180,0.9)";
      // A curled, segmented body.
      for (let s = 0; s < 6; s++) {
        const a = -0.9 + s * 0.36;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * 8, Math.sin(a) * 5, 3.2 - s * 0.3, 2.4, a + 1.2, 0, TAU);
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(236,214,180,0.7)";
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(8, -4);
      ctx.quadraticCurveTo(14, -10 + Math.sin(f.time * 6 + h.phase) * 2, 18, -8);
      for (let leg = 0; leg < 5; leg++) {
        const lx = -4 + leg * 2.8;
        ctx.moveTo(lx, 2);
        ctx.lineTo(lx + Math.sin(f.time * 12 + leg + h.phase) * (hopping ? 2 : 0.6), 7);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}
