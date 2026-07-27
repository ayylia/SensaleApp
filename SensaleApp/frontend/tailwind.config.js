/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        retro: {
          pink: '#FFC1CC',
          blue: '#B2D8E5',
          lime: '#CADB7F',
          cream: '#F8F4E1',
          border: '#000000',
        }
      }
    },
  },
  plugins: [],
}
