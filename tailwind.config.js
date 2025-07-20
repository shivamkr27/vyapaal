/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      animation: {
        'float': 'float 8s ease-in-out infinite',
        'gentle-bounce': 'gentle-bounce 3s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.8s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'soft-glow': 'soft-glow 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(2deg)' },
        },
        'gentle-bounce': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'fade-in-up': {
          'from': {
            opacity: '0',
            transform: 'translateY(40px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        shimmer: {
          '0%': { 'background-position': '-200% 0' },
          '100%': { 'background-position': '200% 0' },
        },
        'gradient-shift': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'soft-glow': {
          '0%, 100%': { 'box-shadow': '0 0 30px rgba(139, 92, 246, 0.1)' },
          '50%': { 'box-shadow': '0 0 50px rgba(139, 92, 246, 0.2)' },
        },
      },
      backgroundSize: {
        '200%': '200%',
        '400%': '400%',
      },
      backdropBlur: {
        xs: '2px',
      },
      colors: {
        cream: {
          50: '#fefdf8',
          100: '#fef7ed',
          200: '#fef2e2',
          300: '#fde8cc',
          400: '#fbd9a5',
          500: '#f8c572',
          600: '#f4a340',
          700: '#e8821e',
          800: '#d97706',
          900: '#b45309',
        },
      },
    },
  },
  plugins: [],
};
