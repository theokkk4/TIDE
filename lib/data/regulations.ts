/**
 * Keep-or-release rules for the states around OwlHacks (Philadelphia), plus federal
 * protections that apply everywhere.
 *
 * Every rule below was read from the official source it cites on the date in
 * RULES_CHECKED. Nothing here is estimated: where a state's rule wasn't verified, the
 * app says so and links the agency instead of guessing. Rules change every season, so
 * the UI always shows the source and the date alongside the verdict.
 */

export type RegionCode = "NJ" | "PA" | "MD";

export interface Region {
  code: RegionCode;
  name: string;
  agency: { label: string; url: string };
}

export const REGIONS: Region[] = [
  { code: "NJ", name: "New Jersey", agency: { label: "NJ Fish & Wildlife", url: "https://dep.nj.gov/njfw/" } },
  {
    code: "PA",
    name: "Pennsylvania",
    agency: { label: "PA Fish & Boat Commission", url: "https://www.pa.gov/agencies/fishandboat" },
  },
  { code: "MD", name: "Maryland", agency: { label: "Maryland DNR", url: "https://dnr.maryland.gov/fisheries" } },
];

export const RULES_CHECKED = "2026-09-26";

/** Inclusive date range within one calendar year, as "MM-DD". */
export type Span = [string, string];

export interface RegionRule {
  region: RegionCode | "US";
  /**
   * open      — keeping is allowed within the limits below
   * no-take   — never keep it
   * must-kill — never release it alive
   * info      — no keep/release rule, just things to know
   */
  kind: "open" | "no-take" | "must-kill" | "info";
  /** Which waters the numbers apply to, when a state splits them. */
  area?: string;
  /** Inches. */
  min?: number;
  max?: number;
  /** "28 to less than 31 inches" rather than "up to 31". */
  maxExclusive?: boolean;
  /** Minimum sizes that change through the season (Maryland crabs). */
  sizeBySeason?: { span: Span; min: number }[];
  /** Dates when keeping is allowed; outside them the catch goes back. */
  harvest?: Span[];
  /** Dates when fishing for the species at all is closed. */
  closed?: Span[];
  females?: "release";
  eggs?: "release";
  bag?: string;
  season?: string;
  notes?: string[];
  source: { label: string; url: string };
}

const NJ_SALTWATER = {
  label: "NJ 2026 recreational size & possession limits",
  url: "https://www.eregulations.com/newjersey/fishing/saltwater/state-size-possession-limits",
};
const NJ_SHELLFISH = {
  label: "NJ 2026 mollusk & crustacean rules",
  url: "https://www.eregulations.com/newjersey/fishing/saltwater/mollusks-crustaceans/",
};
const NJ_TURTLES = {
  label: "NJ Fish & Wildlife — Turtles of New Jersey",
  url: "https://nj.gov/dep/fgw/pdf/2016/digfsh12-15.pdf",
};
const PA_HERPS = {
  label: "58 Pa. Code § 79.3 — reptile & amphibian limits",
  url: "https://www.pacodeandbulletin.gov/Display/pacode?file=/secure/pacode/data/058/chapter79/s79.3.html&d=reduce",
};
const US_SEA_TURTLES = {
  label: "NOAA Fisheries — Sea turtles and recreational fishing",
  url: "https://www.fisheries.noaa.gov/national/marine-life-distress/sea-turtles-and-recreational-fishing",
};

const seaTurtle: RegionRule[] = [
  {
    region: "US",
    kind: "no-take",
    notes: [
      "Protected under the Endangered Species Act — never keep, harm or harass one.",
      "Hooked one? Call NOAA's hotline first: (866) 755-6622. Don't pull the hook out. If it has to go back on its own, cut the line as close to the hook as you safely can.",
    ],
    source: US_SEA_TURTLES,
  },
];

