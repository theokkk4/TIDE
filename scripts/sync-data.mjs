#!/usr/bin/env node
/**
 * Verifies TIDE's species dataset against live public APIs and caches the result.
 *
 *   GBIF          → accepted taxonomy, usage key, occurrence counts
 *   GBIF ⇢ IUCN   → Red List category (keyless mirror of the IUCN assessment)
 *   Wikipedia     → summary text, lead photograph, licence + author attribution
 *   NOAA          → validates the Fisheries species page link before it ships
 *
 * Output: lib/data/generated/verified.json and public/species/<slug>.jpg
 * The app falls back to the curated dataset whenever this cache is missing.
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "lib", "data", "generated");
const IMG_DIR = path.join(ROOT, "public", "species");
const UA = "TIDE-MarineID/1.0 (hackathon project; contact via repository)";

const MEDIA_IMAGES = {
  "fish-and-chips": "Fish and chips",
  ceviche: "Ceviche",
  "fish-taco": "Fish taco",
  "crab-cake": "Crab cake",
  "lobster-roll": "Lobster roll",
  paella: "Paella",
  sashimi: "Sashimi",
  calamari: "Squid as food",
  chowder: "Chowder",
  // Lead images must be the dish, not the animal: "Scampi" and "Sardine" both
  // illustrate the living species, which reads as a mistake on a recipe card.
  "pan-fried": "Sole meunière",
  "grilled-whole": "Ikan bakar",
  cioppino: "Cioppino",
  bouillabaisse: "Bouillabaisse",
  "salmon-dish": "Salmon as food",
  poke: "Poke (dish)",
  "seafood-boil": "Seafood boil",
  pulpo: "Pulpo a la gallega",
  "hero-reef": "Coral reef",
  "hero-kelp": "Kelp forest",
  "hero-seagrass": "Seagrass",
};

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function tryJson(url) {
  try {
    return await getJson(url);
  } catch {
    return null;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Wikimedia throttles bursts, so pace requests and back off when asked to. */
async function wikiJson(url, attempts = 4) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    await sleep(350 + attempt * 900);
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
      if (res.status === 429 || res.status >= 500) continue;
      if (!res.ok) return null;
      return await res.json();
    } catch {
      /* retry */
    }
  }
  return null;
}

async function urlWorks(url) {
  try {
    const res = await fetch(url, { method: "HEAD", headers: { "User-Agent": UA }, redirect: "follow" });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Wikimedia serves a fixed set of thumbnail widths and refuses to upscale past the
 * original, so try progressively smaller widths and fall back to the summary's own URL.
 */
function thumbVariants(src, widths = [1024, 800, 640]) {
  const clean = src.split("?")[0];
  const match = clean.match(/\/(\d+)px-([^/]+)$/);
  if (!match) return [clean];
  const original = Number(match[1]);
  const variants = widths.filter((w) => w > original).map((w) => clean.replace(/\/\d+px-/, `/${w}px-`));
  return [...variants, clean];
}

function fileNameFromThumb(src) {
  // Unscaled originals come back with a ?utm_source=… query that isn't part of the name.
  const match = src.split("?")[0].match(/\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/]+?)(?:\/\d+px-.*)?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function stripHtml(value) {
  if (!value) return null;
  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    // Photographers sometimes append a contact address; the credit only needs the name.
    .replace(/\s*<[^<>\s]+@[^<>\s]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  // Commons often repeats the same credit across nested spans, which renders as
  // "Unknown authorUnknown author" once the tags are gone.
  const words = text.split(" ");
  if (words.length % 2 === 0) {
    const half = words.length / 2;
    if (words.slice(0, half).join(" ") === words.slice(half).join(" ")) {
      return words.slice(0, half).join(" ") || null;
    }
  }
  return text || null;
}

async function fetchAttribution(thumbSource) {
  const fileName = fileNameFromThumb(thumbSource);
  if (!fileName) return null;
  const api =
    "https://en.wikipedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=extmetadata&titles=" +
    encodeURIComponent(`File:${fileName}`);
  const data = await wikiJson(api);
  const pages = data?.query?.pages;
  if (!pages) return null;
  const meta = Object.values(pages)[0]?.imageinfo?.[0]?.extmetadata;
  if (!meta) return null;
  const artist = stripHtml(meta.Artist?.value);
  const licence = stripHtml(meta.LicenseShortName?.value);
  if (!artist && !licence) return null;
  return [artist, licence].filter(Boolean).join(" · ") + " · via Wikimedia Commons";
}

async function downloadImage(src, destPath) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await sleep(200 + attempt * 800);
    try {
      const res = await fetch(src, { headers: { "User-Agent": UA } });
      if (res.status === 429 || res.status >= 500) continue;
      if (!res.ok) return false;
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length < 1024) return false;
      await writeFile(destPath, buffer);
      return true;
    } catch {
      /* retry */
    }
  }
  return false;
}

