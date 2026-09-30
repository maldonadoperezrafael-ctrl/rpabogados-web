/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: '#212529',
        accent: '#FC5D23',
        'bg-light': '#F8F8F8',
        // #6c757d daba 4,42:1 sobre bg-light (falla WCAG AA); #5c636a da 5,73:1
        'text-light': '#5c636a',
        // oro solo sobre fondos oscuros (8,08:1 sobre tinta); sobre fondos claros usar oro-oscuro (5,64:1)
        oro: {
          DEFAULT: '#C5A880',
          claro: '#E6CC9F',
          oscuro: '#7A5C2E',
        },
        tinta: '#12151B',
        // verde WhatsApp con texto blanco: #25D366 da 1,98:1; #0F7A3F da 5,42:1
        whatsapp: {
          DEFAULT: '#0F7A3F',
          hover: '#0B6433',
        },
      },
      fontFamily: {
        sans: ['Raleway', 'sans-serif'],
        cormorant: ['"Cormorant Garamond"', 'Georgia', 'serif'],
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
