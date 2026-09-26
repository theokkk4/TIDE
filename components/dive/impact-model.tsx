"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const US_ANGLERS = 57_900_000;
/** SERC: "the average brood has roughly 3 million eggs". */
const EGGS_PER_BROOD = 3_000_000;

const compact = (value: number) =>
  value >= 1e9
    ? `${(value / 1e9).toFixed(value >= 1e10 ? 0 : 1)}B`
    : value >= 1e6
      ? `${(value / 1e6).toFixed(value >= 1e7 ? 0 : 1)}M`
      : value >= 1e4
        ? `${Math.round(value / 1e3)}K`
        : Math.round(value).toLocaleString("en-US");

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3 text-[13px] text-mist">
        {label}
        <span className="font-mono text-[14px] text-foam">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full accent-[#2ee6c5]"
      />
    </label>
  );
}

/**
 * What TIDE could do with funding and real users. The inputs are assumptions, shown as
 * assumptions and editable, so a judge can stress-test the claim instead of trusting it.
 */
export function ImpactModel() {
  // Log scale: 0 → 1,000 users, 100 → 1,000,000.
  const [scale, setScale] = useState(66.67);
  const [checks, setChecks] = useState(20);
  const [flip, setFlip] = useState(5);
  const [sponge, setSponge] = useState(10);
  const [finds, setFinds] = useState(0.5);

  const users = Math.round(1000 * Math.pow(1000, scale / 100));
  const checked = users * checks;
  const released = checked * (flip / 100);
  const eggs = released * (sponge / 100) * EGGS_PER_BROOD;
  const helped = users * finds;
  const share = (users / US_ANGLERS) * 100;

  const outputs = [
    { value: compact(checked), label: "catches checked against the rules each season" },
    { value: compact(released), label: "undersized, egg-bearing or protected animals put back instead of kept" },
    { value: compact(eggs), label: "crab eggs back in the water, at about 3 million per sponge" },
    { value: compact(helped), label: "turtles and amphibians helped off a road or left in the wild" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="glass rounded-[28px] p-6">
        <p className="font-mono text-[11px] tracking-[0.16em] text-status-watch uppercase">Projection · drag the assumptions</p>
        <div className="mt-5">
          <Slider
            label="Active TIDE users"
            value={scale}
            min={0}
            max={100}
            step={0.5}
            format={() => users.toLocaleString("en-US")}
            onChange={setScale}
          />
          <p className="mt-1 text-[12px] text-mist/70">
            That&apos;s {share < 0.1 ? share.toFixed(2) : share.toFixed(1)}% of America&apos;s 57.9 million anglers.
          </p>
        </div>
        <div className="mt-6 space-y-5 border-t border-foam/10 pt-5">
          <Slider label="Catches each user checks per season" value={checks} min={5} max={60} step={1} format={(v) => `${v}`} onChange={setChecks} />
          <Slider
            label="Checks where TIDE turns a 'keep' into a 'release'"
            value={flip}
            min={1}
            max={15}
            step={0.5}
            format={(v) => `${v}%`}
            onChange={setFlip}
          />
          <Slider label="…of those, egg-bearing crabs" value={sponge} min={0} max={40} step={1} format={(v) => `${v}%`} onChange={setSponge} />
          <Slider
            label="Turtles & amphibians each user meets a year"
            value={finds}
            min={0}
            max={3}
            step={0.1}
            format={(v) => v.toFixed(1)}
            onChange={setFinds}
          />
        </div>
        <p className="mt-5 text-[12px] leading-relaxed text-mist/70">
          These rates are our assumptions, not measurements — that&apos;s why they&apos;re sliders. Most crab eggs never
          become adult crabs; the point is how many never got the chance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {outputs.map((output, index) => (
          <div key={output.label} className={cn("glass rounded-[24px] p-6", index === 2 && "sm:col-span-2")}>
            <p className="font-mono text-[clamp(38px,4.6vw,60px)] leading-none font-semibold text-turquoise">{output.value}</p>
            <p className="mt-3 text-[14px] leading-relaxed text-mist">{output.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
