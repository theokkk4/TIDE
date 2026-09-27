import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { SPECIES } from "@/lib/data/species";
import { getVerified, resolveStatusCode, speciesImage } from "@/lib/conservation";
import { getSeafoodVerdict } from "@/lib/seafood";
import {
  ISSAKA,
  OLIVER,
  PROJECTED_TARGETS,
  REPO_URL,
  ROADMAP,
  SOURCES,
  TEAM,
  THEODORE,
  WORLD_STATS,
} from "@/lib/dive/content";
import { BASELINES } from "@/lib/dive/impact";
import { FRAME } from "@/lib/dive/presentation";
import { CREATURE_GUIDE } from "@/lib/dive/creatures";
import type { Species } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  AbyssBackground,
  Chapter,
  ChapterLabel,
  DepthHud,
  DepthProvider,
  Frame,
  type ChapterMarker,
} from "@/components/dive/depth";
import { VerdictExplorer, type SpeciesCardData } from "@/components/dive/interactives";
import { CreatureLayer } from "@/components/dive/creature-layer";
import { ClipReveal, MaskText, PlaneReveal, SoftReveal } from "@/components/dive/reveal";
import { SmoothScrollProvider } from "@/components/dive/smooth-scroll";
import { SpeciesRiver } from "@/components/dive/species-river";
import { PresentationKeys } from "@/components/dive/presentation-keys";
import { SlideFit } from "@/components/dive/slide-fit";
import { StoryPerson, TheodoreStory } from "@/components/dive/team";
import { Pipeline } from "@/components/dive/pipeline";
import { AppClips, ClipQueue } from "@/components/dive/app-clips";
import { IdentifyCrabButton, LiveDemoProvider, LivePhone } from "@/components/dive/live-demo";
import { Casebook } from "@/components/dive/casebook";

