import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#3b82f6',
          purple: '#7c3aed',
          dark: '#1e293b',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
