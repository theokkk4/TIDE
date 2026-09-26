"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { CreditCard, X } from "lucide-react";
import type { MeasureMethod } from "@/lib/types";
import { formatInches } from "@/lib/data/regulations";
import { useGaugeCalibration } from "@/lib/storage";

/** ISO/IEC 7810 ID-1 — every bank card and driver's licence — is 2.125 in on its short edge. */
const CARD_SHORT_EDGE = 2.125;
const TOP = 16;

/**
 * The phone as a crab gauge. Screens don't know their physical size, so the person
 * calibrates once against a bank card; after that the screen is a ruler with the legal
 * line drawn on it. Close calls still deserve a real gauge, and the screen says so.
 */
export function ScreenGauge({
  measure,
  legalMin,
  regionName,
  onClose,
  onMeasured,
}: {
  measure: MeasureMethod;
  legalMin: number | null;
  regionName: string | null;
  onClose: () => void;
  onMeasured: (inches: number) => void;
}) {
  const [saved, setSaved] = useGaugeCalibration();
  const [draft, setDraft] = useState(saved ?? 150);
  const [calibrating, setCalibrating] = useState(saved === null);
  const [mark, setMark] = useState<number | null>(null);
  const ppi = saved ?? draft;

  const height = typeof window === "undefined" ? 800 : window.innerHeight;
  const inchesShown = Math.floor(((height - TOP - 8) / ppi) * 8) / 8;
  const ticks = Array.from({ length: Math.floor(inchesShown * 8) + 1 }, (_, i) => i / 8);
  const reading = mark !== null ? Math.max(0, (mark - TOP) / ppi) : null;
  const tipLabel = measure === "point-to-point" ? "Put one spike tip on the top line" : "Line the shell's front edge up with the top line";

  // Portalled to <body>: the glass card's backdrop-filter would otherwise trap a fixed overlay inside it.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="On-screen gauge" className="fixed inset-0 z-[80] bg-[#010812] text-foam">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close gauge"
        className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-foam/20 bg-abyss/80"
      >
        <X className="h-5 w-5" aria-hidden />
      </button>

      {calibrating ? (
        <div className="flex h-full flex-col justify-center px-6">
          <CreditCard className="h-8 w-8 text-turquoise" aria-hidden />
          <h2 className="mt-3 text-[22px] font-semibold tracking-tight">Calibrate once</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-mist">
            Hold any bank card or driver&apos;s licence flat against the screen, short edge along the box. Slide until the
            box is exactly as wide as the card.
          </p>
          <div
            className="mt-8 h-[110px] rounded-lg border-2 border-turquoise bg-turquoise/10"
            style={{ width: draft * CARD_SHORT_EDGE }}
          />
          <input
            type="range"
            min={90}
            max={200}
            step={0.5}
            value={draft}
            onChange={(event) => setDraft(Number(event.target.value))}
            aria-label="Box width"
            className="mt-6 w-full accent-[#2ee6c5]"
          />
          <button
            type="button"
            onClick={() => {
              setSaved(draft);
              setCalibrating(false);
            }}
            className="mt-8 h-12 rounded-full bg-[linear-gradient(145deg,#5fe3ef,#2ee6c5)] text-[15px] font-semibold text-abyss"
          >
            It matches — show the gauge
          </button>
        </div>
      ) : (
        <div className="relative h-full" onPointerDown={(event) => setMark(event.clientY)}>
          {/* The ruler, 0 at the top. */}
          <div className="absolute top-0 left-0 h-full w-[46%] border-r border-foam/10">
            {ticks.map((value) => {
              const whole = Number.isInteger(value);
              const half = !whole && Number.isInteger(value * 2);
              return (
                <div key={value} className="absolute left-0 flex items-center" style={{ top: TOP + value * ppi }}>
                  <span
                    className="block h-px bg-foam/70"
                    style={{ width: whole ? 44 : half ? 30 : value * 4 === Math.round(value * 4) ? 22 : 12 }}
                  />
                  {whole && <span className="ml-2 -translate-y-px font-mono text-[13px] text-foam">{value}″</span>}
                </div>
              );
            })}
            {legalMin !== null && legalMin <= inchesShown && (
              <div className="absolute left-0 w-[217%]" style={{ top: TOP + legalMin * ppi }}>
                <div className="h-[2px] bg-status-safe shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                <p className="mt-1 ml-14 font-mono text-[11px] text-status-safe">
                  Legal {formatInches(legalMin)}
                  {regionName ? ` · ${regionName}` : ""}
                </p>
              </div>
            )}
            {mark !== null && (
              <div className="absolute left-0 w-[217%]" style={{ top: mark }}>
                <div className="h-[2px] bg-turquoise" />
              </div>
            )}
          </div>

          <div className="absolute top-0 right-0 flex h-full w-[54%] flex-col justify-center px-4 pt-14">
            <p className="font-mono text-[11px] tracking-[0.16em] text-turquoise uppercase">Crab gauge</p>
            <p className="mt-2 text-[14px] leading-relaxed text-mist">
              {tipLabel}, then tap where the other end reaches.
            </p>
            {reading !== null && (
              <div className="mt-5" onPointerDown={(event) => event.stopPropagation()}>
                <p className="font-mono text-[34px] leading-none font-semibold text-foam">{reading.toFixed(2)}″</p>
                {legalMin !== null && (
                  <p className={`mt-1 text-[13px] font-medium ${reading >= legalMin ? "text-status-safe" : "text-status-alert"}`}>
                    {reading >= legalMin ? "Reaches the legal line" : `${(legalMin - reading).toFixed(2)}″ short`}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => onMeasured(reading)}
                  className="mt-4 h-11 w-full rounded-full bg-[linear-gradient(145deg,#5fe3ef,#2ee6c5)] text-[14px] font-semibold text-abyss"
                >
                  Use {reading.toFixed(2)}″
                </button>
              </div>
            )}
            <p className="mt-6 text-[11.5px] leading-relaxed text-mist/70" onPointerDown={(event) => event.stopPropagation()}>
              Only as accurate as your calibration. Right on the line? Use a real gauge.{" "}
              <button type="button" onClick={() => setCalibrating(true)} className="text-turquoise underline-offset-2 hover:underline">
                Recalibrate
              </button>
            </p>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
