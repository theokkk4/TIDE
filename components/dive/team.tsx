import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import type { ReactNode } from "react";
import type { TeamStory } from "@/lib/dive/content";
import { cn } from "@/lib/utils";
import { MaskText, PlaneReveal, SoftReveal } from "./reveal";
import { Frame } from "./depth";
import { FieldPhoto, LivePhoto } from "./story";

const PHOTO_TYPES = ["jpg", "jpeg", "png", "webp"];

/** public/dive/team/<id>.<ext>, if the team has added one. */
function teamPhoto(id: string) {
  for (const type of PHOTO_TYPES) {
    if (existsSync(path.join(process.cwd(), "public", "dive", "team", `${id}.${type}`))) return `/dive/team/${id}.${type}`;
  }
  return null;
}

/** Their photo, or — until it's added — a quiet frame with their initial. */
function Portrait({ story, sizes, initialClassName }: { story: Pick<TeamStory, "id" | "name" | "photoAlt">; sizes: string; initialClassName: string }) {
  const src = teamPhoto(story.id);
  return src ? (
    <Image src={src} alt={story.photoAlt} fill sizes={sizes} className="object-cover" />
  ) : (
    <div aria-hidden className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(95,227,239,0.25),transparent_60%),linear-gradient(180deg,#0a3a5c,#04101f)]">
      <span className={cn("font-serif leading-none text-foam/80 italic", initialClassName)}>{story.name[0]}</span>
    </div>
  );
}

/** A baby photo in a slightly tilted print, beside their name on their own slide. */
function TeamPhoto({ story, tilt }: { story: Pick<TeamStory, "id" | "name" | "photoAlt" | "photoCaption">; tilt: number }) {
  return (
    <PlaneReveal>
      <figure className="mx-auto w-full max-w-[260px]" style={{ rotate: `${tilt}deg` }}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] border border-foam/15 bg-[linear-gradient(160deg,#0d5570,#072044_70%)] p-2.5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
          <div className="relative h-full w-full overflow-hidden rounded-[14px]">
            <Portrait story={story} sizes="260px" initialClassName="text-[96px]" />
          </div>
        </div>
        {teamPhoto(story.id) && story.photoCaption && (
          <figcaption className="mt-3 text-center font-mono text-[11px] text-mist/70">{story.photoCaption}</figcaption>
        )}
      </figure>
    </PlaneReveal>
  );
}

const LINEUP_TILT = [-3, 2, -1.5];

/** The chapter's opening slide: the three of us as kids, each name under its photo. */
export function TeamLineup({ people }: { people: Pick<TeamStory, "id" | "name" | "photoAlt">[] }) {
  return (
    <ul className="mt-12 flex flex-wrap gap-6 md:gap-10">
      {people.map((person, index) => (
        <li key={person.id}>
          <PlaneReveal index={index}>
            <figure className="w-[132px] md:w-[168px]" style={{ rotate: `${LINEUP_TILT[index % LINEUP_TILT.length]}deg` }}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] border border-foam/15 bg-[linear-gradient(160deg,#0d5570,#072044_70%)] p-2 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)]">
                <div className="relative h-full w-full overflow-hidden rounded-[11px]">
                  <Portrait story={person} sizes="168px" initialClassName="text-[56px]" />
                </div>
              </div>
              <figcaption className="mt-3 text-center font-mono text-[12px] tracking-[0.16em] text-turquoise/80 uppercase">
                {person.name}
              </figcaption>
            </figure>
          </PlaneReveal>
        </li>
      ))}
    </ul>
  );
}

function PersonHeader({ story }: { story: Pick<TeamStory, "name" | "tagline"> }) {
  return (
    <SoftReveal>
      {story.tagline && (
        <p className="font-mono text-[12px] tracking-[0.16em] text-turquoise/80 uppercase">{story.tagline}</p>
      )}
      <h3 className="mt-2 text-[clamp(36px,4.6vw,60px)] leading-none font-semibold tracking-tight text-foam">
        {story.name}
      </h3>
    </SoftReveal>
  );
}

/** A tall photo beside the story, like a print propped against the page. */
function AsidePhoto({ photo }: { photo: NonNullable<TeamStory["aside"]> }) {
  return (
    <FieldPhoto
      src={photo.src}
      alt={photo.alt}
      caption={photo.caption}
      index={1}
      className="mx-auto w-full max-w-[220px] md:max-w-none"
      frameClassName="aspect-[9/16]"
      sizes="(max-width: 768px) 220px, 240px"
    />
  );
}

/** One person, one slide: their photo, their name and their story. */
function Person({ story, tilt, flip = false, children }: { story: TeamStory; tilt: number; flip?: boolean; children?: ReactNode }) {
  return (
    <Frame sub>
      <article
        className={cn(
          "grid items-center gap-10",
          story.aside
            ? "md:grid-cols-[minmax(0,0.34fr)_minmax(0,1fr)_minmax(0,0.26fr)] md:gap-12"
            : flip
              ? "md:grid-cols-[minmax(0,1fr)_minmax(0,0.38fr)] md:gap-16"
              : "md:grid-cols-[minmax(0,0.38fr)_minmax(0,1fr)] md:gap-16",
        )}
      >
        <div className={cn(flip && "md:order-2")}>
          <TeamPhoto story={story} tilt={tilt} />
        </div>
        <div>
          <PersonHeader story={story} />
          {children}
        </div>
        {story.aside && <AsidePhoto photo={story.aside} />}
      </article>
    </Frame>
  );
}

/** More photos from their camera roll: a wide shot and a portrait, laid out like prints on a table. */
function Gallery({ photos }: { photos: NonNullable<TeamStory["gallery"]> }) {
  return (
    <Frame sub className="py-6">
      <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,0.36fr)] md:gap-10">
        {photos.map((photo, index) => (
          <FieldPhoto
            key={photo.src}
            src={photo.src}
            alt={photo.alt}
            caption={photo.caption}
            index={index}
            className={cn(!photo.wide && "mx-auto w-full max-w-[300px] md:max-w-none")}
            frameClassName={photo.wide ? "aspect-[1174/315] md:aspect-[2.3/1]" : "aspect-[4/5]"}
            imageClassName={photo.wide ? "object-[40%_50%]" : undefined}
            sizes={photo.wide ? "(max-width: 768px) 100vw, 780px" : "(max-width: 768px) 300px, 300px"}
          />
        ))}
      </div>
    </Frame>
  );
}

