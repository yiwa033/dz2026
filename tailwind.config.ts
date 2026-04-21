import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1d3b72",
          foreground: "#ffffff"
        }
      }
    }
  },
  plugins: []
};

export default config;
