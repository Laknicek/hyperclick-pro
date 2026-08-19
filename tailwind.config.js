/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#090a0f',
        card: '#12141e',
        cardHover: '#181b2a',
        accent: {
          cyan: '#00f2fe',
          blue: '#4facfe',
          purple: '#7f00ff',
          pink: '#e100ff',
          emerald: '#00f5a0',
          amber: '#ffaa00',
          rose: '#ff3366',
        },
        surface: {
          50: 'rgba(255, 255, 255, 0.03)',
          100: 'rgba(255, 255, 255, 0.06)',
          200: 'rgba(255, 255, 255, 0.10)',
          300: 'rgba(255, 255, 255, 0.15)',
          400: 'rgba(255, 255, 255, 0.25)',
        },
        border: 'rgba(255, 255, 255, 0.08)',
        borderHighlight: 'rgba(0, 242, 254, 0.3)',
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(0, 242, 254, 0.4)',
        'glow-purple': '0 0 25px -5px rgba(127, 0, 255, 0.4)',
        'glow-pink': '0 0 25px -5px rgba(225, 0, 255, 0.4)',
        'glow-emerald': '0 0 25px -5px rgba(0, 245, 160, 0.4)',
        'glow-rose': '0 0 25px -5px rgba(255, 51, 102, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        'xs': '2px',
        '2xl': '24px',
        '3xl': '32px',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'subtle-float': 'subtleFloat 4s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.9', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.98)' },
        },
        subtleFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        }
      }
    },
  },
  plugins: [],
}
