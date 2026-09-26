"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CircleCheck,
  CircleHelp,
  CircleX,
  ExternalLink,
  Fish,
  Info,
  Ruler,
  ShieldAlert,
  Trash2,
  Undo2,
} from "lucide-react";
import type { Species } from "@/lib/types";
import { REGIONS, RULES_CHECKED, getRegion, minSizeOn, ruleFor, type RegionCode } from "@/lib/data/regulations";
import { catchNeeds, decideCatch, type CatchAction, type CheckState } from "@/lib/decision";
import { TONE_CLASSES } from "@/lib/status";
import { useCurrentScanFor, useRegion } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { ScreenGauge } from "./screen-gauge";

const ACTION_ICON: Record<CatchAction, typeof Fish> = {
  KEEP: CircleCheck,
  RELEASE: Undo2,
  CHECK: Ruler,
  REMOVE: Trash2,
  RULES: ShieldAlert,
};

const CHECK_ICON: Record<CheckState, typeof Fish> = {
  pass: CircleCheck,
  fail: CircleX,
  pending: CircleHelp,
  info: Info,
};

const CHECK_TONE: Record<CheckState, string> = {
  pass: "text-status-safe",
  fail: "text-status-alert",
  pending: "text-status-watch",
  info: "text-mist",
};

const MEASURE_LABEL = {
  "total-length": "Total length — snout to tail tip",
  "point-to-point": "Shell width — spike tip to spike tip",
  "carapace-length": "Carapace length — eye socket to back of the body shell",
  "curved-carapace": "Shell length, measured along the curve",
} as const;

