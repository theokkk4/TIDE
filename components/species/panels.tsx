import Link from "next/link";
import {
  Anchor,
  ExternalLink,
  Fish,
  Info,
  Scale,
  ShieldAlert,
  Skull,
  Users,
  Waves,
} from "lucide-react";
import { GlassCard, Pill, Stat } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/status-badge";
import { Expandable } from "@/components/ui/expandable";
import { TONE_CLASSES, type StatusMeta } from "@/lib/status";
import type { SeafoodVerdict } from "@/lib/seafood";
import type { Source, Species } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ConservationCard({ species, status }: { species: Species; status: StatusMeta }) {
  const tone = TONE_CLASSES[status.tone];

  return (
    <GlassCard className={cn("border", tone.border)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-mist uppercase">Conservation status</p>
        <Pill className="text-[10px]">IUCN Red List</Pill>
      </div>

      <div className="mt-3">
        <StatusBadge status={status} />
      </div>

      <p className="mt-4 text-[14px] leading-relaxed text-foam/90">{species.statusContext}</p>

      <div className={cn("mt-4 rounded-2xl border px-4 py-3", tone.border, tone.bg)}>
        <p className="text-[12px] font-semibold text-foam">What {status.label} means</p>
        <p className="mt-1 text-[13px] leading-relaxed text-mist">{status.meaning}</p>
      </div>

      {species.legallyProtected && species.protectionNote && (
        <div className="mt-3 flex gap-2.5 rounded-2xl border border-status-alert/25 bg-status-alert/10 px-4 py-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-status-alert" strokeWidth={2} aria-hidden />
          <div>
            <p className="text-[12px] font-semibold text-foam">Legally protected</p>
            <p className="mt-1 text-[13px] leading-relaxed text-mist">{species.protectionNote}</p>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

export function SeafoodCard({
  species,
  verdict,
  children,
}: {
  species: Species;
  verdict: SeafoodVerdict;
  children?: React.ReactNode;
}) {
  const tone = TONE_CLASSES[verdict.tone];

  return (
    <GlassCard className={cn("border", tone.border)}>
      <p className="text-[11px] font-semibold tracking-[0.16em] text-mist uppercase">On your plate</p>

      <div className="mt-3 flex items-center gap-2.5">
        <span className="text-[22px] leading-none" aria-hidden>
          {verdict.indicator}
        </span>
        <h2 className={cn("text-[20px] font-semibold tracking-tight", tone.text)}>{verdict.headline}</h2>
      </div>

      <p className="mt-3 text-[14px] leading-relaxed text-foam/90">{verdict.summary}</p>

      {verdict.statusOverride && (
        <div className="mt-4 flex gap-2.5 rounded-2xl border border-foam/10 bg-foam/5 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-turquoise" strokeWidth={2} aria-hidden />
          <p className="text-[13px] leading-relaxed text-mist">{verdict.statusOverride}</p>
        </div>
      )}

      {species.fishingStatus && (
        <div className="mt-4 rounded-2xl border border-foam/10 bg-foam/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <Anchor className="h-3.5 w-3.5 text-turquoise" strokeWidth={2} aria-hidden />
            <p className="text-[12px] font-semibold text-foam">Regional fishing status</p>
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-mist">{species.fishingStatus}</p>
        </div>
      )}

      {species.sourcingTips && species.sourcingTips.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-[12px] font-semibold text-foam">If you buy it</p>
          <ul className="space-y-1.5">
            {species.sourcingTips.map((tip) => (
              <li key={tip} className="flex gap-2.5 text-[13px] leading-relaxed text-mist">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-turquoise" aria-hidden />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex gap-2.5 border-t border-foam/8 pt-4">
        <Scale className="mt-0.5 h-4 w-4 shrink-0 text-mist" strokeWidth={1.9} aria-hidden />
        <p className="text-[12px] leading-relaxed text-mist/80">
          Conservation status and seafood sustainability are two different questions. A species can be Least
          Concern globally and still be overfished, protected or unsustainable where you are.
        </p>
      </div>

      {children}
    </GlassCard>
  );
}

export function AboutCard({ species }: { species: Species }) {
  return (
    <Expandable
      title="About this species"
      icon={<Waves className="h-4 w-4" strokeWidth={2} aria-hidden />}
      summary={species.habitat}
      defaultOpen
    >
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Habitat" value={species.habitat} />
        <Stat label="Range" value={species.range} />
        <Stat label="Size" value={species.size} />
        <Stat label="Diet" value={species.diet} />
        {species.lifespan && <Stat label="Lifespan" value={species.lifespan} />}
        <Stat label="Group" value={species.category} />
      </div>

      <div className="mt-4 space-y-3">
        {species.facts.map((fact) => (
          <div key={fact} className="flex gap-2.5">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-turquoise" aria-hidden />
            <p className="text-[13px] leading-relaxed text-mist">{fact}</p>
          </div>
        ))}
      </div>
    </Expandable>
  );
}

export function ThreatsCard({ species }: { species: Species }) {
  return (
    <Expandable
      title="Major threats"
      icon={<Skull className="h-4 w-4" strokeWidth={2} aria-hidden />}
      summary={species.threats.map((threat) => threat.title).join(" · ")}
    >
      <ul className="space-y-3">
        {species.threats.map((threat) => (
          <li key={threat.title} className="rounded-2xl border border-foam/10 bg-foam/5 px-4 py-3">
            <p className="text-[13px] font-semibold text-foam">{threat.title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-mist">{threat.detail}</p>
          </li>
        ))}
      </ul>
    </Expandable>
  );
}

export function HumanImpactCard({ species }: { species: Species }) {
  return (
    <Expandable
      title="Human impact"
      icon={<Users className="h-4 w-4" strokeWidth={2} aria-hidden />}
      summary="How people and this species meet"
    >
      <p className="text-[14px] leading-relaxed text-mist">{species.humanImpact}</p>
    </Expandable>
  );
}

const ORG_COLORS: Record<Source["org"], string> = {
  "IUCN Red List": "text-status-warn",
  GBIF: "text-turquoise",
  "NOAA Fisheries": "text-aqua",
  "Seafood Watch": "text-status-safe",
  CITES: "text-status-alert",
  Wikipedia: "text-mist",
};

export function SourcesCard({ sources, retrievedAt }: { sources: Source[]; retrievedAt: string }) {
  return (
    <Expandable
      title="Sources"
      icon={<Fish className="h-4 w-4" strokeWidth={2} aria-hidden />}
      summary={`${sources.length} references · verified ${retrievedAt}`}
    >
      <ul className="space-y-2">
        {sources.map((source) => (
          <li key={source.url}>
            <Link
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-foam/10 bg-foam/5 px-4 py-3 transition-colors hover:border-turquoise/30"
            >
              <div className="min-w-0 flex-1">
                <p className={cn("text-[11px] font-semibold tracking-wide uppercase", ORG_COLORS[source.org])}>
                  {source.org}
                </p>
                <p className="mt-0.5 truncate text-[13px] text-foam">{source.label}</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-mist" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] leading-relaxed text-mist/60">
        Conservation categories are read from the IUCN Red List via GBIF and cached on {retrievedAt}. TIDE never
        invents a conservation status — where no assessment exists, it says so.
      </p>
    </Expandable>
  );
}
