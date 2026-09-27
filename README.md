# TIDE

**Keep it or let it go?**

Snap your catch — or the turtle on the trail. TIDE identifies it, checks your state's
rules, and tells you whether to keep it, release it, or leave it be. When it's legal to keep
and the species isn't endangered, it hands you a recipe too.

Built for OwlHacks 2026 (theme: Deep Sea Aquatics) by Theodore, Issaka and Oliver —
starting from Theodore's summers crabbing and bass fishing in South Jersey.

---

## What it does

- **Identify** — camera or upload, analyzed by Google Gemini vision with a calibrated
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

The app is fully usable with no configuration: Demo Mode, Discover, Saved and all 50
species pages work out of the box. Live AI identification needs one key (below).

| Command | Does |
| --- | --- |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run sync:data` | Re-verify conservation data and re-fetch photography |

## The presentation — `/dive`

The Dive page is the pitch. It's a scroll-driven site that doubles as the slide deck: each
chapter sits at a depth on the way down to Challenger Deep and back up.

| # | Chapter | What's on it |
| --- | --- | --- |
| 01 | TIDE | The opening. |
| 02 | The problem | FAO figures: 3.1 billion people, 89%, 600M+ livelihoods, 64.5% of stocks within sustainable levels — each with its source and date. |
| 03 | Why it matters | Food, fishing, conservation, families, future generations. |
| 04 | The people | Oliver, Theodore and Issaka, with their baby photos. |
| 05 | The idea | Photo → AI → Species → Conservation → Sustainability → Action. |
| 06 | The app | The real app, live in a phone frame, plus a link to open it. |
| 07 | Live identification | Theodore's crab photo sent through Gemini, inside the phone. |
| 08 | Conservation vs. seafood | Five cases, all judged by the app's own logic, then every species. |
| 09 | Projected outcomes | Published data on one side, our 12-month targets on the other — labelled as projections, with how we'd measure each. |
| 10 | Resurface | The closing, the sources, then a "Questions?" slide that loops the app recordings for Q&A. |

**Presenting.** Open `/dive` full screen (F11, or ⌃⌘F on a Mac) on the laptop driving the
projector. → ↓ PageDown go forward and ← ↑ PageUp go back, which is what most presentation
clickers send; Home and End jump to the first and last slide. Every press is one slide:

- Each slide is exactly one screen tall. On a smaller projector (1366×768, 1280×720, 4:3) a
  slide that wouldn't fit is scaled down until it does (`components/dive/slide-fit.tsx`), so
  nothing is ever cut off.
- Moving to a new chapter, a wave sweeps up the screen and the slide changes behind it; within
  a chapter the screen dips to dark (`components/dive/presentation-keys.tsx`). Both are two
  plain overlays animated with the Web Animations API, hidden between transitions.
- The clicker keeps working after someone taps inside the embedded app. Typing in a field or
  using a slider keeps its own arrow keys. Mouse and touch scrolling are never taken over, and
  the header shows where you are ("04 / 10 · The people").
- The last slide stays up through Q&A: it plays the recordings one after another and starts
  over, and only while it's on screen.

**Team content** lives in `lib/dive/content.ts`:

- **Baby photos** — drop `oliver.jpg`, `theodore.jpg` and `issaka.jpg` into `public/dive/team/`
  (`.png` and `.webp` work too). They appear automatically; until then each frame shows an
  initial.
- **More photos** — add a `gallery` to anyone's story (Oliver's has two) and they show as a
  row of prints under it.
- **A photo beside the story** — `aside` puts one tall photo on the same slide (Issaka's
  shore photo).
- **Stories** — each person's `paragraphs`, `quote` and `tagline`, in their own words. A story
  set to `null` shows a clearly marked "Story coming soon" box instead of anything made up.
- **Q&A reel** — the "Questions?" slide plays `QUEUE` in `components/dive/app-clips.tsx`
  (`questions`, then the three scans below) back to back, forever. Add a clip by putting
  `<id>.mp4`, `<id>.webm` and `<id>.jpg` in `public/dive/app/` and adding the id to `QUEUE`.
- **App recordings** — chapter 05 loops three real scans from `public/dive/app/` (blue crab,
  striped bass, box turtle). Each clip plays only while it's on screen, starts from a poster
  frame, and has its own pause button; with reduced motion they wait for a tap. Each is an
  H.264 `.mp4` with a VP9 `.webm` fallback, cut from the screen recordings with:
  `ffmpeg -i in.mov -an -vf "crop=960:1600:800:0,scale=480:-2,fps=30" -c:v libx264 -crf 27 -preset slow -pix_fmt yuv420p -movflags +faststart out.mp4`
  (for the `.webm`: `-c:v libvpx-vp9 -b:v 0 -crf 38`; adjust the crop to where the app sits
  in your recording).
- **Demo video** — save a portrait screen recording as `public/dive/demo.mp4` and the phone in
  chapters 06–07 gets a "Recording / Live app" switch.

The creatures are drawn on canvas and swim at their real depths — sardines and a green sea
turtle near the surface, lanternfish and siphonophores in the twilight, an anglerfish whose
lure follows your cursor in the dark, and a herd of sea pigs (*Scotoplanes globosa*) on the
seafloor. Click one and the page glides to the field guide, opening its verdict when TIDE
covers that species (`lib/dive/creatures.ts`). All motion respects `prefers-reduced-motion`.

## Environment variables

Copy `.env.example` to `.env.local`:

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | For live identification | Google Gemini vision call in `lib/ai/vision.ts`. Get one at [aistudio.google.com/apikey](https://aistudio.google.com/apikey). |
| `GEMINI_MODEL` | No | Tried first, before the built-in list. Leave unset normally. |
| `ANTHROPIC_API_KEY` | No | Fallback provider (Claude), used only when `GEMINI_API_KEY` is empty. |

The key is only ever read on the server, in `/api/identify`; it never reaches the browser and
is never logged. `.env.local` is git-ignored — keep the key there, and in Vercel's settings.

**Which model.** TIDE asks `gemini-flash-latest` first — Google's current Flash model. If it's
overloaded (429/5xx) TIDE moves on to `gemini-flash-lite-latest`, then `gemini-3-flash-preview`,
and skips an overloaded model for a minute so the next photo isn't slowed down. If Google
retires all of them, it asks the API for a current Flash model. Every attempt stays inside the
route's 60-second limit.

**When it can't identify.** Each failure has its own screen: offline (no key, or a blocked
Google project), busy (try again with the same photo), a photo problem (with tips), or an
animal outside TIDE's guide. The Dive page's crab sample also offers the result Gemini gave for
that photo when it was added, labelled as a demo scan. Nothing is ever faked as a live result.

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
- Static generation of all 50 species pages.

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
    species/[slug]/         species result page (static, 50 pages)
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

1. Vercel → the project → Settings → Environment Variables → add `GEMINI_API_KEY`, ticked for
   Production, Preview and Development.
2. Deployments → ⋯ on the latest → Redeploy (environment changes only apply to new builds).
3. Settings → Domains lists the public production address. Share that address plus `/dive`.
   The `…-projects.vercel.app` preview links ask for a Vercel login.

## Accessibility

Conservation status is never color alone — every badge carries an icon, the category code
and the written label. Semantic HTML, labelled controls, visible focus rings, `aria-live`
on the analysis stages, 44px+ touch targets, and full `prefers-reduced-motion` support.

## Photography

Species and dish photography comes from Wikimedia Commons under its respective licences.
Attribution is fetched with each image; species pages credit their photo inline, and
`/credits` lists every image in the app. `npm run sync:data` warns if any photo lacks a
credit, and a failed refresh keeps the previously verified record rather than dropping it.
