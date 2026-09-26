/* Sunlit-zone creatures: bright water, light from above, rim-lit silhouettes. */

import {
  Creature,
  Strand,
  TAU,
  clamp,
  easeInOutSine,
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
  type Layer,
} from "./kit";

/* ─────────────  European sardine: a bait ball that scatters from the cursor  ───────────── */

interface Fish {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  size: number;
}

// Eight brightness steps, so the flash of a turning fish never allocates a colour string.
const SILVER = Array.from({ length: 8 }, (_, i) => {
  const k = i / 7;
  return `rgba(${Math.round(lerp(120, 236, k))},${Math.round(lerp(160, 246, k))},${Math.round(lerp(182, 252, k))},${lerp(0.55, 0.95, k).toFixed(2)})`;
});

export class SardineSchool extends Creature {
  private fish: Fish[] = [];
  private spin: number;

  constructor(
    anchor: Anchor,
    private count: number,
    private seed: number,
    layer: Layer = "back",
    surfaceOnly = false,
  ) {
    super(anchor, "european-sardine");
    this.layer = layer;
    this.surfaceOnly = surfaceOnly;
    this.reach = 360;
    this.spin = seed % 2 ? 1 : -1;
  }

  private spawn(f: Frame) {
    const rand = seeded(this.seed);
    const total = f.small ? Math.round(this.count * 0.6) : this.count;
    const cx = f.width * this.anchor.x;
    this.fish = Array.from({ length: total }, () => {
      const a = rand() * TAU;
      const r = 20 + rand() * 90;
      return {
        x: cx + Math.cos(a) * r,
        y: this.baseY + Math.sin(a) * r * 0.55,
        vx: -Math.sin(a) * 90 * this.spin,
        vy: Math.cos(a) * 40 * this.spin,
        phase: rand() * TAU,
        size: (f.small ? 10 : 13) + rand() * 6,
      };
    });
  }

