/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Warm earth tones inspired by Substack design
        warm: {
          bg: '#1a1a1a',          // Dark background
          bgLight: '#242424',      // Slightly lighter background
          text: '#ffffff',         // White text
          textMuted: '#a0a0a0',    // Muted gray text
          accent: '#FF6719',       // Orange accent
          accentHover: '#ff8547',  // Lighter orange for hover
          brown: '#8B6F47',        // Warm brown
          beige: '#D4B896',        // Beige
          olive: '#6B7455',        // Olive green
          rust: '#B85C38',         // Rust/terracotta
        },
      },
    },
  },
  plugins: [],
}
