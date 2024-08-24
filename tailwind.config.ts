/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    "bg-red-300",
    "bg-orange-300",
    "bg-yellow-300",
    "bg-green-300",
    "bg-teal-300",
    "bg-blue-300",
    "bg-indigo-300",
    "bg-purple-300",
    "bg-pink-300",
    "bg-rose-300",
    "bg-cyan-300",
    "bg-emerald-300",
    "bg-lime-300",
    "bg-amber-300",
    "bg-fuchsia-300",
    "bg-violet-300",
    "bg-sky-300",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        btn: {
          background: "hsl(var(--btn-background))",
          "background-hover": "hsl(var(--btn-background-hover))",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
