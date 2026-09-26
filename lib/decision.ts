import type { EncounterMode, Species } from "@/lib/types";
import {
  formatInches,
  getRegion,
  inSpan,
  minSizeOn,
  ruleFor,
  type RegionCode,
  type RegionRule,
} from "@/lib/data/regulations";

/**
 * The keep-or-release call. Deterministic and explainable: every verdict lists the
 * checks that produced it, each one traceable to a cited rule. The app never guesses a
 * size from a photo — the person measures, the rule decides.
 */

export type CatchAction = "KEEP" | "RELEASE" | "CHECK" | "REMOVE" | "RULES";
export type FindAction = "LEAVE" | "HELP_ACROSS" | "CALL";
export type CheckState = "pass" | "fail" | "pending" | "info";
export type DecisionTone = "safe" | "alert" | "warn" | "watch" | "unknown";

export interface Check {
  label: string;
  state: CheckState;
  detail: string;
}

export interface CatchDecision {
  action: CatchAction;
  headline: string;
  summary: string;
  tone: DecisionTone;
  checks: Check[];
  rule: RegionRule | null;
}

export interface CatchInput {
  region: RegionCode | null;
  /** Inches, measured by the person. */
  length: number | null;
  eggs: boolean | null;
  female: boolean | null;
  date: Date;
}

export function encounterMode(species: Species): EncounterMode {
  if (species.encounter) return species.encounter;
  return species.category === "turtle" || species.category === "amphibian" ? "find" : "catch";
}

/** What the person needs to establish before the rule can decide. */
export function catchNeeds(species: Species, rule: RegionRule | null) {
  const open = rule?.kind === "open";
  return {
    size: open && (rule.min !== undefined || rule.max !== undefined || !!rule.sizeBySeason),
    eggs: !!species.eggCheck || rule?.eggs === "release",
    female: open && rule.females === "release",
  };
}

export function decideCatch(species: Species, input: CatchInput, edible: boolean): CatchDecision {
  const rule = ruleFor(species.slug, input.region);
  const region = getRegion(input.region);
  const where = region?.name ?? "your state";
  const checks: Check[] = [];

  // 1. Protected anywhere, or no-take in this state.
  if (species.legallyProtected || rule?.kind === "no-take") {
    return {
      action: "RELEASE",
      headline: "Release it",
      summary: rule?.region === "US" || !rule ? "It's protected — keeping one is illegal." : `Keeping one is illegal in ${where}.`,
      tone: "alert",
      checks: [{ label: "Protected", state: "fail", detail: rule?.notes?.[0] ?? species.protectionNote ?? "Legally protected." }],
      rule,
    };
  }

  // 2. Invasive: the right call is the opposite of release.
  if (rule?.kind === "must-kill" || species.invasive) {
    const required = rule?.kind === "must-kill";
    return {
      action: "REMOVE",
      headline: "Don't put it back",
      summary: required
        ? `Invasive — ${where} law says it must not go back alive. Keep it and report it.`
        : "Invasive here. Keep it and report it rather than releasing it.",
      tone: "warn",
      checks: [
        { label: "Invasive species", state: "info", detail: species.invasive ?? "Non-native and harmful to local wildlife." },
        ...(rule?.notes ?? []).map((note) => ({ label: "Rule", state: "info" as const, detail: note })),
      ],
      rule,
    };
  }

  if (!input.region) {
    return {
      action: "RULES",
      headline: "Where are you fishing?",
      summary: "Size limits, seasons and female rules are set by each state. Pick yours to get a verdict.",
      tone: "unknown",
      checks: [],
      rule: null,
    };
  }

  if (!rule) {
    const unverified = `TIDE hasn't verified ${where}'s current rules for this species, so it won't guess a size limit.`;
    if (species.eggCheck && input.eggs) {
      return {
        action: "RELEASE",
        headline: "Release it",
        summary: `Carrying eggs. ${unverified} Every state TIDE does cover requires egg-bearing females to go back.`,
        tone: "alert",
        checks: [{ label: "Eggs", state: "fail", detail: "Egg-bearing ('sponge') — let her go." }],
        rule: null,
      };
    }
    if (!edible) {
      return {
        action: "RELEASE",
        headline: "Let it go",
        summary: `TIDE doesn't recommend keeping this one. ${unverified}`,
        tone: "watch",
        checks: [],
        rule: null,
      };
    }
    return {
      action: "RULES",
      headline: "Check your state's rules",
      summary: unverified,
      tone: "unknown",
      checks: species.eggCheck
        ? [{ label: "Eggs", state: "pending", detail: "Check under the body for an orange-to-black egg mass." }]
        : [],
      rule: null,
    };
  }

  // 3. Season.
  if (rule.closed?.some((span) => inSpan(input.date, span))) {
    return {
      action: "RELEASE",
      headline: "Release it",
      summary: `Closed to all fishing today in ${where}.`,
      tone: "alert",
      checks: [{ label: "Season", state: "fail", detail: rule.season ?? "Closed today." }],
      rule,
    };
  }
  if (rule.harvest) {
    const open = rule.harvest.some((span) => inSpan(input.date, span));
    checks.push({
      label: "Season",
      state: open ? "pass" : "fail",
      detail: open ? `Open today · ${rule.season ?? ""}`.trim() : `Closed today · ${rule.season ?? ""}`.trim(),
    });
    if (!open) {
      return {
        action: "RELEASE",
        headline: "Release it",
        summary: `Out of season in ${where} — it goes back today.`,
        tone: "alert",
        checks,
        rule,
      };
    }
  }

  // 4. Eggs and sex.
  const needs = catchNeeds(species, rule);
  if (needs.eggs) {
    if (input.eggs === true) {
      checks.push({ label: "Eggs", state: "fail", detail: "Egg-bearing ('sponge') — it must go back immediately." });
    } else if (input.eggs === false) {
      checks.push({ label: "Eggs", state: "pass", detail: "No egg mass." });
    } else {
      checks.push({ label: "Eggs", state: "pending", detail: "Flip it: an orange-to-black sponge under the apron means eggs." });
    }
  }
  if (needs.female) {
    if (input.female === true) {
      checks.push({ label: "Female", state: "fail", detail: `${where} doesn't allow recreational crabbers to keep females.` });
    } else if (input.female === false) {
      checks.push({ label: "Male", state: "pass", detail: "Males may be kept." });
    } else {
      checks.push({
        label: "Male or female?",
        state: "pending",
        detail: "Males have a narrow, T-shaped apron; females a wide triangle or dome and red-tipped claws.",
      });
    }
  }

  // 5. Size.
  if (needs.size) {
    const min = minSizeOn(rule, input.date);
    const max = rule.max ?? null;
    const range =
      min !== null && max !== null
        ? `${formatInches(min)} to ${rule.maxExclusive ? "under " : ""}${formatInches(max)}`
        : min !== null
          ? `at least ${formatInches(min)}`
          : `up to ${formatInches(max ?? 0)}`;
    if (input.length === null) {
      checks.push({ label: "Size", state: "pending", detail: `Legal size: ${range}. Measure it.` });
    } else {
      const small = min !== null && input.length < min;
      const large = max !== null && (rule.maxExclusive ? input.length >= max : input.length > max);
      checks.push({
        label: "Size",
        state: small || large ? "fail" : "pass",
        detail: small
          ? `${formatInches(input.length)} is under the ${formatInches(min!)} minimum.`
          : large
            ? `${formatInches(input.length)} is over the slot (${range}).`
            : `${formatInches(input.length)} is inside the legal size (${range}).`,
      });
    }
  }

  const failed = checks.find((check) => check.state === "fail");
  if (failed) {
    return {
      action: "RELEASE",
      headline: "Release it",
      summary: failed.label === "Size" ? "Wrong size to keep — put it back gently." : `${failed.detail}`,
      tone: "alert",
      checks,
      rule,
    };
  }
  if (checks.some((check) => check.state === "pending")) {
    return {
      action: "CHECK",
      headline: "Check before you keep it",
      summary: "Answer the checks below and TIDE will make the call.",
      tone: "watch",
      checks,
      rule,
    };
  }
  return {
    action: "KEEP",
    headline: "You can keep it",
    summary: edible
      ? `Legal to keep in ${where} today${rule.bag ? `, within the limit: ${rule.bag.toLowerCase()}` : ""}.`
      : `Legal to keep in ${where}, but TIDE doesn't recommend eating it — see why below.`,
    tone: "safe",
    checks,
    rule,
  };
}

