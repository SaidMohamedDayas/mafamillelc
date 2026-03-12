/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#070916',
        foreground: '#f8f8ff',
        card: '#0e1228',
        muted: '#9ca6cb',
        brand: '#4f46e5',
        accent: '#f7c66f',
      },
      boxShadow: {
        glow: '0 0 36px rgba(79, 70, 229, 0.25)',
        gold: '0 0 24px rgba(247, 198, 111, 0.35)',
      },
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
