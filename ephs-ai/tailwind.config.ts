import type { Config } from "tailwindcss";

/**
 * EPHS design tokens: "varsity editorial".
 * Official colors from the 2026-27 EPHS Course Guide (EP red, charcoal,
 * white) extended with a warm paper background and steel neutrals so the
 * app reads like a printed athletics program, not a generic dashboard.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ep: {
          red: "#D8272E",
          "red-dark": "#A61E24",
          "red-deep": "#701216",
          "red-soft": "#FBE9E9",
          charcoal: "#1C181A",
          coal: "#131013",
          ink: "#2A2527",
          muted: "#6B6467",
          faint: "#96908E",
          steel: "#C9C4BE",
          bg: "#F5F3EF",
          card: "#FFFFFF",
          border: "#DDD8D1",
          "border-soft": "#EAE6E0",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(19, 16, 19, 0.05), 0 2px 6px rgba(19, 16, 19, 0.06)",
        "card-hover":
          "0 2px 4px rgba(19, 16, 19, 0.07), 0 10px 24px rgba(19, 16, 19, 0.12)",
        panel: "0 24px 60px rgba(19, 16, 19, 0.28)",
      },
      maxWidth: {
        shell: "80rem",
      },
      animation: {
        "fade-up": "fade-up 0.55s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
