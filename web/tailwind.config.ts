import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        brand: "#2563eb",
        brandlt: "#93c5fd",
      },
    },
  },
  plugins: [],
};
export default config;
