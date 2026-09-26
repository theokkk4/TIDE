import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SPECIES, getSpecies } from "@/lib/data/species";
import { getVerified, resolveStatusCode, speciesImage } from "@/lib/conservation";
import { getSeafoodVerdict } from "@/lib/seafood";
import { IMPACT, REPO_URL, TEAM, TRACKS } from "@/lib/dive/content";
import { CREATURE_GUIDE, type CreatureGuide } from "@/lib/dive/creatures";
import type { Species } from "@/lib/types";
import { AbyssBackground, Chapter, DepthHud, DepthProvider, type ChapterMarker } from "@/components/dive/depth";
import {
  CountUp,
  DemoPhone,
  PhoneStory,
  SourceConverge,
  VerdictExplorer,
  type SpeciesCardData,
} from "@/components/dive/interactives";
import { CreatureLayer } from "@/components/dive/creature-layer";
import { ClipReveal, MaskText, PlaneReveal, SoftReveal } from "@/components/dive/reveal";
import { SmoothScrollProvider } from "@/components/dive/smooth-scroll";
import { SpeciesRiver } from "@/components/dive/species-river";
import { CatchSplit, type CatchScenario } from "@/components/dive/catch-split";
import { FoundQuiz } from "@/components/dive/found-quiz";
import { ImpactModel } from "@/components/dive/impact-model";
import { BASELINES } from "@/lib/dive/impact";
import { FieldPhoto, LivePhoto } from "@/components/dive/story";
import { getRecipesFor } from "@/lib/data/recipes";

export const metadata: Metadata = {
  title: "TIDE — Keep it or let it go?",
  description:
    "Built by a South Jersey crabber: snap your catch, and TIDE checks your state's rules and tells you whether to keep it, release it or leave it be — with recipes when it's legal and not endangered.",
};

const CATEGORY_LABELS: Record<string, string> = {
  turtle: "turtles",
  fish: "fish",
  shark: "sharks & rays",
  ray: "sharks & rays",
  crustacean: "crustaceans",
  cephalopod: "cephalopods",
  mammal: "mammals",
  amphibian: "amphibians",
  other: "other",
};

function toCard(species: Species, context?: string): SpeciesCardData {
  const status = resolveStatusCode(species);
  const verdict = getSeafoodVerdict(species, status);
  return {
    slug: species.slug,
    name: species.commonName,
    scientificName: species.scientificName,
    emoji: species.emoji,
    category: CATEGORY_LABELS[species.category] ?? species.category,
    image: speciesImage(species),
    status,
    context,
    verdictHeadline: verdict.headline,
    verdictTone: verdict.tone,
    verdictSummary: verdict.summary,
    fishingStatus: species.fishingStatus,
    showRecipes: verdict.showRecipes,
    protectedSpecies: verdict.key === "PROTECTED",
  };
}

/** Three catches for the split chapter, judged live by the app's engine. */
const CATCHES: { slug: string; setup: string; input: CatchScenario["input"] }[] = [
  {
    slug: "blue-crab",
    setup: "A fat 5½-inch blue crab. You flip her over — there's an orange sponge under the apron.",
    input: { length: 5.5, eggs: true, female: true },
  },
  {
    slug: "striped-bass",
    setup: "A 22-inch striped bass, hooked in the lip on a circle hook. Dinner?",
    input: { length: 22, eggs: null, female: null },
  },
  {
    slug: "northern-snakehead",
    setup: "Something long, blotchy and toothy with scales on its head. Your buddy says throw it back.",
    input: { length: null, eggs: null, female: null },
  },
];

const STORY_STEPS = [
  {
    title: "Snap it",
    body: "Point your phone at the catch, or the turtle on the trail. Runs in any mobile browser — nothing to install.",
    image: "/dive/01-home.webp",
    alt: "TIDE home screen asking 'Caught it? Found it?'",
  },
  {
    title: "Identify",
    body: "Google Gemini vision names the species with a confidence score and look-alikes. Below 75%, TIDE says “We aren't completely sure.”",
    image: "/dive/02-analyzing.webp",
    alt: "TIDE analysing a photo",
  },
  {
    title: "Check the rules",
    body: "Pick your state and TIDE applies its size limit, season, egg and female rules — each one cited and dated.",
    image: "/dive/03-crab-keep.webp",
    alt: "Blue crab verdict: You can keep it, with the New Jersey rule cited",
  },
  {
    title: "Measure on the spot",
    body: "Calibrate once against a bank card and your phone becomes a crab gauge, with your state's legal line drawn on it.",
    image: "/dive/04-gauge.webp",
    alt: "On-screen crab gauge showing the Maryland legal line",
  },
  {
    title: "Or leave it be",
    body: "Found a box turtle on the road? TIDE says what to do, what's illegal, and how to stay safe.",
    image: "/dive/05-box-turtle.webp",
    alt: "Box turtle guidance: help it across the way it was heading",
  },
];