  update(f: Frame) {
    if (!this.fish.length) this.spawn(f);
    const { fish } = this;
    const n = fish.length;
    const dt = f.dt;
    const radius = f.small ? 72 : 120;
    // The ball wanders about its home; scrolling drags the home and the school streams after it.
    const cx = f.width * (this.anchor.x + 0.08 * Math.sin(f.time * 0.12 + this.seed));
    const cy = this.baseY + 50 * Math.sin(f.time * 0.19 + this.seed * 1.7);
    const p = f.pointer;
    const fleeRadius = 170;
    let sx = 0;
    let sy = 0;

    for (let i = 0; i < n; i++) {
      const a = fish[i];
      let ax = 0;
      let ay = 0;
      let avx = 0;
      let avy = 0;
      let neighbours = 0;
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const b = fish[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > 2400) continue;
        neighbours++;
        avx += b.vx;
        avy += b.vy;
        if (d2 < 196) {
          const push = 5200 / (d2 + 20);
          ax -= dx * push * 0.1;
          ay -= dy * push * 0.1;
        }
      }
      if (neighbours) {
        ax += (avx / neighbours - a.vx) * 1.6;
        ay += (avy / neighbours - a.vy) * 1.6;
      }
      // Hold the ball together and circle it, flattened the way real bait balls are.
      const dx = cx - a.x;
      const dy = cy - a.y;
      const d = Math.hypot(dx, dy) + 0.001;
      const pull = Math.max(0, d - radius * 0.45) / radius;
      ax += (dx / d) * pull * 320;
      ay += (dy / d) * pull * 420;
      ax += (-dy / d) * 70 * this.spin;
      ay += (dx / d) * 34 * this.spin;
      // The cursor is a predator.
      if (p.active && !f.reduced) {
        const px = a.x - p.x;
        const py = a.y - p.y;
        const pd = Math.hypot(px, py);
        if (pd < fleeRadius) {
          const k = (1 - pd / fleeRadius) ** 2 * 3400;
          ax += (px / (pd + 0.01)) * k;
          ay += (py / (pd + 0.01)) * k;
        }
      }
      a.vx += ax * dt;
      a.vy += ay * dt;
      const speed = Math.hypot(a.vx, a.vy) || 0.001;
      const max = 250;
      const min = 60;
      if (speed > max) {
        a.vx *= max / speed;
        a.vy *= max / speed;
      } else if (speed < min) {
        a.vx *= min / speed;
        a.vy *= min / speed;
      }
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      sx += a.x;
      sy += a.y;
    }
    this.x = sx / n;
    this.y = sy / n;
    this.radius = radius * 1.1;
  }

  draw(f: Frame, ctx: CanvasRenderingContext2D) {
    const light = this.lit(f, this.x, this.y);
    ctx.globalAlpha = lerp(0.35, 1, light);
    for (const a of this.fish) {
      const angle = Math.atan2(a.vy, a.vx);
      place(ctx, f.dpr, a.x, a.y, angle);
      const L = a.size;
      const wag = Math.sin(f.time * 17 + a.phase) * 0.12 * L;
      // Scales flash as each fish turns into the light, so flickers ripple through the ball.
      const flash = 0.5 + 0.5 * Math.sin(angle * 2 + a.phase + f.time * 0.9);
      ctx.fillStyle = SILVER[Math.min(7, Math.floor(flash * 8))];
      ctx.beginPath();
      ctx.moveTo(L * 0.55, 0);
      ctx.quadraticCurveTo(L * 0.12, -L * 0.21, -L * 0.36, wag * 0.3);
      ctx.lineTo(-L * 0.62, -L * 0.18 + wag);
      ctx.lineTo(-L * 0.54, wag);
      ctx.lineTo(-L * 0.62, L * 0.18 + wag);
      ctx.lineTo(-L * 0.36, wag * 0.3);
      ctx.quadraticCurveTo(L * 0.12, L * 0.17, L * 0.55, 0);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

/* ─────────────  Green sea turtle: a slow glide with a powerful flipper stroke  ───────────── */

export class SeaTurtle extends Creature {
  private size = 110;
  private dir: number;

  constructor(anchor: Anchor, layer: Layer = "back") {
    super(anchor, "green-sea-turtle");
    this.layer = layer;
    this.dir = anchor.x > 0.5 ? -1 : 1;
  }

  /** Quick, strong downstroke; slow recovery. Returns the flipper angle (radians, + is tip up). */
  private stroke(t: number) {
    const phase = wrap(t * 0.42, 0, 1);
    return phase < 0.36
      ? lerp(0.95, -0.6, easeInOutSine(phase / 0.36))
      : lerp(-0.6, 0.95, easeInOutSine((phase - 0.36) / 0.64));
  }

  update(f: Frame) {
    this.size = f.small ? 74 : 112;
    const S = this.size;
    this.x = wrap(f.width * this.anchor.x + this.dir * f.time * 20, -S * 1.5, f.width + S * 1.5);
    const lift = -Math.sin(wrap(f.time * 0.42, 0, 1) * TAU) * 6;
    this.y = this.baseY + 14 * Math.sin(f.time * 0.45) + lift;
    this.radius = S * 0.8;
  }

  private flipper(ctx: CanvasRenderingContext2D, length: number, width: number, fill: string) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, -width * 0.5);
    ctx.quadraticCurveTo(-length * 0.45, -width * 1.3, -length, width * 0.15);
    ctx.quadraticCurveTo(-length * 0.5, width * 0.9, 0, width * 0.5);
    ctx.fill();
  }

  draw(f: Frame, ctx: CanvasRenderingContext2D) {
    const S = this.size;
    const t = f.time;
    const light = this.lit(f, this.x, this.y);
    const pitch = Math.cos(t * 0.45) * 0.05;
    const angle = this.stroke(t);
    const { dpr } = f;
    ctx.globalAlpha = lerp(0.3, 0.92, light);

    // Far-side flippers first, darker, a beat behind.
    place(ctx, dpr, this.x, this.y, pitch, this.dir, 1);
    ctx.save();
    ctx.translate(S * 0.2, S * 0.02);
    ctx.rotate(this.stroke(t - 0.08) * 0.9 + 0.1);
    this.flipper(ctx, S * 0.74, S * 0.15, "#27403d");
    ctx.restore();

    // Carapace, lit from above.
    const shell = ctx.createLinearGradient(0, -S * 0.36, 0, S * 0.14);
    shell.addColorStop(0, "#8ea27a");
    shell.addColorStop(0.45, "#55694f");
    shell.addColorStop(1, "#253531");
    ctx.fillStyle = shell;
    ctx.beginPath();
    ctx.moveTo(-S * 0.5, S * 0.06);
    ctx.bezierCurveTo(-S * 0.46, -S * 0.3, S * 0.28, -S * 0.38, S * 0.47, S * 0.02);
    ctx.bezierCurveTo(S * 0.3, S * 0.15, -S * 0.3, S * 0.17, -S * 0.5, S * 0.06);
    ctx.fill();
    // Scute seams.
    ctx.strokeStyle = "rgba(20,32,26,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const k of [-0.22, 0.02, 0.24]) {
      ctx.moveTo(S * k - S * 0.04, -S * 0.24 + Math.abs(k) * S * 0.2);
      ctx.quadraticCurveTo(S * k, -S * 0.06, S * k + S * 0.05, S * 0.1);
    }
    ctx.stroke();
    // Sunlight catching the top of the shell.
    ctx.strokeStyle = `rgba(214,245,250,${0.45 * light})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-S * 0.42, -S * 0.08);
    ctx.bezierCurveTo(-S * 0.3, -S * 0.3, S * 0.2, -S * 0.34, S * 0.4, -S * 0.06);
    ctx.stroke();

    // Neck and head.
    ctx.fillStyle = "#6b7f5f";
    ctx.beginPath();
    ctx.moveTo(S * 0.4, -S * 0.04);
    ctx.quadraticCurveTo(S * 0.52, -S * 0.08, S * 0.58, -S * 0.07);
    ctx.lineTo(S * 0.58, S * 0.07);
    ctx.quadraticCurveTo(S * 0.5, S * 0.08, S * 0.38, S * 0.08);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(S * 0.63, -S * 0.01, S * 0.13, S * 0.085, -0.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#0c1716";
    ctx.beginPath();
    ctx.arc(S * 0.67, -S * 0.035, S * 0.016, 0, TAU);
    ctx.fill();

    // Rear flipper, then the near front flipper doing the work.
    ctx.save();
    ctx.translate(-S * 0.42, S * 0.09);
    ctx.rotate(Math.sin(t * 2.6) * 0.18 - 0.2);
    this.flipper(ctx, S * 0.28, S * 0.11, "#4e6350");
    ctx.restore();
    ctx.save();
    ctx.translate(S * 0.24, S * 0.08);
    ctx.rotate(angle);
    this.flipper(ctx, S * 0.8, S * 0.17, "#60775c");
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

/* ─────────────  Humpback whale: a far, slow giant with those long white fins  ───────────── */

export class HumpbackWhale extends Creature {
  private length = 700;

  constructor(anchor: Anchor) {
    super(anchor, "humpback-whale");
    this.reach = 520;
  }

  update(f: Frame) {
    this.length = Math.max(f.small ? 300 : 460, f.width * (f.small ? 0.85 : 0.52));
    // Tied to the scroll: the whale swims across as you sink past it.
    const through = clamp((this.baseY + this.reach) / (f.height + this.reach * 2));
    this.x = lerp(-this.length * 0.4, f.width + this.length * 0.4, through) + 30 * Math.sin(f.time * 0.07);
    this.y = this.baseY + 20 * Math.sin(f.time * 0.23);
    this.radius = this.length * 0.32;
  }

  draw(f: Frame, ctx: CanvasRenderingContext2D) {
    const L = this.length;
    const t = f.time * 0.9;
    const bend = (s: number) => L * 0.022 * s ** 2.4 * Math.sin(t - s * 2.6);
    const top = (s: number) =>
      L *
      (s < 0.32
        ? 0.028 + 0.064 * Math.sin((s / 0.32) * (Math.PI / 2))
        : s < 0.88
          ? 0.092 - 0.074 * smoothstep(0.32, 0.88, s)
          : 0.018 - 0.012 * ((s - 0.88) / 0.12)) +
      L * 0.018 * Math.exp(-(((s - 0.66) / 0.03) ** 2));
    const bottom = (s: number) =>
      L *
      (s < 0.36
        ? 0.03 + 0.085 * Math.sin((s / 0.36) * (Math.PI / 2))
        : s < 0.88
          ? 0.115 - 0.1 * smoothstep(0.36, 0.88, s)
          : 0.015 - 0.01 * ((s - 0.88) / 0.12));
    const light = this.lit(f, this.x, this.y);

    // Facing left, so it swims into the page as you descend.
    place(ctx, f.dpr, this.x, this.y, 0.04, -1, 1);
    ctx.globalAlpha = 0.62;

    // Flukes, beating up and down; foreshortened as they rotate.
    const tailY = bend(1);
    const beat = Math.cos(t - 2.6);
    ctx.fillStyle = "#08263b";
    ctx.beginPath();
    ctx.moveTo(-L * 0.47, tailY);
    ctx.quadraticCurveTo(-L * 0.53, tailY - L * 0.05 * beat - L * 0.01, -L * 0.6, tailY - L * 0.075 * beat);
    ctx.quadraticCurveTo(-L * 0.56, tailY, -L * 0.6, tailY + L * 0.075 * beat + L * 0.004);
    ctx.quadraticCurveTo(-L * 0.53, tailY + L * 0.03 * beat, -L * 0.47, tailY);
    ctx.fill();

    const body = ctx.createLinearGradient(0, -L * 0.1, 0, L * 0.12);
    body.addColorStop(0, "#0e3550");
    body.addColorStop(0.6, "#072338");
    body.addColorStop(1, "#04182a");
    ctx.fillStyle = body;
    spinePath(ctx, L, top, bottom, bend);
    ctx.fill();

    // Ventral pleats along the throat.
    ctx.strokeStyle = "rgba(150,200,220,0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const off = L * (0.03 + k * 0.016);
      ctx.moveTo(L * 0.46, bend(0.04) + off * 0.5);
      ctx.quadraticCurveTo(L * 0.2, bend(0.3) + off + L * 0.02, -L * 0.02, bend(0.52) + off * 0.9);
    }
    ctx.stroke();

    // Knobbly tubercles on the head.
    ctx.fillStyle = "rgba(170,215,230,0.18)";
    for (let k = 0; k < 6; k++) {
      const s = 0.03 + k * 0.035;
      ctx.beginPath();
      ctx.arc(L / 2 - s * L, bend(s) - top(s) + 2, L * 0.004, 0, TAU);
      ctx.fill();
    }

    // Sunlight along the back.
    ctx.strokeStyle = `rgba(170,228,245,${0.35 * light})`;
    ctx.lineWidth = 1.5;
    spineTop(ctx, L, top, bend, 0.02, 0.9);
    ctx.stroke();

    // The long, pale pectoral fin.
    const finAngle = -0.55 + Math.sin(f.time * 0.5) * 0.12;
    ctx.save();
    ctx.translate(L * 0.18, bend(0.32) + bottom(0.32) * 0.6);
    ctx.rotate(finAngle);
    const fin = ctx.createLinearGradient(0, 0, -L * 0.3, 0);
    fin.addColorStop(0, "rgba(120,170,190,0.55)");
    fin.addColorStop(1, "rgba(200,232,242,0.55)");
    ctx.fillStyle = fin;
    ctx.beginPath();
    // Scalloped leading edge, tapering to a point.
    ctx.moveTo(0, -L * 0.02);
    ctx.bezierCurveTo(-L * 0.1, -L * 0.034, -L * 0.22, -L * 0.022, -L * 0.3, L * 0.004);
    ctx.bezierCurveTo(-L * 0.2, L * 0.008, -L * 0.1, L * 0.02, 0, L * 0.018);
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

/* ─────────────  Moon jellyfish: pulsing bell, trailing tentacles, four glowing rings  ───────────── */

export class MoonJelly extends Creature {
  private vx = 0;
  private vy = 0;
  private tilt = 0;
  private phase: number;
  private period: number;
  private tentacles: Strand[] = [];
  private arms: Strand[] = [];
  private homeOffset: number;

  constructor(
    anchor: Anchor,
    private size: number,
    seed: number,
  ) {
    super(anchor, "moon-jellyfish");
    const rand = seeded(seed);
    this.phase = rand();
    this.period = 2.2 + rand() * 1.2;
    this.homeOffset = (rand() - 0.5) * 80;
  }

  update(f: Frame) {
    const R = f.small ? this.size * 0.75 : this.size;
    if (!this.tentacles.length) {
      this.x = f.width * this.anchor.x;
      this.y = this.baseY;
      this.tentacles = Array.from({ length: 16 }, () => new Strand(9, R * 0.11, this.x, this.y));
      this.arms = Array.from({ length: 4 }, () => new Strand(8, R * 0.13, this.x, this.y));
    }
    const dt = f.dt;
    const before = this.phase;
    this.phase = wrap(this.phase + dt / this.period, 0, 1);
    // Each contraction pushes the bell the way it points.
    if (before < 0.08 && this.phase >= 0.08) {
      this.vx += Math.sin(this.tilt) * 32;
      this.vy -= Math.cos(this.tilt) * 32;
    }
    // Drift home, sink slowly between pulses, and get pushed aside by the cursor's wake.
    const homeX = f.width * this.anchor.x + 30 * Math.sin(f.time * 0.1 + this.period);
    const homeY = this.baseY + this.homeOffset;
    this.vx += (homeX - this.x) * 0.35 * dt;
    this.vy += ((homeY - this.y) * 0.5 + 6) * dt;
    const p = f.pointer;
    if (p.active && !f.reduced) {
      const dx = this.x - p.x;
      const dy = this.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d < 180) {
        this.vx += (dx / (d + 1)) * 90 * dt * (1 - d / 180);
        this.vy += (dy / (d + 1)) * 60 * dt * (1 - d / 180);
      }
    }
    const drag = Math.exp(-1.3 * dt);
    this.vx *= drag;
    this.vy *= drag;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.tilt += (clamp(this.vx * 0.012, -0.5, 0.5) - this.tilt) * Math.min(1, dt * 2);
    this.radius = R * 1.3;

    const c = this.contraction();
    const w = R * (1 - 0.16 * c);
    const cos = Math.cos(this.tilt);
    const sin = Math.sin(this.tilt);
    const gravity = f.reduced ? 0 : 0.18;
    this.tentacles.forEach((strand, i) => {
      const u = (i / (this.tentacles.length - 1)) * 2 - 1;
      const lx = u * w * 0.98;
      const ly = R * 0.02 - Math.abs(u) * R * 0.04;
      strand.step(this.x + lx * cos - ly * sin, this.y + lx * sin + ly * cos, gravity, 0);
    });
    this.arms.forEach((strand, i) => {
      const lx = (i - 1.5) * R * 0.1;
      strand.step(this.x + lx * cos, this.y + lx * sin, gravity * 0.8, Math.sin(f.time * 1.3 + i) * 0.12);
    });
  }

  private contraction() {
    const p = this.phase;
    return p < 0.22 ? Math.sin((p / 0.22) * (Math.PI / 2)) : 1 - smoothstep(0.22, 1, p);
  }

  draw(f: Frame, ctx: CanvasRenderingContext2D) {
    const R = f.small ? this.size * 0.75 : this.size;
    const c = this.contraction();
    const w = R * (1 - 0.16 * c);
    const h = R * (0.62 + 0.12 * c);
    const light = this.lit(f, this.x, this.y);
    const { dpr } = f;
    ctx.globalCompositeOperation = "lighter";

    // Tentacles and oral arms, in screen space.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = `rgba(190,215,255,${0.22 + 0.2 * light})`;
    ctx.lineWidth = 0.8;
    for (const strand of this.tentacles) {
      strand.trace(ctx);
      ctx.stroke();
    }
    ctx.strokeStyle = `rgba(220,200,255,${0.16 + 0.16 * light})`;
    ctx.lineWidth = R * 0.09;
    ctx.lineCap = "round";
    for (const strand of this.arms) {
      strand.trace(ctx);
      ctx.stroke();
    }
    ctx.lineCap = "butt";

    // The bell.
    place(ctx, dpr, this.x, this.y, this.tilt);
    const bell = ctx.createRadialGradient(0, -h * 0.55, R * 0.1, 0, -h * 0.3, w * 1.25);
    bell.addColorStop(0, `rgba(215,235,255,${0.32 + 0.18 * light})`);
    bell.addColorStop(0.6, `rgba(150,190,255,${0.12 + 0.08 * light})`);
    bell.addColorStop(1, "rgba(120,160,255,0.03)");
    ctx.fillStyle = bell;
    ctx.beginPath();
    ctx.moveTo(-w, 0);
    ctx.bezierCurveTo(-w, -h * 1.38, w, -h * 1.38, w, 0);
    // Scalloped margin.
    const lobes = 8;
    for (let k = lobes; k > 0; k--) {
      const x0 = -w + ((k - 0.5) * 2 * w) / lobes;
      const x1 = -w + ((k - 1) * 2 * w) / lobes;
      ctx.quadraticCurveTo(x0, R * 0.07, x1, 0);
    }
    ctx.fill();
    ctx.strokeStyle = `rgba(225,242,255,${0.35 + 0.3 * light})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-w * 0.96, -h * 0.05);
    ctx.bezierCurveTo(-w, -h * 1.32, w, -h * 1.32, w * 0.96, -h * 0.05);
    ctx.stroke();

    // The four horseshoe gonads that give moon jellies their look.
    ctx.strokeStyle = `rgba(235,180,255,${0.35 + 0.25 * light})`;
    ctx.lineWidth = R * 0.05;
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * TAU + 0.4;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * w * 0.3, -h * 0.5 + Math.sin(a) * h * 0.16, R * 0.14, R * 0.09, a, 0.4, TAU - 0.4);
      ctx.stroke();
    }
    glow(ctx, "190,220,255", 0, -h * 0.5, R * 1.3, 0.14 + 0.1 * light);
    ctx.globalCompositeOperation = "source-over";
  }
}

