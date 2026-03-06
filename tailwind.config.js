/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#1a1b26',
          panel: '#24283b',
          elevated: '#292e42',
          hover: '#2f3549'
        },
        text: {
          primary: '#c0caf5',
          muted: '#565f89'
        },
        accent: {
          DEFAULT: '#7aa2f7',
          hover: '#89b4fa'
        },
        border: '#3b4261',
        red: '#f7768e',
        green: '#9ece6a',
        yellow: '#e0af68',
        orange: '#ff9e64',
        purple: '#bb9af7',
        cyan: '#7dcfff'
      }
    }
  },
  plugins: []
}
