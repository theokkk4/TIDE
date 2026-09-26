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
  SpeciesSplit,
  VerdictExplorer,
  type SpeciesCardData,
} from "@/components/dive/interactives";
import { CreatureLayer } from "@/components/dive/creature-layer";
import { ClipReveal, MaskText, PlaneReveal, SoftReveal } from "@/components/dive/reveal";
import { SmoothScrollProvider } from "@/components/dive/smooth-scroll";
import { SpeciesRiver } from "@/components/dive/species-river";

export const metadata: Metadata = {
  title: "TIDE — A dive into what lives beneath the surface",
  description:
    "An interactive dive through the ocean: why 'not endangered' doesn't mean 'safe to eat', and how TIDE answers both questions from a single photo.",
};

const CATEGORY_LABELS: Record<string, string> = {
  turtle: "turtles",
  fish: "fish",
  shark: "sharks & rays",
  ray: "sharks & rays",
  crustacean: "crustaceans",
  cephalopod: "cephalopods",
  mammal: "mammals",
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

const SPLIT: { slug: string; context: string }[] = [
  {
    slug: "green-sea-turtle",
    context: "Protected under the US Endangered Species Act and CITES Appendix I.",
  },
  {
    slug: "atlantic-bluefin-tuna",
    context: "Moved from Endangered to Least Concern in 2021.",
  },
  {
    slug: "atlantic-cod",
    context: "Some stocks are certified sustainable while others remain overfished.",
  },
];

const STORY_STEPS = [
  {
    title: "Capture",
    body: "Point your phone at the animal, or upload a photo. It runs in any mobile browser — nothing to install.",
    image: "/dive/01-home.webp",
    alt: "TIDE home screen asking 'What did you find?'",
  },
  {
    title: "Identify",
    body: "Google Gemini vision names the species with a confidence score and look-alikes. Below 75%, TIDE says “We aren't completely sure.”",
    image: "/dive/02-analyzing.webp",
    alt: "TIDE scanning a photo of a green sea turtle",
  },
  {
    title: "Verify",
    body: "The name is checked live against GBIF and the IUCN Red List, with cited sources on every species.",
    image: "/dive/03-turtle-result.webp",
    alt: "Green sea turtle result showing Least Concern and 96% confidence",
  },
  {
    title: "Advise",
    body: "Status, threats and human impact — then an honest verdict on whether it belongs on your plate.",
    image: "/dive/04-turtle-verdict.webp",
    alt: "TIDE verdict card reading Do Not Consume",
  },
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
  const split = SPLIT.flatMap(({ slug, context }) => {
    const species = getSpecies(slug);
    return species ? [toCard(species, context)] : [];
  });
  const explorer = SPECIES.map((species) => toCard(species));
  // Creatures that are also TIDE species show their live-verified status, not a copy.
  const guide: CreatureGuide[] = CREATURE_GUIDE.map((entry) => {
    const species = entry.slug ? getSpecies(entry.slug) : undefined;
    return species ? { ...entry, iucn: resolveStatusCode(species) } : entry;
  });

  const verifiedCount = SPECIES.filter((s) => getVerified(s.slug)?.iucnCode).length;
  const occurrences = SPECIES.reduce((sum, s) => sum + (getVerified(s.slug)?.occurrenceCount ?? 0), 0);

  const hasVideo = existsSync(path.join(process.cwd(), "public", "dive", "demo.mp4"));
  const showImpact = TRACKS.length > 0 || IMPACT.length > 0;

  const chapters: ChapterMarker[] = [
    { id: "surface", number: "00", title: "Surface", depth: 0 },
    { id: "question", number: "01", title: "The Question", depth: 150 },
    { id: "split", number: "02", title: "The Split", depth: 450 },
    { id: "scatter", number: "03", title: "The Scatter", depth: 900 },
    { id: "lens", number: "04", title: "The Lens", depth: 1600 },
    { id: "verdict", number: "05", title: "The Verdict", depth: 3200 },
    { id: "evidence", number: "06", title: "The Evidence", depth: 5000 },
    ...(showImpact ? [{ id: "impact", number: "07", title: "The Impact", depth: 7500 }] : []),
    { id: "deep", number: showImpact ? "08" : "07", title: "The Deep", depth: 10935 },
    { id: "resurface", number: showImpact ? "09" : "08", title: "Resurface", depth: 0 },
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
              segments={[{ text: "See what's beneath you.", className: "font-serif italic" }]}
              delay={1.45}
              className="mt-6 text-[clamp(32px,4.4vw,56px)] leading-[1.05] text-foam"
            />
            <SoftReveal delay={1.7}>
              <p className="mt-6 max-w-md text-[18px] leading-relaxed text-mist">
                Photograph a marine animal. TIDE tells you what it is — and what it means for the ocean.
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

        {/* 01 · The Question */}
        <Chapter id="question" depth={150} number="01" title="The Question" className="min-h-[80vh]">
          <SoftReveal>
            <MaskText className="max-w-4xl text-[clamp(44px,7vw,96px)] leading-[0.95] font-semibold tracking-tight text-foam" segments={["What did you", { text: "find?", className: "font-serif font-normal italic" }]} />
          </SoftReveal>
          <SoftReveal delay={0.1}>
            <p className="mt-10 max-w-2xl text-[20px] leading-relaxed text-mist">
              A turtle gliding past the reef. A crab in the trap. A fish on ice at the market. Most of us can&apos;t
              name what we&apos;re looking at — let alone say whether it&apos;s thriving, protected, or on its way out.
            </p>
          </SoftReveal>
          <SoftReveal delay={0.2}>
            <p className="mt-6 max-w-2xl text-[20px] leading-relaxed text-foam">
              And the one question people actually ask — <em className="font-serif text-[1.15em]">can I eat this?</em> —
              has an answer more complicated than any label.
            </p>
          </SoftReveal>
        </Chapter>

        {/* 02 · The Split */}
        <Chapter id="split" depth={450} number="02" title="The Split">
          <SoftReveal>
            <MaskText className="max-w-3xl text-[clamp(38px,5.5vw,72px)] leading-[1] font-semibold tracking-tight text-foam" segments={["Three species.", { text: "Three different answers.", className: "font-serif font-normal italic" }]} />
            <p className="mt-6 mb-12 max-w-xl text-[18px] leading-relaxed text-mist">
              Two are rated Least Concern. One is Vulnerable. Guess which ones you can eat — then reveal what TIDE says.
            </p>
          </SoftReveal>
          <SpeciesSplit cards={split} />
        </Chapter>

        {/* 03 · The Scatter */}
        <Chapter id="scatter" depth={900} number="03" title="The Scatter">
          <SoftReveal>
            <MaskText className="max-w-3xl text-[clamp(38px,5.5vw,72px)] leading-[1] font-semibold tracking-tight text-foam" segments={["The answer exists.", { text: "It's just scattered.", className: "font-serif font-normal italic" }]} />
            <p className="mt-6 max-w-xl text-[18px] leading-relaxed text-mist">
              Four authorities each hold one piece. Nobody checks all four at the fish counter. Keep scrolling.
            </p>
          </SoftReveal>
          <SourceConverge />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                stat: "1 in 3",
                label: "assessed fish stocks are overfished",
                source: "FAO, State of World Fisheries and Aquaculture 2024",
              },
              {
                stat: <CountUp value={80} suffix="%+" />,
                label: "of the ocean remains unexplored",
                source: "NOAA Ocean Service",
              },
              {
                stat: <CountUp value={8} prefix="~" suffix="%" />,
                label: "of the ocean is protected",
                source: "Protected Planet",
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
              checking — against live conservation data, never guesswork.
            </p>
          </SoftReveal>
          <PhoneStory steps={STORY_STEPS} />
        </Chapter>

        {/* The field guide: all thirty species drifting past as a current you can grab */}
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

        {/* 05 · The Verdict */}
        <Chapter id="verdict" depth={3200} number="05" title="The Verdict">
          <SoftReveal>
            <MaskText className="max-w-3xl text-[clamp(38px,5.5vw,72px)] leading-[1] font-semibold tracking-tight text-foam" segments={["Try the rules", { text: "yourself.", className: "font-serif font-normal italic" }]} />
            <p className="mt-6 mb-12 max-w-2xl text-[18px] leading-relaxed text-mist">
              Pick any of the {SPECIES.length} species. This is the app&apos;s own decision logic: recipes appear only
              when a species passes every check, and disappear automatically if live data moves it to Endangered.
            </p>
          </SoftReveal>
          <VerdictExplorer species={explorer} />
        </Chapter>

        {/* 06 · The Evidence */}
        <Chapter id="evidence" depth={5000} number="06" title="The Evidence">
          <SoftReveal>
            <MaskText className="max-w-3xl text-[clamp(38px,5.5vw,72px)] leading-[1] font-semibold tracking-tight text-foam" segments={["Built on real data.", { text: "Never invented.", className: "font-serif font-normal italic" }]} />
            <p className="mt-6 mb-12 max-w-2xl text-[18px] leading-relaxed text-mist">
              TIDE never guesses a conservation status. Where no assessment exists, it says so.
            </p>
          </SoftReveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { stat: <CountUp value={SPECIES.length} />, label: "species — turtles, fish, sharks, rays, crustaceans, cephalopods, mammals" },
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
              { stat: <CountUp value={5} />, label: "outdated statuses caught by our automated drift check during development" },
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

        {/* 07 · The Impact (only once the team has supplied tracks or numbers) */}
        {showImpact && (
          <Chapter id="impact" depth={7500} number="07" title="The Impact">
            <SoftReveal>
              <MaskText className="max-w-3xl text-[clamp(38px,5.5vw,72px)] leading-[1] font-semibold tracking-tight text-foam" segments={["Why it", { text: "matters.", className: "font-serif font-normal italic" }]} />
            </SoftReveal>
            {IMPACT.length > 0 && (
              <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {IMPACT.map((item, index) => (
                  <PlaneReveal key={item.label} index={index}>
                    <div className="glass h-full rounded-[24px] p-6">
                      {item.projected && (
                        <p className="mb-2 font-mono text-[10px] tracking-[0.16em] text-status-watch uppercase">
                          Projected
                        </p>
                      )}
                      <p className="font-mono text-[clamp(40px,4.5vw,56px)] leading-none font-semibold text-turquoise">
                        {item.value}
                      </p>
                      <p className="mt-4 text-[14px] leading-relaxed text-mist">{item.label}</p>
                    </div>
                  </PlaneReveal>
                ))}
              </div>
            )}
            {TRACKS.length > 0 && (
              <div className="mt-14">
                <p className="mb-5 font-mono text-[12px] tracking-[0.16em] text-mist/70 uppercase">Built for</p>
                <div className="grid gap-5 md:grid-cols-2">
                  {TRACKS.map((track, index) => (
                    <PlaneReveal key={track.name} index={index}>
                      <div className="glass h-full rounded-[24px] p-6">
                        <h3 className="text-[20px] font-semibold text-foam">{track.name}</h3>
                        <p className="mt-2 text-[15px] leading-relaxed text-mist">{track.fit}</p>
                      </div>
                    </PlaneReveal>
                  ))}
                </div>
              </div>
            )}
          </Chapter>
        )}

        {/* 08 · The Deep */}
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
                    ["Green sea turtle", "Least Concern — still Do Not Consume"],
                    ["Atlantic cod", "Vulnerable — recipes, with sourcing advice"],
                    ["Bluefin tuna", "Not endangered — still avoid"],
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
                  Reef: Richard Ling, CC BY-SA 3.0. Green sea turtle: Charles J. Sharp, CC BY-SA 4.0. Atlantic
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
