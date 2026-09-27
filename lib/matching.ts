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

/** Equal, or one typo apart for a name long enough that it can't be a different genus by accident. */
function sameGenus(a: string, b: string) {
  if (a === b) return true;
  if (Math.min(a.length, b.length) < 5 || Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/** The genus in a model's scientific name: "Sebastes sp." → "sebastes". Family or order names aren't one. */
function genusOf(scientific: string) {
  const first = scientific.split(" ")[0];
  return first && !/(idae|inae|oidea|formes)$/.test(first) ? first : null;
}

/**
 * Resolves whatever the vision model returns onto TIDE's curated dataset.
 * Scientific names are trusted most, then aliases, then fuzzy common-name overlap.
 *
 * When the model names the taxon, a match has to agree with it. Common names are
 * regional — Marylanders call striped bass "rockfish", but a model's "Rockfish
 * (Sebastes sp.)" is a different fish entirely — so a nickname alone never overrides
 * the scientific name. Anything that doesn't agree goes to the "outside our field
 * guide" page under its own name instead of being forced onto a species we cover.
 */
export function matchSpecies(commonName?: string | null, scientificName?: string | null): Species | null {
  const common = commonName ? normalize(commonName) : "";
  const scientific = scientificName ? normalize(scientificName) : "";
  if (!common && !scientific) return null;
  const genus = scientific ? genusOf(scientific) : null;

  let best: { species: Species; score: number } | null = null;

  for (const species of SPECIES) {
    const candidates = [species.commonName, species.scientificName, ...(species.aliases ?? [])];

    // A family-level answer ("Portunidae") can't be compared, so the common name decides.
    if (genus) {
      const named = candidates.some((candidate) => normalize(candidate) === scientific);
      // Older binomials in the aliases (e.g. "rana catesbeiana") count for the genus too.
      const agrees = candidates.some((candidate) => sameGenus(normalize(candidate).split(" ")[0], genus));
      if (!named && !agrees) continue;
    }

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
