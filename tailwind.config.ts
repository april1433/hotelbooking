/* eslint-disable @typescript-eslint/no-require-imports */
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Luxury Hotel Palette
        navy: {
          50:  "#eef1f8",
          100: "#d5ddf0",
          200: "#adbce1",
          300: "#7a94cc",
          400: "#4d6db5",
          500: "#2c4e9a",
          600: "#1e3a7c",
          700: "#1a2e63",
          800: "#162650",
          900: "#0f1a38",
          950: "#0a1128",
        },
        gold: {
          50:  "#fdf9f0",
          100: "#faf0d7",
          200: "#f4dfa6",
          300: "#ebc96a",
          400: "#e2ae38",
          500: "#c9931e",
          600: "#a97316",
          700: "#875913",
          800: "#6b4514",
          900: "#583814",
          950: "#331e07",
        },
        cream: {
          50:  "#fefefe",
          100: "#faf8f5",
          200: "#f4f0e8",
          300: "#ece5d5",
          400: "#dfd4bb",
          500: "#cec09d",
          600: "#b5a07a",
          700: "#927e5d",
          800: "#79664d",
          900: "#635541",
          950: "#352c21",
        },
        charcoal: {
          50:  "#f5f6f7",
          100: "#e8eaed",
          200: "#c9cdd5",
          300: "#9ea5b4",
          400: "#6c7890",
          500: "#4d5a72",
          600: "#3b4660",
          700: "#2d3652",
          800: "#1e263d",
          900: "#141a2e",
          950: "#0f1623",
        },
      },
      fontFamily: {
        sans:    ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(24px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "accordion-down":  "accordion-down 0.2s ease-out",
        "accordion-up":    "accordion-up 0.2s ease-out",
        "fade-in":         "fade-in 0.4s ease-out",
        "fade-in-up":      "fade-in-up 0.5s ease-out",
        "slide-in-right":  "slide-in-right 0.4s ease-out",
        shimmer:           "shimmer 2s linear infinite",
        "spin-slow":       "spin-slow 8s linear infinite",
        float:             "float 3s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-luxury": "linear-gradient(135deg, #1a2744 0%, #0f1623 50%, #1a2744 100%)",
        "gradient-gold":   "linear-gradient(135deg, #c9a96e 0%, #e2ae38 50%, #c9a96e 100%)",
        "glass":           "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
      },
      boxShadow: {
        luxury:  "0 4px 24px rgba(26, 39, 68, 0.15), 0 1px 4px rgba(26, 39, 68, 0.08)",
        "luxury-lg": "0 8px 48px rgba(26, 39, 68, 0.2), 0 2px 8px rgba(26, 39, 68, 0.1)",
        gold:    "0 4px 16px rgba(201, 147, 30, 0.3)",
        glass:   "0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255,255,255,0.1)",
        card:    "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
