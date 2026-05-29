/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        /* Paleta cálida modo claro — referencia dashboard crema */
        canvas: {
          DEFAULT: '#F7F4F0',
          subtle: '#FDFCFA',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F5F2ED',
          hover: '#F0EDE8',
        },
        /* Sobrescribe solo los tonos claros de stone para calentar toda la UI */
        stone: {
          50: '#F7F4F0',
          100: '#F0EDE8',
          200: '#E8E4DE',
          300: '#D4CFC7',
          400: '#9C9690',
          500: '#757575',
          600: '#5C5854',
          700: '#4A4744',
          800: '#2D2B28',
          900: '#1A1A1A',
          950: '#121110',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 4px 24px rgba(26, 26, 26, 0.06)',
        'soft-lg': '0 8px 32px rgba(26, 26, 26, 0.08)',
        'card': '0 2px 12px rgba(26, 26, 26, 0.04)',
        'sidebar': '0 4px 20px rgba(26, 26, 26, 0.07)',
      },
      keyframes: {
        'page-enter': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'route-panel-enter': {
          '0%': { opacity: '0', transform: 'translateX(2.5rem)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'route-panel-enter-mobile': {
          '0%': { opacity: '0', transform: 'translateY(1.25rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'page-enter': 'page-enter 0.38s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'route-panel-enter': 'route-panel-enter 0.42s cubic-bezier(0.22, 1, 0.36, 1) both',
        'route-panel-enter-mobile': 'route-panel-enter-mobile 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}
