/**
 * One requestAnimationFrame loop for the whole story page.
 *
 * Smooth scroll subscribes with the lowest order, so everything that draws afterwards in
 * the same frame (the creature canvas, the species river) sees the scroll position the
 * browser is about to paint. Separate loops would let the canvas lag the page by a frame.
 */
type Tick = (time: number, delta: number) => void;

interface Entry {
  tick: Tick;
  order: number;
}

const entries: Entry[] = [];
let frame = 0;
let last = 0;

function loop(time: number) {
  // Clamp so a backgrounded tab doesn't resume with one enormous step.
  const delta = last ? Math.min(64, time - last) : 1000 / 60;
  last = time;
  for (const entry of entries.slice()) entry.tick(time, delta);
  frame = entries.length ? requestAnimationFrame(loop) : 0;
}

/** Runs `tick` every frame, in ascending `order`. Returns the unsubscribe function. */
export function onTick(tick: Tick, order = 0) {
  const entry = { tick, order };
  entries.push(entry);
  entries.sort((a, b) => a.order - b.order);
  if (!frame) {
    last = 0;
    frame = requestAnimationFrame(loop);
  }
  return () => {
    const index = entries.indexOf(entry);
    if (index >= 0) entries.splice(index, 1);
    if (!entries.length && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };
}