export const RULES: Record<string, RegionRule[]> = {
  "blue-crab": [
    {
      region: "NJ",
      kind: "open",
      area: "All New Jersey waters",
      min: 4.5,
      eggs: "release",
      bag: "1 bushel per person per day",
      season: "Crab pots & trotlines: Mar 15 – Nov 30 in most waters (Delaware Bay: Apr 6 – Dec 4)",
      notes: [
        "Hard crabs 4½″, soft crabs 3½″, peelers 3″ — measured point to point.",
        "All egg-bearing females and undersized crabs go back immediately.",
        "Pots in water under 150 ft wide must carry diamondback terrapin excluders.",
      ],
      source: NJ_SHELLFISH,
    },
    {
      region: "MD",
      kind: "open",
      area: "Chesapeake Bay & tidal tributaries",
      sizeBySeason: [
        { span: ["04-01", "07-14"], min: 5 },
        { span: ["07-15", "12-15"], min: 5.25 },
      ],
      harvest: [["04-01", "12-15"]],
      females: "release",
      eggs: "release",
      bag: "Unlicensed: 2 dozen hard crabs a day · licensed: 1 bushel",
      season: "Apr 1 – Dec 15",
      notes: [
        "Recreational crabbers may not keep any female hard crab or peeler.",
        "Measured tip to tip of the spikes. Soft crabs 3½″; peelers 3¼″ (3½″ from Jul 15).",
        "Recreational pots must have turtle reduction devices.",
      ],
      source: {
        label: "Maryland 2026 blue crab rules — Chesapeake Bay",
        url: "https://www.eregulations.com/maryland/fishing/blue-crabs-chesapeake-bay",
      },
    },
  ],
  "american-lobster": [
    {
      region: "NJ",
      kind: "open",
      min: 3.375,
      max: 5.25,
      eggs: "release",
      bag: "6 lobsters per person",
      notes: [
        "Carapace length, eye socket to the rear of the body shell: 3⅜″ to 5¼″.",
        "Release any lobster carrying eggs, any female with a V-notched tail, and any with eggs removed.",
      ],
      source: NJ_SHELLFISH,
    },
  ],
  "striped-bass": [
    {
      region: "NJ",
      kind: "open",
      area: "Atlantic Ocean & NJ marine waters",
      min: 28,
      max: 31,
      maxExclusive: true,
      bag: "1 fish per day",
      season:
        "Ocean (0–3 mi): open all year · most other marine waters: Mar 1 – Dec 31 · Delaware River below Trenton: Mar 1–31 and Jun 1 – Dec 31",
      notes: [
        "Slot limit: 28″ to less than 31″.",
        "Non-offset circle hooks are required when fishing with bait.",
      ],
      source: NJ_SALTWATER,
    },
    {
      region: "MD",
      kind: "open",
      area: "Chesapeake Bay & tidal tributaries",
      min: 19,
      max: 24,
      harvest: [
        ["05-01", "07-31"],
        ["09-01", "12-05"],
      ],
      closed: [["08-01", "08-31"]],
      bag: "1 fish per day",
      season: "Keep: May 1 – Jul 31 and Sep 1 – Dec 5 · August: closed to all striped bass fishing · otherwise catch-and-release",
      notes: ["Slot limit: 19″ to 24″.", "Atlantic Ocean & coastal bays: 1 fish, 28–31″."],
      source: { label: "Maryland 2026 striped bass rules", url: "https://www.eregulations.com/maryland/fishing/striped-bass" },
    },
  ],
  "summer-flounder": [
    {
      region: "NJ",
      kind: "open",
      area: "Most NJ marine waters",
      min: 18,
      harvest: [["05-04", "09-25"]],
      bag: "3 fish per day",
      season: "May 4 – Sep 25",
      notes: [
        "Delaware Bay & tributaries: 17″ minimum, 3 fish.",
        "Island Beach State Park, from shore: 16″ minimum, 2 fish.",
      ],
      source: NJ_SALTWATER,
    },
  ],
  "black-sea-bass": [
    {
      region: "NJ",
      kind: "open",
      min: 12.5,
      harvest: [["05-15", "12-31"]],
      bag: "10 a day (May 15 – Jun 21, Sep 23 – Oct 31) · 1 a day (Jun 22 – Sep 22) · 15 a day (Nov 1 – Dec 31)",
      season: "May 15 – Dec 31",
      source: NJ_SALTWATER,
    },
  ],
  bluefish: [
    {
      region: "NJ",
      kind: "open",
      bag: "5 per day (7 on party or charter boats)",
      season: "Open all year · no minimum size",
      source: NJ_SALTWATER,
    },
  ],
  "american-eel": [
    {
      region: "NJ",
      kind: "open",
      min: 9,
      bag: "25 per day",
      season: "Open all year",
      source: NJ_SALTWATER,
    },
  ],
  "northern-snakehead": [
    {
      region: "NJ",
      kind: "must-kill",
      notes: ["Listed as a potentially dangerous fish: anglers must destroy it if caught."],
      source: {
        label: "NJ 2026 freshwater regulations summary",
        url: "https://www.eregulations.com/newjersey/fishing/freshwater/summary-of-fishing-regulations",
      },
    },
    {
      region: "PA",
      kind: "must-kill",
      notes: [
        "Illegal to possess, sell, import or transport a live snakehead.",
        "Don't release it — dispose of it and report it: 814-359-5163.",
      ],
      source: {
        label: "PA Fish & Boat Commission — Snakehead",
        url: "https://www.pa.gov/agencies/fishandboat/fishing/all-about-fish/catch-pa-fish/snakehead",
      },
    },
    {
      region: "MD",
      kind: "open",
      bag: "No season, size or creel limit — Maryland fishing license required",
      notes: [
        "If you keep it, kill it immediately: possessing or transporting a live snakehead is illegal.",
        "Releasing is allowed only immediately, back where you caught it — but Maryland DNR encourages harvesting every snakehead you catch.",
      ],
      source: { label: "Maryland DNR — Northern snakehead", url: "https://dnr.maryland.gov/fisheries/documents/shq_a-fishing.pdf" },
    },
  ],
  "atlantic-sturgeon": [
    {
      region: "US",
      kind: "no-take",
      notes: [
        "Endangered under the Endangered Species Act since 2012: illegal to possess, harm or harass one, alive or dead.",
        "Keep it in the water, cut the line close to the hook, and report it to sturg911@noaa.gov (NJ: 609-748-2020).",
      ],
      source: { label: "NOAA Fisheries — Atlantic sturgeon", url: "https://www.fisheries.noaa.gov/species/atlantic-sturgeon" },
    },
  ],
  "horseshoe-crab": [
    {
      region: "NJ",
      kind: "no-take",
      notes: [
        "Harvest and possession are banned under the moratorium in place since 2008, which protects the shorebirds that feed on their eggs.",
      ],
      source: {
        label: "NJ Fish & Wildlife marine digest",
        url: "https://dep.nj.gov/njfw/wp-content/uploads/njfw/digmar20-24.pdf",
      },
    },
  ],
  "diamondback-terrapin": [
    {
      region: "NJ",
      kind: "no-take",
      notes: [
        "No turtle in New Jersey may be taken from the wild as a pet.",
        "Crab pots in water under 150 ft wide must carry terrapin excluders — the rule exists because terrapins drown in them.",
      ],
      source: NJ_TURTLES,
    },
    {
      region: "MD",
      kind: "info",
      notes: ["Recreational crab pots must have turtle reduction devices so terrapins can't swim in and drown."],
      source: {
        label: "Maryland 2026 blue crab rules — Chesapeake Bay",
        url: "https://www.eregulations.com/maryland/fishing/blue-crabs-chesapeake-bay",
      },
    },
  ],
  "eastern-box-turtle": [
    {
      region: "PA",
      kind: "no-take",
      notes: ["No open season: 0 per day, 0 in possession."],
      source: PA_HERPS,
    },
    {
      region: "NJ",
      kind: "no-take",
      notes: [
        "No turtle in New Jersey may be taken from the wild as a pet, and releasing pet turtles is illegal too.",
        "State status: Special Concern.",
      ],
      source: NJ_TURTLES,
    },
  ],
  "wood-turtle": [
    { region: "PA", kind: "no-take", notes: ["No open season: 0 per day, 0 in possession."], source: PA_HERPS },
    {
      region: "NJ",
      kind: "no-take",
      notes: ["State Threatened. No turtle in New Jersey may be taken from the wild as a pet."],
      source: NJ_TURTLES,
    },
  ],
  "bog-turtle": [
    {
      region: "US",
      kind: "no-take",
      notes: ["Listed as threatened under the Endangered Species Act (northern population). Never collect or disturb one."],
      source: { label: "US Fish & Wildlife Service — Bog turtle", url: "https://www.fws.gov/species/bog-turtle-glyptemys-muhlenbergii" },
    },
    {
      region: "NJ",
      kind: "no-take",
      notes: ["State Endangered in New Jersey. Report sightings to NJ Fish & Wildlife."],
      source: NJ_TURTLES,
    },
  ],
  "common-snapping-turtle": [
    {
      region: "PA",
      kind: "open",
      harvest: [["07-01", "10-31"]],
      bag: "15 per day, 30 in possession — fishing license required",
      season: "Jul 1 – Oct 31",
      source: PA_HERPS,
    },
    {
      region: "NJ",
      kind: "open",
      min: 13,
      harvest: [["07-15", "10-31"]],
      season: "Jul 15 – Oct 31",
      notes: ["Minimum 13″ measured along the curved shell.", "Fresh waters only."],
      source: {
        label: "NJ 2026 freshwater regulation changes",
        url: "https://www.eregulations.com/newjersey/fishing/freshwater/highlights-of-regulation-changes",
      },
    },
  ],
  "eastern-painted-turtle": [
    {
      region: "PA",
      kind: "open",
      bag: "1 per day, 1 in possession — the default for native species not otherwise listed; fishing license required",
      source: PA_HERPS,
    },
    {
      region: "NJ",
      kind: "no-take",
      notes: ["No turtle in New Jersey may be taken from the wild as a pet."],
      source: NJ_TURTLES,
    },
  ],
  "red-eared-slider": [
    {
      region: "NJ",
      kind: "info",
      notes: ["Non-native to New Jersey — most wild sliders are released pets.", "Releasing captive or pet turtles into the wild is illegal."],
      source: NJ_TURTLES,
    },
  ],
  "eastern-hellbender": [
    {
      region: "PA",
      kind: "no-take",
      notes: [
        "No open season: 0 per day, 0 in possession.",
        "Pennsylvania's official state amphibian. Proposed for federal listing as endangered in December 2024.",
      ],
      source: PA_HERPS,
    },
  ],
  "american-bullfrog": [
    {
      region: "PA",
      kind: "open",
      harvest: [["07-01", "10-31"]],
      bag: "10 per day, 20 in possession (combined with green frogs) — fishing license required",
      season: "Jul 1 – Oct 31",
      source: PA_HERPS,
    },
  ],
  "spotted-salamander": [
    {
      region: "PA",
      kind: "open",
      bag: "1 per day, 1 in possession — the default for unlisted native species; fishing license required",
      source: PA_HERPS,
    },
  ],
  "red-spotted-newt": [
    {
      region: "PA",
      kind: "open",
      bag: "1 per day, 1 in possession — the default for unlisted native species; fishing license required",
      source: PA_HERPS,
    },
  ],
  "american-toad": [
    {
      region: "PA",
      kind: "open",
      bag: "1 per day, 1 in possession — the default for unlisted native species; fishing license required",
      source: PA_HERPS,
    },
  ],
  "green-sea-turtle": seaTurtle,
  "loggerhead-sea-turtle": seaTurtle,
  "leatherback-sea-turtle": seaTurtle,
  "hawksbill-sea-turtle": seaTurtle,
};

