/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores primarios
        primary: {
          DEFAULT: '#2482C5',
          dark: '#1e6ba0',
          light: '#4da3d6',
        },
        // Colores secundarios
        secondary: {
          DEFAULT: '#6c757d',
          dark: '#5a6268',
          light: '#adb5bd',
        },
        // Colores de estado
        success: {
          DEFAULT: '#28a745',
          dark: '#218838',
          light: '#48bb78',
        },
        warning: {
          DEFAULT: '#ffc107',
          dark: '#e0a800',
          light: '#ffd23f',
        },
        danger: {
          DEFAULT: '#dc3545',
          dark: '#c82333',
          light: '#f56565',
        },
        info: {
          DEFAULT: '#17a2b8',
          dark: '#138496',
          light: '#4fc3f7',
        },
        // Escala de grises personalizada
        gray: {
          25: '#fbfcfd',
          50: '#f8f9fa',
          100: '#e9ecef',
          200: '#dee2e6',
          300: '#ced4da',
          400: '#adb5bd',
          500: '#6c757d',
          600: '#495057',
          700: '#343a40',
          800: '#212529',
          900: '#141619',
        },
      },
      spacing: {
        'xs': '4px',
        'sm': '8px', 
        'md': '16px',
        'lg': '20px',
        'xl': '32px',
        'xxl': '48px',
        'xxxl': '64px',
      },
      borderRadius: {
        'xs': '2px',
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        'xxl': '16px',
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'sm': '0 2px 4px rgba(0, 0, 0, 0.075)',
        'md': '0 4px 8px rgba(0, 0, 0, 0.1)',
        'lg': '0 8px 16px rgba(0, 0, 0, 0.15)',
        'xl': '0 12px 24px rgba(0, 0, 0, 0.175)',
        'hover': '0 6px 20px rgba(0, 0, 0, 0.12)',
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        'xxl': '1.5rem',
        'xxxl': '2rem',
        'h1': '2.5rem',
        'h2': '2rem',
        'h3': '1.75rem',
      },
      fontWeight: {
        'light': 300,
        'normal': 400,
        'medium': 500,
        'semibold': 600,
        'bold': 700,
        'black': 900,
      },
      letterSpacing: {
        'tight': '-0.8px',
        'normal': '-0.5px',
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-out',
        'pulse': 'pulse 2s infinite',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%': { 
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(40, 167, 69, 0.4)' 
          },
          '70%': { 
            transform: 'scale(1.1)',
            boxShadow: '0 0 0 10px rgba(40, 167, 69, 0)' 
          },
          '100%': { 
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(40, 167, 69, 0)' 
          },
        },
      },
      transitionTimingFunction: {
        'fast': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'base': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        'fast': '0.2s',
        'base': '0.3s',
      },
      textShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.1)',
        'md': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'lg': '0 4px 8px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.text-shadow-sm': {
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        },
        '.text-shadow-md': {
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
        '.text-shadow-lg': {
          textShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}