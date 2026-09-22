import { SPECIES } from "@/lib/data/species";
import type { Species } from "@/lib/types";

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(value: string) {
  return normalize(value).split(" ").filter(Boolean);
}

/** Ignore words that appear across many marine species and carry no signal. */
const STOP_WORDS = new Set(["sea", "common", "atlantic", "pacific", "european", "american", "giant", "great"]);

function overlapScore(a: string, b: string) {
  const left = tokens(a).filter((t) => !STOP_WORDS.has(t));
  const right = tokens(b).filter((t) => !STOP_WORDS.has(t));
  if (!left.length || !right.length) return 0;
  const shared = left.filter((token) => right.includes(token));
  return shared.length / Math.max(left.length, right.length);
}

/**
 * Resolves whatever the vision model returns onto TIDE's curated dataset.
 * Scientific names are trusted most, then aliases, then fuzzy common-name overlap.
 */
export function matchSpecies(commonName?: string | null, scientificName?: string | null): Species | null {
  const common = commonName ? normalize(commonName) : "";
  const scientific = scientificName ? normalize(scientificName) : "";
  if (!common && !scientific) return null;

  let best: { species: Species; score: number } | null = null;

  for (const species of SPECIES) {
    const candidates = [species.commonName, species.scientificName, ...(species.aliases ?? [])];
    let score = 0;

    for (const candidate of candidates) {
      const normalized = normalize(candidate);
      if (scientific && normalized === scientific) score = Math.max(score, 1);
      if (common && normalized === common) score = Math.max(score, 0.98);
    }

    // Genus-level hit, e.g. "Chelonia sp." or a misspelled species epithet.
    if (scientific) {
      const genus = normalize(species.scientificName).split(" ")[0];
      if (genus && scientific.split(" ")[0] === genus) score = Math.max(score, 0.8);
      score = Math.max(score, overlapScore(scientific, species.scientificName) * 0.85);
    }

    if (common) {
      for (const candidate of candidates) {
        score = Math.max(score, overlapScore(common, candidate) * 0.9);
      }
    }

    if (!best || score > best.score) best = { species, score };
  }

  if (!best || best.score < 0.55) return null;
  return best.species;
}
