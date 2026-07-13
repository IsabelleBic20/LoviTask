/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#F7F5FF',
          dark: '#0B0A16',
          cardLight: '#FFFFFF',
          cardDark: '#121124',
          indigo: '#6366f1',
          purple: '#9333ea',
          violet: '#8b5cf6',
          lavender: '#e0e7ff',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce-slow 4s infinite ease-in-out',
        'breathe': 'breathe 3s infinite ease-in-out',
        'shimmer': 'shimmer 2s infinite linear',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
      },
      keyframes: {
        'bounce-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'breathe': {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 4px 20px 0 rgba(99, 102, 241, 0.15)' },
          '50%': { transform: 'scale(1.015)', boxShadow: '0 8px 30px 0 rgba(99, 102, 241, 0.25)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
