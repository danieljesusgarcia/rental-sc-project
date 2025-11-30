/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FAF9F7',
          100: '#F0EBE5',
          200: '#E0D5C9',
          300: '#C9B8A0',
          400: '#A68968',
          500: '#8B7355',
          600: '#6B5943',
          700: '#4D3F2F',
          800: '#32291E',
          900: '#1A1510',
        },
        secondary: {
          DEFAULT: '#C9B8A0',
          light: '#E0D5C9',
          dark: '#A68968',
        },
        accent: '#D4AF37',
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif']
      }
    },
    backgroundImage: {
      // eslint-disable-next-line quotes
      'mvx-white': "url('../multiversx-white.svg')"
    }
  },
  plugins: []
};
