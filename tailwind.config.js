/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        surface: "#18181b",
        border: "#27272a",
        muted: "#3f3f46",
        "text-secondary": "#a1a1aa",
        "text-primary": "#f4f4f5",
        accent: "#84cc16",
        "accent-pressed": "#a3e635",
        destructive: "#ef4444",
        warning: "#f59e0b",
      },
    },
  },
  plugins: [],
};