export const metadata: Metadata = {
  title: "TIDE — Keep it or let it go?",
  description:
    "An OwlHacks 2026 project by Theodore, Issaka and Oliver. Snap your catch, or the turtle on the trail: TIDE identifies it with Google Gemini, checks your state's rules, and tells you whether to keep it, release it or leave it be.",
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

const WHY = [
  ["Food", "Fish, crabs and clams feed families all over the world — ours included."],
  ["Fishing", "For a lot of people it's how the weekend goes: a line off the pier, a trap off the dock."],
  ["Conservation", "Keep an undersized fish or a crab carrying eggs, and there are fewer of them next season."],
  ["Families", "A lot of us learned from a parent or a grandparent, on the same water they fished."],
  ["Future generations", "What we take today decides what our kids and grandkids get to see."],
];

const APP_FEATURES = [
  ["Check my catch", "Keep or release, from your state's size, season and egg rules."],
  ["Found one", "Turtles and amphibians: leave it, help it across the road, or call it in."],
  ["Crab gauge", "Calibrate once with a bank card and your phone shows the legal line."],
  ["Demo Mode", "Six real scenarios that still work with no signal."],
];

const LIVE_STEPS = [
  "Gemini reads the photo and names the animal, with a confidence score and look-alikes.",
  "TIDE matches it to its field guide and checks the name against GBIF and the IUCN Red List.",
  "Pick your state. TIDE applies the size, egg and season rules and makes the call — with a recipe only if it's a keeper.",
];

const TEAM_ORDER = [OLIVER.name, THEODORE.name, ISSAKA.name];

const story = (file: string) => existsSync(path.join(process.cwd(), "public", "dive", "story", file));

export default function DivePage() {
  const explorer = SPECIES.map((species) => toCard(species));

  const verifiedCount = SPECIES.filter((s) => getVerified(s.slug)?.iucnCode).length;
  const occurrences = SPECIES.reduce((sum, s) => sum + (getVerified(s.slug)?.occurrenceCount ?? 0), 0);
  const fieldPhotos = story("crab.jpg") ? [{ src: "/dive/story/crab.jpg", caption: "Blue crab, off the back-bay marsh" }] : [];
  const hasVideo = existsSync(path.join(process.cwd(), "public", "dive", "demo.mp4"));

  const chapters: ChapterMarker[] = [
    { id: "surface", number: "01", title: "TIDE", depth: 0 },
    { id: "problem", number: "02", title: "The problem", depth: 40 },
    { id: "why", number: "03", title: "Why it matters", depth: 150 },
    { id: "crew", number: "04", title: "The people", depth: 400 },
    { id: "idea", number: "05", title: "The idea", depth: 900 },
    { id: "product", number: "06", title: "The app", depth: 1600 },
    { id: "live", number: "07", title: "Live identification", depth: 2400 },
    { id: "seafood", number: "08", title: "Conservation vs. seafood", depth: 4000 },
    { id: "outcomes", number: "09", title: "Projected outcomes", depth: 10935 },
    { id: "resurface", number: "10", title: "Resurface", depth: 0 },
  ];
  const chapter = (id: string) => chapters.find((c) => c.id === id)!;

  return (
    <SmoothScrollProvider>
      <DepthProvider>
        <PresentationKeys />
        <SlideFit />
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
        <CreatureLayer guide={CREATURE_GUIDE} />
        <DepthHud chapters={chapters} />

        <main className="relative">
          {/* 01 · Surface */}
          <section
            id="surface"
            data-depth={0}
            data-slide=""
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
                <p className="mt-6 text-[16px] text-mist">Theodore, Issaka &amp; Oliver</p>
              </SoftReveal>
              <SoftReveal delay={1.9}>
                <div className="mt-16 flex flex-col gap-3 font-mono text-[12px] tracking-[0.16em] text-mist/80 uppercase">
                  <p className="flex items-center gap-3">
                    <span className="inline-block h-10 w-px animate-pulse bg-turquoise/70" />
                    Scroll to dive<span className="hidden md:inline"> · or press →</span>
                  </p>
                  <p className="text-[11px] tracking-[0.12em] text-mist/60">
                    ◎ <span className="hidden md:inline">Click</span>
                    <span className="md:hidden">Tap</span> any creature to find it in the field guide
                  </p>
                </div>
              </SoftReveal>
            </div>
          </section>

          {/* 02 · The problem */}
          <Chapter id="problem" depth={40} number="02" title="The problem">
            <MaskText
              className="max-w-4xl text-[clamp(34px,4.2vw,56px)] leading-[1.04] font-semibold tracking-tight text-foam"
              segments={[
                "Billions of people eat from the water.",
                { text: "Over a third of fish stocks are overfished.", className: "font-serif font-normal italic" },
              ]}
            />
            <div className="mt-10 grid gap-x-12 gap-y-8 sm:grid-cols-2">
              {WORLD_STATS.map((stat, index) => (
                <PlaneReveal key={stat.value} index={index}>
                  <div className="border-t border-foam/15 pt-5">
                    <p className="text-[clamp(50px,5.4vw,80px)] leading-none font-semibold tracking-tight text-turquoise">
                      {stat.value}
                    </p>
                    <p className="mt-3 max-w-md text-[17px] leading-snug text-foam/90">{stat.label}</p>
                    <a
                      href={stat.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-[12px] text-mist/60 transition-colors hover:text-turquoise"
                    >
                      {stat.source} ↗
                    </a>
                  </div>
                </PlaneReveal>
              ))}
            </div>
            <SoftReveal delay={0.1}>
              <p className="mt-10 max-w-2xl text-[19px] leading-relaxed text-mist">
                And out on the dock, whether a fish or a crab is okay to keep usually comes down to memory and a guess.{" "}
                <span className="text-foam">That&apos;s the moment TIDE is for.</span>
              </p>
            </SoftReveal>
          </Chapter>

          {/* 03 · Why it matters */}
          <Chapter id="why" depth={150} number="03" title="Why it matters">
            <MaskText
              className="max-w-3xl text-[clamp(38px,5.5vw,72px)] leading-[1] font-semibold tracking-tight text-foam"
              segments={["It's more than", { text: "what's for dinner.", className: "font-serif font-normal italic" }]}
            />
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {WHY.map(([title, body], index) => (
                <PlaneReveal key={title} index={index} className="h-full">
                  <div className="glass h-full rounded-[24px] p-6">
                    <p className="font-mono text-[11px] tracking-[0.16em] text-turquoise/80 uppercase">{title}</p>
                    <p className="mt-3 text-[16px] leading-relaxed text-foam/90">{body}</p>
                  </div>
                </PlaneReveal>
              ))}
            </div>
          </Chapter>

          {/* 04 · The people */}
          <Chapter id="crew" depth={400} split>
            <Frame>
              <ChapterLabel {...chapter("crew")} />
              <MaskText
                className="max-w-3xl text-[clamp(38px,5.5vw,72px)] leading-[1] font-semibold tracking-tight text-foam"
                segments={["Meet the people", { text: "behind TIDE.", className: "font-serif font-normal italic" }]}
              />
              <SoftReveal delay={0.1}>
                <p className="mt-6 max-w-xl text-[19px] leading-relaxed text-mist">
                  The ocean was part of our lives long before this hackathon.
                </p>
                <p className="mt-10 font-mono text-[13px] tracking-[0.16em] text-turquoise/80 uppercase">
                  {TEAM_ORDER.join(" · ")}
                </p>
              </SoftReveal>
            </Frame>
            <StoryPerson story={OLIVER} tilt={-2.5} />
            <TheodoreStory story={THEODORE} fieldPhotos={fieldPhotos} />
            <StoryPerson story={ISSAKA} tilt={-1.5} />
          </Chapter>

          {/* 05 · The idea */}
          <Chapter id="idea" depth={900} split>
            <Frame>
              <ChapterLabel {...chapter("idea")} />
              <MaskText
                className="max-w-4xl text-[clamp(36px,5vw,64px)] leading-[1.02] font-semibold tracking-tight text-foam"
                segments={["Take a photo.", { text: "TIDE tells you what it is and what to do.", className: "font-serif font-normal italic" }]}
              />
              <div className="mt-16">
                <Pipeline />
              </div>
              <SoftReveal delay={0.1}>
                <ul className="mt-16 flex flex-wrap gap-2">
                  {[
                    `${SPECIES.length} species — fish, crabs, turtles, amphibians and more`,
                    `${verifiedCount}/${SPECIES.length} Red List statuses verified live`,
                    `${(occurrences / 1_000_000).toFixed(1)}M GBIF occurrence records`,
                    "NJ · PA · MD rules, each cited and dated",
                    "Works offline in Demo Mode",
                  ].map((item) => (
                    <li key={item} className="rounded-full border border-foam/15 px-3.5 py-1.5 text-[13px] text-mist">
                      {item}
                    </li>
                  ))}
                </ul>
              </SoftReveal>
            </Frame>

            {/* Three real scans, recorded in the app. */}
            <Frame sub>
              <div className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
                <MaskText
                  as="h3"
                  className="text-[clamp(30px,3.6vw,46px)] leading-[1.05] font-semibold tracking-tight text-foam"
                  segments={["Three scans,", { text: "start to finish.", className: "font-serif font-normal italic" }]}
                />
                <SoftReveal delay={0.1}>
                  <p className="max-w-sm text-[15px] leading-relaxed text-mist">
                    Recorded in TIDE: a photo goes in, the verdict comes out.
                  </p>
                </SoftReveal>
              </div>
              <AppClips />
            </Frame>
          </Chapter>

          {/* 06 · The app and 07 · Live identification share one live phone. */}
          <LiveDemoProvider videoSrc={hasVideo ? "/dive/demo.mp4" : null}>
            <div className="relative z-10 mx-auto grid w-full max-w-6xl px-5 md:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] md:gap-x-14 md:px-10">
              <section
                id="product"
                data-depth={1600}
                data-slide=""
                className={cn(FRAME, "md:col-start-1 md:row-start-1")}
              >
                <div data-fit className="w-full">
                  <ChapterLabel {...chapter("product")} />
                  <MaskText
                    className="max-w-2xl text-[clamp(38px,5vw,64px)] leading-[1.02] font-semibold tracking-tight text-foam"
                    segments={["This is TIDE.", { text: "The real app, running live.", className: "font-serif font-normal italic" }]}
                  />
                  <SoftReveal delay={0.1}>
                    <p className="mt-6 max-w-lg text-[18px] leading-relaxed text-mist">
                      It runs in any phone&apos;s browser — nothing to install.{" "}
                      <span className="hidden md:inline">The phone beside this is the real thing, not a recording. Tap around.</span>
                    </p>
                  </SoftReveal>
                  <SoftReveal delay={0.15}>
                    <ul className="mt-10 grid max-w-xl gap-x-8 gap-y-5 sm:grid-cols-2">
                      {APP_FEATURES.map(([title, body]) => (
                        <li key={title} className="border-l-2 border-turquoise/40 pl-4">
                          <p className="text-[16px] font-semibold text-foam">{title}</p>
                          <p className="mt-1 text-[14px] leading-relaxed text-mist">{body}</p>
                        </li>
                      ))}
                    </ul>
                  </SoftReveal>
                  <SoftReveal delay={0.2}>
                    <Link
                      href="/"
                      target="_blank"
                      className="mt-10 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(145deg,#5fe3ef,#2ee6c5)] px-6 py-3.5 text-[16px] font-semibold text-abyss shadow-[0_10px_30px_-10px_rgba(46,230,197,0.8)] transition hover:brightness-105"
                    >
                      Open TIDE
                      <ArrowUpRight className="h-4 w-4" strokeWidth={2.4} aria-hidden />
                    </Link>
                  </SoftReveal>
                </div>
              </section>

              <section
                id="live"
                data-depth={2400}
                data-slide=""
                className={cn(FRAME, "md:col-start-1 md:row-start-2")}
              >
                <div data-fit className="w-full">
                  <ChapterLabel {...chapter("live")} />
                  <MaskText
                    className="max-w-2xl text-[clamp(38px,5vw,64px)] leading-[1.02] font-semibold tracking-tight text-foam"
                    segments={["Remember the crab?", { text: "Let's ask TIDE.", className: "font-serif font-normal italic" }]}
                  />
                  <div className="mt-10 grid items-center gap-8 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
                    <PlaneReveal>
                      <figure className="mx-auto w-full max-w-[240px] -rotate-2">
                        <div className="relative aspect-[3/4] overflow-hidden rounded-[22px] border border-foam/15 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
                          <Image
                            src="/dive/story/crab.jpg"
                            alt="A blue crab held up in an orange crabbing glove on a South Jersey marsh"
                            fill
                            sizes="240px"
                            className="object-cover"
                          />
                        </div>
                        <figcaption className="mt-3 font-mono text-[11px] text-mist/70">Theodore&apos;s photo, back-bay marsh</figcaption>
                      </figure>
                    </PlaneReveal>
                    <SoftReveal delay={0.1}>
                      <ol className="space-y-4">
                        {LIVE_STEPS.map((step, index) => (
                          <li key={step} className="flex gap-4">
                            <span className="font-mono text-[13px] text-turquoise">0{index + 1}</span>
                            <p className="text-[16px] leading-relaxed text-foam/90">{step}</p>
                          </li>
                        ))}
                      </ol>
                      <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                        <IdentifyCrabButton />
                        <Link
                          href="/identify?sample=crab"
                          target="_blank"
                          className="text-[14px] text-mist underline-offset-4 hover:text-foam hover:underline"
                        >
                          Open it full screen ↗
                        </Link>
                      </div>
                      <p className="mt-4 max-w-md text-[12px] leading-relaxed text-mist/60">
                        If Gemini can&apos;t be reached, TIDE offers the result it gave for this photo earlier, labelled as a demo
                        scan.
                      </p>
                    </SoftReveal>
                  </div>
                </div>
              </section>

              <div className="pb-24 md:col-start-2 md:row-span-2 md:row-start-1 md:pb-0">
                <div className="md:sticky md:top-[76px]">
                  <LivePhone />
                </div>
              </div>
            </div>
          </LiveDemoProvider>

          {/* The field guide: every species drifting past as a current you can grab */}
          <section id="field-guide" aria-label="Species field guide" data-slide="" className={cn("relative z-10", FRAME)}>
            <div data-fit className="w-full">
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
            </div>
          </section>

          {/* 08 · Conservation vs. seafood */}
          <Chapter id="seafood" depth={4000} split>
            <Frame>
              <ChapterLabel {...chapter("seafood")} />
              <MaskText
                className="max-w-4xl text-[clamp(36px,5vw,64px)] leading-[1.02] font-semibold tracking-tight text-foam"
                segments={["“Not endangered” doesn’t mean", { text: "“sustainable.”", className: "font-serif font-normal italic" }]}
              />
              <SoftReveal delay={0.1}>
                <p className="mt-6 mb-12 max-w-2xl text-[18px] leading-relaxed text-mist">
                  A species can be doing fine worldwide and still be overfished off your coast, protected by law, or carrying
                  next year&apos;s crabs. So TIDE checks more than the Red List — and only offers a recipe when every check
                  passes.
                </p>
              </SoftReveal>
              <Casebook />
            </Frame>

            <Frame sub>
              <SoftReveal>
                <h3 className="text-[clamp(26px,3vw,38px)] font-semibold tracking-tight text-foam">
                  Try any of the {SPECIES.length}.
                </h3>
                <p className="mt-3 mb-10 max-w-2xl text-[16px] leading-relaxed text-mist">
                  Same logic as the app: recipes appear only when a species passes every check, and disappear on their own
                  if live data moves it to Endangered.
                </p>
              </SoftReveal>
              <VerdictExplorer species={explorer} />
            </Frame>
          </Chapter>

          {/* 09 · Projected outcomes */}
          <Chapter id="outcomes" depth={10935} split>
            <Frame>
              <ChapterLabel {...chapter("outcomes")} />
              <p className="-mt-3 mb-3 font-mono text-[12px] text-mist/60">10,935 m · Challenger Deep, the deepest point in the ocean</p>
              <MaskText
                className="max-w-5xl text-[clamp(36px,4.4vw,60px)] leading-[1] font-semibold tracking-tight text-foam"
                segments={["What we're aiming for", { text: "in year one.", className: "font-serif font-normal italic" }]}
              />
              <SoftReveal delay={0.1}>
                <p className="mt-5 max-w-2xl text-[18px] leading-relaxed text-mist">
                  On one side, published numbers about the people and animals TIDE is for. On the other, our targets for
                  TIDE&apos;s first twelve months — projections, not results.
                </p>
              </SoftReveal>

              <div className="mt-10 grid gap-8 lg:grid-cols-2">
                <SoftReveal>
                  <div className="h-full rounded-[28px] border border-foam/10 p-6 md:p-8">
                    <p className="font-mono text-[12px] tracking-[0.16em] text-mist/80 uppercase">Real-world data · published</p>
                    <ul className="mt-2 grid gap-x-6 sm:grid-cols-2">
                      {BASELINES.map((item) => (
                        <li key={item.label} className="border-t border-foam/10 py-4 first:border-t-0 sm:[&:nth-child(2)]:border-t-0">
                          <p className="font-mono text-[30px] leading-none font-semibold text-foam">{item.value}</p>
                          <div className="mt-2">
                            <p className="text-[15px] leading-snug text-foam/90">{item.label}</p>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-block text-[11px] text-mist/60 hover:text-turquoise"
                            >
                              {item.source} ↗
                            </a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </SoftReveal>

                <SoftReveal delay={0.1}>
                  <div className="h-full rounded-[28px] border border-status-watch/30 bg-status-watch/[0.04] p-6 md:p-8">
                    <p className="font-mono text-[12px] tracking-[0.16em] text-status-watch uppercase">
                      TIDE · projected 12-month targets
                    </p>
                    <ul className="mt-2 grid gap-x-6 sm:grid-cols-2">
                      {PROJECTED_TARGETS.map((target, index) => (
                        <li key={target.value} className="border-t border-foam/10 py-4 first:border-t-0 sm:[&:nth-child(2)]:border-t-0">
                          <p className="flex items-center gap-3">
                            <span className="font-mono text-[30px] leading-none font-semibold text-turquoise">{target.value}</span>
                            <span className="rounded-full border border-status-watch/40 px-2 py-0.5 font-mono text-[9px] tracking-[0.12em] text-status-watch uppercase">
                              Projected
                            </span>
                          </p>
                          <p className="mt-2 text-[15px] leading-snug text-foam/90">
                            {target.label}
                            <sup className="ml-0.5 text-[10px] text-mist/70">{index + 1}</sup>
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </SoftReveal>
              </div>

            </Frame>

            {/* Room at the bottom for the sea pigs grazing on the floor of the trench. */}
            <Frame sub className="pb-44 md:pb-36">
              <MaskText
                as="h3"
                className="max-w-3xl text-[clamp(30px,3.6vw,46px)] leading-[1.05] font-semibold tracking-tight text-foam"
                segments={["How we'd know", { text: "it's working.", className: "font-serif font-normal italic" }]}
              />
              <SoftReveal delay={0.1}>
                <div className="mt-10 grid gap-12 lg:grid-cols-2">
                  <div>
                    <p className="font-mono text-[12px] tracking-[0.16em] text-mist/70 uppercase">How we&apos;d measure the targets</p>
                    <ol className="mt-4 space-y-3 text-[15px] leading-relaxed text-mist">
                      {PROJECTED_TARGETS.map((target, index) => (
                        <li key={target.value}>
                          <sup className="mr-1 text-mist">{index + 1}</sup>
                          {target.measure}
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <p className="font-mono text-[12px] tracking-[0.16em] text-turquoise/80 uppercase">What funding would change</p>
                    <ul className="mt-4 grid gap-4 text-[15px] leading-relaxed text-mist sm:grid-cols-2">
                      {ROADMAP.map(([title, body]) => (
                        <li key={title} className="border-l-2 border-turquoise/40 pl-3">
                          <span className="text-foam">{title}.</span> {body}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </SoftReveal>
            </Frame>
          </Chapter>

          {/* 10 · Resurface */}
          <section id="resurface" data-depth={0} data-slide="" className="relative z-10 overflow-hidden">
            <Frame>
              <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 md:grid-cols-[minmax(0,1fr)_minmax(0,300px)] md:px-10">
                <div>
                  <SoftReveal>
                    <p className="font-mono text-[12px] tracking-[0.16em] text-turquoise/90 uppercase">10 · 0 m · Resurfaced</p>
                  </SoftReveal>
                  <MaskText
                    className="mt-8 max-w-4xl font-serif text-[clamp(36px,5.2vw,72px)] leading-[1.04] text-balance text-foam italic"
                    segments={["We don't want future generations to lose the marine life we get to see today."]}
                    stagger={0.05}
                  />
                  <SoftReveal delay={0.2}>
                    <p className="mt-14 text-[clamp(28px,3vw,40px)] leading-none font-semibold tracking-[0.36em] text-foam">TIDE</p>
                    <p className="mt-4 text-[clamp(18px,2vw,26px)] text-mist">See it. Identify it. Understand it. Protect it.</p>
                  </SoftReveal>
                  <SoftReveal delay={0.3}>
                    <div className="mt-10 flex flex-wrap gap-3">
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
                    <p className="mt-10 text-[15px] text-mist">
                      {TEAM.join(", ").replace(/, ([^,]*)$/, " and $1")} · OwlHacks 2026 · identification by Google Gemini
                    </p>
                  </SoftReveal>
                </div>
                {story("moon.jpg") && (
                  <PlaneReveal>
                    <figure className="mx-auto w-full max-w-[300px] rotate-2">
                      <div className="relative aspect-[3/4] overflow-hidden rounded-[24px] border border-foam/15 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)]">
                        <Image src="/dive/story/moon.jpg" alt="The moon rising over calm water in South Jersey" fill sizes="300px" className="object-cover" />
                      </div>
                      <figcaption className="mt-3 font-mono text-[11px] text-mist/70">Moonrise over the bay, South Jersey</figcaption>
                    </figure>
                  </PlaneReveal>
                )}
              </div>
            </Frame>

            {/* The last slide: where every number came from. */}
            <Frame sub>
              <footer className="mx-auto max-w-6xl px-5 md:px-10">
                <h2 className="text-[clamp(30px,3.6vw,46px)] leading-[1.05] font-semibold tracking-tight text-foam">
                  Sources <span className="font-serif font-normal italic">and credits.</span>
                </h2>
                <div className="mt-10 grid gap-12 text-[15px] md:grid-cols-2">
                  <div>
                    <p className="mb-4 font-mono text-[11px] tracking-[0.16em] text-mist/70 uppercase">Sources</p>
                    <ul className="space-y-3">
                      {SOURCES.map((source) => (
                        <li key={source.url}>
                          <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-mist hover:text-turquoise">
                            {source.label} ↗
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-4 font-mono text-[11px] tracking-[0.16em] text-mist/70 uppercase">Photography</p>
                    <p className="leading-relaxed text-mist">
                      Night crabbing, the blue crab and the moonrise: Theodore. The team&apos;s childhood and shore photos: Oliver,
                      Theodore and Issaka. Reef: Richard Ling, CC BY-SA 3.0, via Wikimedia Commons.{" "}
                      <Link href="/credits" className="text-turquoise hover:underline">
                        Every other photo credit →
                      </Link>
                    </p>
                    <p className="mt-6 text-mist/60">TIDE · OwlHacks 2026</p>
                  </div>
                </div>
              </footer>
            </Frame>

            {/* The last slide stays up through Q&A, with the recordings playing one after another. */}
            <Frame sub>
              <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16 md:px-10">
                <div>
                  <p className="font-mono text-[12px] tracking-[0.18em] text-turquoise/90 uppercase">
                    TIDE · OwlHacks 2026 · Deep Sea Aquatics
                  </p>
                  <MaskText
                    segments={[{ text: "Questions?", className: "font-serif italic" }]}
                    className="mt-6 text-[clamp(64px,9vw,140px)] leading-[0.95] font-normal text-foam"
                  />
                  <p className="mt-8 text-[clamp(18px,1.8vw,24px)] text-mist">
                    {TEAM.join(", ").replace(/, ([^,]*)$/, " and $1")}
                  </p>
                  <p className="mt-3 text-[15px] text-mist/70">See it. Identify it. Understand it. Protect it.</p>
                </div>
                <ClipQueue className="mx-auto w-[min(78vw,340px)] md:w-[min(420px,calc((100dvh-200px)*0.6))]" />
              </div>
            </Frame>
          </section>
        </main>
      </DepthProvider>
    </SmoothScrollProvider>
  );
}
