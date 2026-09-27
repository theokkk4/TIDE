import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { AiIdentification } from "@/lib/types";

/**
 * The only file in TIDE that talks to an AI provider. Everything downstream consumes
 * the `AiIdentification` shape. Google Gemini is the primary provider (GEMINI_API_KEY);
 * Claude is kept as a fallback when only ANTHROPIC_API_KEY is configured.
 */

const IdentificationSchema = z.object({
  species_common_name: z
    .string()
    .describe("Most likely common name, e.g. 'Green Sea Turtle'. Empty string if unidentifiable."),
  scientific_name: z.string().describe("Binomial name, e.g. 'Chelonia mydas'. Empty string if unsure."),
  confidence: z.number().describe("Calibrated confidence from 0 to 100 that the identification is correct."),
  animal_type: z
    .string()
    .describe("Broad group: turtle, fish, shark, ray, crustacean, cephalopod, marine mammal, other."),
  visual_reasoning: z
    .string()
    .describe("One or two sentences naming the visible features that drove the identification."),
  possible_alternatives: z
    .array(z.string())
    .describe("Up to three other species the photo could plausibly show, most likely first."),
  is_supported_animal: z
    .boolean()
    .describe(
      "True for any animal that lives in or around water: fish, sharks and rays, crabs, lobsters, shrimp and other shellfish, squid and octopus, jellyfish, marine mammals (dolphins, whales, seals, manatees, sea otters), turtles (sea, freshwater or land), frogs, toads, salamanders and newts. False for land mammals, birds, insects, people, plated food, or an image with no animal in it.",
    ),
  egg_mass_visible: z
    .enum(["yes", "no", "unknown"])
    .describe("Crabs and lobsters only: is an egg mass ('sponge') visible under the body? 'unknown' if the underside isn't visible or it isn't a crustacean."),
  crab_sex: z
    .enum(["male", "female", "unknown"])
    .describe("Crabs only, when the apron or claw tips show it (e.g. blue crab: narrow T-shaped apron = male; wide apron or red claw tips = female). Otherwise 'unknown'."),
});

const SYSTEM_PROMPT = `You identify animals from photographs for TIDE, an app that helps anglers and crabbers decide what to keep and what to release, and helps people who find a turtle or amphibian know what to do.

Rules:
- Identify the animal that is actually in the photo, wherever in the world it lives. Rare, endangered and unusual species (a handfish, a sawfish, a sturgeon, a deep-sea fish) are expected; never default to a common North American game fish just because the photo is unclear.
- Look at the whole body plan before naming it: fin shape and placement (including pectoral fins used like hands or legs), head and mouth shape, any lure or crest on the head, skin texture (scaled, smooth, warty), and colour pattern.
- Use the standard English common name, never a regional nickname: say "Striped Bass", not "rockfish"; "Tautog", not "blackfish".
- Most TIDE users fish the US Atlantic coast (New Jersey, Pennsylvania, Maryland). When a photo can't separate an Atlantic species from a look-alike elsewhere (Atlantic vs. Pacific halibut, for example), prefer the Atlantic one and list the other in possible_alternatives.
- Tunas: Atlantic bluefin has short pectoral fins that end well before the second dorsal fin and a very deep, heavy body; yellowfin has long pectoral fins and long, sickle-shaped yellow second dorsal and anal fins.
- Prefer living species over ones that are extinct, possibly extinct or known only from old specimens, unless the photo is clearly a museum specimen or fossil. A pink handfish with red spots and red fins, photographed alive, is a red handfish (Thymichthys politus).
- Always fill scientific_name with at least the genus (e.g. "Sebastes sp.") when you can narrow it that far; leave it empty only if you can't.
- Photos may show a dead animal on a deck or dock, an animal injured or with bulging eyes from being pulled up from depth, or a photo of a screen. Identify it anyway, and lower the confidence for a poor or partial view.
- Report calibrated confidence. A clear, close photo of a distinctive species may justify 90+; a blurry or partial photo should be well below 70. Never report 100.
- When several species are plausible, say so in possible_alternatives rather than committing to one.
- Identify to species level only when visible features support it. Otherwise give the genus or the common group name and lower the confidence accordingly.
- Base visual_reasoning strictly on features visible in the image: shell scute pattern, fin shape and placement, colouration, body proportions, claw form, apron shape.
- Never estimate the animal's size or length: legal size limits are decided by the person measuring, not from a photo.
- Only report egg_mass_visible or crab_sex from what is actually visible. When unsure, say "unknown" — the person will be asked to check.
- Set is_supported_animal to true for every animal that lives in or around water, marine mammals like dolphins, whales and seals included. Set it to false for mammals that live on land, birds, insects, people, food on a plate, or images with no animal in them. Cooked or plated seafood is not a live animal.`;

