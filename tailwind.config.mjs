/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: '#212529',
        accent: '#FC5D23',
        'bg-light': '#F8F8F8',
        'text-light': '#6c757d',
      },
      fontFamily: {
        sans: ['Raleway', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.8s cubic-bezier(0.77, 0, 0.175, 1) forwards',
        'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.77, 0, 0.175, 1) forwards',
        'fade-in-down': 'fadeInDown 0.8s cubic-bezier(0.77, 0, 0.175, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
