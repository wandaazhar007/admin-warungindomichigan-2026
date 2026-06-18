import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        red: {
          50:  '#FFF5F5',
          100: '#FFE8E8',
          200: '#FFCCCC',
          400: '#F28B8B',
          500: '#E86363',
          600: '#D14F4F',
          900: '#7F1D1D',
        },
        gray: {
          50:  '#FAFAFA',
          100: '#F4F4F5',
          200: '#E4E4E7',
          400: '#A1A1AA',
          500: '#71717A',
          700: '#3F3F46',
          900: '#18181B',
        },
        success: '#4ADE80',
        warning: '#FBBF24',
        error:   '#F87171',
        info:    '#60A5FA',
      },
      fontFamily: {
        display: ['Bricolage Grotesque', 'system-ui', 'sans-serif'],
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        '600': '600',
        '700': '700',
      },
    },
  },
  plugins: [],
} satisfies Config;
