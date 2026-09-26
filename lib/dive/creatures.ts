import type { IucnCode } from "@/lib/types";

/**
 * Field-guide entries for the animated creatures on /dive. Hover (or tap) one and the
 * page identifies it, the way the app does.
 *
 * Species that are also in TIDE's dataset carry a `slug`; their status is read from the
 * verified dataset at build time, so the `iucn` values below are only used for the others.
 * Those were checked against the IUCN Red List via GBIF on 2026-09-26 — the same source
 * the app uses. "NE" means no assessment exists, not that the species is safe.
 */
export interface CreatureGuide {
  id: string;
  name: string;
  scientificName: string;
  zone: string;
  fact: string;
  iucn: IucnCode;
  slug?: string;
}

export const CREATURE_GUIDE: CreatureGuide[] = [
  {
    id: "european-sardine",
    slug: "european-sardine",
    name: "European sardine",
    scientificName: "Sardina pilchardus",
    zone: "Sunlit zone",
    fact: "Schools of thousands turn as one, flashing silver to confuse predators.",
    iucn: "LC",
  },
  {
    id: "green-sea-turtle",
    slug: "green-sea-turtle",
    name: "Green sea turtle",
    scientificName: "Chelonia mydas",
    zone: "Sunlit zone",
    fact: "Rated Least Concern globally, yet protected under CITES — TIDE says do not consume.",
    iucn: "LC",
  },
  {
    id: "humpback-whale",
    slug: "humpback-whale",
    name: "Humpback whale",
    scientificName: "Megaptera novaeangliae",
    zone: "Sunlit zone",
    fact: "Its pectoral fins are the longest of any whale — up to a third of its body length.",
    iucn: "LC",
  },
  {
    id: "moon-jellyfish",
    name: "Moon jellyfish",
    scientificName: "Aurelia aurita",
    zone: "Sunlit zone",
    fact: "No brain, heart or bones — and one of the most widespread jellyfish on Earth.",
    iucn: "NE",
  },
  {
    id: "comb-jelly",
    name: "Comb jelly",
    scientificName: "Beroe forskalii",
    zone: "Sunlit zone",
    fact: "Not a jellyfish. The rainbow is light scattered by its beating rows of cilia.",
    iucn: "NE",
  },
  {
    id: "spotted-lanternfish",
    name: "Spotted lanternfish",
    scientificName: "Myctophum punctatum",
    zone: "Twilight zone",
    fact: "Climbs hundreds of metres to the surface each night to feed, then sinks before dawn.",
    iucn: "LC",
  },
  {
    id: "giant-siphonophore",
    name: "Giant siphonophore",
    scientificName: "Praya dubia",
    zone: "Twilight zone",
    fact: "A colony of clones working as one animal — it can grow longer than a blue whale.",
    iucn: "NE",
  },
  {
    id: "helmet-jellyfish",
    name: "Helmet jellyfish",
    scientificName: "Periphylla periphylla",
    zone: "Twilight to midnight zone",
    fact: "Deep red to stay hidden: red light never reaches this deep, so red looks black.",
    iucn: "NE",
  },
  {
    id: "sperm-whale",
    name: "Sperm whale",
    scientificName: "Physeter macrocephalus",
    zone: "Dives past 2,000 m",
    fact: "Holds its breath for over an hour while hunting squid in total darkness.",
    iucn: "VU",
  },
  {
    id: "humpback-anglerfish",
    name: "Humpback anglerfish",
    scientificName: "Melanocetus johnsonii",
    zone: "Midnight zone",
    fact: "Its glowing lure is lit by bacteria living inside it. This one is following your light.",
    iucn: "LC",
  },
  {
    id: "atolla-jellyfish",
    name: "Atolla jellyfish",
    scientificName: "Atolla wyvillei",
    zone: "Midnight zone",
    fact: "Under attack it flashes a spinning ring of blue light — a burglar alarm that summons bigger predators.",
    iucn: "NE",
  },
  {
    id: "dumbo-octopus",
    name: "Dumbo octopus",
    scientificName: "Grimpoteuthis sp.",
    zone: "Abyssal zone",
    fact: "One was filmed at 6,957 m — the deepest octopus ever recorded.",
    iucn: "NE",
  },
  {
    id: "mariana-snailfish",
    name: "Mariana snailfish",
    scientificName: "Pseudoliparis swirei",
    zone: "Hadal zone · 6,000–8,000 m",
    fact: "Among the deepest-living fish. A relative was filmed at 8,336 m, the deepest fish on record.",
    iucn: "NE",
  },
  {
    id: "hadal-amphipod",
    name: "Hadal amphipod",
    scientificName: "Hirondellea gigas",
    zone: "Challenger Deep · 10,900 m",
    fact: "Scavenges the floor of the deepest place on Earth.",
    iucn: "NE",
  },
  {
    id: "giant-manta-ray",
    slug: "giant-manta-ray",
    name: "Giant manta ray",
    scientificName: "Mobula birostris",
    zone: "Sunlit zone",
    fact: "The largest ray on Earth — a gentle filter feeder that lives on plankton.",
    iucn: "EN",
  },
];
