/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#f2ca50',
        background: '#131313',
        surface: {
          DEFAULT: '#1c1b1b',
          container: '#232323',
          bright: '#2d2d2d',
        },
        on: {
          surface: '#e5e2e1',
          variant: '#b3b3b3',
          primary: '#3d2e00',
        }
      }
    },
  },
  plugins: [],
}
