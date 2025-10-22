import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F6EFC",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#0FB8FC",
          foreground: "#020817",
        },
        background: "#F7FAFC",
        muted: "#64748B",
      },
    },
  },
  plugins: [],
};

export default config;
