"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Compass, Database, HelpCircle, Info } from "lucide-react";
import { ButtonLink, GlassCard, Pill } from "@/components/ui/primitives";
import { SpeciesPhoto } from "@/components/ui/species-photo";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageTransition } from "@/components/ui/motion";
import { statusFromCode } from "@/lib/status";
import { useCurrentScan, useHydrated } from "@/lib/storage";
import type { GbifEnrichment } from "@/lib/types";
import { formatCount } from "@/lib/utils";

/**
 * Shown when the vision model identifies something outside TIDE's curated dataset.
 * It reports what is actually known and withholds what isn't — no invented status,
 * no seafood advice.
 */
export default function UnknownSpeciesPage() {
  const router = useRouter();
  const scan = useCurrentScan();
  const hydrated = useHydrated();
  const [enrichment, setEnrichment] = useState<GbifEnrichment | null>(null);
  const scientificName = scan?.scientificName;

  useEffect(() => {
    if (!scientificName) return;
    let cancelled = false;

    fetch(`/api/enrich?name=${encodeURIComponent(scientificName)}`)
      .then((response) => response.json() as Promise<GbifEnrichment>)
      .then((data) => {
        if (!cancelled) setEnrichment(data);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [scientificName]);

  if (hydrated && !scan) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-8 text-center">
        <HelpCircle className="h-10 w-10 text-mist" strokeWidth={1.6} aria-hidden />
        <p className="text-[15px] text-mist">There&apos;s no identification to show right now.</p>
        <ButtonLink href="/identify">Identify something</ButtonLink>
      </div>
    );
  }

  if (!scan) return null;

  const status = enrichment?.iucnCode ? statusFromCode(enrichment.iucnCode) : null;

  return (
    <PageTransition>
      <article className="pb-6">
        <header className="relative">
          <div className="relative h-[42vh] max-h-[380px] min-h-[280px] w-full overflow-hidden">
            <SpeciesPhoto
              src={scan.photo}
              alt={scan.commonName || "Unidentified marine animal"}
              emoji="🌊"
              className="absolute inset-0 h-full w-full"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,20,0.5)_0%,rgba(2,8,20,0.08)_34%,rgba(2,8,20,0.85)_80%,#020814_100%)]" />

            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Go back"
              className="absolute top-[max(16px,env(safe-area-inset-top))] left-5 flex h-10 w-10 items-center justify-center rounded-full bg-abyss/55 backdrop-blur-md"
            >
              <ArrowLeft className="h-5 w-5 text-foam" strokeWidth={2} aria-hidden />
            </button>

            <div className="absolute inset-x-0 bottom-0 px-6 pb-5">
              <Pill className="mb-3">Outside TIDE&apos;s curated species</Pill>
              <h1 className="text-balance text-[28px] leading-[1.1] font-semibold tracking-tight text-foam">
                {scan.commonName || "Unidentified marine animal"}
              </h1>
              {scan.scientificName && <p className="mt-1 text-[14px] text-mist italic">{scan.scientificName}</p>}
            </div>
          </div>
        </header>

        <div className="mt-4 space-y-4 px-6">
          <GlassCard>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[13px] font-medium text-mist">
                  {scan.confidence < 75 ? "We aren't completely sure" : "Identification confidence"}
                </p>
                <p className="mt-1 text-[15px] leading-snug text-foam">
                  This species isn&apos;t in TIDE&apos;s curated dataset yet.
                </p>
              </div>
              <p className="shrink-0 font-mono text-[26px] leading-none font-semibold text-turquoise">
                {scan.confidence}%
              </p>
            </div>

            {scan.reasoning && (
              <p className="mt-4 border-t border-foam/8 pt-4 text-[13px] leading-relaxed text-mist">
                {scan.reasoning}
              </p>
            )}

            {scan.alternatives.length > 0 && (
              <div className="mt-4 border-t border-foam/8 pt-4">
                <p className="mb-2 text-[12px] font-semibold tracking-wide text-mist uppercase">
                  Possible alternatives
                </p>
                <ul className="flex flex-wrap gap-2">
                  {scan.alternatives.map((alternative) => (
                    <li
                      key={alternative}
                      className="rounded-full border border-foam/12 bg-foam/5 px-3 py-1 text-[12px] text-foam/90"
                    >
                      {alternative}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-mist uppercase">
                What we could verify
              </p>
              <Database className="h-3.5 w-3.5 text-mist/50" aria-hidden />
            </div>

            {status ? (
              <div className="mt-3 space-y-3">
                <StatusBadge status={status} />
                <p className="text-[13px] leading-relaxed text-mist">{status.meaning}</p>
              </div>
            ) : (
              <p className="mt-3 text-[13px] leading-relaxed text-mist">
                No IUCN Red List assessment was found for this name. TIDE will not guess a conservation status.
              </p>
            )}

            {enrichment?.acceptedName && (
              <div className="mt-4 space-y-1.5 border-t border-foam/8 pt-4 text-[13px] text-mist">
                <p>
                  <span className="text-mist/60">Accepted name: </span>
                  <span className="text-foam italic">{enrichment.acceptedName}</span>
                </p>
                {enrichment.taxonomy.family && (
                  <p>
                    <span className="text-mist/60">Family: </span>
                    <span className="text-foam">{enrichment.taxonomy.family}</span>
                  </p>
                )}
                {enrichment.occurrenceCount !== null && (
                  <p>
                    <span className="text-mist/60">GBIF records: </span>
                    <span className="text-foam">{formatCount(enrichment.occurrenceCount)}</span>
                  </p>
                )}
              </div>
            )}
          </GlassCard>

          <div className="flex gap-2.5 rounded-2xl border border-foam/10 bg-foam/5 px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-turquoise" strokeWidth={2} aria-hidden />
            <p className="text-[13px] leading-relaxed text-mist">
              TIDE only gives seafood guidance for species it has verified data for, so there is none here. When
              in doubt, treat an unidentified animal as one to leave alone.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <ButtonLink href="/identify" className="w-full">
              Try another photo
            </ButtonLink>
            <ButtonLink href="/discover" variant="secondary" className="w-full">
              <Compass className="h-4 w-4" strokeWidth={2} aria-hidden />
              Browse known species
            </ButtonLink>
          </div>
        </div>
      </article>
    </PageTransition>
  );
}
