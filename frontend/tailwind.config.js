/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#4ac4b4',
          500: '#2c9f8f',
          600: '#248a7c',
          700: '#1a6b60',
          800: '#164e46',
          900: '#134e4a',
          950: '#042f2e',
        },
        secondary: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#7b8b9a',
          500: '#486581',
          600: '#334e68',
          700: '#264652',
          800: '#1a2332',
          900: '#0f1419',
          950: '#0a0e12',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.04), 0 1px 6px -2px rgba(0, 0, 0, 0.02)',
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        'card-hover': '0 10px 25px -5px rgba(0,0,0,0.06), 0 6px 10px -5px rgba(0,0,0,0.03)',
        'glow': '0 0 20px rgba(44, 159, 143, 0.15)',
        'glow-lg': '0 0 40px rgba(44, 159, 143, 0.2)',
        'glow-sm': '0 0 10px rgba(44, 159, 143, 0.1)',
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
