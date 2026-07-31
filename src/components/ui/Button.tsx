import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-afr-amber disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        amber:
          "bg-gradient-to-r from-afr-amber to-afr-amber-dark text-slate-950 font-semibold shadow-glow-amber hover:shadow-glow-amber-lg hover:from-afr-amber-light hover:to-afr-amber border border-amber-400/30",
        terracotta:
          "bg-gradient-to-r from-afr-terracotta to-afr-terracotta-deep text-white font-semibold shadow-glow-terracotta hover:from-afr-terracotta-warm hover:to-afr-terracotta border border-red-500/30",
        emerald:
          "bg-gradient-to-r from-afr-emerald to-emerald-700 text-slate-950 font-semibold shadow-glow-emerald hover:brightness-110 border border-emerald-400/30",
        glass:
          "afr-glass text-slate-200 hover:text-white hover:border-afr-amber/50 hover:bg-slate-900/80 shadow-glass",
        outline:
          "border border-slate-800 bg-slate-950/60 text-slate-200 hover:border-afr-amber/60 hover:text-afr-amber-light hover:bg-slate-900/40",
        ghost:
          "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-base rounded-xl",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "amber",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant, size, children, ...props }, ref) => {
    return (
      <button
        className={`${buttonVariants({ variant, size })} ${className}`}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