/** Photos from Theodore's camera roll, shown when the files are in public/dive/story. */
const FIELD_PHOTOS = [
  { file: "crab.jpg", caption: "Blue crab, back-bay marsh" },
  { file: "bay.jpg", caption: "Out on the back bay" },
  { file: "moon.jpg", caption: "Moonrise over the bay" },
];

const SOURCES = [
  { label: "IUCN Red List of Threatened Species", url: "https://www.iucnredlist.org" },
  { label: "GBIF — Global Biodiversity Information Facility", url: "https://www.gbif.org" },
  { label: "NOAA Fisheries", url: "https://www.fisheries.noaa.gov" },
  { label: "FAO — The State of World Fisheries and Aquaculture", url: "https://www.fao.org/state-of-fisheries-aquaculture" },
  { label: "NOAA Ocean Service — ocean exploration", url: "https://oceanservice.noaa.gov/facts/exploration.html" },
  { label: "Protected Planet — marine protected areas", url: "https://protectedplanet.net/marine" },
];

export default function DivePage() {
  const catches: CatchScenario[] = CATCHES.flatMap(({ slug, setup, input }) => {
    const species = getSpecies(slug);
    if (!species) return [];
    const verdict = getSeafoodVerdict(species, resolveStatusCode(species));
    return [{ species, image: speciesImage(species), edible: verdict.showRecipes, setup, input }];
  });
  const fieldPhotos = FIELD_PHOTOS.filter((photo) =>
    existsSync(path.join(process.cwd(), "public", "dive", "story", photo.file)),
  );
  // Plot twist: recipes only for species that are legal to keep and not endangered.
  // One dish each, so the cards don't repeat: crab cakes, beer-battered bass, baked fluke.
  const twist = (
    [
      ["blue-crab", "cakes"],
      ["striped-bass", "beer-battered"],
      ["summer-flounder", "mediterranean"],
    ] as const
  ).flatMap(([slug, dish]) => {
    const species = getSpecies(slug);
    if (!species) return [];
    const verdict = getSeafoodVerdict(species, resolveStatusCode(species));
    const recipe = verdict.showRecipes ? getRecipesFor(species).find((r) => r.id.endsWith(dish)) : undefined;
    return recipe ? [{ species, recipe }] : [];
  });
  const eel = getSpecies("american-eel");
  const boxTurtle = getSpecies("eastern-box-turtle");
  const explorer = SPECIES.map((species) => toCard(species));
  // Creatures that are also TIDE species show their live-verified status, not a copy.
  const guide: CreatureGuide[] = CREATURE_GUIDE.map((entry) => {
    const species = entry.slug ? getSpecies(entry.slug) : undefined;
    return species ? { ...entry, iucn: resolveStatusCode(species) } : entry;
  });

  const verifiedCount = SPECIES.filter((s) => getVerified(s.slug)?.iucnCode).length;
  const occurrences = SPECIES.reduce((sum, s) => sum + (getVerified(s.slug)?.occurrenceCount ?? 0), 0);

  const hasVideo = existsSync(path.join(process.cwd(), "public", "dive", "demo.mp4"));
  const chapters: ChapterMarker[] = [
    { id: "surface", number: "00", title: "Surface", depth: 0 },
    { id: "story", number: "01", title: "The Crabber", depth: 60 },
    { id: "question", number: "02", title: "The Question", depth: 150 },
    { id: "split", number: "03", title: "The Catch", depth: 450 },
    { id: "scatter", number: "04", title: "The Scatter", depth: 900 },
    { id: "lens", number: "05", title: "The Lens", depth: 1600 },
    { id: "found", number: "06", title: "Found One?", depth: 2400 },
    { id: "twist", number: "07", title: "Plot Twist", depth: 3000 },
    { id: "verdict", number: "08", title: "The Verdict", depth: 3600 },
    { id: "evidence", number: "09", title: "The Evidence", depth: 5000 },
    { id: "impact", number: "10", title: "The Impact", depth: 7500 },
    { id: "deep", number: "11", title: "The Deep", depth: 10935 },
    { id: "resurface", number: "12", title: "Resurface", depth: 0 },
  ];
  const chapter = (id: string) => chapters.find((c) => c.id === id)!;

  return (
    <SmoothScrollProvider>
    <DepthProvider>
      <div aria-hidden className="dive-curtain">
        <p className="dive-curtain__mark">TIDE</p>
        <p className="dive-curtain__note">0 m · OwlHacks 2026</p>
        <svg className="dive-curtain__wave" viewBox="0 0 1200 90" preserveAspectRatio="none">
          <path
            fill="#0d5570"
            d="M0 0 H1200 V40 C1125 72 1050 72 975 40 C900 8 825 8 750 40 C675 72 600 72 525 40 C450 8 375 8 300 40 C225 72 150 72 75 40 C50 30 25 22 0 20 Z"
          />
        </svg>
      </div>
      <AbyssBackground />
      <CreatureLayer guide={guide} />
      <DepthHud chapters={chapters} />

      <main className="relative">
        {/* 00 · Surface */}
        <section
          id="surface"
          data-depth={0}
          className="relative z-10 flex min-h-[100dvh] items-center overflow-hidden"
        >
          <ClipReveal delay={0.95} className="absolute inset-y-0 right-0 hidden w-[48%] md:block">
            <Image src="/dive/reef.webp" alt="" fill priority sizes="48vw" className="object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#0d5570_0%,rgba(13,85,112,0.55)_28%,transparent_60%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,#0d5570_0%,transparent_30%)]" />
          </ClipReveal>
          <div className="absolute inset-0 md:hidden">
            <Image src="/dive/reef.webp" alt="" fill priority sizes="100vw" className="object-cover opacity-45" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,85,112,0.4),#0d5570_85%)]" />
          </div>

          <div className="relative mx-auto w-full max-w-6xl px-5 pt-24 md:px-10">
            <SoftReveal delay={1.1}>
              <p className="font-mono text-[12px] tracking-[0.18em] text-turquoise/90 uppercase">
                OwlHacks 2026 · Deep Sea Aquatics
              </p>
            </SoftReveal>
            <MaskText
              as="h1"
              segments={["T I D E"]}
              label="TIDE"
              delay={1.15}
              stagger={0.08}
              className="mt-6 text-[clamp(72px,14vw,176px)] leading-[0.85] font-semibold text-foam [word-spacing:-0.06em]"
            />
            <MaskText
              as="p"
              segments={[{ text: "Keep it or let it go?", className: "font-serif italic" }]}
              delay={1.45}
              className="mt-6 text-[clamp(32px,4.4vw,56px)] leading-[1.05] text-foam"
            />
            <SoftReveal delay={1.7}>
              <p className="mt-6 max-w-md text-[18px] leading-relaxed text-mist">
                Snap your catch — or the turtle on the trail. TIDE names it, checks your state&apos;s rules, and tells
                you whether to keep it, release it, or leave it be.
              </p>
            </SoftReveal>
            <SoftReveal delay={1.9}>
              <div className="mt-16 flex flex-col gap-3 font-mono text-[12px] tracking-[0.16em] text-mist/80 uppercase">
                <p className="flex items-center gap-3">
                  <span className="inline-block h-10 w-px animate-pulse bg-turquoise/70" />
                  Scroll to dive
                </p>
                <p className="hidden text-[11px] tracking-[0.12em] text-mist/60 md:block">
                  ◎ Hover any creature and TIDE identifies it
                </p>
                <p className="text-[11px] tracking-[0.12em] text-mist/60 md:hidden">◎ Tap any creature to identify it</p>
              </div>
            </SoftReveal>
          </div>
        </section>

        {/* 01 · The Crabber — Theodore's story */}
        <Chapter id="story" depth={60} number="01" title="The Crabber">
          <div className="grid items-start gap-12 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:gap-16">
            <div>
              <SoftReveal>
                <p className="font-mono text-[12px] tracking-[0.16em] text-mist/70 uppercase">Theodore&apos;s story</p>
              </SoftReveal>
              <MaskText
                className="mt-4 max-w-3xl text-[clamp(38px,5.5vw,72px)] leading-[1] font-semibold tracking-tight text-foam"
                segments={["I grew up on the water", { text: "in South Jersey.", className: "font-serif font-normal italic" }]}
              />
              <SoftReveal delay={0.1}>
                <div className="mt-8 max-w-xl space-y-5 text-[18px] leading-relaxed text-mist">
                  <p>
                    I&apos;ve been fishing with my grandparents and my friends my whole life. I&apos;d go out for bass
                    sometimes, but mostly we crabbed — lines and pots off the marsh, from the first warm mornings until
                    we were pulling traps by moonlight.
                  </p>
                  <p>
                    Every crabber knows the moment. You pull one up and hold it against the gauge.{" "}
                    <span className="text-foam">Is it four and a half inches? Is that a sponge under her? Is this one
                    even legal here?</span> Guess wrong and you&apos;ve either broken the law, or taken a crab that should
                    have gone back to make more crabs.
                  </p>
                  <p>
                    TIDE is the tool I wish I&apos;d had. My phone becomes the crab gauge, so I don&apos;t have to buy
                    one. It knows the rules for the water I&apos;m standing in. And when I&apos;m fishing salt water and
                    hook something endangered, it tells me to let it go — before it&apos;s too late.{" "}
                    <span className="text-foam">I care about this water. I want my grandkids crabbing it too.</span>
                  </p>
                </div>
              </SoftReveal>
            </div>
            <div className="mx-auto w-full max-w-[420px]">
              <LivePhoto
                still="/dive/story/night-crabbing.webp"
                video="/dive/story/night-crabbing.mp4"
                alt="Theodore and a friend holding up a blue crab at night"
                caption="Night crabbing in South Jersey — the one that made it into the bushel"
              />
            </div>
          </div>

          {fieldPhotos.length > 0 && (
            <div className="mt-14 grid grid-cols-2 gap-5 md:grid-cols-3">
              {fieldPhotos.map((photo, index) => (
                <FieldPhoto key={photo.file} src={`/dive/story/${photo.file}`} caption={photo.caption} index={index} />
              ))}
            </div>
          )}

          <SoftReveal delay={0.1}>
            <figure className="glass mt-16 max-w-3xl rounded-[28px] p-7 md:p-9">
              <p className="font-mono text-[11px] tracking-[0.16em] text-status-watch uppercase">
                The fish that started it
              </p>
              <blockquote className="mt-4 font-serif text-[clamp(24px,3vw,34px)] leading-[1.2] text-foam italic">
                “When I was a kid I brought home a pet fish, put him in the wrong kind of water, and he was gone in about
                an hour. I cried.”
              </blockquote>
              <figcaption className="mt-5 text-[16px] leading-relaxed text-mist">
                It&apos;s a funny story now. But it taught me that the right answer depends on details you can&apos;t
                see just by looking at an animal — what water it needs, how big it has to be, whether it&apos;s carrying
                eggs, whether it&apos;s protected. That&apos;s what TIDE sees for you.
              </figcaption>
            </figure>
          </SoftReveal>
        </Chapter>

        {/* 02 · The Question */}
        <Chapter id="question" depth={150} number="02" title="The Question" className="min-h-[80vh]">
          <SoftReveal>
            <MaskText className="max-w-4xl text-[clamp(44px,7vw,96px)] leading-[0.95] font-semibold tracking-tight text-foam" segments={["Keep it or", { text: "let it go?", className: "font-serif font-normal italic" }]} />
          </SoftReveal>
          <SoftReveal delay={0.1}>
            <p className="mt-10 max-w-2xl text-[20px] leading-relaxed text-mist">
              Anglers and crabbers make that call dozens of times a trip. In 2023, US saltwater anglers caught about{" "}
              <span className="text-foam">1.1 billion fish and released 65% of them</span> — every one of those was a
              decision, made on a dock, usually from memory.
            </p>
          </SoftReveal>
          <SoftReveal delay={0.2}>
            <p className="mt-6 max-w-2xl text-[20px] leading-relaxed text-foam">
              Off the water it&apos;s the same question in a different shape: a box turtle on the road, a salamander on
              a rainy night. <em className="font-serif text-[1.15em]">Help it, take it, or leave it?</em>
            </p>
          </SoftReveal>
          <p className="mt-4 text-[12px] text-mist/60">Catch figures: NOAA Fisheries, Fisheries of the United States.</p>
        </Chapter>

        {/* 03 · The Catch */}
        <Chapter id="split" depth={450} number="03" title="The Catch">
          <SoftReveal>
            <MaskText className="max-w-3xl text-[clamp(38px,5.5vw,72px)] leading-[1] font-semibold tracking-tight text-foam" segments={["Three catches.", { text: "Three different answers.", className: "font-serif font-normal italic" }]} />
            <p className="mt-6 mb-10 max-w-xl text-[18px] leading-relaxed text-mist">
              Real 2026 rules, cited and dated, judged by the same engine the app uses. Guess first — then ask TIDE.
            </p>
          </SoftReveal>
          <CatchSplit scenarios={catches} />
        </Chapter>

        {/* 03 · The Scatter */}
        <Chapter id="scatter" depth={900} number="03" title="The Scatter">
          <SoftReveal>
            <MaskText className="max-w-3xl text-[clamp(38px,5.5vw,72px)] leading-[1] font-semibold tracking-tight text-foam" segments={["The rules exist.", { text: "They're just scattered.", className: "font-serif font-normal italic" }]} />
            <p className="mt-6 max-w-xl text-[18px] leading-relaxed text-mist">
              Size limits live with the state. Seasons change by the date. Protections are federal. Invasive species
              have their own orders. Nobody checks all four standing on a dock. Keep scrolling.
            </p>
          </SoftReveal>
          <SourceConverge />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                stat: <CountUp value={57.9} decimals={1} suffix="M" />,
                label: "Americans went fishing in 2024 — a record",
                source: "RBFF, 2025 Special Report on Fishing",
              },
              {
                stat: <CountUp value={65} suffix="%" />,
                label: "of saltwater fish caught by US anglers are released",
                source: "NOAA Fisheries, Fisheries of the United States (2023)",
              },
              {
                stat: "1 in 3",
                label: "assessed fish stocks worldwide are overfished",
                source: "FAO, State of World Fisheries and Aquaculture 2024",
              },
            ].map((item, index) => (
              <PlaneReveal key={item.label} index={index}>
                <div className="glass rounded-[24px] p-6">
                  <p className="font-mono text-[clamp(44px,5vw,64px)] leading-none font-semibold text-turquoise">
                    {item.stat}
                  </p>
                  <p className="mt-3 text-[16px] text-foam">{item.label}</p>
                  <p className="mt-2 text-[12px] text-mist/70">{item.source}</p>
                </div>
              </PlaneReveal>
            ))}
          </div>
        </Chapter>

        {/* 04 · The Lens */}
        <Chapter id="lens" depth={1600} number="04" title="The Lens">
          <SoftReveal>
            <MaskText className="max-w-3xl text-[clamp(38px,5.5vw,72px)] leading-[1] font-semibold tracking-tight text-foam" segments={["One photo.", { text: "The whole picture.", className: "font-serif font-normal italic" }]} />
            <p className="mt-6 max-w-xl text-[18px] leading-relaxed text-mist">
              You point and shoot. <span className="text-foam">Google Gemini</span> does the looking; TIDE does the
              checking — against your state&apos;s rules and live conservation data, never guesswork.
            </p>
          </SoftReveal>
          <PhoneStory steps={STORY_STEPS} />
        </Chapter>

        {/* The field guide: every species drifting past as a current you can grab */}
        <section aria-label="Species field guide" className="relative z-10 py-16 md:py-24">
          <div className="mx-auto mb-10 flex max-w-6xl flex-wrap items-end justify-between gap-4 px-5 md:px-10">
            <MaskText
              as="h2"
              className="max-w-2xl text-[clamp(32px,4.4vw,56px)] leading-[1] font-semibold tracking-tight text-foam"
              segments={[`${SPECIES.length} species`, { text: "in the field guide.", className: "font-serif font-normal italic" }]}
            />
            <SoftReveal>
              <p className="font-mono text-[12px] tracking-[0.14em] text-mist/70 uppercase">
                Drag the current · tap one for its verdict
              </p>
            </SoftReveal>
          </div>
          <SpeciesRiver species={explorer} />
        </section>

        {/* 06 · Found One? */}
        <Chapter id="found" depth={2400} number="06" title="Found One?">
          <SoftReveal>
            <MaskText className="max-w-3xl text-[clamp(38px,5.5vw,72px)] leading-[1] font-semibold tracking-tight text-foam" segments={["Found one?", { text: "Here's what to do.", className: "font-serif font-normal italic" }]} />
            <p className="mt-6 mb-12 max-w-2xl text-[18px] leading-relaxed text-mist">
              Turtles and amphibians are some of the most threatened animals on Earth, and the people who find them
              usually want to help. The most common way to help is also the most common mistake.
            </p>
          </SoftReveal>
          <FoundQuiz image={boxTurtle ? speciesImage(boxTurtle) : null} />
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              { value: "41%", label: "of amphibian species are threatened with extinction", source: "IUCN, Nature 2023" },
              { value: "54%", label: "of turtle and tortoise species are threatened", source: "IUCN Turtle Specialist Group, 2025" },
              {
                value: "2–3%",
                label: "extra adult deaths a year is more than most turtle populations can sustain",
                source: "Gibbs & Shriver, Conservation Biology 2002",
              },
            ].map((item, index) => (
              <PlaneReveal key={item.label} index={index}>
                <div className="glass h-full rounded-[24px] p-6">
                  <p className="font-mono text-[clamp(40px,4.6vw,58px)] leading-none font-semibold text-turquoise">{item.value}</p>
                  <p className="mt-3 text-[15px] text-foam">{item.label}</p>
                  <p className="mt-2 text-[12px] text-mist/70">{item.source}</p>
                </div>
              </PlaneReveal>
            ))}
          </div>
          <SoftReveal delay={0.1}>
            <ul className="mt-10 grid gap-4 text-[15px] leading-relaxed text-mist md:grid-cols-3">
              <li className="border-l-2 border-turquoise/40 pl-4">
                <span className="text-foam">Snapping turtle on the road?</span> Never lift it by the tail. Slide it onto
                a car mat and pull it across.
              </li>
              <li className="border-l-2 border-turquoise/40 pl-4">
                <span className="text-foam">Hellbender under a rock?</span> Leave the rock. It&apos;s closed to all taking
                in Pennsylvania.
              </li>
              <li className="border-l-2 border-turquoise/40 pl-4">
                <span className="text-foam">Terrapin in your crab pot?</span> Let it out now, and fit an excluder — New
                Jersey and Maryland require them.
              </li>
            </ul>
          </SoftReveal>
        </Chapter>

        {/* 07 · Plot twist */}
        <Chapter id="twist" depth={3000} number="07" title="Plot Twist">
          <SoftReveal>
            <p className="font-mono text-[13px] tracking-[0.2em] text-status-watch uppercase">Plot twist</p>
            <MaskText className="mt-4 max-w-4xl text-[clamp(40px,6.2vw,84px)] leading-[0.98] font-semibold tracking-tight text-foam" segments={["We'll help you", { text: "cook it, too.", className: "font-serif font-normal italic" }]} />
            <p className="mt-6 mb-12 max-w-2xl text-[18px] leading-relaxed text-mist">
              TIDE isn&apos;t against keeping fish — it&apos;s against keeping the wrong ones. When your catch is legal to
              keep and the species isn&apos;t endangered, TIDE hands you recipes. When it isn&apos;t, the recipes stay
              locked, automatically.
            </p>
          </SoftReveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {twist.map(({ species, recipe }, index) => (
              <PlaneReveal key={species.slug} index={index}>
                <article className="glass h-full overflow-hidden rounded-[26px]">
                  <div className="relative h-44 w-full">
                    <Image src={recipe.image} alt={recipe.title} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" />
                    <span className="absolute top-3 left-3 rounded-full bg-status-safe/90 px-2.5 py-1 text-[11px] font-semibold text-abyss">
                      Legal to keep
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="font-mono text-[11px] tracking-[0.14em] text-mist/70 uppercase">{species.commonName}</p>
                    <h3 className="mt-1 text-[18px] leading-snug font-semibold text-foam">{recipe.title}</h3>
                    <p className="mt-2 text-[13px] text-mist">
                      {recipe.time} · {recipe.difficulty}
                    </p>
                  </div>
                </article>
              </PlaneReveal>
            ))}
            {eel && (
              <PlaneReveal index={3}>
                <article className="flex h-full flex-col justify-between rounded-[26px] border border-dashed border-status-alert/40 bg-status-alert/[0.06] p-6">
                  <div>
                    <p className="font-mono text-[11px] tracking-[0.14em] text-status-alert uppercase">Recipes locked</p>
                    <h3 className="mt-2 text-[20px] font-semibold text-foam">{eel.commonName}</h3>
                    <p className="mt-3 text-[14px] leading-relaxed text-mist">
                      Legal to keep in New Jersey at 9 inches — but globally Endangered. TIDE shows the rule, holds back
                      the recipes, and suggests letting it go.
                    </p>
                  </div>
                  <p className="mt-6 font-mono text-[12px] text-mist/70">🔒 No recipes for endangered species</p>
                </article>
              </PlaneReveal>
            )}
          </div>
        </Chapter>

        {/* 08 · The Verdict */}
        <Chapter id="verdict" depth={3600} number="08" title="The Verdict">
          <SoftReveal>
            <MaskText className="max-w-3xl text-[clamp(38px,5.5vw,72px)] leading-[1] font-semibold tracking-tight text-foam" segments={["Try the rules", { text: "yourself.", className: "font-serif font-normal italic" }]} />
            <p className="mt-6 mb-12 max-w-2xl text-[18px] leading-relaxed text-mist">
              Pick any of the {SPECIES.length} species. This is the app&apos;s own logic: recipes appear only when a
              species passes every check, and disappear automatically if live data moves it to Endangered.
            </p>
          </SoftReveal>
          <VerdictExplorer species={explorer} />
        </Chapter>

        {/* 09 · The Evidence */}
        <Chapter id="evidence" depth={5000} number="09" title="The Evidence">
          <SoftReveal>
            <MaskText className="max-w-3xl text-[clamp(38px,5.5vw,72px)] leading-[1] font-semibold tracking-tight text-foam" segments={["Built on real data.", { text: "Never invented.", className: "font-serif font-normal italic" }]} />
            <p className="mt-6 mb-12 max-w-2xl text-[18px] leading-relaxed text-mist">
              TIDE never guesses a conservation status or a size limit. Every rule is cited and dated; where TIDE
              hasn&apos;t verified one, it says so and links the agency instead.
            </p>
          </SoftReveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { stat: <CountUp value={SPECIES.length} />, label: "species — fish, crabs, turtles, amphibians, sharks, rays, cephalopods, mammals" },
              {
                stat: (
                  <>
                    <CountUp value={verifiedCount} />/{SPECIES.length}
                  </>
                ),
                label: "conservation statuses verified live against the IUCN Red List via GBIF",
              },
              {
                stat: <CountUp value={occurrences / 1_000_000} decimals={1} suffix="M" />,
                label: "GBIF occurrence records behind those species",
              },
              { stat: <CountUp value={7} />, label: "outdated statuses caught by our automated drift check during development" },
            ].map((item, index) => (
              <PlaneReveal key={item.label} index={index}>
                <div className="glass h-full rounded-[24px] p-6">
                  <p className="font-mono text-[clamp(44px,5vw,64px)] leading-none font-semibold text-turquoise">
                    {item.stat}
                  </p>
                  <p className="mt-4 text-[14px] leading-relaxed text-mist">{item.label}</p>
                </div>
              </PlaneReveal>
            ))}
          </div>
          <SoftReveal delay={0.2}>
            <ul className="mt-10 flex flex-wrap gap-2">
              {[
                "Next.js",
                "TypeScript",
                "Tailwind CSS",
                "Framer Motion",
                "Google Gemini vision",
                "NJ · PA · MD fishing rules",
                "GBIF API",
                "IUCN Red List",
                "Wikimedia Commons",
                "Works offline in Demo Mode",
              ].map((item) => (
                <li key={item} className="rounded-full border border-foam/15 px-3.5 py-1.5 text-[13px] text-mist">
                  {item}
                </li>
              ))}
            </ul>
          </SoftReveal>
        </Chapter>

        {/* 10 · The Impact */}
        <Chapter id="impact" depth={7500} number="10" title="The Impact">
          <SoftReveal>
            <MaskText className="max-w-4xl text-[clamp(38px,5.5vw,72px)] leading-[1] font-semibold tracking-tight text-foam" segments={["What it could do", { text: "with real users.", className: "font-serif font-normal italic" }]} />
            <p className="mt-6 mb-12 max-w-2xl text-[18px] leading-relaxed text-mist">
              Most of the damage people do to wildlife on the water isn&apos;t malice — it&apos;s a wrong guess made in
              good faith. Here&apos;s the scale of the problem, from published sources, and a model of what TIDE could
              change with funding and users. The model is a projection; drag its assumptions.
            </p>
          </SoftReveal>
          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BASELINES.map((item, index) => (
              <PlaneReveal key={item.label} index={index % 3}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass block h-full rounded-[22px] p-5 transition-colors hover:border-turquoise/30"
                >
                  <p className="font-mono text-[clamp(30px,3.4vw,42px)] leading-none font-semibold text-foam">{item.value}</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-mist">{item.label}</p>
                  <p className="mt-2 text-[11px] text-mist/60">{item.source} ↗</p>
                </a>
              </PlaneReveal>
            ))}
          </div>
          <ImpactModel />
          <SoftReveal delay={0.1}>
            <div className="mt-12 grid gap-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <div>
                <p className="font-mono text-[12px] tracking-[0.16em] text-turquoise/80 uppercase">What funding unlocks</p>
                <p className="mt-3 text-[clamp(24px,2.6vw,32px)] leading-tight font-semibold tracking-tight text-foam">
                  From three states to every dock in the country.
                </p>
              </div>
              <ul className="grid gap-4 text-[15px] leading-relaxed text-mist sm:grid-cols-2">
                {[
                  ["All 50 states", "A regulations pipeline built with state agencies, instead of a hand-verified table."],
                  ["Offline on the water", "Rules and the crab gauge cached for marshes and boats with no signal."],
                  ["Season alerts", "A heads-up when a limit or season changes for the water you fish."],
                  ["Sightings for science", "Opt-in reports of sturgeon, rare turtles and snakeheads, routed to state biologists."],
                ].map(([title, body]) => (
                  <li key={title} className="border-l-2 border-turquoise/40 pl-4">
                    <span className="text-foam">{title}.</span> {body}
                  </li>
                ))}
              </ul>
            </div>
          </SoftReveal>
          {(IMPACT.length > 0 || TRACKS.length > 0) && (
            <div className="mt-14 grid gap-5 md:grid-cols-2">
              {IMPACT.map((item, index) => (
                <PlaneReveal key={item.label} index={index}>
                  <div className="glass h-full rounded-[24px] p-6">
                    {item.projected && (
                      <p className="mb-2 font-mono text-[10px] tracking-[0.16em] text-status-watch uppercase">Projected</p>
                    )}
                    <p className="font-mono text-[clamp(40px,4.5vw,56px)] leading-none font-semibold text-turquoise">{item.value}</p>
                    <p className="mt-4 text-[14px] leading-relaxed text-mist">{item.label}</p>
                  </div>
                </PlaneReveal>
              ))}
              {TRACKS.map((track, index) => (
                <PlaneReveal key={track.name} index={index}>
                  <div className="glass h-full rounded-[24px] p-6">
                    <p className="font-mono text-[10px] tracking-[0.16em] text-mist/70 uppercase">Built for</p>
                    <h3 className="mt-2 text-[20px] font-semibold text-foam">{track.name}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-mist">{track.fit}</p>
                  </div>
                </PlaneReveal>
              ))}
            </div>
          )}
        </Chapter>

        {/* 11 · The Deep */}
        <Chapter id="deep" depth={10935} number={chapter("deep").number} title="The Deep" className="min-h-[100dvh]">
          <div className="grid items-center gap-14 md:grid-cols-[1fr_auto]">
            <div>
              <SoftReveal>
                <p className="font-mono text-[13px] text-mist/70">10,935 m · Challenger Deep — the deepest point on Earth</p>
                <MaskText className="mt-4 max-w-2xl text-[clamp(38px,5.5vw,72px)] leading-[1] font-semibold tracking-tight text-foam" segments={["Down here,", { text: "you make the light.", className: "font-serif font-normal italic" }]} />
                <p className="mt-6 max-w-lg text-[18px] leading-relaxed text-mist">
                  {hasVideo
                    ? "Watch TIDE work end to end — or switch to the live app and try it yourself, right here."
                    : "This is the real app, running live inside the page. Tap an example, or use Demo to see a full identification."}
                </p>
              </SoftReveal>
              <SoftReveal delay={0.1}>
                <ol className="mt-10 space-y-4">
                  {[
                    ["Blue crab, 5″, no eggs, NJ", "keep it — and here's a crab cake recipe"],
                    ["Striped bass, 26″, NJ", "release it — under the 28″ slot"],
                    ["Box turtle on the road", "help it across, the way it was heading"],
                  ].map(([name, outcome], index) => (
                    <li key={name} className="flex gap-4">
                      <span className="font-mono text-[13px] text-turquoise">0{index + 1}</span>
                      <p className="text-[16px] text-foam">
                        {name} <span className="text-mist">→ {outcome}</span>
                      </p>
                    </li>
                  ))}
                </ol>
              </SoftReveal>
            </div>
            <SoftReveal delay={0.15} className="mx-auto">
              <DemoPhone videoSrc={hasVideo ? "/dive/demo.mp4" : null} />
            </SoftReveal>
          </div>
        </Chapter>

        {/* Resurface */}
        <section id="resurface" data-depth={0} className="relative z-10 overflow-hidden">
          <div className="mx-auto flex min-h-[90dvh] max-w-6xl flex-col justify-center px-5 py-28 md:px-10">
            <SoftReveal>
              <p className="font-mono text-[12px] tracking-[0.16em] text-turquoise/90 uppercase">0 m · Resurfaced</p>
              <MaskText className="mt-8 max-w-5xl font-serif text-[clamp(44px,7.5vw,104px)] leading-[0.98] text-balance text-foam italic" segments={["See it. Identify it. Understand it. Protect it."]} stagger={0.07} />
            </SoftReveal>
            <SoftReveal delay={0.1}>
              <div className="mt-12 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="rounded-full bg-[linear-gradient(145deg,#5fe3ef,#2ee6c5)] px-7 py-4 text-[16px] font-semibold text-abyss shadow-[0_10px_30px_-10px_rgba(46,230,197,0.8)] transition hover:brightness-105"
                >
                  Open TIDE
                </Link>
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-foam/25 px-7 py-4 text-[16px] font-semibold text-foam transition-colors hover:border-turquoise/60 hover:text-turquoise"
                >
                  Source on GitHub ↗
                </a>
              </div>
              {TEAM.length > 0 && (
                <div className="mt-14 border-t border-foam/10 pt-8">
                  <p className="font-mono text-[11px] tracking-[0.18em] text-turquoise/80 uppercase">The crew</p>
                  <ul className="mt-4 flex flex-wrap gap-x-10 gap-y-3">
                    {TEAM.map((name) => (
                      <li key={name} className="text-[clamp(24px,3vw,34px)] font-semibold tracking-tight text-foam">
                        {name}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-[14px] text-mist">
                    Built at OwlHacks 2026 · identification powered by Google Gemini
                  </p>
                </div>
              )}
            </SoftReveal>
          </div>

          <footer className="border-t border-foam/10">
            <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 text-[13px] md:grid-cols-2 md:px-10">
              <div>
                <p className="mb-4 font-mono text-[11px] tracking-[0.16em] text-mist/70 uppercase">Sources</p>
                <ul className="space-y-2">
                  {SOURCES.map((source) => (
                    <li key={source.url}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-mist hover:text-turquoise"
                      >
                        {source.label} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-4 font-mono text-[11px] tracking-[0.16em] text-mist/70 uppercase">Photography</p>
                <p className="leading-relaxed text-mist">
                  Night crabbing: Theodore, TIDE team. Reef: Richard Ling, CC BY-SA 3.0. Green sea turtle: Charles J. Sharp, CC BY-SA 4.0. Atlantic
                  bluefin tuna: public domain. Atlantic cod: Wilhelm Thomas Fiege, CC BY-SA 4.0. All via Wikimedia
                  Commons.{" "}
                  <Link href="/credits" className="text-turquoise hover:underline">
                    Every other photo credit →
                  </Link>
                </p>
                <p className="mt-6 text-mist/60">TIDE · OwlHacks 2026</p>
              </div>
            </div>
          </footer>
        </section>
      </main>
    </DepthProvider>
    </SmoothScrollProvider>
  );
}
