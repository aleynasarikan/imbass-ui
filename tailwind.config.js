/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark background system
        dark: {
          DEFAULT: '#1a1a2e',
          50: '#2a2a3e',
          100: '#232336',
          200: '#1e1e30',
          300: '#16162a',
          400: '#121224',
          500: '#0e0e1e',
          surface: '#222236',
          card: '#252540',
          sidebar: '#1e1e2d',
          nav: '#1a1a2e',
        },
        // Warm accent palette (from reference)
        accent: {
          peach: '#e8a87c',
          salmon: '#d4736e',
          rose: '#c97b84',
          lilac: '#b08bbf',
          mint: '#7ec8a0',
          DEFAULT: '#e8a87c',
        },
        // Muted text colors
        muted: {
          DEFAULT: '#8b8ba3',
          light: '#a0a0b8',
          lighter: '#c0c0d0',
        },
        // Status colors
        success: '#4ade80',
        warning: '#fbbf24',
        danger: '#f87171',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      spacing: {
        'sidebar': '260px',
        'navbar': '64px',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(232, 168, 124, 0.15)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.3)',
        'sidebar': '4px 0 24px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
}