/* ─────────────  Found on land or in a stream  ───────────── */

export interface FindDecision {
  action: FindAction;
  headline: string;
  summary: string;
  tone: DecisionTone;
  legal: Check | null;
  rule: RegionRule | null;
}

export function decideFind(species: Species, region: RegionCode | null, onRoad: boolean): FindDecision {
  const rule = ruleFor(species.slug, region);
  const place = getRegion(region)?.name;
  const noTake = species.legallyProtected || rule?.kind === "no-take";

  const legal: Check | null = rule
    ? {
        label: rule.kind === "no-take" ? "Illegal to take" : rule.kind === "open" ? "Legal harvest exists" : "Good to know",
        state: rule.kind === "no-take" ? "fail" : "info",
        detail:
          rule.kind === "open"
            ? `${place ?? "Here"}: ${[rule.season, rule.bag].filter(Boolean).join(" · ") || "see the rule"}.`
            : (rule.notes?.[0] ?? ""),
      }
    : species.legallyProtected
      ? { label: "Protected", state: "fail", detail: species.protectionNote ?? "Legally protected." }
      : null;

  if (species.category === "turtle" && species.slug.includes("sea-turtle")) {
    return {
      action: "CALL",
      headline: "Call it in",
      summary: "Stranded, injured or hooked? Call NOAA's hotline at (866) 755-6622 and keep people and pets back.",
      tone: "alert",
      legal,
      rule,
    };
  }
  if (onRoad) {
    return {
      action: "HELP_ACROSS",
      headline: "Help it across — the way it was heading",
      summary:
        "Only if it's safe for you. Carry it across in the direction it was already going; turning it back just sends it onto the road again.",
      tone: "watch",
      legal,
      rule,
    };
  }
  return {
    action: "LEAVE",
    headline: species.invasive ? "Don't move it — report it" : "Leave it where it is",
    summary: species.invasive
      ? "Moving it spreads it. Report the sighting instead."
      : noTake
        ? `Taking it is illegal${place ? ` in ${place}` : ""}. The best thing you can do is let it carry on.`
        : "It lives its whole life in a small patch of habitat. Watch, take a photo, and let it carry on.",
    tone: noTake ? "alert" : "safe",
    legal,
    rule,
  };
}
