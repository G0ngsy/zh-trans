/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        
        'sunset': {
          50: '#FFF8DE',
          100: '#FFECB3',
          200: '#FFC100',
          300: '#FF8A08',
          400: '#FF6500',
          500: '#C40C0C',
          600: '#920909',
          700: '#680414',
          800: '#3E001F',
        },
      },
    },
  },
  plugins: [],
}