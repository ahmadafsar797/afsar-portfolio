/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cormorant', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Archivo', 'sans-serif'],
      },
      colors: {
        cinema: {
          950: '#070709',
          900: '#0b0b0e',
          850: '#101014',
          800: '#16161d',
          750: '#1d1d26',
          700: '#252530',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-hover': 'rgba(255, 255, 255, 0.18)',
          muted: '#8e8e9c',
          silver: '#d1d1dc',
        },
        gold: {
          400: '#e5b158',
          500: '#d49a37',
          600: '#b87e22',
        },
        amber: {
          warm: '#f3a953',
        }
      },
      aspectRatio: {
        '9/16': '9 / 16',
        '16/9': '16 / 9',
        '4/5': '4 / 5',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
