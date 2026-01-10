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
        void: {
          900: '#030712',
          800: '#0B1121',
          700: '#151E32',
        },
        starlight: {
          100: '#E2E8F0',
          400: '#94A3B8',
        },
        primary: {
          DEFAULT: '#2DD4BF',
          hover: '#0EA5E9',
        },
        cyber: {
          teal: '#2DD4BF',
          sky: '#0EA5E9',
        },
      },
      backgroundImage: {
        'gradient-cyber': 'linear-gradient(135deg, #2DD4BF 0%, #0EA5E9 100%)',
        'gradient-cyan': 'linear-gradient(135deg, #06B6D4 0%, #22D3EE 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        'unit': '8px',
      },
      borderRadius: {
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      transitionDuration: {
        '120': '120ms',
      },
    },
  },
  plugins: [],
};
