import type { Config } from "tailwindcss";

/**
 * Driveway Advocate brand system — "Trust Navy + Signal Gold + Verdict palette."
 *
 * Strict color rules (this is a decision-support tool; color teaches meaning):
 *   - GOLD   #B8872E  = primary BRAND ACTION only (main CTAs, shield accents,
 *                       recommended/selected states). Never a risk color.
 *   - NAVY   #0B1628  = authority/trust (headers, dark sections, footer, wordmark).
 *   - CREAM  #F8F5EF  = warm page background; WHITE = cards.
 *   - VERDICT green/blue/amber/red/black = DIAGNOSIS only, never brand chrome:
 *       green  #2E9E55  Looks fair (low concern)
 *       blue   #2563EB  Verify first (needs confirmation)
 *       amber  #D98A1E  Push back first (negotiate)
 *       red    #D14343  Do not sign yet (serious risk)
 *       black  #050816  Walk-away signal (severe)
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
          DEFAULT: "#0B1628",
          50: "#F1F3F6",
          100: "#D7DDE6",
          700: "#1C3252",
          800: "#10213A",
          900: "#0B1628",
          950: "#07111F",
        },
        ink: "#111827",
        gold: {
          DEFAULT: "#B8872E",
          dark: "#9F7324",
          light: "#E3BC78",
          glow: "#F0C977",
          // Soft brand accents (pills, badges, light callouts).
          100: "#F3E6C8",
          50: "#FBF5E8",
        },
        cream: {
          DEFAULT: "#F8F5EF",
          50: "#FCFAF4",
          100: "#F5F2EA",
          200: "#EBE6D8",
        },
        slate: {
          DEFAULT: "#4B5563",
          muted: "#6B7280",
        },
        paleblue: "#EAF3FF",
        // Verdict / diagnostic colors. DIAGNOSIS ONLY — never buttons/chrome.
        verdict: {
          green: "#2E9E55", // Looks fair (low concern)
          blue: "#2563EB", // Verify first (needs confirmation)
          amber: "#D98A1E", // Push back first (negotiate)
          red: "#D14343", // Do not sign yet (serious risk)
          black: "#050816", // Walk-away signal (severe)
        },
        flag: {
          orange: "#F97316", // time-sensitive / urgency accent
          red: "#D14343",
          green: "#2E9E55",
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
        card: "0 1px 2px rgba(11,22,40,0.06), 0 8px 24px rgba(11,22,40,0.08)",
        lift: "0 2px 6px rgba(11,22,40,0.08), 0 24px 48px -12px rgba(11,22,40,0.22)",
        glass:
          "0 1px 0 rgba(255,255,255,0.6) inset, 0 1px 3px rgba(11,22,40,0.08), 0 18px 50px -18px rgba(11,22,40,0.30)",
        "glass-dark":
          "0 1px 0 rgba(255,255,255,0.08) inset, 0 24px 60px -20px rgba(0,0,0,0.55)",
        glow: "0 0 0 1px rgba(184,135,46,0.35), 0 12px 40px -8px rgba(184,135,46,0.45)",
      },
      backgroundImage: {
        "grid-navy":
          "linear-gradient(rgba(11,22,40,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(11,22,40,0.05) 1px, transparent 1px)",
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
          "0%": { boxShadow: "0 0 0 0 rgba(184,135,46,0.45)" },
          "70%": { boxShadow: "0 0 0 12px rgba(184,135,46,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(184,135,46,0)" },
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
