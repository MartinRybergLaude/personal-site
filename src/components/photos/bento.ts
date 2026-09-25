import type { Photo } from "./types";

/**
 * Composes an ordered list of photographs into bento blocks.
 *
 * The rhythm alternates between full-viewport heroes and denser rows so the
 * page breathes: a hero, a row of three, a row of two, a tall portrait beside
 * two stacked landscapes, and so on. Every block is sized purely from aspect
 * ratios, so widths are proportional and heights line up without measuring.
 *
 * Order is preserved except for a small lookahead window used to find a
 * photograph of the right orientation for the current beat.
 */

export type Block =
  | { kind: "hero"; photo: Photo }
  | { kind: "row"; photos: Photo[] }
  | { kind: "stack"; tall: Photo; stack: [Photo, Photo]; side: "left" | "right" };

type Beat = "hero" | "row3" | "row2" | "stack" | "pair";

const RHYTHM: Beat[] = ["hero", "row3", "row2", "stack", "row2", "pair", "row3", "stack", "row2"];
const LOOKAHEAD = 3;

export const ratio = (p: Photo) => p.width / p.height;
export const isLandscape = (p: Photo) => ratio(p) >= 1.25;
export const isPortrait = (p: Photo) => ratio(p) <= 0.9;

/** Removes and returns the first photo within the lookahead window matching `pred`. */
function take(pool: Photo[], pred: (p: Photo) => boolean): Photo | undefined {
  const limit = Math.min(pool.length, LOOKAHEAD);
  for (let i = 0; i < limit; i++) {
    if (pred(pool[i])) return pool.splice(i, 1)[0];
  }
  return undefined;
}

function tryBeat(beat: Beat, pool: Photo[], side: "left" | "right"): Block | null {
  const work = [...pool];
  let block: Block | null = null;

  switch (beat) {
    case "hero": {
      const p = take(work, isLandscape);
      if (p) block = { kind: "hero", photo: p };
      break;
    }
    case "stack": {
      const tall = take(work, isPortrait);
      const a = tall && take(work, isLandscape);
      const b = a && take(work, isLandscape);
      if (tall && a && b) block = { kind: "stack", tall, stack: [a, b], side };
      break;
    }
    case "pair": {
      const a = take(work, isPortrait);
      const b = a && take(work, isPortrait);
      if (a && b) block = { kind: "row", photos: [a, b] };
      break;
    }
    case "row3":
    case "row2": {
      const n = beat === "row3" ? 3 : 2;
      if (work.length >= n) block = { kind: "row", photos: work.splice(0, n) };
      break;
    }
  }

  if (block) pool.splice(0, pool.length, ...work);
  return block;
}

const FALLBACKS: Record<Beat, Beat[]> = {
  hero: ["pair", "row2"],
  stack: ["row3", "row2"],
  pair: ["row2"],
  row3: ["row2"],
  row2: [],
};

export function compose(photos: Photo[]): Block[] {
  const pool = [...photos];
  const blocks: Block[] = [];
  let beatIndex = 0;
  let side: "left" | "right" = "left";

  while (pool.length > 0) {
    // Whatever is left at the end becomes its own block.
    if (pool.length === 1) {
      const p = pool.shift()!;
      blocks.push(isLandscape(p) ? { kind: "hero", photo: p } : { kind: "row", photos: [p] });
      break;
    }

    const beat = RHYTHM[beatIndex++ % RHYTHM.length];
    let block: Block | null = null;
    for (const candidate of [beat, ...FALLBACKS[beat]]) {
      block = tryBeat(candidate, pool, side);
      if (block) break;
    }
    if (!block) block = { kind: "row", photos: pool.splice(0, Math.min(2, pool.length)) };

    if (block.kind === "stack") side = side === "left" ? "right" : "left";
    blocks.push(block);
  }

  return blocks;
}