/**
 * Special:FilePath serves an arbitrary width, so it gives far better resolution than the
 * summary's 330px lead thumbnail. Thumbnail variants remain the fallback.
 */
async function downloadBestImage(source, destPath, width = 1024) {
  const fileName = fileNameFromThumb(source);
  if (fileName) {
    const filePath = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=${width}`;
    if (await downloadImage(filePath, destPath)) return true;
  }
  for (const candidate of thumbVariants(source, [1024, 800, 640])) {
    if (await downloadImage(candidate, destPath)) return true;
  }
  return false;
}

async function readJsonIfExists(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return null;
  }
}

/** A cached record still counts only if the image it points at is actually on disk. */
const FORCE_IMAGES = process.env.FORCE_IMAGES === "1";

function imageOnDisk(record) {
  return Boolean(record?.image && existsSync(path.join(ROOT, "public", record.image.replace(/^\//, ""))));
}

function cachedImageUsable(record) {
  return !FORCE_IMAGES && imageOnDisk(record);
}

/**
 * A refresh must never erase data an earlier run verified. Wikipedia and GBIF both
 * throttle, so a failed fetch falls back to the previous record instead of writing a
 * degraded file — a forced re-sync once dropped nine photos this way.
 */
function keepPreviousOnFailure(record, cached) {
  if (!cached) return record;

  if (!record.gbifKey && cached.gbifKey) {
    for (const key of ["gbifKey", "taxonomy", "iucnCode", "iucnCategory", "iucnTaxonId", "occurrenceCount"]) {
      record[key] = cached[key];
    }
  } else if (!record.iucnCode && cached.iucnCode && record.gbifKey === cached.gbifKey) {
    record.iucnCode = cached.iucnCode;
    record.iucnCategory = cached.iucnCategory;
    record.iucnTaxonId = cached.iucnTaxonId;
  }

  if (!record.image && imageOnDisk(cached)) {
    record.image = cached.image;
    record.imageCredit = cached.imageCredit;
    record.wikipediaUrl = cached.wikipediaUrl;
    record.summary = cached.summary;
  }

  record.noaaUrl ??= cached.noaaUrl ?? null;
  return record;
}

/** Wikipedia redirects scientific names to the article, so try that first. */
async function fetchWikiSummary(candidates) {
  for (const title of candidates) {
    const data = await wikiJson(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`,
    );
    if (data && data.type === "standard" && data.thumbnail?.source) return data;
  }
  return null;
}

