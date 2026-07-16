import type { Config } from "tailwindcss";

/**
 * EPHS design tokens.
 * Colors are extracted from the official 2026-27 EPHS Course Guide PDF
 * (see data/ephs-course-guide-2026-27.json → branding).
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
          "red-dark": "#B01F25",
          "red-soft": "#FDECEC",
          charcoal: "#231F20",
          ink: "#2E2A2B",
          muted: "#5F5A5B",
          faint: "#8A8485",
          bg: "#F5F5F5",
          card: "#FFFFFF",
          border: "#D9D9D9",
          "border-soft": "#E8E8E8",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(35, 31, 32, 0.05), 0 1px 3px rgba(35, 31, 32, 0.08)",
        "card-hover":
          "0 2px 4px rgba(35, 31, 32, 0.06), 0 4px 12px rgba(35, 31, 32, 0.10)",
      },
      maxWidth: {
        shell: "80rem",
      },
    },
  },
  plugins: [],
};

export default config;
