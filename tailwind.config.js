/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4fa',
          100: '#d9e2f0',
          200: '#b3c5e0',
          300: '#8da7d0',
          400: '#5e7bb5',
          500: '#3a5a9a',
          600: '#2c4578',
          700: '#1f3460',
          800: '#15244a',
          900: '#0b1730',
          950: '#070f20',
        },
        teal: {
          50: '#effcf8',
          100: '#cbf3e6',
          200: '#99e7d0',
          300: '#5fd6b5',
          400: '#2ec099',
          500: '#14a580',
          600: '#0c8466',
          700: '#0a6852',
          800: '#0a5242',
          900: '#094438',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 10px 30px -10px rgb(11 23 48 / 0.15), 0 4px 12px -6px rgb(11 23 48 / 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
