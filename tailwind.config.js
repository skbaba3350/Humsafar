/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FFFEFA',
          100: '#FDFBF7',
          200: '#FAF6F0',
          300: '#F5EFE6',
        },
        burgundy: {
          700: '#670C2D',
          800: '#540822',
          900: '#3D0518',
          950: '#2A0310',
        },
        magenta: {
          600: '#A00C45',
          700: '#850E35',
          800: '#6E0B2C',
        },
        gold: {
          400: '#E5B842',
          500: '#D4AF37',
          600: '#C69214',
          700: '#9E740E',
        },
        deepPurple: {
          900: '#340728',
          950: '#24041C',
        },
        cardPink: '#FCE6EC',
        cardPeach: '#FDECE2',
        cardLavender: '#EFE8F7',
      },
      fontFamily: {
        urdu: ['var(--font-urdu)', 'Noto Nastaliq Urdu', 'Noto Sans Arabic', 'Tahoma', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