export function getRegion(code: RegionCode | null | undefined) {
  return REGIONS.find((region) => region.code === code) ?? null;
}

/** The rule for this state, or a nationwide one when no state rule was verified. */
export function ruleFor(slug: string, region: RegionCode | null): RegionRule | null {
  const rules = RULES[slug] ?? [];
  return rules.find((rule) => rule.region === region) ?? rules.find((rule) => rule.region === "US") ?? null;
}

export function hasRules(slug: string) {
  return (RULES[slug]?.length ?? 0) > 0;
}

/* ─────────────  dates  ───────────── */

function monthDay(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function inSpan(date: Date, [from, to]: Span) {
  const day = monthDay(date);
  return day >= from && day <= to;
}

/** Minimum size that applies on this date, for rules whose limit moves through the season. */
export function minSizeOn(rule: RegionRule, date: Date) {
  const seasonal = rule.sizeBySeason?.find((entry) => inSpan(date, entry.span));
  return seasonal?.min ?? rule.min ?? null;
}

/** 4.5 → "4½″", 3.375 → "3⅜″", 28 → "28″". */
export function formatInches(value: number) {
  const whole = Math.floor(value);
  const fraction = Math.round((value - whole) * 8) / 8;
  const glyph = { 0.125: "⅛", 0.25: "¼", 0.375: "⅜", 0.5: "½", 0.625: "⅝", 0.75: "¾", 0.875: "⅞" }[fraction];
  if (!fraction) return `${whole}″`;
  return glyph ? `${whole || ""}${glyph}″` : `${value}″`;
}
