import type { Config } from "tailwindcss";

/**
 * Driveway Advocate design system — modern buyer-advocacy SaaS / deal-defense
 * dashboard. Clean navy/white, card-based, NOT cream-and-gold brochure.
 *
 * FUNNEL colors teach which path a buyer is on (one action color each):
 *   - GREEN  #188038  quote review / Deal Rescue
 *   - BLUE   #0E4D8A  still-shopping / Co-Pilot / Deal Maker
 *   - GOLD   #C98A12  Concierge / premium "handle it for me"
 *   - NAVY   #0B1F3A  brand trust, header, footer, dark authority sections
 * RISK colors are diagnosis-only (never brand chrome):
 *   - RED #C2412D / ORANGE #E17B22  overcharge + risk flags
 * Surfaces: BG #F6F8FB (light gray), CARD #FFFFFF, thin borders #D9E1EC.
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
          DEFAULT: "#0B1F3A",
          50: "#EAF0F7",
          100: "#D2DEEC",
          700: "#102A4C", // navy-soft
          800: "#0B1F3A",
          900: "#081B33",
          950: "#061426", // midnight
        },
        ink: "#102033",
        // GOLD — Concierge / premium funnel only.
        gold: {
          DEFAULT: "#C98A12",
          dark: "#A66F0B",
          soft: "#FFF4DD",
          light: "#E3BC78",
          glow: "#F0C977",
        },
        // GREEN — quote review / Deal Rescue funnel.
        green: {
          DEFAULT: "#188038",
          dark: "#11652B",
          soft: "#EAF6EE",
        },
        // BLUE — still-shopping / Co-Pilot / Deal Maker funnel.
        blue: {
          DEFAULT: "#0E4D8A",
          dark: "#083968",
          soft: "#EAF2FB",
        },
        // RED — post-sale triage funnel only (also risk/overcharge).
        red: {
          DEFAULT: "#C2412D",
          dark: "#9F2F20",
          soft: "#FDECEA",
        },
        // ORANGE — caution accent within post-sale / risk.
        orange: {
          DEFAULT: "#E17B22",
          soft: "#FFF0E3",
        },
        // Cool neutral surfaces (formerly "cream"): page bg, washes, cards.
        cream: {
          DEFAULT: "#F6F8FB", // page background
          50: "#FFFFFF", // card / paper
          100: "#EEF2F7", // light wash
          200: "#E1E8F0", // deeper wash
        },
        slate: {
          DEFAULT: "#5D6B7A",
          muted: "#5D6B7A",
        },
        // Card border hairlines.
        edge: {
          DEFAULT: "#D9E1EC",
          strong: "#B8C5D4",
        },
        paleblue: "#EAF2FB",
        // Verdict / diagnostic colors. DIAGNOSIS ONLY — never buttons/chrome.
        verdict: {
          green: "#188038", // Looks fair (low concern)
          blue: "#2563EB", // Verify first (needs confirmation)
          amber: "#E17B22", // Push back first (negotiate)
          red: "#C2412D", // Do not sign yet (serious risk)
          black: "#061426", // Walk-away signal (severe)
        },
        // Risk flags / overcharge warnings only.
        flag: {
          orange: "#E17B22",
          red: "#C2412D",
          green: "#188038",
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
        card: "0 1px 2px rgba(11,31,58,0.06), 0 8px 24px rgba(11,31,58,0.08)",
        lift: "0 2px 6px rgba(11,31,58,0.08), 0 24px 48px -12px rgba(11,31,58,0.22)",
        glass:
          "0 1px 0 rgba(255,255,255,0.6) inset, 0 1px 3px rgba(11,31,58,0.08), 0 18px 50px -18px rgba(11,31,58,0.30)",
        "glass-dark":
          "0 1px 0 rgba(255,255,255,0.08) inset, 0 24px 60px -20px rgba(0,0,0,0.55)",
        glow: "0 0 0 1px rgba(201,138,18,0.35), 0 12px 40px -8px rgba(201,138,18,0.45)",
      },
      backgroundImage: {
        "grid-navy":
          "linear-gradient(rgba(11,31,58,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(11,31,58,0.05) 1px, transparent 1px)",
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
          "0%": { boxShadow: "0 0 0 0 rgba(201,138,18,0.45)" },
          "70%": { boxShadow: "0 0 0 12px rgba(201,138,18,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(201,138,18,0)" },
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
