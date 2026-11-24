/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#EEF7F0', 100: '#D8EDDD', 200: '#B3DBBC', 500: '#3D8B4F', 600: '#2F7340', 700: '#25603A', 900: '#12301D' },
        gold: { 100: '#FEF3C7', 500: '#F59E0B', 600: '#D97706' },
        ink: { 900: '#1B2420', 700: '#3A4741', 500: '#66736C', 300: '#A9B3AD', 200: '#D5DBD7', 100: '#EAEEEB', 50: '#F5F7F5' },
        danger: { 100: '#FDE8E8', 600: '#C0392B' },
      },
    },
  },
  plugins: [],
};
