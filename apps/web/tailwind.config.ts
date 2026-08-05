import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./apps/web/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0E14",
        surface: {
          DEFAULT: "#121721",
          elevated: "#1A202C",
          border: "#1E293B",
        },
        afr: {
          dark: {
            DEFAULT: "#0B0E14",
            card: "#121721",
            border: "#1E293B",
            hover: "#1A202C",
          },
          amber: {
            DEFAULT: "#F7931A", // Bitcoin Amber Gold
            dark: "#E58410",
            light: "#FFB84D",
            glow: "rgba(247, 147, 26, 0.35)",
          },
          terracotta: {
            DEFAULT: "#C84B31", // African Heritage Warmth
            warm: "#D9534F",
            deep: "#9E321B",
            glow: "rgba(200, 75, 49, 0.35)",
          },
          emerald: {
            DEFAULT: "#10B981", // Live WebSocket / Paid State
            dark: "#059669",
            glow: "rgba(16, 185, 129, 0.35)",
          },
          zinc: {
            light: "#F8FAFC",
            body: "#E2E8F0",
            muted: "#94A3B8",
            dim: "#64748B",
          },
        },
      },
      fontFamily: {
        sans: ["Inter", "Space Grotesk", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        "glow-amber": "0 0 25px -3px rgba(247, 147, 26, 0.4)",
        "glow-amber-lg": "0 0 45px 2px rgba(247, 147, 26, 0.5)",
        "glow-terracotta": "0 0 25px -3px rgba(200, 75, 49, 0.4)",
        "glow-emerald": "0 0 25px -3px rgba(16, 185, 129, 0.4)",
        "glass": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 15px rgba(247, 147, 26, 0.2)" },
          "100%": { boxShadow: "0 0 30px rgba(247, 147, 26, 0.6)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
