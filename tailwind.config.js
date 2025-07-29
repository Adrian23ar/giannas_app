/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
      sans: ['Poppins', 'sans-serif'], // <-- Añade esta línea
    },
      colors: {
        'brand-fucsia': '#CC146C',
        'brand-fucsia-dark': '#A10E4B',
        'brand-morado': '#4C1831',
        'brand-chocolate': '#772D04',
        'brand-galleta': '#B66F2F',
        'brand-rosa-palo': '#C09E9B',
        'brand-blanco': '#F0F8FF',
      }
    },
  },
  plugins: [],
}