/** Oliver — and anyone else whose story is plain paragraphs and a quote. */
export function StoryPerson({ story, tilt, flip }: { story: TeamStory; tilt: number; flip?: boolean }) {
  const person = (
    <Person story={story} tilt={tilt} flip={flip}>
      {story.paragraphs ? (
        <>
          <SoftReveal delay={0.1}>
            <div className="mt-6 max-w-xl space-y-5 text-[18px] leading-relaxed text-mist">
              {story.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>
          </SoftReveal>
          {story.quote && (
            <SoftReveal delay={0.2}>
              <blockquote className="mt-8 max-w-2xl border-l-2 border-turquoise/50 pl-5 font-serif text-[clamp(26px,3vw,38px)] leading-[1.15] text-foam italic">
                “{story.quote}”
              </blockquote>
            </SoftReveal>
          )}
        </>
      ) : (
        // Placeholder until their story is written — see lib/dive/content.ts.
        <SoftReveal delay={0.1}>
          <div className="mt-6 max-w-xl rounded-[22px] border border-dashed border-foam/20 px-6 py-5">
            <p className="font-mono text-[11px] tracking-[0.16em] text-mist/60 uppercase">Story coming soon</p>
            <p className="mt-2 text-[16px] leading-relaxed text-mist">{story.name}&apos;s part of this story will go here.</p>
          </div>
        </SoftReveal>
      )}
    </Person>
  );
  if (!story.gallery?.length) return person;
  return (
    <>
      {person}
      <Gallery photos={story.gallery} />
    </>
  );
}

/** Theodore's chapter, as he told it — the words and photos are his. */
export function TheodoreStory({
  story,
  fieldPhotos,
}: {
  story: Pick<TeamStory, "id" | "name" | "tagline" | "photoAlt" | "photoCaption">;
  fieldPhotos: { src: string; caption: string }[];
}) {
  return (
    <>
      <Person story={{ ...story, paragraphs: [] }} tilt={2.5} flip>
        <MaskText
          className="mt-6 max-w-3xl text-[clamp(30px,3.6vw,46px)] leading-[1.05] font-semibold tracking-tight text-foam"
          segments={["Grew up on the water", { text: "in South Jersey.", className: "font-serif font-normal italic" }]}
        />
        <SoftReveal delay={0.1}>
          <div className="mt-6 max-w-xl space-y-5 text-[18px] leading-relaxed text-mist">
            <p>
              I&apos;ve been fishing with my grandparents and my friends basically forever. Bass sometimes, but mostly
              crabbing off the marsh, from the first warm days of summer until we were pulling traps by moonlight.
            </p>
            <p>
              Every time you pull one up it&apos;s the same questions.{" "}
              <span className="text-foam">Is it four and a half inches? Is that a sponge under her? Is it even legal here?</span>{" "}
              Guess wrong and either you broke the law or you kept a crab that should&apos;ve gone back.
            </p>
            <p>
              So we built the thing I always wanted. My phone is the crab gauge, it knows the rules wherever I&apos;m
              standing, and if I hook something endangered it tells me to let it go.{" "}
              <span className="text-foam">I really care about this water.</span>
            </p>
          </div>
        </SoftReveal>
      </Person>

      <Frame sub className="py-6">
        <div className="grid items-start gap-6 sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.25fr)]">
          <LivePhoto
            still="/dive/story/night-crabbing.webp"
            video="/dive/story/night-crabbing.mp4"
            alt="Theodore and a friend holding up a blue crab at night"
            caption="Night crabbing in South Jersey — the one that made it into the bushel"
          />
          {fieldPhotos.map((photo, index) => (
            <FieldPhoto key={photo.src} src={photo.src} caption={photo.caption} index={index + 1} />
          ))}
          <SoftReveal delay={0.1} className="sm:col-span-2 md:col-span-1">
            <figure className="glass rounded-[28px] p-7">
              <p className="font-mono text-[11px] tracking-[0.16em] text-status-watch uppercase">The fish that started it</p>
              <blockquote className="mt-4 font-serif text-[clamp(22px,2.4vw,30px)] leading-[1.2] text-foam italic">
                “When I was a kid I brought home a pet fish, put him in the wrong kind of water, and he was gone in about an
                hour. I cried.”
              </blockquote>
              <figcaption className="mt-5 text-[15px] leading-relaxed text-mist">
                It&apos;s a funny story now. But it taught me that the right answer depends on details you can&apos;t see
                just by looking at an animal — what water it needs, how big it has to be, whether it&apos;s carrying eggs,
                whether it&apos;s protected. That&apos;s what TIDE sees for you.
              </figcaption>
            </figure>
          </SoftReveal>
        </div>
      </Frame>
    </>
  );
}
