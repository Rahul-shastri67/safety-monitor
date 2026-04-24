/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0a0f1e',
          card: '#0f1629',
          border: '#1e2d4a',
          hover: '#162038',
        },
        brand: {
          DEFAULT: '#3b82f6',
          light: '#60a5fa',
          dark: '#1d4ed8',
        },
        danger: { DEFAULT: '#ef4444', light: '#fca5a5', dark: '#b91c1c' },
        warning: { DEFAULT: '#f59e0b', light: '#fcd34d', dark: '#b45309' },
        success: { DEFAULT: '#10b981', light: '#6ee7b7', dark: '#047857' },
        purple: { DEFAULT: '#8b5cf6', light: '#c4b5fd', dark: '#6d28d9' },
      },
      fontFamily: {
        sans: ['"Syne"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Syne"', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'ping-once': 'ping 0.8s cubic-bezier(0, 0, 0.2, 1) 1',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(59,130,246,0.4)' },
          '50%': { boxShadow: '0 0 24px rgba(59,130,246,0.8)' },
        },
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(30,45,74,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(30,45,74,0.4) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  plugins: [],
};
