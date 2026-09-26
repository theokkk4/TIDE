import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-dvh bg-abyss text-foam">{children}</body>
    </html>
  );
}