/* ─────────────  Comb jelly: rainbow waves running down eight comb rows  ───────────── */

const RAINBOW = Array.from({ length: 36 }, (_, i) => `hsl(${i * 10} 95% 68%)`);

export class CombJelly extends Creature {
  private seed: number;

  constructor(anchor: Anchor, seed: number) {
    super(anchor, "comb-jelly");
    this.seed = seed;
  }

  update(f: Frame) {
    const t = f.time + this.seed;
    this.x = f.width * this.anchor.x + 40 * Math.sin(t * 0.13);
    this.y = this.baseY + 30 * Math.sin(t * 0.21);
    this.radius = f.small ? 28 : 38;
  }

  draw(f: Frame, ctx: CanvasRenderingContext2D) {
    const t = f.time + this.seed;
    const w = f.small ? 15 : 20;
    const h = f.small ? 26 : 34;
    const light = this.lit(f, this.x, this.y);
    place(ctx, f.dpr, this.x, this.y, Math.sin(t * 0.4) * 0.2);
    ctx.globalCompositeOperation = "lighter";

    ctx.fillStyle = `rgba(190,225,255,${0.06 + 0.08 * light})`;
    ctx.strokeStyle = `rgba(200,230,255,${0.2 + 0.2 * light})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -h);
    ctx.bezierCurveTo(w * 1.2, -h * 0.8, w * 1.1, h * 0.7, w * 0.35, h);
    ctx.lineTo(-w * 0.35, h);
    ctx.bezierCurveTo(-w * 1.1, h * 0.7, -w * 1.2, -h * 0.8, 0, -h);
    ctx.fill();
    ctx.stroke();

    // Comb plates beating in sequence: colour travels down each row.
    const rows = [-0.72, -0.28, 0.28, 0.72];
    for (let r = 0; r < rows.length; r++) {
      for (let k = 0; k < 11; k++) {
        const v = k / 10;
        const y = lerp(-h * 0.82, h * 0.82, v);
        const bulge = Math.sin(v * Math.PI);
        const x = rows[r] * w * (0.45 + 0.6 * bulge);
        const hue = Math.floor(wrap(t * 16 - k * 3 + r * 4.5, 0, 36));
        const pulse = 0.5 + 0.5 * Math.sin(t * 9 - k * 0.9 + r);
        ctx.globalAlpha = (0.25 + 0.6 * pulse) * lerp(0.5, 1, light);
        ctx.fillStyle = RAINBOW[hue];
        ctx.fillRect(x - 1.2, y - 0.9, 2.4, 1.8);
      }
    }
    ctx.globalAlpha = 1;
    glow(ctx, "160,220,255", 0, 0, h * 1.5, 0.08 * light);
    ctx.globalCompositeOperation = "source-over";
  }
}

/* ─────────────  Giant manta ray: gliding overhead against the returning light  ───────────── */

export class MantaRay extends Creature {
  private span = 300;

  constructor(anchor: Anchor) {
    super(anchor, "giant-manta-ray");
    this.reach = 420;
    this.surfaceOnly = true;
  }

  update(f: Frame) {
    this.span = f.small ? 210 : Math.min(420, f.width * 0.3);
    const through = clamp((this.baseY + this.reach) / (f.height + this.reach * 2));
    this.x = lerp(f.width * (this.anchor.x - 0.25), f.width * (this.anchor.x + 0.15), through);
    this.y = this.baseY + 24 * Math.sin(f.time * 0.3);
    this.radius = this.span * 0.42;
  }

  draw(f: Frame, ctx: CanvasRenderingContext2D) {
    const W = this.span;
    const phase = f.time * 0.9;
    const flap = Math.sin(phase);
    // Seen from below and heading up-screen, wings spread left and right.
    place(ctx, f.dpr, this.x, this.y, -0.12 + Math.sin(f.time * 0.2) * 0.05);
    const tip = W * (0.5 - 0.04 * Math.abs(flap));
    const tipY = W * 0.05 + flap * W * 0.13;
    const outline = () => {
      ctx.beginPath();
      ctx.moveTo(-W * 0.07, -W * 0.19);
      ctx.bezierCurveTo(-W * 0.2, -W * 0.25, -W * 0.4, -W * 0.13, -tip, tipY);
      ctx.bezierCurveTo(-W * 0.36, tipY + W * 0.03, -W * 0.18, W * 0.07, -W * 0.06, W * 0.2);
      ctx.quadraticCurveTo(0, W * 0.24, W * 0.06, W * 0.2);
      ctx.bezierCurveTo(W * 0.18, W * 0.07, W * 0.36, tipY + W * 0.03, tip, tipY);
      ctx.bezierCurveTo(W * 0.4, -W * 0.13, W * 0.2, -W * 0.25, W * 0.07, -W * 0.19);
      ctx.quadraticCurveTo(0, -W * 0.17, -W * 0.07, -W * 0.19);
    };
    const body = ctx.createRadialGradient(0, -W * 0.02, W * 0.03, 0, 0, W * 0.5);
    body.addColorStop(0, "rgba(38,74,94,0.92)");
    body.addColorStop(0.5, "rgba(10,34,52,0.92)");
    body.addColorStop(1, "rgba(3,16,28,0.9)");
    ctx.fillStyle = body;
    outline();
    ctx.fill();
    // Cephalic lobes either side of the mouth.
    ctx.fillStyle = "rgba(6,24,38,0.95)";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * W * 0.075, -W * 0.215, W * 0.018, W * 0.045, side * -0.25, 0, TAU);
      ctx.fill();
    }
    // Whip tail.
    ctx.strokeStyle = "rgba(4,18,30,0.9)";
    ctx.lineWidth = W * 0.008;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, W * 0.22);
    ctx.quadraticCurveTo(Math.sin(phase * 0.7) * W * 0.03, W * 0.32, 0, W * 0.42);
    ctx.stroke();
    ctx.lineCap = "butt";
    // Light from the surface catching the leading edges.
    ctx.strokeStyle = "rgba(200,240,250,0.3)";
    ctx.lineWidth = 1.2;
    outline();
    ctx.stroke();
  }
}
