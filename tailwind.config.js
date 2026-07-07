/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Phera brand — warm saffron + deep burgundy, inspired by wedding mandap colors
        phera: {
          50: '#fef7f0',
          100: '#fdecd9',
          200: '#fad5b0',
          300: '#f6b87d',
          400: '#f19448',
          500: '#ed7824',
          600: '#de5f1a',
          700: '#b84717',
          800: '#93391b',
          900: '#773119',
        },
        wine: {
          50: '#fdf2f4',
          100: '#fce7ea',
          200: '#f9d0d9',
          300: '#f4aabb',
          400: '#ec7a97',
          500: '#e04f75',
          600: '#cc2d5e',
          700: '#ab204d',
          800: '#8f1d44',
          900: '#7a1c3e',
        },
        ivory: {
          50: '#fefdfb',
          100: '#fdf9f3',
          200: '#faf2e5',
          300: '#f5e6d0',
          400: '#eed5b3',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(237, 120, 36, 0.15)',
        'lifted': '0 3px 12px 0 rgba(0, 0, 0, 0.08), 0 5px 12px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)',
        'venue': '0 0 0 1px rgba(171, 32, 77, 0.05), 0 4px 24px rgba(0, 0, 0, 0.04)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 1px rgba(255, 255, 255, 0.8)',
        'zone': '0 2px 8px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(0, 0, 0, 0.03)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
        'slide-down': 'slideDown 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        'slide-in-left': 'slideInLeft 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'sheet-up': 'sheetUp 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
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
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '60%': { opacity: '1', transform: 'scale(1.03)' },
          '100%': { transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        sheetUp: {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.32, 0.72, 0, 1)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
