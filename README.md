# TIDE

**Marine intelligence in your hands.**

Photograph a marine animal. TIDE identifies the species, verifies it against live
biodiversity data, explains its conservation status and the threats it faces — and tells
you honestly whether it belongs on your plate.

> See it. Identify it. Understand it. Protect it.

Built for OwlHacks (theme: Deep Sea Aquatics).

---

## The idea

Most species apps stop at "here's what it is." TIDE's premise is that **"not endangered" is
not the same as "safe to eat."** A species can be Least Concern globally and still be
overfished, legally protected, or a poor choice in your region.

The app keeps those questions separate everywhere:

| Question | Source | Example |
| --- | --- | --- |
| How is the global population doing? | IUCN Red List (via GBIF) | Green sea turtle is **Least Concern** since 2023 |
| Is it legal to take? | Curated protection data | The same turtle is **protected** under the ESA and CITES — do not consume |
| Is the fishery sustainable here? | Curated regional fishing status | Atlantic cod is **Vulnerable** globally, healthy in the Barents Sea, overfished in the Gulf of Maine |

Atlantic bluefin tuna is the sharpest case: IUCN moved it from Endangered to Least Concern
in 2021, and sustainable-seafood programmes still say avoid it. TIDE shows both, and shows
alternatives instead of recipes.

## What it does

- **Identify** — camera capture or photo upload, analysed by a vision model that returns
  structured JSON with a calibrated confidence score and alternative candidates.
- **Never overclaims** — below 75% confidence the result leads with "We aren't completely
  sure" and lists what else it could be. Confidence is never rounded up to certainty.
- **Verify** — every species is checked against GBIF for accepted taxonomy, occurrence
  counts and the IUCN Red List category. Cached data is used when the network is down, and
  the UI says which one you're looking at.
- **Conservation** — status card with category, plain-English meaning, threats, and human
  impact, plus clickable sources.
- **Seafood logic** — four states (Protected / Not typically eaten / Common seafood /
  Check local guidance) driven by data, not vibes.
- **Recipes** — only for species that pass every check, with a sourcing advisory where it
  matters.
- **Alternatives** — protected or avoid-rated species surface sustainable swaps instead.
- **Discover** — species of the week, endangered species, common seafood, protected
  species, and sourced ocean facts.
- **Saved** — a local species log, stored on-device.
- **Demo Mode** — the full experience with preloaded photos, working with no network, no
  camera permission and no API key.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

The app is fully usable with no configuration: Demo Mode, Discover, Saved and all 30
species pages work out of the box. Live AI identification needs one key (below).

```bash
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run sync:data    # re-verify conservation data and re-fetch photography
```

## Environment variables

Copy `.env.example` to `.env.local`:

| Variable | Required | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | For live identification | Claude vision call in `lib/ai/vision.ts`. Get one at [console.anthropic.com](https://console.anthropic.com). |
| `TIDE_VISION_MODEL` | No | Overrides the model (default `claude-opus-5`). |

**No key configured?** `/api/identify` returns a clean `no_credentials` response and the UI
explains that live identification isn't set up and points at Demo Mode. It never fabricates
a result.

No database, no auth, no Supabase — saved species and history use `localStorage`, and the
in-flight scan uses `sessionStorage`. That was a deliberate scope decision: nothing in the
MVP needed a backend.

## Where the data comes from

TIDE does not invent conservation data. `npm run sync:data` queries public APIs and writes
`lib/data/generated/verified.json`:

- **GBIF** — accepted taxonomy, usage keys, occurrence counts (keyless).
- **IUCN Red List via GBIF** — the Red List category for each species (keyless mirror).
- **Wikipedia / Wikimedia Commons** — lead photography with author and licence attribution.
- **NOAA Fisheries** — species profile links, HEAD-checked so no dead links ship.

The script also **fails loudly on drift**: if a curated fallback category disagrees with the
live assessment, it prints a warning naming the species. That check caught five species
during development whose written context no longer matched the current Red List.

Where no assessment exists (blue crab, snow crab, lobster), the app says *Not Evaluated* and
explains that this is an absence of data, not a clean bill of health.

## Real vs mocked

**Production-ready**

- Vision identification via the Anthropic SDK with structured outputs, typed error handling
  (auth, rate limit, refusal), and size/format validation on upload.
- GBIF enrichment endpoint with a 4s timeout and cached fallback.
- The species dataset, conservation logic, seafood classification and recipe gating.
- Camera capture with client-side downscaling, permission and no-camera fallbacks.
- Static generation of all 30 species pages.

**Mocked or curated**

- **Demo Mode** scans are pre-written identifications, labelled "demo scan" in the UI.
- **Recipes** are hand-written templates, not AI-generated, labelled "curated by TIDE".
- **Regional fishing status and sourcing tips** are curated editorial content citing NOAA,
  ICCAT and Seafood Watch positions — not a live API. IUCN's own API needs a token, so the
  category comes through GBIF instead.
- **Alternatives** are a curated list rather than a sourcing database.

## Project structure

```
app/
  page.tsx                  home
  identify/                 camera + analysis flow
  species/[slug]/           species result page (static, 30 pages)
  species/unknown/          graceful result for species outside the dataset
  discover/  saved/  demo/
  api/identify/             vision endpoint
  api/enrich/               GBIF verification endpoint
components/
  ocean-background, bottom-nav, ui/, identify/, species/, home/
lib/
  data/species.ts           the curated dataset
  data/generated/           API-verified cache (written by sync:data)
  seafood.ts                the eat / don't-eat decision
  conservation.ts           status resolution and source links
  ai/vision.ts              the only file that talks to an AI provider
scripts/sync-data.mjs       data verification + photo sync
```

## Deploying

Deploys to Vercel as-is. Push the repo, import it, and set `ANTHROPIC_API_KEY` in project
settings if you want live identification. The generated data cache and photography are
committed, so a fresh clone builds without network access to the data APIs.

## Accessibility

Conservation status is never colour alone — every badge carries an icon, the category code
and the written label. Semantic HTML, labelled controls, visible focus rings, `aria-live`
on the analysis stages, 44px+ touch targets, and full `prefers-reduced-motion` support.

## Photography

Species and dish photography comes from Wikimedia Commons under its respective licences.
Attribution is fetched with each image and displayed on the species page.
