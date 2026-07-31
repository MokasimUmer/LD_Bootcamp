import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        amber:
          "border border-amber-500/40 bg-amber-500/10 text-afr-amber-light shadow-[0_0_10px_rgba(247,147,26,0.2)]",
        terracotta:
          "border border-red-500/40 bg-red-500/10 text-afr-terracotta-warm shadow-[0_0_10px_rgba(200,75,49,0.2)]",
        emerald:
          "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
        slate:
          "border border-slate-800 bg-slate-900/80 text-slate-300",
        live:
          "border border-emerald-500/50 bg-emerald-950/60 text-emerald-300 animate-pulse",
      },
    },
    defaultVariants: {
      variant: "amber",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className = "", variant, ...props }: BadgeProps) {
  return (
    <div className={`${badgeVariants({ variant })} ${className}`} {...props} />
  );
}
