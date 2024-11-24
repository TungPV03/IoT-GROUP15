/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0B192C',
        secondary: '#1E3E62',
        accent: "#DDE6ED",
        success: '#4caf50',
        warning: '#ff9800',
        danger: '#f44336',
      },
    },
  },
  plugins: [],
}
