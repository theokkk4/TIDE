"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChefHat, ChevronDown, Clock, Info, Leaf, Users } from "lucide-react";
import { Button, SectionHeading } from "@/components/ui/primitives";
import { SpeciesPhoto } from "@/components/ui/species-photo";
import type { Alternative } from "@/lib/data/alternatives";
import type { Recipe } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RecipeSection({
  recipes,
  speciesName,
  advisory,
}: {
  recipes: Recipe[];
  speciesName: string;
  advisory?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  if (recipes.length === 0) return null;

  return (
    <section className="mt-8 px-6">
      <SectionHeading eyebrow="Cook this species" title={`Ways to cook ${speciesName}`} />

      {advisory && (
        <div className="mb-4 flex gap-2.5 rounded-2xl border border-status-warn/25 bg-status-warn/10 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-status-warn" strokeWidth={2} aria-hidden />
          <p className="text-[13px] leading-relaxed text-foam/90">{advisory}</p>
        </div>
      )}

      <div className="space-y-3">
        {recipes.map((recipe) => {
          const open = openId === recipe.id;
          return (
            <article key={recipe.id} className="glass overflow-hidden rounded-[24px]">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : recipe.id)}
                aria-expanded={open}
                className="w-full text-left"
              >
                <div className="relative h-36 w-full">
                  <SpeciesPhoto
                    src={recipe.image || null}
                    alt={recipe.title}
                    emoji="🍽️"
                    className="absolute inset-0 h-full w-full"
                    sizes="(max-width: 480px) 100vw, 480px"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,20,0.15),rgba(2,8,20,0.88))]" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-[16px] font-semibold text-foam">{recipe.title}</h3>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-mist">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" aria-hidden />
                          {recipe.time}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ChefHat className="h-3 w-3" aria-hidden />
                          {recipe.difficulty}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" aria-hidden />
                          Serves {recipe.serves}
                        </span>
                      </div>
                    </div>
                    <ChevronDown
                      className={cn("h-4 w-4 shrink-0 text-foam transition-transform", open && "rotate-180")}
                      aria-hidden
                    />
                  </div>
                </div>
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 px-5 py-4">
                      <p className="text-[13px] leading-relaxed text-mist">{recipe.blurb}</p>

                      <div>
                        <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-turquoise uppercase">
                          Ingredients
                        </p>
                        <ul className="space-y-1.5">
                          {recipe.ingredients.map((item) => (
                            <li key={item} className="flex gap-2.5 text-[13px] leading-relaxed text-foam/90">
                              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-turquoise" aria-hidden />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-turquoise uppercase">
                          Method
                        </p>
                        <ol className="space-y-2.5">
                          {recipe.steps.map((step, index) => (
                            <li key={step} className="flex gap-3 text-[13px] leading-relaxed text-mist">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-turquoise/15 font-mono text-[11px] text-turquoise">
                                {index + 1}
                              </span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>

                      <p className="border-t border-foam/8 pt-3 text-[11px] text-mist/60">
                        Recipe curated by TIDE. Cooking times are a guide — check the fish is opaque and flakes
                        cleanly before serving.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function AlternativesSection({
  alternatives,
  reason,
}: {
  alternatives: Alternative[];
  reason: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="mt-8 px-6">
      <SectionHeading eyebrow="Try this instead" title="Sustainable seafood alternatives" />
      <p className="mb-4 text-[14px] leading-relaxed text-mist">{reason}</p>

      {!expanded ? (
        <Button onClick={() => setExpanded(true)} variant="secondary" size="lg" className="w-full">
          <Leaf className="h-4 w-4" strokeWidth={2} aria-hidden />
          Explore Alternatives
        </Button>
      ) : (
        <motion.ul
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-3"
        >
          {alternatives.map((alternative, index) => {
            const body = (
              <>
                <SpeciesPhoto
                  src={alternative.dishKey ? `/media/${alternative.dishKey}.jpg` : null}
                  alt={alternative.name}
                  emoji="🌿"
                  className="h-20 w-20 shrink-0 rounded-2xl"
                  sizes="80px"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-[15px] font-semibold text-foam">{alternative.name}</h3>
                  </div>
                  <span className="mt-1 inline-flex rounded-full bg-status-safe/12 px-2 py-0.5 text-[10px] font-semibold text-status-safe">
                    {alternative.badge}
                  </span>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-mist">{alternative.detail}</p>
                </div>
              </>
            );

            return (
              <motion.li
                key={alternative.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.35 }}
              >
                {alternative.speciesSlug ? (
                  <Link
                    href={`/species/${alternative.speciesSlug}`}
                    className="glass flex gap-4 rounded-[22px] p-3 transition-colors hover:border-turquoise/30"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="glass flex gap-4 rounded-[22px] p-3">{body}</div>
                )}
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </section>
  );
}
