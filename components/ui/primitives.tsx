import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  children,
  ...props
}: ComponentProps<"div"> & { children: ReactNode }) {
  return (
    <div className={cn("glass rounded-[24px] p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-3", className)}>
      <div>
        {eyebrow && (
          <p className="text-[11px] font-semibold tracking-[0.18em] text-turquoise/80 uppercase">{eyebrow}</p>
        )}
        <h2 className="text-lg font-semibold tracking-tight text-foam">{title}</h2>
      </div>
      {action}
    </div>
  );
}

const BUTTON_VARIANTS = {
  primary:
    "bg-[linear-gradient(145deg,#5fe3ef,#2ee6c5)] text-abyss shadow-[0_10px_30px_-10px_rgba(46,230,197,0.8)] hover:brightness-[1.06]",
  secondary: "glass text-foam hover:bg-foam/10",
  outline: "border border-foam/20 text-foam hover:border-turquoise/50 hover:text-turquoise",
  ghost: "text-mist hover:text-foam",
} as const;

const BUTTON_SIZES = {
  sm: "h-9 px-4 text-sm",
  md: "h-12 px-5 text-[15px]",
  lg: "h-14 px-6 text-base",
} as const;

type ButtonStyleProps = {
  variant?: keyof typeof BUTTON_VARIANTS;
  size?: keyof typeof BUTTON_SIZES;
};

function buttonClasses({ variant = "primary", size = "md" }: ButtonStyleProps, className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    className,
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & ButtonStyleProps) {
  return <button className={buttonClasses({ variant, size }, className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & ButtonStyleProps) {
  return <Link className={buttonClasses({ variant, size }, className)} {...props} />;
}

export function Pill({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-foam/12 bg-foam/6 px-3 py-1 text-[11px] font-medium text-mist",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-foam/10 bg-foam/5 px-3 py-2.5">
      <p className="text-[10px] font-semibold tracking-[0.14em] text-mist/70 uppercase">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foam">{value}</p>
    </div>
  );
}
