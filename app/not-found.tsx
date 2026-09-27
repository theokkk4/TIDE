import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,#0a3a5c,#020814_70%)] px-6 text-center">
      <p className="font-mono text-[12px] tracking-[0.18em] text-turquoise/80 uppercase">404 · 10,935 m</p>
      <h1 className="mt-4 font-serif text-[clamp(40px,8vw,72px)] leading-none text-foam italic">Nothing down here.</h1>
      <p className="mt-4 max-w-sm text-[16px] leading-relaxed text-mist">That page doesn&apos;t exist. Head back up.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-[linear-gradient(145deg,#5fe3ef,#2ee6c5)] px-6 py-3 text-[15px] font-semibold text-abyss"
        >
          Open TIDE
        </Link>
        <Link
          href="/dive"
          className="rounded-full border border-foam/25 px-6 py-3 text-[15px] font-semibold text-foam hover:border-turquoise/60 hover:text-turquoise"
        >
          The story
        </Link>
      </div>
    </main>
  );
}
