import type { Config } from "tailwindcss";

/**
 * Driveway Advocate brand tokens.
 *
 * Premium, high-trust buyer-protection product — modern fintech/SaaS, NOT a
 * generic green fintech template or a flat brochure.
 *
 *  - navy  #14253D  primary / ink        (deepest: ink #0E1A2B)
 *  - gold  #C8923A  accent / primary CTA (reassuring, never alarming)
 *  - cream #FCFBF8  warm background
 *
 * Semantic flag colors (orange / red / green) are RESERVED for verdict +
 * severity cues — never for buttons or chrome. A "get help" / primary CTA
 * always reads gold/amber.
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
          800: "#102033",
          900: "#0E1A2C",
          950: "#0A1422",
        },
        ink: "#0E1A2B",
        gold: {
          DEFAULT: "#C8923A",
          dark: "#A9781F",
          light: "#E3BC78",
          glow: "#F0C977",
        },
        cream: {
          DEFAULT: "#FCFBF8",
          50: "#FFFDF8",
          100: "#F5F2EA",
          200: "#EBE6D8",
        },
        slate: {
          DEFAULT: "#5D6675",
          muted: "#5D6675",
        },
        paleblue: "#EAF3FF",
        // Verdict / severity semantic colors. Do not use for buttons/chrome.
        verdict: {
          red: "#DC2626",
          amber: "#D98E2B",
          green: "#16A34A",
        },
        flag: {
          orange: "#F97316",
          red: "#DC2626",
          green: "#16A34A",
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
        lift: "0 2px 6px rgba(20,37,61,0.08), 0 24px 48px -12px rgba(20,37,61,0.22)",
        glass:
          "0 1px 0 rgba(255,255,255,0.6) inset, 0 1px 3px rgba(20,37,61,0.08), 0 18px 50px -18px rgba(20,37,61,0.30)",
        "glass-dark":
          "0 1px 0 rgba(255,255,255,0.08) inset, 0 24px 60px -20px rgba(0,0,0,0.55)",
        glow: "0 0 0 1px rgba(200,146,58,0.35), 0 12px 40px -8px rgba(200,146,58,0.45)",
      },
      backgroundImage: {
        "grid-navy":
          "linear-gradient(rgba(20,37,61,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(20,37,61,0.05) 1px, transparent 1px)",
        "grid-light":
          "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
      },
      keyframes: {
        "float-slow": {
          "0%, 100%": { transform: "translateY(0) rotate(var(--tw-rotate,0))" },
          "50%": { transform: "translateY(-14px) rotate(var(--tw-rotate,0))" },
        },
        "float-slower": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-22px)" },
        },
        "reveal-up": {
          from: { opacity: "0", transform: "translateY(22px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        sweep: {
          "0%": { transform: "translateX(-120%) skewX(-12deg)" },
          "100%": { transform: "translateX(220%) skewX(-12deg)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(217,142,43,0.45)" },
          "70%": { boxShadow: "0 0 0 12px rgba(217,142,43,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(217,142,43,0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "float-slow": "float-slow 7s ease-in-out infinite",
        "float-slower": "float-slower 9s ease-in-out infinite",
        "reveal-up": "reveal-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.66,0,0,1) infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
