import type { Config } from "tailwindcss";
import { brand } from "./config/brand";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./config/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sourced from config/brand.ts so the palette lives in one place.
        scarlet: brand.colors.scarlet, // #C8102E primary
        ink: brand.colors.ink, // #1A1A1A near-black text
        "scarlet-tint": brand.colors.scarletTint, // light accent
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
