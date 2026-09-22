"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Camera, Compass, Home, Bookmark, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/demo", label: "Demo", icon: Sparkles },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  // The camera experience is full-screen; a tab bar over it would fight the capture UI.
  if (pathname === "/identify") return null;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[480px] px-4 pb-[max(12px,env(safe-area-inset-bottom))] sm:bottom-6"
    >
      <div className="relative">
        <Link
          href="/identify"
          aria-label="Identify marine life with your camera"
          className="group absolute -top-7 left-1/2 z-10 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-[linear-gradient(145deg,#5fe3ef,#2ee6c5)] shadow-[0_10px_30px_-6px_rgba(46,230,197,0.65)] transition-transform active:scale-95"
        >
          <span className="absolute inset-0 animate-pulse-ring rounded-full border border-turquoise/50" />
          <Camera className="h-7 w-7 text-abyss" strokeWidth={2.2} aria-hidden />
        </Link>

        <div className="glass-strong grid grid-cols-4 items-center rounded-[26px] px-2 py-2">
          {TABS.map((tab, index) => {
            const active = isActive(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium transition-colors",
                  // Keep the middle two tabs clear of the floating capture button.
                  index === 1 && "mr-6",
                  index === 2 && "ml-6",
                  active ? "text-turquoise" : "text-mist hover:text-foam",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-2xl bg-turquoise/10"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon className="relative h-5 w-5" strokeWidth={active ? 2.4 : 1.9} aria-hidden />
                <span className="relative">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
