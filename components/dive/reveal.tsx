"use client";

import { Fragment, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/** bright-avenue.jp's signature curves: expo-out for reveals, quint-out for settling planes. */
export const EXPO_OUT = [0.16, 1, 0.3, 1] as const;
export const QUINT_OUT = [0.22, 1, 0.36, 1] as const;

type Segment = string | { text: string; className?: string };

const TAGS = { h1: motion.h1, h2: motion.h2, h3: motion.h3, p: motion.p } as const;

/**
 * Headline reveal: every word rises out of its own mask, staggered so each line arrives
 * as a wave. Screen readers get the sentence once, through aria-label.
 */
export function MaskText({
  as = "h2",
  segments,
  className,
  delay = 0,
  stagger = 0.045,
  label: spokenLabel,
}: {
  as?: keyof typeof TAGS;
  segments: Segment[];
  /** What screen readers hear, when the visual text is spaced out (e.g. a wordmark). */
  label?: string;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const reduced = useReducedMotion();
  const Tag = TAGS[as];
  const parts = segments.map((segment) => (typeof segment === "string" ? { text: segment } : segment));
  const label = spokenLabel ?? parts.map((part) => part.text).join(" ");

  let index = 0;
  const words = parts.flatMap((part) =>
    part.text
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => ({ word, className: part.className, order: index++ })),
  );

  return (
    <Tag
      className={className}
      aria-label={label}
      initial={reduced ? false : "hidden"}
      whileInView="shown"
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
    >
      {words.map(({ word, className: wordClass, order }, n) => (
        <Fragment key={n}>
          {/* Padding widens the mask so italic overhangs and descenders aren't clipped. */}
          <span aria-hidden className="-mx-[0.06em] -mb-[0.14em] inline-block overflow-hidden px-[0.06em] pb-[0.14em] align-top">
            <motion.span
              className={cn("inline-block origin-bottom-left", wordClass)}
              variants={{
                hidden: { y: "112%", rotate: 6 },
                shown: {
                  y: "0%",
                  rotate: 0,
                  transition: { duration: 1.3, ease: EXPO_OUT, delay: delay + order * stagger },
                },
              }}
            >
              {word}
            </motion.span>
          </span>
          {n < words.length - 1 && " "}
        </Fragment>
      ))}
    </Tag>
  );
}

/** Body copy: rises and comes into focus. The filter is cleared afterwards so glass children keep their blur. */
export function SoftReveal({
  children,
  delay = 0,
  className,
  y = 28,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 1.2, delay, ease: EXPO_OUT }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Cards stand up out of the water as they arrive — a CSS 3D take on bright-avenue's WebGL
 * plane reveal, where each image starts tilted away and settles flat, staggered.
 */
export function PlaneReveal({
  children,
  className,
  index = 0,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const start = delay + index * 0.1;
  return (
    <motion.div
      className={className}
      style={{ transformPerspective: 1300, transformOrigin: "50% 100%" }}
      initial={reduced ? false : { opacity: 0, y: 120, rotateX: 48, rotateZ: index % 2 ? 2.5 : -2.5, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0, rotateZ: 0, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -6% 0px" }}
      transition={{
        default: { duration: 1.6, delay: start, ease: QUINT_OUT },
        opacity: { duration: 0.8, delay: start, ease: "easeOut" },
      }}
    >
      {children}
    </motion.div>
  );
}

/** The short rule beside each chapter number, drawn in from the left. */
export function DrawLine({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.span
      aria-hidden
      className={cn("block origin-left", className)}
      initial={reduced ? false : { scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.2, ease: EXPO_OUT, delay: 0.1 }}
    />
  );
}

/** The hero photograph opening out of a rounded window as the curtain lifts. */
export function ClipReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { clipPath: "inset(16% 12% 16% 12% round 56px)" }}
      animate={{ clipPath: "inset(0% 0% 0% 0% round 0px)" }}
      transition={{ duration: 1.9, delay, ease: EXPO_OUT }}
    >
      <motion.div
        className="absolute inset-0"
        initial={reduced ? false : { scale: 1.3 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2.6, delay, ease: EXPO_OUT }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
