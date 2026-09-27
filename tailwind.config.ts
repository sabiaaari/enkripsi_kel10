import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        moya: {
          bg: "#F8F6FB",
          surface: "#FFFFFF",
          soft: "#F1ECF8",
          border: "#E7E0F1",
          primary: "#A996D6",
          primarydark: "#8874C2",
          pink: "#F3C9D4",
          sage: "#BFD8BD",
          butter: "#F3DFA8",
          text: "#443E54",
          muted: "#8D8499",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-jakarta)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 24px -12px rgba(137, 116, 194, 0.28)",
        card: "0 4px 16px -6px rgba(137, 116, 194, 0.18)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
