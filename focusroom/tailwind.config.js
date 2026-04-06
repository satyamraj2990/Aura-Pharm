/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          900: '#0F172A',
          cyan: '#22D3EE',
          violet: '#8B5CF6',
        },
      },
      boxShadow: {
        glow: '0 0 40px rgba(34, 211, 238, 0.28)',
        'glow-lg': '0 0 60px rgba(34, 211, 238, 0.4)',
        'glow-xl': '0 0 80px rgba(34, 211, 238, 0.5)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

