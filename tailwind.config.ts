import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F6F0E4",
        paper: "#FFFDF8",
        ink: "#17233F",
        subtle: "#5A6072",
        navy: "#23396B",
        "navy-deep": "#16264A",
        orange: "#F49B42",
        "orange-deep": "#9C5210",
        mint: "#56C3A4",
        "mint-deep": "#1F6B58",
        coral: "#EF6F62",
        "coral-deep": "#A6403A",
        line: "#E4DCCB",
        "navy-soft": "#E7ECF7",
        "mint-soft": "#E4F5EE",
        "coral-soft": "#FCE9E6",
        "orange-soft": "#FCEEDB",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"Nunito Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ['"Nunito Sans"', "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: { card: "24px", tile: "18px", pill: "999px" },
      boxShadow: {
        card: "0 24px 48px -34px rgba(23,35,63,.45)",
        lift: "0 4px 8px rgba(23,35,63,.06), 0 18px 34px -20px rgba(23,35,63,.38)",
        tile: "0 1px 2px rgba(23,35,63,.05), 0 8px 16px -12px rgba(23,35,63,.28)",
        inset: "inset 0 1px 0 rgba(255,255,255,.7)",
      },
      transitionTimingFunction: {
        pop: "cubic-bezier(.2,.9,.25,1.15)",
      },
      keyframes: {
        "rise-in": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "tile-in": {
          "0%": { opacity: "0", transform: "translateY(16px) rotateX(-18deg) scale(.96)" },
          "60%": { opacity: "1" },
          "100%": { opacity: "1", transform: "translateY(0) rotateX(0) scale(1)" },
        },
        "pop": {
          "0%": { transform: "scale(.86)" },
          "55%": { transform: "scale(1.06)" },
          "100%": { transform: "scale(1)" },
        },
        "warm-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(244,155,66,0)" },
          "35%": { boxShadow: "0 0 0 6px rgba(244,155,66,.28)" },
        },
        "shake-x": {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-4px)" },
          "45%": { transform: "translateX(4px)" },
          "70%": { transform: "translateX(-2px)" },
        },
        "float-y": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-7px)" },
        },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
        "confetti-a": {
          "0%": { opacity: "0", transform: "translate(0,0) scale(.4)" },
          "30%": { opacity: "1" },
          "100%": { opacity: "0", transform: "translate(14px,-22px) scale(1)" },
        },
      },
      animation: {
        "rise-in": "rise-in .5s cubic-bezier(.2,.7,.2,1) both",
        "tile-in": "tile-in .5s cubic-bezier(.2,.8,.2,1) both",
        pop: "pop .45s cubic-bezier(.2,.9,.25,1.15) both",
        "warm-pulse": "warm-pulse 1.8s ease-out 2",
        "shake-x": "shake-x .45s ease-in-out",
        "float-y": "float-y 6s ease-in-out infinite",
        "spin-slow": "spin-slow 18s linear infinite",
        "confetti-a": "confetti-a 1.1s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
