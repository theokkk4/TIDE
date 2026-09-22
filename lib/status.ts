import type { IucnCode } from "@/lib/types";

export interface StatusMeta {
  code: IucnCode;
  label: string;
  short: string;
  tone: "safe" | "watch" | "warn" | "alert" | "unknown";
  /** Non-colour indicator so status never depends on colour alone. */
  indicator: string;
  meaning: string;
}

export const STATUS_META: Record<IucnCode, StatusMeta> = {
  LC: {
    code: "LC",
    label: "Least Concern",
    short: "Least Concern",
    tone: "safe",
    indicator: "●",
    meaning:
      "Assessed as widespread and abundant. This describes the global population, not fishing pressure or legal protection.",
  },
  NT: {
    code: "NT",
    label: "Near Threatened",
    short: "Near Threatened",
    tone: "watch",
    indicator: "◐",
    meaning: "Close to qualifying for a threatened category, or likely to qualify in the near future.",
  },
  VU: {
    code: "VU",
    label: "Vulnerable",
    short: "Vulnerable",
    tone: "warn",
    indicator: "◑",
    meaning: "Facing a high risk of extinction in the wild.",
  },
  EN: {
    code: "EN",
    label: "Endangered",
    short: "Endangered",
    tone: "alert",
    indicator: "◕",
    meaning: "Facing a very high risk of extinction in the wild.",
  },
  CR: {
    code: "CR",
    label: "Critically Endangered",
    short: "Critically Endangered",
    tone: "alert",
    indicator: "⬤",
    meaning: "Facing an extremely high risk of extinction in the wild.",
  },
  EW: {
    code: "EW",
    label: "Extinct in the Wild",
    short: "Extinct in Wild",
    tone: "alert",
    indicator: "⬤",
    meaning: "Survives only in cultivation, captivity or outside its historic range.",
  },
  EX: {
    code: "EX",
    label: "Extinct",
    short: "Extinct",
    tone: "alert",
    indicator: "⬤",
    meaning: "No reasonable doubt that the last individual has died.",
  },
  DD: {
    code: "DD",
    label: "Data Deficient",
    short: "Data Deficient",
    tone: "unknown",
    indicator: "◌",
    meaning:
      "Not enough information exists to assess extinction risk. This is an absence of data, not a sign of health.",
  },
  NE: {
    code: "NE",
    label: "Not Evaluated",
    short: "Not Evaluated",
    tone: "unknown",
    indicator: "◌",
    meaning:
      "No global Red List assessment exists. Regional stock assessments are the better guide for this species.",
  },
};

export const TONE_CLASSES: Record<
  StatusMeta["tone"],
  { text: string; bg: string; border: string; dot: string }
> = {
  safe: { text: "text-status-safe", bg: "bg-status-safe/12", border: "border-status-safe/30", dot: "bg-status-safe" },
  watch: {
    text: "text-status-watch",
    bg: "bg-status-watch/12",
    border: "border-status-watch/30",
    dot: "bg-status-watch",
  },
  warn: { text: "text-status-warn", bg: "bg-status-warn/12", border: "border-status-warn/30", dot: "bg-status-warn" },
  alert: {
    text: "text-status-alert",
    bg: "bg-status-alert/12",
    border: "border-status-alert/30",
    dot: "bg-status-alert",
  },
  unknown: {
    text: "text-status-unknown",
    bg: "bg-status-unknown/12",
    border: "border-status-unknown/30",
    dot: "bg-status-unknown",
  },
};

export function statusFromCode(code: IucnCode | null | undefined): StatusMeta {
  return STATUS_META[code as IucnCode] ?? STATUS_META.NE;
}

export function isThreatened(code: IucnCode) {
  return code === "VU" || code === "EN" || code === "CR" || code === "EW" || code === "EX";
}
