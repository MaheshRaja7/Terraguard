/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        eoc: {
          bg: "#070b14",
          panel: "#0e172a",
          card: "#131f37",
          cardHover: "#1a2a4b",
          border: "#1e3156",
          text: "#f1f5f9",
          muted: "#94a3b8",
          radar: "#38bdf8",
        },
        risk: {
          low: "#10b981",
          moderate: "#f59e0b",
          high: "#f97316",
          critical: "#ef4444",
        }
      },
      fontFamily: {
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      }
    },
  },
  plugins: [],
};