export type VisionFailure = "no_credentials" | "provider_error" | "unreadable";

export interface VisionResult {
  ok: boolean;
  identification: AiIdentification | null;
  failure?: VisionFailure;
  message?: string;
}

type MediaType = "image/jpeg" | "image/png" | "image/webp";

/** Names a Gemini key is commonly saved under in a host's settings. GEMINI_API_KEY is the one to use. */
const GEMINI_KEY_NAMES = ["GEMINI_API_KEY", "GOOGLE_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GEMINI_KEY"];

/**
 * The Gemini key, read on the server only. Stray spaces or quotes pasted into a dashboard
 * are trimmed, so a key that works locally works when deployed too.
 */
export function geminiApiKey() {
  for (const name of GEMINI_KEY_NAMES) {
    const value = process.env[name]?.trim().replace(/^["']+|["']+$/g, "").trim();
    if (value) return value;
  }
  return null;
}

export function visionProvider(): "gemini" | "claude" | null {
  if (geminiApiKey()) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  return null;
}

export function hasVisionCredentials() {
  return visionProvider() !== null;
}

export async function identifyMarineAnimal(imageBase64: string, mediaType: MediaType): Promise<VisionResult> {
  const provider = visionProvider();
  if (provider === "gemini") return identifyWithGemini(imageBase64, mediaType);
  if (provider === "claude") return identifyWithClaude(imageBase64, mediaType);
  return {
    ok: false,
    identification: null,
    failure: "no_credentials",
    message: "AI identification is not configured on this deployment.",
  };
}

function finish(parsed: z.infer<typeof IdentificationSchema>): VisionResult {
  // Some models answer on a 0–1 scale despite being asked for 0–100.
  const confidence = parsed.confidence <= 1 ? parsed.confidence * 100 : parsed.confidence;
  return {
    ok: true,
    identification: {
      ...parsed,
      confidence: Math.max(0, Math.min(99, Math.round(confidence))),
      possible_alternatives: parsed.possible_alternatives.slice(0, 3),
    },
  };
}

/* ─────────────  Google Gemini (primary)  ───────────── */

/** Gemini's structured-output schema: the same fields as IdentificationSchema. */
const GEMINI_SCHEMA = {
  type: "OBJECT",
  properties: {
    species_common_name: { type: "STRING" },
    scientific_name: { type: "STRING" },
    confidence: { type: "NUMBER" },
    animal_type: { type: "STRING" },
    visual_reasoning: { type: "STRING" },
    possible_alternatives: { type: "ARRAY", items: { type: "STRING" } },
    is_supported_animal: { type: "BOOLEAN" },
    egg_mass_visible: { type: "STRING", enum: ["yes", "no", "unknown"] },
    crab_sex: { type: "STRING", enum: ["male", "female", "unknown"] },
  },
  required: [
    "species_common_name",
    "scientific_name",
    "confidence",
    "animal_type",
    "visual_reasoning",
    "possible_alternatives",
    "is_supported_animal",
    "egg_mass_visible",
    "crab_sex",
  ],
  propertyOrdering: [
    "species_common_name",
    "scientific_name",
    "confidence",
    "animal_type",
    "visual_reasoning",
    "possible_alternatives",
    "is_supported_animal",
    "egg_mass_visible",
    "crab_sex",
  ],
};

const FIELD_GUIDE = Object.entries(IdentificationSchema.shape)
  .map(([key, field]) => `- ${key}: ${field.description ?? ""}`)
  .join("\n");

/**
 * Current Flash models, best first. The "-latest" aliases follow Google's releases, so the
 * list keeps working when a model is retired; the preview is there for when both are
 * overloaded. GEMINI_MODEL, when set, is tried before any of them.
 */
const GEMINI_MODELS = [
  "gemini-flash-latest",
  "gemini-3.8-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.7-flash",
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-flash-lite-latest",
  "gemini-3.5-flash-lite",
];

/** Everything, fallbacks included, has to finish inside the route's time limit. */
const DEADLINE_MS = 40_000;
const ATTEMPT_MS = 15_000;
/**
 * Google's models go through spells of "high demand". Rather than wait out a slow one, the
 * next model starts alongside it after this long (or at once, if one fails), and the first
 * good answer wins.
 */
const HEDGE_MS = 4_000;
const MAX_IN_FLIGHT = 3;
/** A model that answered 429 or 5xx is skipped for a minute, so the next photo isn't slowed by it. */
const COOLDOWN_MS = 60_000;

const coolingUntil = new Map<string, number>();
/** Models this key can't use (404). Never retried. */
const unavailable = new Set<string>();

function modelOrder() {
  const pinned = process.env.GEMINI_MODEL?.trim();
  const models = [...new Set([...(pinned ? [pinned] : []), ...GEMINI_MODELS])].filter((m) => !unavailable.has(m));
  const now = Date.now();
  const cooling = (model: string) => (coolingUntil.get(model) ?? 0) > now;
  // If every model is cooling down, try them anyway, in order.
  return [...models.filter((m) => !cooling(m)), ...models.filter(cooling)];
}

/**
 * If Google retires every model above, ask the API which Flash models this key can use
 * and pick the newest stable one, rather than failing on demo day.
 */
async function discoverGeminiModel(apiKey: string): Promise<string | null> {
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", {
      headers: { "x-goog-api-key": apiKey },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
    const candidates = (data.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name.replace(/^models\//, ""))
      .filter((name) => /^gemini-.*flash/.test(name) && !/(lite|image|tts|audio|live|omni|embedding|thinking|transcribe)/.test(name))
      .filter((name) => !unavailable.has(name));
    const score = (name: string) => {
      const version = Number.parseFloat(/gemini-(\d+(?:\.\d+)?)/.exec(name)?.[1] ?? "0");
      const unstable = /(preview|exp)/.test(name) ? 1 : 0;
      return version * 10 - unstable * 5;
    };
    return candidates.sort((a, b) => score(b) - score(a))[0] ?? null;
  } catch {
    return null;
  }
}

function geminiRequest(model: string, imageBase64: string, mediaType: MediaType, signal: AbortSignal) {
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    signal,
    headers: { "content-type": "application/json", "x-goog-api-key": geminiApiKey() ?? "" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: `${SYSTEM_PROMPT}\n\nFields:\n${FIELD_GUIDE}` }] },
      contents: [
        {
          role: "user",
          parts: [
            { inline_data: { mime_type: mediaType, data: imageBase64 } },
            { text: "Identify the animal in this photograph. Check its body plan and distinctive features before you name it." },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: GEMINI_SCHEMA,
      },
    }),
  });
}

