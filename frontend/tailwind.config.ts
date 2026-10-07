import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Kantumruy Pro"', 'system-ui', 'sans-serif'],
        khmer: ['"Kantumruy Pro"', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dbe4fe',
          200: '#bfd0fe',
          300: '#93b1fd',
          400: '#6087fa',
          500: '#3b62f6',
          600: '#2544eb',
          700: '#1d32d8',
          800: '#1e2ab0',
          900: '#1e288a',
          950: '#171c54',
        },
        khmer: {
          accent: '#0d9488',
          glow: '#14b8a6',
        },
      },
      lineHeight: {
        khmer: '1.85',
      },
    },
  },
  plugins: [],
} satisfies Config;
