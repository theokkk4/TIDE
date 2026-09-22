"use client";

import { Eye, TriangleAlert } from "lucide-react";
import { GlassCard } from "@/components/ui/primitives";
import { useCurrentScanFor } from "@/lib/storage";
import { cn } from "@/lib/utils";

const LOW_CONFIDENCE = 75;

/**
 * Confidence is reported, never hidden. Below the threshold the app leads with
 * uncertainty and shows what else the photo could be.
 */
export function ScanSummary({ slug }: { slug: string }) {
  const scan = useCurrentScanFor(slug);
  if (!scan) return null;

  const uncertain = scan.confidence < LOW_CONFIDENCE;

  return (
    <GlassCard className="mx-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-mist">
            {uncertain ? "We aren't completely sure" : "Identification confidence"}
          </p>
          <p className="mt-1 text-[15px] leading-snug text-foam">
            {uncertain ? `Likely ${scan.commonName}` : `${scan.confidence}% confident this is a ${scan.commonName}`}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p
            className={cn(
              "font-mono text-[26px] leading-none font-semibold",
              uncertain ? "text-status-watch" : "text-turquoise",
            )}
          >
            {scan.confidence}%
          </p>
          {scan.source === "demo" && <p className="mt-1 text-[10px] text-mist/60">demo scan</p>}
        </div>
      </div>

      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-foam/10"
        role="meter"
        aria-valuenow={scan.confidence}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Identification confidence"
      >
        <div
          className={cn("h-full rounded-full", uncertain ? "bg-status-watch" : "bg-turquoise")}
          style={{ width: `${scan.confidence}%` }}
        />
      </div>

      {scan.reasoning && (
        <div className="mt-4 flex gap-2.5 border-t border-foam/8 pt-4">
          <Eye className="mt-0.5 h-4 w-4 shrink-0 text-turquoise" strokeWidth={1.9} aria-hidden />
          <p className="text-[13px] leading-relaxed text-mist">{scan.reasoning}</p>
        </div>
      )}

      {scan.alternatives.length > 0 && (
        <div className="mt-4 border-t border-foam/8 pt-4">
          <div className="mb-2 flex items-center gap-2">
            {uncertain && <TriangleAlert className="h-3.5 w-3.5 text-status-watch" aria-hidden />}
            <p className="text-[12px] font-semibold tracking-wide text-mist uppercase">Possible alternatives</p>
          </div>
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
  );
}