/** One try against one model. `retry` outcomes move on to the next model; `final` ones don't. */
type Attempt =
  | { outcome: "ok"; result: VisionResult }
  | { outcome: "final"; result: VisionResult; detail: string }
  | { outcome: "retry"; reason: "busy" | "gone" | "timeout" | "failed"; detail: string };

const failure = (failure: VisionFailure, message: string): VisionResult => ({
  ok: false,
  identification: null,
  failure,
  message,
});

async function attemptGemini(
  model: string,
  imageBase64: string,
  mediaType: MediaType,
  timeoutMs: number,
  cancel: AbortSignal,
): Promise<Attempt> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  // Another model already answered: stop waiting on this one.
  const onCancel = () => controller.abort();
  cancel.addEventListener("abort", onCancel);
  try {
    const response = await geminiRequest(model, imageBase64, mediaType, controller.signal);

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      let reason = "";
      try {
        reason = (JSON.parse(body) as { error?: { message?: string } }).error?.message ?? "";
      } catch {
        /* not JSON */
      }
      const detail = `${response.status} ${reason}`.trim();
      if (response.status === 404) return { outcome: "retry", reason: "gone", detail };
      if (response.status === 429 || response.status >= 500) return { outcome: "retry", reason: "busy", detail };
      if (/denied access/i.test(reason)) {
        return {
          outcome: "final",
          detail,
          result: failure("no_credentials", "Google has blocked the project this Gemini key belongs to. A key from another project will work."),
        };
      }
      if (/API_KEY_INVALID|API key not valid|API key expired/i.test(body)) {
        return { outcome: "final", detail, result: failure("no_credentials", "The Gemini API key isn't valid.") };
      }
      if (response.status === 401 || response.status === 403) {
        return { outcome: "final", detail, result: failure("no_credentials", "This Gemini API key can't use the Gemini API.") };
      }
      // Anything else is this model's problem (an unsupported option, say), so try the next one.
      return { outcome: "retry", reason: "failed", detail };
    }

    const data = (await response.json()) as {
      candidates?: { finishReason?: string; content?: { parts?: { text?: string }[] } }[];
      promptFeedback?: { blockReason?: string };
    };
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    if (data.promptFeedback?.blockReason || !text) {
      return { outcome: "final", detail: "no content", result: failure("unreadable", "We couldn't analyze this image.") };
    }

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return { outcome: "retry", reason: "failed", detail: "malformed JSON" };
    }
    const parsed = IdentificationSchema.safeParse(json);
    if (!parsed.success) return { outcome: "retry", reason: "failed", detail: "response didn't match the schema" };
    return { outcome: "ok", result: finish(parsed.data) };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { outcome: "retry", reason: "timeout", detail: `no answer in ${Math.round(timeoutMs / 1000)}s` };
    }
    return { outcome: "retry", reason: "failed", detail: "network error" };
  } finally {
    clearTimeout(timer);
    cancel.removeEventListener("abort", onCancel);
  }
}

