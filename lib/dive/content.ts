/**
 * Words and numbers for the /dive presentation, kept apart from the layout so the team
 * can edit them without touching components.
 */

export const REPO_URL = "https://github.com/theokkk4/TIDE";

export const TEAM = ["Theodore", "Issaka", "Oliver"];

/* ─────────────  The people  ───────────── */

export interface TeamStory {
  id: "oliver" | "theodore" | "issaka";
  name: string;
  /** A few words under the name. */
  tagline?: string;
  /**
   * Baby or fishing photo. Drop the file at public/dive/team/<id>.jpg and it appears
   * automatically; until then a quiet placeholder frame shows their initial.
   */
  photoAlt: string;
  photoCaption?: string;
  /** Short paragraphs in their own words. `null` = not written yet. */
  paragraphs: string[] | null;
  /** The line that stays with you. */
  quote?: string;
}

export const OLIVER: TeamStory = {
  id: "oliver",
  name: "Oliver",
  tagline: "Fishing with family",
  photoAlt: "Oliver as a kid",
  paragraphs: [
    "I've been fishing more times than I can count — usually with my family, sometimes with friends. A lot of my best memories are from those days on the water, and it's something I hold onto.",
    "Spend enough time out there and you start to care about what's under the surface. That's why TIDE means something to me: it gives anyone a way to find out what they're looking at, and to know when it's a species that's in trouble.",
  ],
  quote: "I don't want my grandkids to grow up without this beautiful marine life.",
};

export const THEODORE: Pick<TeamStory, "id" | "name" | "tagline" | "photoAlt" | "photoCaption"> = {
  id: "theodore",
  name: "Theodore",
  tagline: "Crabbing in South Jersey",
  photoAlt: "Theodore as a kid",
};

// TODO(issaka): Issaka's story goes here — two or three short paragraphs in his own words,
// plus an optional `quote` and `tagline`. Leave `paragraphs` as null until then; the page
// shows a clearly marked placeholder instead of inventing anything.
export const ISSAKA: TeamStory = {
  id: "issaka",
  name: "Issaka",
  photoAlt: "Issaka as a kid",
  paragraphs: null,
};

/* ─────────────  The problem: FAO figures, worded as FAO states them  ───────────── */

export interface SourcedStat {
  value: string;
  label: string;
  source: string;
  url: string;
}

const SOFIA_2026 = "https://www.fao.org/newsroom/detail/sofia-2026--global-fisheries-and-aquaculture-production-reaches-new-highs/en";
const FAO_STOCKS_2025 =
  "https://www.fao.org/newsroom/detail/fao-releases-the-most-detailed-global-assessment-of-marine-fish-stocks-to-date/en";

export const WORLD_STATS: SourcedStat[] = [
  {
    value: "3.1 billion",
    label: "people get at least one-fifth of their animal protein from aquatic animal foods",
    source: "FAO, The State of World Fisheries and Aquaculture 2026",
    url: SOFIA_2026,
  },
  {
    value: "89%",
    label: "of aquatic animal production goes to human consumption",
    source: "FAO, The State of World Fisheries and Aquaculture 2026",
    url: SOFIA_2026,
  },
  {
    value: "600M+",
    label: "livelihoods are supported by the aquatic food sector",
    source: "FAO, The State of World Fisheries and Aquaculture 2026",
    url: SOFIA_2026,
  },
  {
    value: "64.5%",
    label: "of assessed global marine fishery stocks were exploited within biologically sustainable levels in 2021",
    source: "FAO, Review of the State of World Marine Fishery Resources 2025 (2021 data)",
    url: FAO_STOCKS_2025,
  },
];

/* ─────────────  Projected outcomes  ───────────── */

export interface ProjectedTarget {
  value: string;
  label: string;
  /** What the number counts and how we'd measure it — never a claim that it's been reached. */
  measure: string;
}

export const PROJECTED_TARGETS: ProjectedTarget[] = [
  {
    value: "85–90%",
    label: "identification accuracy across supported marine species",
    measure:
      "A labelled set of photos for every species TIDE supports. An identification counts as correct when TIDE's top answer matches the label.",
  },
  {
    value: "50%+",
    label: "of seafood-related sessions interact with sustainability or conservation information before recipes",
    measure:
      "Sessions on species TIDE treats as seafood, counting whether the conservation or rules card was opened before any recipe. TIDE puts them above the recipes by design.",
  },
  {
    value: "10,000+",
    label: "marine-life identifications in year one",
    measure: "Live identifications that return a species. Demo scans don't count.",
  },
  {
    value: "25,000+",
    label: "species and conservation information views in year one",
    measure: "Views of a species page's conservation status, state rules or found-it guidance, from scans or from Discover.",
  },
];

/** What funding would change — the roadmap, kept short. */
export const ROADMAP: [string, string][] = [
  ["All 50 states", "A regulations pipeline built with state agencies, instead of a hand-checked table for three."],
  ["Offline on the water", "Rules and the crab gauge cached for marshes and boats with no signal."],
  ["Season alerts", "A heads-up when a limit or season changes for the water you fish."],
  ["Sightings for science", "Opt-in reports of sturgeon, rare turtles and snakeheads, sent to state biologists."],
];

/* ─────────────  Sources for the footer  ───────────── */

export const SOURCES = [
  { label: "FAO — The State of World Fisheries and Aquaculture 2026", url: SOFIA_2026 },
  { label: "FAO — Review of the State of World Marine Fishery Resources 2025", url: FAO_STOCKS_2025 },
  { label: "NOAA Fisheries — Fisheries of the United States", url: "https://www.fisheries.noaa.gov/national/sustainable-fisheries/fisheries-united-states" },
  { label: "RBFF — 2025 Special Report on Fishing", url: "https://www.takemefishing.org/corporate/resource-center/research/fishing-boating-research/" },
  { label: "IUCN Red List of Threatened Species", url: "https://www.iucnredlist.org" },
  { label: "GBIF — Global Biodiversity Information Facility", url: "https://www.gbif.org" },
];