async function loadSpeciesList() {
  const src = await readFile(path.join(ROOT, "lib", "data", "species.ts"), "utf8");
  const entries = [];
  const slugRe =
    /slug:\s*"([^"]+)"[\s\S]*?commonName:\s*"([^"]+)"[\s\S]*?scientificName:\s*"([^"]+)"[\s\S]*?iucnCode:\s*"([^"]+)"/g;
  let match;
  while ((match = slugRe.exec(src)) !== null) {
    entries.push({
      slug: match[1],
      commonName: match[2],
      scientificName: match[3],
      curatedIucn: match[4],
    });
  }
  return entries;
}

async function syncSpecies(entry, cached) {
  const { slug, commonName, scientificName } = entry;
  const record = {
    gbifKey: null,
    iucnCode: null,
    iucnCategory: null,
    iucnTaxonId: null,
    occurrenceCount: null,
    taxonomy: {},
    image: null,
    imageCredit: null,
    wikipediaUrl: null,
    noaaUrl: null,
    summary: null,
  };

  const match = await tryJson(
    `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(scientificName)}`,
  );
  if (match?.usageKey) {
    record.gbifKey = match.usageKey;
    record.taxonomy = {
      kingdom: match.kingdom,
      phylum: match.phylum,
      class: match.class,
      order: match.order,
      family: match.family,
    };

    const iucn = await tryJson(`https://api.gbif.org/v1/species/${match.usageKey}/iucnRedListCategory`);
    if (iucn?.code) {
      record.iucnCode = iucn.code;
      record.iucnCategory = iucn.category;
      record.iucnTaxonId = iucn.iucnTaxonID ?? null;
    }

    const occ = await tryJson(
      `https://api.gbif.org/v1/occurrence/search?taxonKey=${match.usageKey}&limit=0`,
    );
    if (typeof occ?.count === "number") record.occurrenceCount = occ.count;
  }

  // Wikipedia rate-limits hard, so reuse anything a previous run already fetched. A photo
  // without its credit isn't reusable: most are CC BY-SA, which requires attribution, and
  // re-fetching image and credit together keeps the two from ever mismatching.
  if (cachedImageUsable(cached) && cached.imageCredit) {
    record.image = cached.image;
    record.imageCredit = cached.imageCredit;
    record.wikipediaUrl = cached.wikipediaUrl;
    record.summary = cached.summary;
    const noaaCached = `https://www.fisheries.noaa.gov/species/${slug}`;
    record.noaaUrl = cached.noaaUrl ?? ((await urlWorks(noaaCached)) ? noaaCached : null);
    return keepPreviousOnFailure(record, cached);
  }

  // Wikipedia titles are sentence case, so "Blue Crab" needs a "Blue crab" attempt too.
  const sentenceCase = commonName.charAt(0) + commonName.slice(1).toLowerCase();
  const wiki = await fetchWikiSummary([scientificName, commonName, sentenceCase]);
  if (wiki) {
    record.wikipediaUrl = wiki.content_urls?.desktop?.page ?? null;
    record.summary = wiki.extract ?? null;
    const source = wiki.thumbnail.source;
    await mkdir(IMG_DIR, { recursive: true });
    const dest = path.join(IMG_DIR, `${slug}.jpg`);
    const ok = await downloadBestImage(source, dest);
    if (ok) {
      record.image = `/species/${slug}.jpg`;
      record.imageCredit = await fetchAttribution(source);
    }
  }

  const noaaUrl = `https://www.fisheries.noaa.gov/species/${slug}`;
  if (await urlWorks(noaaUrl)) record.noaaUrl = noaaUrl;

  return keepPreviousOnFailure(record, cached);
}

async function syncMediaImages(cachedMedia) {
  const dir = path.join(ROOT, "public", "media");
  await mkdir(dir, { recursive: true });
  const out = {};
  for (const [key, title] of Object.entries(MEDIA_IMAGES)) {
    const cached = cachedMedia?.[key];
    if (cachedImageUsable(cached) && cached.credit) {
      out[key] = cached;
      continue;
    }
    const wiki = await fetchWikiSummary([title]);
    const ok = wiki ? await downloadBestImage(wiki.thumbnail.source, path.join(dir, `${key}.jpg`), 800) : false;
    if (ok) {
      out[key] = { image: `/media/${key}.jpg`, credit: await fetchAttribution(wiki.thumbnail.source) };
      console.log(`  ✓ media ${key}`);
    } else if (imageOnDisk(cached)) {
      out[key] = cached;
      console.log(`  · media ${key} (refresh failed — kept previous)`);
    } else {
      console.log(`  ✗ media ${key}`);
    }
  }
  return out;
}

async function main() {
  const list = await loadSpeciesList();
  const previous = await readJsonIfExists(path.join(OUT_DIR, "verified.json"));
  console.log(`Syncing ${list.length} species against GBIF / IUCN / Wikipedia…\n`);

  const species = {};
  for (const entry of list) {
    try {
      const record = await syncSpecies(entry, previous?.species?.[entry.slug]);
      species[entry.slug] = record;
      console.log(
        `  ${record.image ? "✓" : "·"} ${entry.commonName.padEnd(28)} ` +
          `IUCN ${String(record.iucnCode ?? "—").padEnd(3)} ` +
          `GBIF ${String(record.gbifKey ?? "—").padEnd(10)} ` +
          `${record.occurrenceCount?.toLocaleString() ?? "—"} records` +
          `${record.noaaUrl ? " · NOAA" : ""}`,
      );
    } catch (error) {
      console.log(`  ✗ ${entry.commonName}: ${error.message}`);
      species[entry.slug] = null;
    }
  }

  console.log("\nSyncing dish and scene photography…");
  const media = await syncMediaImages(previous?.media);

  // Credits reused from earlier runs never went through the current parser.
  for (const record of Object.values(species)) {
    if (record?.imageCredit) record.imageCredit = stripHtml(record.imageCredit);
  }
  for (const record of Object.values(media)) {
    if (record.credit) record.credit = stripHtml(record.credit);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const payload = {
    retrievedAt: new Date().toISOString().slice(0, 10),
    species,
    media,
  };
  await writeFile(path.join(OUT_DIR, "verified.json"), JSON.stringify(payload, null, 2) + "\n");

  const withStatus = Object.values(species).filter((s) => s?.iucnCode).length;
  const withImages = Object.values(species).filter((s) => s?.image).length;
  const mediaTotal = Object.keys(MEDIA_IMAGES).length;
  console.log(
    `\nDone. ${withStatus}/${list.length} IUCN categories, ${withImages}/${list.length} species photos, ` +
      `${Object.keys(media).length}/${mediaTotal} media photos.`,
  );

  // Missing entries make the app fall back to placeholders, so say so loudly.
  const missing = [
    ...list.filter((entry) => !species[entry.slug]?.image).map((entry) => entry.slug),
    ...Object.keys(MEDIA_IMAGES).filter((key) => !media[key]),
  ];
  if (missing.length) {
    console.log(`\n⚠  No photo recorded for: ${missing.join(", ")}`);
    console.log("   Usually Wikimedia rate limiting — re-run `npm run sync:data` in a minute.");
  }
  const uncredited = [
    ...list.filter((entry) => species[entry.slug]?.image && !species[entry.slug].imageCredit).map((e) => e.slug),
    ...Object.entries(media).filter(([, value]) => !value.credit).map(([key]) => key),
  ];
  if (uncredited.length) {
    console.log(`\n⚠  No attribution recorded for: ${uncredited.join(", ")}`);
    console.log("   Most photos are CC BY-SA and must be credited — re-run `npm run sync:data`.");
  }

  // Curated prose must never contradict the live assessment.
  const drift = list.filter(
    (entry) => species[entry.slug]?.iucnCode && species[entry.slug].iucnCode !== entry.curatedIucn,
  );
  if (drift.length) {
    console.log("\n⚠  Curated fallback differs from the live IUCN category:");
    for (const entry of drift) {
      console.log(`   ${entry.commonName}: dataset ${entry.curatedIucn} → live ${species[entry.slug].iucnCode}`);
    }
    console.log("   Update lib/data/species.ts so the written context matches the assessment.");
  }
  if (!existsSync(path.join(OUT_DIR, "verified.json"))) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