async function identifyWithGemini(imageBase64: string, mediaType: MediaType): Promise<VisionResult> {
  const started = Date.now();
  const queue = modelOrder();
  const cancel = new AbortController();
  let discovered = false;
  let inFlight = 0;
  let last: Extract<Attempt, { outcome: "retry" }> | null = null;

  return new Promise<VisionResult>((resolve) => {
    let settled = false;
    let hedge: ReturnType<typeof setTimeout> | undefined;

    const finish = (result: VisionResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(hedge);
      clearTimeout(deadline);
      cancel.abort();
      resolve(result);
    };
    const giveUp = () => {
      if (last?.reason === "timeout") return finish(failure("provider_error", "Identification timed out. Try again."));
      if (last?.reason === "gone") return finish(failure("provider_error", "None of Gemini's Flash models are available to this key."));
      if (last?.reason === "failed") return finish(failure("unreadable", "We couldn't analyze this image."));
      finish(failure("provider_error", "Gemini is busy right now. Try again in a moment."));
    };
    const deadline = setTimeout(giveUp, DEADLINE_MS);

    const launch = async (): Promise<void> => {
      if (settled) return;
      clearTimeout(hedge);
      let model = queue.shift();
      // Every model we know about has been retired: ask Google for a current one.
      if (!model && !discovered) {
        discovered = true;
        model = (await discoverGeminiModel(geminiApiKey() ?? "")) ?? undefined;
      }
      const remaining = DEADLINE_MS - (Date.now() - started);
      if (!model || remaining < 2_000) {
        if (inFlight === 0) giveUp();
        return;
      }

      inFlight++;
      // If nobody has answered in a few seconds, start the next model alongside this one.
      hedge = setTimeout(() => {
        if (inFlight < MAX_IN_FLIGHT) void launch();
      }, HEDGE_MS);

      const attempt = await attemptGemini(model, imageBase64, mediaType, Math.min(ATTEMPT_MS, remaining), cancel.signal);
      inFlight--;
      if (settled) return;

      if (attempt.outcome === "ok") {
        coolingUntil.delete(model);
        return finish(attempt.result);
      }
      if (attempt.outcome === "final") {
        console.warn(`[identify] ${model}: ${attempt.detail}`);
        return finish(attempt.result);
      }
      last = attempt;
      if (attempt.reason === "gone") unavailable.add(model);
      if (attempt.reason === "busy" || attempt.reason === "timeout") coolingUntil.set(model, Date.now() + COOLDOWN_MS);
      console.warn(`[identify] ${model}: ${attempt.detail} — trying the next model`);
      // A failure starts the next model straight away.
      void launch();
    };

    void launch();
  });
}

/* ─────────────  Claude (fallback)  ───────────── */

async function identifyWithClaude(imageBase64: string, mediaType: MediaType): Promise<VisionResult> {

  // Some keys aren't pinned to a single workspace and need the target workspace named
  // explicitly, or every request is rejected with a 400 before it reaches the model.
  const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;
  const client = new Anthropic(
    workspaceId ? { defaultHeaders: { "anthropic-workspace-id": workspaceId } } : undefined,
  );

  try {
    const response = await client.messages.parse({
      model: process.env.TIDE_VISION_MODEL ?? "claude-opus-5",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      output_config: {
        format: zodOutputFormat(IdentificationSchema),
        // Species identification from a single photo does not need deep reasoning,
        // and the capture flow is latency-sensitive.
        effort: "low",
      },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
            {
              type: "text",
              text: "Identify the animal in this photograph. Check its body plan and distinctive features before you name it.",
            },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return {
        ok: false,
        identification: null,
        failure: "unreadable",
        message: "We couldn't analyze this image.",
      };
    }

    const parsed = response.parsed_output;
    if (!parsed) {
      return {
        ok: false,
        identification: null,
        failure: "unreadable",
        message: "We couldn't read a result from this image.",
      };
    }

    return finish(parsed);
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return {
        ok: false,
        identification: null,
        failure: "no_credentials",
        message: "The configured AI credentials were rejected.",
      };
    }
    if (error instanceof Anthropic.RateLimitError) {
      return {
        ok: false,
        identification: null,
        failure: "provider_error",
        message: "Identification is busy right now. Try again in a moment.",
      };
    }
    return {
      ok: false,
      identification: null,
      failure: "provider_error",
      message: error instanceof Error ? error.message : "Identification failed.",
    };
  }
}
