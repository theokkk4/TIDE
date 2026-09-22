import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { OceanBackground } from "@/components/ocean-background";
import { BottomNav } from "@/components/bottom-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TIDE — Marine intelligence in your hands",
  description:
    "Photograph a marine animal and TIDE identifies the species, its conservation status, the threats it faces, and whether it belongs on your plate.",
  applicationName: "TIDE",
  appleWebApp: { capable: true, title: "TIDE", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#020814",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-dvh bg-abyss text-foam">
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
      </body>
    </html>
  );
}
