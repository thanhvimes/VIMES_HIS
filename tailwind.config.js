/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./modules/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./views/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        primary: {
          50: '#F0F7FF',
          100: '#E0EFFF',
          200: '#B8DBFF',
          300: '#7AB7FF',
          400: '#4796FF',
          500: '#0078D4', // Azure DevOps Blue
          DEFAULT: '#0078D4',
          600: '#005A9E',
          700: '#004578',
          800: '#00335A',
          900: '#002038',
        },
        secondary: {
          DEFAULT: '#17424C', // Zendesk Dark Teal
          light: '#00A88E',  // Zendesk Green
          surface: '#F4F7F9'
        },
        azure: '#0078D4',
        zendesk: '#17424C',
        accent: '#3BB17B', // Screenshot status green

        // Semantic colors
        success: { DEFAULT: '#107C10', light: '#DFF6DD', dark: '#0B5A0B' }, // Azure Success
        danger: { DEFAULT: '#A4262C', light: '#FDE7E9', dark: '#75191C' }, // Azure Error
        warning: { DEFAULT: '#9D5D00', light: '#FFF4CE', dark: '#663D00' },
        info: { DEFAULT: '#0078D4', light: '#EFF6FF', dark: '#005A9E' },

        // Light theme refined
        background: '#F3F5F7', // Soft background
        surface: '#FFFFFF',
        onPrimary: '#FFFFFF',
        onSurface: '#201F1E', // Microsoft standard dark
        border: '#EDEBE9',

        // Dark theme (Refined bluish tint)
        dark: {
          background: '#071521', // Deep mysterious blue
          surface: '#0C243B',    // Bluish tinted surface
          onSurface: '#F1F5F9',
          primary: '#60A5FA',
          border: '#1E3A5F',     // Bluish border
        }
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'translate(-50%, 100%) scale(0.5)', opacity: '0' },
          '50%': { transform: 'translate(-50%, -10%) scale(1.05)' },
          '70%': { transform: 'translate(-50%, 5%) scale(0.95)' },
          '100%': { transform: 'translate(-50%, 0) scale(1)', opacity: '1' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        zoomIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'slide-in-up': 'slideInUp 0.4s ease-out forwards',
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
        'pulse-slow': 'pulseSlow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'zoom-in': 'zoomIn 0.2s ease-out forwards',
      }
    },
  },
  plugins: [],
}
