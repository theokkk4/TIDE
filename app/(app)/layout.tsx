import type { ReactNode } from "react";
import { OceanBackground } from "@/components/ocean-background";
import { BottomNav } from "@/components/bottom-nav";

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
