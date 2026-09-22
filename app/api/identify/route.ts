import { NextResponse } from "next/server";
import { identifyMarineAnimal, hasVisionCredentials } from "@/lib/ai/vision";
import { matchSpecies } from "@/lib/matching";
import { resolveStatusCode } from "@/lib/conservation";
import type { IdentifyResponse } from "@/lib/types";

export const runtime = "nodejs";
/** Photos are user data — never cache an identification response. */
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const SUPPORTED = ["image/jpeg", "image/png", "image/webp"] as const;
type SupportedType = (typeof SUPPORTED)[number];

function parseDataUrl(dataUrl: string) {
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const [, mediaType, data] = match;
  if (!SUPPORTED.includes(mediaType as SupportedType)) return null;
  return { mediaType: mediaType as SupportedType, data };
}

export async function POST(request: Request) {
  let body: { image?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<IdentifyResponse>(
      {
        ok: false,
        identification: null,
        matchedSlug: null,
        source: "ai",
        error: "unreadable",
        message: "We couldn't read that photo.",
      },
      { status: 400 },
    );
  }

  const parsed = body.image ? parseDataUrl(body.image) : null;
  if (!parsed) {
    return NextResponse.json<IdentifyResponse>(
      {
        ok: false,
        identification: null,
        matchedSlug: null,
        source: "ai",
        error: "unreadable",
        message: "That image format isn't supported. Try a JPEG or PNG photo.",
      },
      { status: 400 },
    );
  }

  // base64 inflates by ~4/3, so compare against the decoded size.
  if ((parsed.data.length * 3) / 4 > MAX_IMAGE_BYTES) {
    return NextResponse.json<IdentifyResponse>(
      {
        ok: false,
        identification: null,
        matchedSlug: null,
        source: "ai",
        error: "unreadable",
        message: "That photo is too large. Try a smaller image.",
      },
      { status: 413 },
    );
  }

  if (!hasVisionCredentials()) {
    return NextResponse.json<IdentifyResponse>({
      ok: false,
      identification: null,
      matchedSlug: null,
      source: "ai",
      error: "no_credentials",
      message: "Live AI identification isn't configured on this deployment.",
    });
  }

  const result = await identifyMarineAnimal(parsed.data, parsed.mediaType);

  if (!result.ok || !result.identification) {
    return NextResponse.json<IdentifyResponse>({
      ok: false,
      identification: null,
      matchedSlug: null,
      source: "ai",
      error: result.failure ?? "provider_error",
      message: result.message,
    });
  }

  const identification = result.identification;

  if (!identification.is_marine_animal) {
    return NextResponse.json<IdentifyResponse>({
      ok: false,
      identification,
      matchedSlug: null,
      source: "ai",
      error: "not_marine",
      message: "That doesn't look like a marine animal.",
    });
  }

  const match = matchSpecies(identification.species_common_name, identification.scientific_name);

  return NextResponse.json<IdentifyResponse>({
    ok: true,
    identification,
    matchedSlug: match?.slug ?? null,
    matched: match
      ? {
          slug: match.slug,
          commonName: match.commonName,
          scientificName: match.scientificName,
          statusCode: resolveStatusCode(match),
          emoji: match.emoji,
        }
      : null,
    source: "ai",
  });
}
