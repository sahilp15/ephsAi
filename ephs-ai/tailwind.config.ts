import type { Config } from "tailwindcss";

/**
 * EPHS AI design tokens — "academic editorial".
 *
 * Evolved from the original varsity system: the same official EP red and
 * charcoal from the 2026-27 Course Guide, but tuned toward a calm, premium
 * academic-planning product. Red is reserved for primary actions and brand
 * moments; neutrals do the heavy lifting. Motion is CSS-only with a small,
 * consistent timing scale.
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
          // Brand
          red: "#D8272E",
          "red-dark": "#A61E24",
          "red-deep": "#701216",
          "red-soft": "#FCECEC",
          "red-tint": "#FDF5F4",
          // Ink
          charcoal: "#1C181A",
          coal: "#141416",
          ink: "#2B2629",
          muted: "#6E6769",
          faint: "#98918F",
          // Surfaces & lines
          steel: "#C9C4BE",
          bg: "#F7F5F1",
          "bg-sunken": "#F0EDE7",
          card: "#FFFFFF",
          border: "#E4DFD8",
          "border-soft": "#EEEAE3",
          // Restrained semantic accents
          success: "#0F7A52",
          "success-soft": "#E7F4EE",
          warn: "#B45309",
          "warn-soft": "#FBF1E3",
          info: "#1D5F9C",
          "info-soft": "#E9F1FA",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "0.625rem",
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(20, 20, 22, 0.04)",
        card: "0 1px 2px rgba(20, 20, 22, 0.04), 0 1px 3px rgba(20, 20, 22, 0.05)",
        "card-hover":
          "0 2px 4px rgba(20, 20, 22, 0.05), 0 8px 24px rgba(20, 20, 22, 0.08)",
        pop: "0 4px 12px rgba(20, 20, 22, 0.08), 0 16px 40px rgba(20, 20, 22, 0.14)",
        panel: "0 24px 60px rgba(20, 20, 22, 0.26)",
        "focus-ring": "0 0 0 2px #FFFFFF, 0 0 0 4px #D8272E",
      },
      maxWidth: {
        shell: "84rem",
        prose: "42rem",
      },
      transitionTimingFunction: {
        "ep-out": "cubic-bezier(0.22, 1, 0.36, 1)",
        "ep-in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      transitionDuration: {
        micro: "150ms",
        panel: "220ms",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "translateY(6px) scale(0.985)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-up-sheet": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.2s ease-out both",
        "scale-in": "scale-in 0.18s cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-in-right": "slide-in-right 0.22s cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-up-sheet": "slide-up-sheet 0.24s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
