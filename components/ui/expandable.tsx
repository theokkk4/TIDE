"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Expandable({
  title,
  icon,
  summary,
  children,
  defaultOpen = false,
  className,
}: {
  title: string;
  icon?: ReactNode;
  summary?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("glass overflow-hidden rounded-[24px]", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        {icon && <span className="shrink-0 text-turquoise">{icon}</span>}
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-foam">{title}</span>
          {summary && !open && <span className="mt-0.5 block truncate text-[12px] text-mist">{summary}</span>}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-mist transition-transform duration-300", open && "rotate-180")}
          aria-hidden
        />
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
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
