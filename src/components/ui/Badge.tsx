import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide transition-colors",
  {
    variants: {
      variant: {
        /* Gold — primary */
        amber:
          "border border-yellow-400/40 bg-yellow-400/10 text-yellow-300",
        /* Orange — secondary */
        terracotta:
          "border border-orange-400/40 bg-orange-500/10 text-orange-300",
        /* Emerald — success */
        emerald:
          "border border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
        /* Neutral slate */
        slate:
          "border border-slate-700 bg-slate-800/80 text-slate-300",
        /* Live — animated pulse */
        live:
          "border border-yellow-400/50 bg-yellow-400/10 text-yellow-300 animate-pulse",
      },
    },
    defaultVariants: { variant: "amber" },
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
