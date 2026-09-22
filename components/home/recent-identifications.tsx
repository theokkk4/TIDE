"use client";

import Link from "next/link";
import { ChevronRight, History } from "lucide-react";
import { SectionHeading } from "@/components/ui/primitives";
import { SpeciesPhoto } from "@/components/ui/species-photo";
import { StatusBadge } from "@/components/ui/status-badge";
import { useRecentScans } from "@/lib/storage";
import { statusFromCode } from "@/lib/status";
import { relativeDate } from "@/lib/utils";

export function RecentIdentifications() {
  const { recent } = useRecentScans();

  return (
    <section className="mt-10 px-6">
      <SectionHeading eyebrow="Your history" title="Recently Identified" />

      {recent.length === 0 ? (
        <div className="glass flex items-center gap-3 rounded-[22px] px-4 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foam/8">
            <History className="h-5 w-5 text-mist" strokeWidth={1.8} aria-hidden />
          </div>
          <p className="text-[13px] leading-relaxed text-mist">
            Nothing yet. Identify something and it will appear here, saved on this device.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {recent.slice(0, 3).map((scan) => (
            <li key={scan.id}>
              <Link
                href={scan.slug ? `/species/${scan.slug}` : "/identify"}
                className="glass group flex items-center gap-4 rounded-[22px] p-3 transition-colors hover:border-turquoise/30"
              >
                <SpeciesPhoto
                  src={scan.photo}
                  alt={scan.commonName}
                  className="h-16 w-16 shrink-0 rounded-2xl"
                  sizes="64px"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-foam">{scan.commonName}</p>
                  <p className="truncate text-[12px] text-mist/80 italic">{scan.scientificName}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    {scan.statusCode && <StatusBadge status={statusFromCode(scan.statusCode)} size="sm" />}
                    <span className="text-[11px] text-mist/60">{relativeDate(scan.createdAt)}</span>
                  </div>
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-mist transition-transform group-hover:translate-x-0.5 group-hover:text-turquoise"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
