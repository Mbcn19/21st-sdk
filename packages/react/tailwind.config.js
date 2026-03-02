/** @type {import('tailwindcss').Config} */
export default {
  important: ".an-root",
  corePlugins: { preflight: false },
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--an-background)",
        foreground: "var(--an-foreground)",
        muted: { DEFAULT: "var(--an-foreground-muted)", foreground: "var(--an-foreground-muted)" },
        accent: { DEFAULT: "var(--an-background-secondary)", foreground: "var(--an-foreground)" },
        border: "var(--an-border-color)",
        destructive: { DEFAULT: "#ef4444", foreground: "#ffffff" },
        popover: { DEFAULT: "var(--an-background)", foreground: "var(--an-foreground)" },
      },
    },
  },
  plugins: [],
}
