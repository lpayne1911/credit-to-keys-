import type { Config } from "tailwindcss";

/**
 * Driveway Advocate brand tokens.
 *
 * Calm, trustworthy, NOT generic green fintech.
 *  - navy  #14253D  primary / ink
 *  - gold  #C8923A  accent / CTA (reassuring, never alarming)
 *  - cream #FCFBF8  background
 *
 * Semantic red/amber/green are RESERVED for verdict cues only — never for
 * buttons or chrome. A "get help" / primary CTA always reads gold.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#14253D",
          50: "#F1F3F6",
          100: "#D7DDE6",
          700: "#1C3252",
          900: "#0E1A2C",
        },
        gold: {
          DEFAULT: "#C8923A",
          dark: "#A9781F",
          light: "#E3BC78",
        },
        cream: {
          DEFAULT: "#FCFBF8",
          100: "#F5F2EA",
          200: "#EBE6D8",
        },
        // Verdict-only semantic colors. Do not use for buttons/chrome.
        verdict: {
          red: "#C0392B",
          amber: "#D98E2B",
          green: "#2E6E4E",
        },
      },
      fontFamily: {
        // Characterful serif for headlines, clean sans for body/UI.
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        prose: "44rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,37,61,0.06), 0 8px 24px rgba(20,37,61,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
