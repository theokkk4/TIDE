# TIDE

**Keep it or let it go?**

Snap your catch — or the turtle on the trail. TIDE identifies it, checks your state's
rules, and tells you whether to keep it, release it, or leave it be. When it's legal to keep
and the species isn't endangered, it hands you a recipe too.

Built for OwlHacks 2026 (theme: Deep Sea Aquatics) by Theodore, Issaka and Oliver —
starting from Theodore's summers crabbing and bass fishing in South Jersey.

---

## What it does

- **Identify** — camera or upload, analysed by Google Gemini vision with a calibrated
  confidence score and look-alikes. Below 75% it leads with "We aren't completely sure."
- **Keep or release** — for anything caught on a line or in a pot. Pick New Jersey,
  Pennsylvania or Maryland and TIDE applies that state's size limit, slot, season, egg-bearing
  and female rules to your catch. Every verdict lists the checks that produced it and cites
  the official rule with the date it was checked.
- **On-screen crab gauge** — calibrate once against any bank card (2.125″ short edge) and
  the phone becomes a ruler with your state's legal line drawn on it.
- **Found one?** — for turtles and amphibians: leave it, help it across the road the way it
  was heading, or call it in (sea turtles), plus what's illegal where you are and how to stay
  safe (snapping-turtle bites, toad toxins, Salmonella).
- **Invasive species** — snakeheads get "don't put it back," per NJ, PA and MD rules.
- **Recipes** — only when a species is legal to keep and passes every conservation check.
  Endangered species (American eel) get the rule and no recipes.
- **Conservation data** — IUCN category via GBIF for all 50 species, verified at build time.
- **Demo Mode** — six scenarios (sponge crab, striped bass slot, snakehead, box turtle on the
  road, hellbender, sea turtle) with no network, camera or API key.

## Where the rules come from

`lib/data/regulations.ts` holds keep-or-release rules for New Jersey, Pennsylvania and
Maryland plus federal protections, each read from its official source on the date in
`RULES_CHECKED`: the NJ and MD 2026 regulation guides, 58 Pa. Code § 79.3, the PA Fish & Boat
Commission, NOAA Fisheries and US Fish & Wildlife. Where a state rule hasn't been verified, the
app says so and links the agency instead of guessing a number. `lib/decision.ts` turns those
rules into a verdict; the story site's interactive uses the same engine, so the two can't
disagree. TIDE never estimates size from a photo — the person measures.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000 for the app and http://localhost:3000/dive for the story site.

> **zsh users:** run each command on its own line with nothing after it. Interactive zsh
> doesn't treat a trailing `# comment` as a comment the way bash does, so
> `npm run dev # some note` gets passed to Next.js as a literal argument and crashes with
> "Invalid project directory provided."

The app is fully usable with no configuration: Demo Mode, Discover, Saved and all 30
species pages work out of the box. Live AI identification needs one key (below).

| Command | Does |
| --- | --- |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run sync:data` | Re-verify conservation data and re-fetch photography |

## The story site — `/dive`

A scroll-driven submission page: scrolling is a dive from the surface to Challenger Deep
(10,935 m) and back, with a live depth gauge, a chapter per idea, and an interactive piece in
each — judge three real catches under NJ and MD rules, a found-turtle quiz, the recipe plot
twist, the rules explorer for all 50 species, a drifting river of every species photo, and
the real app running inside a phone frame.
Every number on it is computed from the verified data.

- **Living ocean.** Canvas-drawn creatures swim at their real depths: a sardine bait ball
  that scatters from your cursor, a green sea turtle, a humpback, moon and comb jellies,
  lanternfish, siphonophores, a diving sperm whale, Atolla (which flashes its blue "burglar
  alarm" when you come close), a dumbo octopus, snailfish and hadal amphipods, and a manta
  overhead when you resurface. Below 2,000 m an anglerfish follows your cursor and its lure
  is the only light.
- **Hover to identify.** Point at any creature and TIDE's scanner locks on with a field ID.
  Statuses come from the verified dataset or were checked against the IUCN Red List via GBIF
  (`lib/dive/creatures.ts`); species in the app link through to their verdict.
- **Motion.** Lenis smooth scrolling, masked word reveals, cards that stand up out of the
  water, and a CSS-only intro curtain. All of it respects
  `prefers-reduced-motion`.
- Team names and hackathon tracks live in `lib/dive/content.ts`.
- **Theodore's chapter** tells the South Jersey crabbing story with his night-crabbing Live
  Photo. Drop more photos at `public/dive/story/crab.jpg`, `bay.jpg` or `moon.jpg` and they
  appear automatically.
- **Three catches**, **Found one?** and **Plot twist** run on the app's own decision engine.
- **The Impact** pairs sourced baselines (RBFF, NOAA, IUCN, Gibbs & Shriver, SERC) with an
  adjustable projection model — the assumptions are sliders, labelled as projections.
- Drop a portrait screen recording at `public/dive/demo.mp4` and the deep chapter adds a
  "Watch the demo" view alongside the live app.

## Environment variables

Copy `.env.example` to `.env.local`:

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | For live identification | Google Gemini vision call in `lib/ai/vision.ts`. Get one at [aistudio.google.com/apikey](https://aistudio.google.com/apikey). |
| `GEMINI_MODEL` | No | Overrides the model (default `gemini-flash-latest`). |
| `ANTHROPIC_API_KEY` | No | Fallback provider (Claude), used only when `GEMINI_API_KEY` is empty. |

On Vercel, add `GEMINI_API_KEY` under Project → Settings → Environment Variables and
redeploy.

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

- Vision identification via the Google Gemini API with structured JSON output, typed error
  handling (bad key, rate limit, blocked image, timeout), and size/format validation on upload.
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
  (app)/                    the mobile app, framed in a phone-width column
    page.tsx                home
    identify/               camera + analysis flow
    species/[slug]/         species result page (static, 30 pages)
    species/unknown/        graceful result for species outside the dataset
    discover/  saved/  demo/  credits/
  (story)/dive/             the scroll-story submission site, full width
  api/identify/             vision endpoint
  api/enrich/               GBIF verification endpoint
components/
  ocean-background, bottom-nav, ui/, identify/, species/, home/
  dive/                     depth HUD, reveals, species river, interactive chapters
  dive/ocean/               the creature engine (canvas) for /dive
lib/
  dive/content.ts           team, tracks and impact numbers for /dive
  data/species.ts           the curated dataset
  data/generated/           API-verified cache (written by sync:data)
  seafood.ts                the eat / don't-eat decision
  conservation.ts           status resolution and source links
  ai/vision.ts              the only file that talks to an AI provider
scripts/sync-data.mjs       data verification + photo sync
```

## Deploying

Deploys to Vercel as-is. Push the repo, import it, and set `GEMINI_API_KEY` in project
settings if you want live identification. The generated data cache and photography are
committed, so a fresh clone builds without network access to the data APIs.

## Accessibility

Conservation status is never colour alone — every badge carries an icon, the category code
and the written label. Semantic HTML, labelled controls, visible focus rings, `aria-live`
on the analysis stages, 44px+ touch targets, and full `prefers-reduced-motion` support.

## Photography

Species and dish photography comes from Wikimedia Commons under its respective licences.
Attribution is fetched with each image; species pages credit their photo inline, and
`/credits` lists every image in the app. `npm run sync:data` warns if any photo lacks a
credit, and a failed refresh keeps the previously verified record rather than dropping it.
