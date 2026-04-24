import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      boxShadow: {
        panel: "0 16px 40px rgba(24, 35, 54, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
