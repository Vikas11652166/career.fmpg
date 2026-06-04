/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Redefining standard Tailwind color tokens for global Light-Theme mapping
        'black': '#ffffff',
        'white': '#0f172a',
        'gray': {
          950: '#ffffff',
          900: '#fafbfc',
          800: '#f1f5f9',
          700: '#e2e8f0',
          600: '#cbd5e1',
          500: '#64748b',
          400: '#5e6b7e',
          300: '#475569',
          200: '#334155',
          100: '#1e293b',
          50: '#0f172a',
        },
        'zinc': {
          900: '#fafbfc',
        },
        'lime': {
          400: '#10b981', /* Mint */
          500: '#059669', /* FMPG Emerald Green */
          600: '#047857', /* Dark Emerald */
        },
        'primary-black': 'var(--color-black)',
        'secondary-black': 'var(--color-surface)',
        'primary-yellow': 'var(--color-primary)',
        'secondary-yellow': 'var(--color-primary-hover)',
        'text-light': 'var(--color-white)',
        'dark-gray': 'var(--color-surface-elevated)',
        'card-bg': 'var(--color-surface)',
        'lime-brand': 'var(--color-primary)',
        'lime-brand-light': 'var(--color-primary-hover)',
        'lime-brand-dark': '#047857',
      },
      backgroundColor: {
        'dark': 'var(--color-black)',
        'card': 'var(--color-surface)',
        'input': 'var(--color-surface-elevated)',
      },
      textColor: {
        'primary': 'var(--color-white)',
        'secondary': 'var(--color-muted)',
        'accent': 'var(--color-primary)',
      },
      borderColor: {
        'primary': 'var(--color-border)',
        'accent': 'var(--color-primary)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'pulse-slow': 'pulse 3s infinite',
        'float': 'float 6s ease-in-out infinite',
        'scale-in': 'scaleIn 0.5s ease-out forwards',
        'bounce-soft': 'bounceSoft 2s infinite',
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
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'glow-lime': '0 0 15px 5px rgba(5, 150, 105, 0.15)',
        'glow-yellow': '0 0 15px 5px rgba(245, 158, 11, 0.15)',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      }
    },
  },
  plugins: [],
}
