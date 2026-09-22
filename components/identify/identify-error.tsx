"use client";

import Link from "next/link";
import { Fish, KeyRound, Lightbulb, RotateCcw } from "lucide-react";
import { Button, ButtonLink, GlassCard } from "@/components/ui/primitives";
import type { IdentifyResponse } from "@/lib/types";

const TIPS = [
  "Move closer so the animal fills more of the frame",
  "Find better lighting, or turn the flash off underwater",
  "Get the whole animal in shot, including fins or claws",
];

export function IdentifyError({
  reason,
  message,
  photo,
  onRetry,
}: {
  reason: IdentifyResponse["error"];
  message?: string;
  photo: string | null;
  onRetry: () => void;
}) {
  const notConfigured = reason === "no_credentials";
  const notMarine = reason === "not_marine";

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6 py-12">
      {photo && (
        <div className="mx-auto mb-7 h-32 w-32 overflow-hidden rounded-[26px] border border-foam/15 opacity-60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <div className="flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foam/8">
          {notConfigured ? (
            <KeyRound className="h-6 w-6 text-turquoise" strokeWidth={1.8} aria-hidden />
          ) : (
            <Fish className="h-6 w-6 text-turquoise" strokeWidth={1.8} aria-hidden />
          )}
        </div>
      </div>

      <h1 className="mt-5 text-center text-[24px] font-semibold tracking-tight text-foam">
        {notConfigured
          ? "Live identification isn't set up"
          : notMarine
            ? "That doesn't look like marine life"
            : "We couldn't identify this one"}
      </h1>

      <p className="mx-auto mt-3 max-w-[320px] text-center text-[14px] leading-relaxed text-mist">
        {notConfigured
          ? "This deployment has no AI vision key configured, so photos can't be analysed. Demo Mode runs the full experience without one."
          : notMarine
            ? (message ?? "Try a photo of a fish, turtle, crab or other ocean animal.")
            : (message ?? "The photo was hard to read. A clearer shot usually fixes it.")}
      </p>

      {!notConfigured && (
        <GlassCard className="mx-auto mt-7 w-full max-w-[340px]">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-turquoise" strokeWidth={2} aria-hidden />
            <p className="text-[13px] font-semibold text-foam">Try this</p>
          </div>
          <ul className="space-y-2">
            {TIPS.map((tip) => (
              <li key={tip} className="flex gap-2.5 text-[13px] leading-relaxed text-mist">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-turquoise" aria-hidden />
                {tip}
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      <div className="mx-auto mt-7 flex w-full max-w-[340px] flex-col gap-3">
        <Button onClick={onRetry} size="lg">
          <RotateCcw className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          Try Again
        </Button>
        <ButtonLink href="/demo" variant="secondary">
          Open Demo Mode
        </ButtonLink>
        <Link href="/" className="text-center text-[13px] text-mist hover:text-foam">
          Back to home
        </Link>
      </div>
    </div>
  );
}
