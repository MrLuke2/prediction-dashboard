import { type Config } from "tailwindcss";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./index.tsx",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          "poly-blue": "var(--brand-poly-blue)",
          "kalshi-green": "var(--brand-kalshi-green)",
          "kalshi-red": "var(--brand-kalshi-red)",
          "fin-bg": "var(--brand-fin-bg)",
          "fin-card": "var(--brand-fin-card)",
          "fin-border": "var(--brand-fin-border)",
          "fin-hover": "var(--brand-fin-hover)",
          "text-main": "var(--brand-text-main)",
          "text-muted": "var(--brand-text-muted)",
        },
      },
      fontFamily: {
        mono: [
          "var(--font-mono)",
          "JetBrains Mono",
          "Geist Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        "ticker-scroll": "ticker-scroll 20s linear infinite",
      },
      keyframes: {
        glow: {
          "0%": {
            boxShadow:
              "0 0 5px var(--brand-poly-blue), 0 0 10px var(--brand-poly-blue)",
          },
          "100%": {
            boxShadow:
              "0 0 20px var(--brand-poly-blue), 0 0 35px var(--brand-poly-blue)",
          },
        },
        "ticker-scroll": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