function Toggle<T extends string | boolean>({
  value,
  options,
  onChange,
  label,
}: {
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (value: T | null) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1.5">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(active ? null : option.value)}
            className={cn(
              "min-h-[40px] flex-1 rounded-full border px-3 text-[13px] font-medium transition-colors",
              active ? "border-turquoise/70 bg-turquoise/15 text-turquoise" : "border-foam/15 text-mist hover:text-foam",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The keep-or-release call for anything caught on a line or in a pot. The person picks
 * their state and measures; the cited state rule makes the decision, and every check
 * that produced it is shown.
 */
export function KeepOrRelease({ species, edible }: { species: Species; edible: boolean }) {
  const [region, setRegion] = useRegion();
  const [length, setLength] = useState("");
  const [eggs, setEggs] = useState<boolean | null>(null);
  const [female, setFemale] = useState<boolean | null>(null);
  const [gaugeOpen, setGaugeOpen] = useState(false);
  const scan = useCurrentScanFor(species.slug);

  const parsed = Number.parseFloat(length);
  const inches = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  const decision = decideCatch(species, { region, length: inches, eggs, female, date: new Date() }, edible);
  const rule = decision.rule ?? ruleFor(species.slug, region);
  const needs = catchNeeds(species, rule);
  const tone = TONE_CLASSES[decision.tone];
  const Icon = ACTION_ICON[decision.action];
  const regionInfo = getRegion(region);
  const canGauge = needs.size && species.measure && species.measure !== "total-length";
  // Hide the questions only when the answer can't change the verdict (protected, invasive, out of season).
  const answerable =
    decision.action === "CHECK" ||
    decision.action === "KEEP" ||
    (decision.action === "RELEASE" && decision.checks.some((check) => check.label !== "Season" && check.label !== "Protected"));
  const tips = decision.action === "KEEP" ? species.keepTips : decision.action === "REMOVE" ? species.keepTips : species.releaseTips;

  return (
    <section aria-labelledby="keep-heading" className="glass mx-6 overflow-hidden rounded-[28px]">
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <p id="keep-heading" className="font-mono text-[11px] tracking-[0.16em] text-turquoise uppercase">
          Keep or release?
        </p>
        <div role="radiogroup" aria-label="Where are you fishing?" className="flex gap-1">
          {REGIONS.map((option) => (
            <button
              key={option.code}
              type="button"
              role="radio"
              aria-checked={region === option.code}
              title={option.name}
              onClick={() => setRegion(option.code as RegionCode)}
              className={cn(
                "h-8 min-w-[40px] rounded-full border px-2.5 font-mono text-[12px] font-semibold transition-colors",
                region === option.code
                  ? "border-turquoise/70 bg-turquoise/15 text-turquoise"
                  : "border-foam/15 text-mist hover:text-foam",
              )}
            >
              {option.code}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${decision.action}-${decision.headline}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className={cn("mx-5 mt-4 flex items-start gap-3 rounded-2xl border p-4", tone.bg, tone.border)}
          aria-live="polite"
        >
          <Icon className={cn("mt-0.5 h-7 w-7 shrink-0", tone.text)} strokeWidth={2.2} aria-hidden />
          <div className="min-w-0">
            <p className={cn("text-[22px] leading-tight font-semibold tracking-tight", tone.text)}>{decision.headline}</p>
            <p className="mt-1 text-[14px] leading-relaxed text-foam/90">{decision.summary}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {decision.checks.length > 0 && (
        <ul className="mx-5 mt-4 space-y-2.5">
          {decision.checks.map((check, index) => {
            const CheckIcon = CHECK_ICON[check.state];
            return (
              <li key={`${check.label}-${index}`} className="flex gap-2.5">
                <CheckIcon className={cn("mt-0.5 h-4 w-4 shrink-0", CHECK_TONE[check.state])} strokeWidth={2.2} aria-hidden />
                <p className="text-[13.5px] leading-snug text-mist">
                  <span className="font-semibold text-foam">{check.label}: </span>
                  {check.detail}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {region && answerable && (needs.size || needs.eggs || needs.female) && (
        <div className="mx-5 mt-5 space-y-4 border-t border-foam/10 pt-4">
          {needs.size && (
            <div>
              <label htmlFor="catch-length" className="text-[13px] font-medium text-foam">
                How big is it?
              </label>
              {species.measure && <p className="mt-0.5 text-[12px] text-mist/80">{MEASURE_LABEL[species.measure]}</p>}
              <div className="mt-2 flex gap-2">
                <div className="relative flex-1">
                  <input
                    id="catch-length"
                    inputMode="decimal"
                    type="number"
                    min={0}
                    step={0.25}
                    placeholder="e.g. 4.75"
                    value={length}
                    onChange={(event) => setLength(event.target.value)}
                    className="h-11 w-full rounded-xl border border-foam/15 bg-abyss/60 px-3 pr-14 text-[16px] text-foam placeholder:text-mist/40 focus:border-turquoise/60 focus:outline-none"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[13px] text-mist">inches</span>
                </div>
                {canGauge && (
                  <button
                    type="button"
                    onClick={() => setGaugeOpen(true)}
                    className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-turquoise/40 px-3 text-[13px] font-medium text-turquoise transition-colors hover:bg-turquoise/10"
                  >
                    <Ruler className="h-4 w-4" aria-hidden />
                    Gauge
                  </button>
                )}
              </div>
            </div>
          )}

          {needs.eggs && (
            <div>
              <p className="text-[13px] font-medium text-foam">Carrying eggs?</p>
              <p className="mt-0.5 mb-2 text-[12px] text-mist/80">
                Flip it over: an orange-to-black spongy mass under the apron means eggs.
                {scan?.hints?.eggs === "yes" && (
                  <span className="text-status-watch"> TIDE thinks it sees eggs in your photo — please check.</span>
                )}
              </p>
              <Toggle
                label="Carrying eggs?"
                value={eggs}
                onChange={setEggs}
                options={[
                  { value: false, label: "No eggs" },
                  { value: true, label: "Eggs" },
                ]}
              />
            </div>
          )}

          {needs.female && (
            <div>
              <p className="text-[13px] font-medium text-foam">Male or female?</p>
              <p className="mt-0.5 mb-2 text-[12px] text-mist/80">
                Flip it: males have a narrow T-shaped apron; females a wide triangle or dome, and red-tipped claws.
                {scan?.hints?.sex && scan.hints.sex !== "unknown" && (
                  <span className="text-status-watch"> Your photo looks {scan.hints.sex} — please check.</span>
                )}
              </p>
              <Toggle
                label="Male or female?"
                value={female}
                onChange={setFemale}
                options={[
                  { value: false, label: "Male (jimmy)" },
                  { value: true, label: "Female (sook)" },
                ]}
              />
            </div>
          )}
        </div>
      )}

      {tips && tips.length > 0 && region && (
        <div className="mx-5 mt-5 rounded-2xl bg-foam/[0.04] p-4">
          <p className="text-[12px] font-semibold tracking-wide text-foam">
            {decision.action === "KEEP" ? "Keeping it" : decision.action === "REMOVE" ? "What to do" : "Releasing it right"}
          </p>
          <ul className="mt-2 space-y-1.5">
            {tips.map((tip) => (
              <li key={tip} className="flex gap-2 text-[12.5px] leading-snug text-mist">
                <span className="text-turquoise" aria-hidden>
                  ›
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 border-t border-foam/10 bg-abyss/30 px-5 py-4 text-[12px] leading-relaxed text-mist/80">
        {rule ? (
          <>
            {rule.area && <p className="text-mist">{rule.area}</p>}
            {rule.bag && <p>Limit: {rule.bag}</p>}
            {rule.season && !rule.harvest && <p>Season: {rule.season}</p>}
            {rule.notes?.slice(decision.action === "RELEASE" && decision.checks[0]?.label === "Protected" ? 1 : 0).map((note) => (
              <p key={note}>{note}</p>
            ))}
            <a
              href={rule.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-turquoise hover:underline"
            >
              {rule.source.label}
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
            <p className="mt-1 text-mist/60">
              Rules checked {new Date(`${RULES_CHECKED}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.
              Regulations change — confirm before you keep anything.
            </p>
          </>
        ) : regionInfo ? (
          <p>
            Official rules:{" "}
            <a href={regionInfo.agency.url} target="_blank" rel="noopener noreferrer" className="text-turquoise hover:underline">
              {regionInfo.agency.label} ↗
            </a>
          </p>
        ) : (
          <p>TIDE covers New Jersey, Pennsylvania and Maryland rules, plus federal protections everywhere.</p>
        )}
      </div>

      {gaugeOpen && species.measure && (
        <ScreenGauge
          measure={species.measure}
          legalMin={rule?.kind === "open" ? minSizeOn(rule, new Date()) : null}
          regionName={regionInfo?.name ?? null}
          onClose={() => setGaugeOpen(false)}
          onMeasured={(value) => {
            setLength(value.toFixed(2).replace(/\.?0+$/, ""));
            setGaugeOpen(false);
          }}
        />
      )}
    </section>
  );
}
