import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97]",
  {
    variants: {
      variant: {
        /* Gold — universal primary */
        primary:
          "bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 shadow-glow-gold hover:brightness-110 border border-yellow-400/30",
        amber:
          "bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 shadow-glow-gold hover:brightness-110 border border-yellow-400/30",
        /* Warm orange — secondary action */
        terracotta:
          "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-glow-terracotta hover:brightness-110 border border-orange-400/30",
        /* Emerald — success */
        emerald:
          "bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-glow-emerald hover:brightness-110 border border-emerald-400/30",
        /* Danger */
        danger:
          "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-glow-red hover:brightness-110 border border-red-400/30",
        /* Glass */
        glass:
          "bg-white/[0.06] backdrop-blur-md text-slate-200 border border-white/10 hover:bg-white/10 hover:border-yellow-400/30 hover:text-yellow-200",
        /* Outlined */
        outline:
          "border border-[#1A2236] bg-[#0D1117]/60 text-slate-300 hover:border-yellow-400/50 hover:text-yellow-200",
        /* Ghost */
        ghost:
          "text-slate-400 hover:text-slate-100 hover:bg-white/[0.06]",
      },
      size: {
        sm:   "h-8  px-3  text-xs  rounded-lg",
        md:   "h-10 px-4  py-2",
        lg:   "h-12 px-6  text-base rounded-xl",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant, size, children, ...props }, ref) => (
    <button
      className={`${buttonVariants({ variant, size })} ${className}`}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = "Button";
