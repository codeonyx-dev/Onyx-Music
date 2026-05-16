/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        onyx: {
          black: '#000000',
          dark: '#0F0F0F',
          panel: '#1A1A1A',
          hover: '#2A2A2A',
          border: '#333333',
          text: '#FFFFFF',
          muted: '#A0A0A0',
          accent: '#FFFFFF',
        }
      }
    },
  },
  plugins: [],
}