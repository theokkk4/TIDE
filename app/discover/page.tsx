import Link from "next/link";
import { ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import { SPECIES } from "@/lib/data/species";
import { OCEAN_FACTS, weekIndex } from "@/lib/data/ocean-facts";
import { resolveStatus, resolveStatusCode, speciesImage } from "@/lib/conservation";
import { isThreatened } from "@/lib/status";
import { getSeafoodVerdict } from "@/lib/seafood";
import { SpeciesPhoto } from "@/components/ui/species-photo";
import { StatusBadge } from "@/components/ui/status-badge";
import { GlassCard, Pill, SectionHeading } from "@/components/ui/primitives";
import { PageTransition, Reveal } from "@/components/ui/motion";
import type { Species } from "@/lib/types";

export const metadata = {
  title: "Discover — TIDE",
};

function SpeciesRailCard({ species }: { species: Species }) {
  const status = resolveStatus(species);

  return (
    <Link
      href={`/species/${species.slug}`}
      className="group block w-[164px] shrink-0 snap-start"
      style={{ scrollSnapAlign: "start" }}
    >
      <div className="relative h-[190px] w-full overflow-hidden rounded-[22px] border border-foam/10">
        <SpeciesPhoto
          src={speciesImage(species)}
          alt={species.commonName}
          emoji={species.emoji}
          className="absolute inset-0 h-full w-full"
          imageClassName="transition-transform duration-500 group-hover:scale-105"
          sizes="164px"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,20,0.1),rgba(2,8,20,0.9))]" />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="text-[13px] leading-tight font-semibold text-foam">{species.commonName}</p>
          <p className="mt-0.5 truncate text-[10px] text-mist italic">{species.scientificName}</p>
          <div className="mt-2">
            <StatusBadge status={status} size="sm" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function Rail({ children }: { children: React.ReactNode }) {
  return (
    <div className="no-scrollbar snap-rail -mx-6 flex gap-3 overflow-x-auto px-6 pb-1">{children}</div>
  );
}

export default function DiscoverPage() {
  const featured = SPECIES[weekIndex() % SPECIES.length];
  const featuredStatus = resolveStatus(featured);

  const endangered = SPECIES.filter((species) => isThreatened(resolveStatusCode(species))).sort(
    (a, b) => a.commonName.localeCompare(b.commonName),
  );

  const seafood = SPECIES.filter((species) => {
    const verdict = getSeafoodVerdict(species, resolveStatusCode(species));
    return verdict.key === "COMMONLY_CONSUMED" || verdict.key === "SUSTAINABILITY_CONCERN";
  });

  const protectedSpecies = SPECIES.filter(
    (species) => getSeafoodVerdict(species, resolveStatusCode(species)).key === "PROTECTED",
  );

  return (
    <PageTransition>
      <header className="px-6 pt-[max(24px,env(safe-area-inset-top))]">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-turquoise/80 uppercase">Discover</p>
        <h1 className="mt-1 text-[28px] leading-tight font-semibold tracking-tight text-foam">
          Explore the ocean, one species at a time.
        </h1>
      </header>

      <section className="mt-7 px-6">
        <Reveal>
          <Link href={`/species/${featured.slug}`} className="group block">
            <div className="relative h-[280px] w-full overflow-hidden rounded-[28px] border border-foam/10">
              <SpeciesPhoto
                src={speciesImage(featured)}
                alt={featured.commonName}
                emoji={featured.emoji}
                className="absolute inset-0 h-full w-full"
                imageClassName="transition-transform duration-700 group-hover:scale-[1.04]"
                sizes="(max-width: 480px) 100vw, 480px"
                priority
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,20,0.25),rgba(2,8,20,0.92))]" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <Pill className="mb-3 border-turquoise/30 bg-turquoise/10 text-turquoise">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Species of the Week
                </Pill>
                <h2 className="text-[24px] leading-tight font-semibold tracking-tight text-foam">
                  {featured.commonName}
                </h2>
                <p className="mt-1 text-[13px] text-mist italic">{featured.scientificName}</p>
                <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-mist">{featured.facts[0]}</p>
                <div className="mt-3">
                  <StatusBadge status={featuredStatus} size="sm" />
                </div>
              </div>
            </div>
          </Link>
        </Reveal>
      </section>

      <section className="mt-9 px-6">
        <SectionHeading eyebrow="Under pressure" title="Endangered Marine Life" />
        <Reveal>
          <Rail>
            {endangered.map((species) => (
              <SpeciesRailCard key={species.slug} species={species} />
            ))}
          </Rail>
        </Reveal>
      </section>

      <section className="mt-9 px-6">
        <SectionHeading eyebrow="On the menu" title="Common Seafood" />
        <Reveal>
          <Rail>
            {seafood.map((species) => (
              <SpeciesRailCard key={species.slug} species={species} />
            ))}
          </Rail>
        </Reveal>
      </section>

      <section className="mt-9 px-6">
        <SectionHeading eyebrow="Leave them be" title="Protected Species" />
        <Reveal>
          <Rail>
            {protectedSpecies.map((species) => (
              <SpeciesRailCard key={species.slug} species={species} />
            ))}
          </Rail>
        </Reveal>
      </section>

      <section className="mt-10 px-6">
        <SectionHeading eyebrow="Ocean facts" title="Why any of this matters" />
        <div className="space-y-3">
          {OCEAN_FACTS.map((fact, index) => (
            <Reveal key={fact.id} delay={index * 0.04}>
              <GlassCard className="relative overflow-hidden">
                <div
                  aria-hidden
                  className="absolute -top-6 -right-3 font-mono text-[64px] leading-none font-semibold text-turquoise/10"
                >
                  {fact.stat}
                </div>
                <p className="relative text-[11px] font-semibold tracking-[0.16em] text-turquoise/80 uppercase">
                  {fact.stat}
                </p>
                <h3 className="relative mt-1.5 text-[17px] leading-snug font-semibold tracking-tight text-foam">
                  {fact.headline}
                </h3>
                <p className="relative mt-2 text-[13px] leading-relaxed text-mist">{fact.detail}</p>
                <Link
                  href={fact.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-turquoise hover:underline"
                >
                  {fact.source.label}
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </Link>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mt-10 px-6">
        <Link
          href="/identify"
          className="glass flex items-center justify-between gap-4 rounded-[24px] px-5 py-4 transition-colors hover:border-turquoise/30"
        >
          <div>
            <p className="text-[15px] font-semibold text-foam">Found something yourself?</p>
            <p className="mt-0.5 text-[13px] text-mist">Point your camera at it and find out what it is.</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-turquoise" aria-hidden />
        </Link>
      </section>

      <p className="mt-9 px-6 pb-2 text-center text-[12px] text-mist/60">
        {SPECIES.length} species · conservation data from the IUCN Red List via GBIF
      </p>
    </PageTransition>
  );
}
