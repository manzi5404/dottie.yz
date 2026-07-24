/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./shop.html",
    "./product.html",
    "./cart.html",
    "./login.html",
    "./signup.html",
    "./about.html",
    "./contact.html",
    "./lookbook.html",
    "./faq.html",
    "./shipping.html",
    "./terms.html",
    "./src/**/*.{js,ts}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#FFFFFF',
        surface: '#FAFAFA',
        ink: '#111111',
        muted: '#6B6B6B',
        line: '#EAEAEA',
        // Legacy brand tokens — remapped to the new monochrome system.
        'DOTTIE-black': '#FFFFFF',
        'DOTTIE-dark': '#FAFAFA',
        'DOTTIE-white': '#111111',
        'DOTTIE-gray': '#EAEAEA',
        'DOTTIE-accent': '#111111',
      },
      fontFamily: {
        // Inter only — clean, bold, single typeface across the site.
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '10px',
        sm: '8px',
        md: '10px',
        lg: '12px',
        xl: '16px',
      },
      maxWidth: {
        xl: '1280px',
      },
      transitionDuration: {
        DEFAULT: '250ms',
      },
    },
  },
  plugins: [],
}
