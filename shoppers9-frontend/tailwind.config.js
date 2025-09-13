/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Elite Shopping Brand Book Colors
        elite: {
          // Primary Colors
          'base-white': '#FFFFFF',
          'cta-purple': '#322F61',
          // Secondary Colors
          'light-grey': '#F5F5F5',
          'medium-grey': '#9E9E9E',
          'charcoal-black': '#212121',
          // Accent Colors
          'gold-highlight': '#C9A227',
          'purple-hover': '#463F85',
        },
        primary: {
          50: '#f8f7ff',
          100: '#f1efff',
          200: '#e6e2ff',
          300: '#d4ccff',
          400: '#bba8ff',
          500: '#322F61',
          600: '#463F85',
          700: '#2a2751',
          800: '#1f1d3d',
          900: '#161429',
        },
        secondary: {
          50: '#fefefe',
          100: '#fdfdfd',
          200: '#fafafa',
          300: '#f5f5f5',
          400: '#eeeeee',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
      },
      fontFamily: {
        // Elite Brand Typography
        'playfair': ['Playfair Display', 'serif'],
        'inter': ['Inter', 'sans-serif'],
        // Legacy support
        'montserrat': ['Montserrat', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
      },
      fontSize: {
        // Elite Typography Hierarchy
        'hero': ['48px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'section': ['32px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'subsection': ['24px', { lineHeight: '1.3' }],
        'body': ['16px', { lineHeight: '1.6' }],
        'caption': ['12px', { lineHeight: '1.4', letterSpacing: '0.5px' }],
      },
      backgroundImage: {
        // Elite gradients removed - using solid colors per brand book
      },
      boxShadow: {
        // Elite Shadow System
        'premium': '0 4px 20px rgba(50, 47, 97, 0.1)',
        'card': '0 2px 12px rgba(0, 0, 0, 0.08)',
        'hover': '0 8px 30px rgba(50, 47, 97, 0.15)',
        'elite-card': '0 2px 12px rgba(0, 0, 0, 0.08)',
        'elite-hover': '0 8px 30px rgba(50, 47, 97, 0.15)',
      },
      borderRadius: {
        // Elite Design - No rounded edges
        'none': '0',
        'elite': '0',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}