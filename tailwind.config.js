/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        abyss: {
          50: '#f1f5ff',
          100: '#e1e9ff',
          200: '#c6d3ff',
          300: '#9cb2ff',
          400: '#6a87ff',
          500: '#4260ff',
          600: '#283cf5',
          700: '#1e2dd8',
          800: '#1b28ae',
          900: '#0b1020',
          950: '#070814',
        },
        neon: {
          cyan: '#22d3ee',
          orange: '#fb923c',
          pink: '#f472b6',
          purple: '#a78bfa',
          green: '#4ade80',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(34, 211, 238, 0.35)',
        'glow-orange': '0 0 20px rgba(251, 146, 60, 0.4)',
        'glow-soft': '0 0 40px rgba(167, 139, 250, 0.15)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'float-y': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      animation: {
        'pulse-slow': 'pulse-slow 2s ease-in-out infinite',
        'float-y': 'float-y 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
