import type { ReactNode } from "react";
import Link from "next/link";
import { OceanBackground } from "@/components/ocean-background";
import { BottomNav } from "@/components/bottom-nav";
import { EmbedKeyBridge } from "@/components/embed-key-bridge";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <OceanBackground />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-turquoise focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-abyss"
      >
        Skip to content
      </a>
      <EmbedKeyBridge />
      {/* Desktop only: the app sits in a column, so the margin has room for a way back to the story. */}
      <Link
        href="/dive"
        className="fixed top-6 left-6 z-20 hidden rounded-full border border-foam/15 bg-abyss/40 px-4 py-2 text-[13px] text-mist backdrop-blur-sm transition-colors hover:border-turquoise/50 hover:text-foam lg:inline-flex"
      >
        ← The story behind TIDE
      </Link>
      {/* On wider screens the app sits in a framed column rather than stretching. */}
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[480px] flex-col sm:my-6 sm:min-h-[calc(100dvh-3rem)] sm:overflow-hidden sm:rounded-[36px] sm:border sm:border-foam/10 sm:shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
        <main id="main" className="flex-1 pb-28">
          {children}
        </main>
        <BottomNav />
      </div>
    </>
  );
}
