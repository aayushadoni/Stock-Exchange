import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontSize: {
      xs: "0.7rem",
      sm: "0.8rem",
      base: ["1rem", { lineHeight: "1.5", letterSpacing: "-0.017em" }],
      lg: ["1.125rem", { lineHeight: "1.5", letterSpacing: "-0.017em" }],
      xl: ["1.25rem", { lineHeight: "1.5", letterSpacing: "-0.017em" }],
      "2xl": ["1.5rem", { lineHeight: "1.415", letterSpacing: "-0.037em" }],
      "3xl": [
        "1.875rem",
        { lineHeight: "1.3333", letterSpacing: "-0.037em" },
      ],
      "4xl": ["2.25rem", { lineHeight: "1.2777", letterSpacing: "-0.037em" }],
      "5xl": ["3rem", { lineHeight: "1", letterSpacing: "-0.037em" }],
      "6xl": ["4rem", { lineHeight: "1", letterSpacing: "-0.037em" }],
      "7xl": ["4.5rem", { lineHeight: "1", letterSpacing: "-0.037em" }],
    },
    keyframes: {
      "code-1": {
        "0%": { opacity: "0" },
        "2.5%": { opacity: "1" },
        "97.5%": { opacity: "1" },
        "100%": { opacity: "0" },
      },
      "code-2": {
        "16.2%": { opacity: "0" },
        "18.75%": { opacity: "1" },
        "97.5%": { opacity: "1" },
        "100%": { opacity: "0" },
      },
      "code-3": {
        "32.5%": { opacity: "0" },
        "35%": { opacity: "1" },
        "97.5%": { opacity: "1" },
        "100%": { opacity: "0" },
      },
      "code-4": {
        "48.75%": { opacity: "0" },
        "51.25%": { opacity: "1" },
        "97.5%": { opacity: "1" },
        "100%": { opacity: "0" },
      },
      "code-5": {
        "65%": { opacity: "0" },
        "72.5%": { opacity: "1" },
        "97.5%": { opacity: "1" },
        "100%": { opacity: "0" },
      },
      "code-6": {
        "81.25%": { opacity: "0" },
        "83.75%": { opacity: "1" },
        "97.5%": { opacity: "1" },
        "100%": { opacity: "0" },
      },
      breath: {
        "0%, 100%": { transform: "scale(0.95)" },
        "50%": { transform: "scale(1.1)" },
      },
      float: {
        "0%, 100%": { transform: "translateY(0)" },
        "50%": { transform: "translateY(-5%)" },
      },
      line: {
        "0%, 100%": { left: "0", opacity: "0" },
        "50%": { left: "100%", transform: "translateX(-100%)" },
        "10%, 40%, 60%, 90%": { opacity: "0" },
        "25%, 75%": { opacity: "1" },
      },
      "infinite-scroll": {
        from: { transform: "translateX(0)" },
        to: { transform: "translateX(-100%)" },
      },
    },
    extend: {
      colors: {
        greenBackgroundTransparent: 'rgba(0,194,120,.12)',
        redBackgroundTransparent: 'rgba(234,56,59,.12)',
        baseBackgroundL2: "rgb(32,33,39)",
        baseBackgroundL3: "rgb(32,33,39)",
        greenPrimaryButtonBackground: "rgb(0,194,120)",
        redPrimaryButtonBackground: "rgb(194, 0, 0)"
      },
      borderColor: {
        redBorder: 'rgba(234,56,59,.5)',
        greenBorder: 'rgba(0,194,120,.4)',
        baseBorderMed: '#cccccc',
        accentBlue: "rgb(76,148,255)",
        baseBorderLight: "rgb(32,33,39)",
        baseTextHighEmphasis: "rgb(244,244,246)"
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      textColor: {
        greenPrimaryButtonText: "rgb(20,21,27)"
      }
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
export default config;
