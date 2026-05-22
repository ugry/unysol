/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Ubuntu', 'sans-serif'],
        display: ['Oswald', 'sans-serif'],
        mono: ['Ubuntu Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        enterprise: {
          primary: '#072C2C',
          'primary-hover': '#0A4545',
          secondary: '#FF5F03',
          'secondary-hover': '#E55600',
          success: '#16A34A',
          warning: '#D97706',
          danger: '#DC2626',
          surface: '#EDEADE',
          'surface-hi': '#F9F8F4',
          'text': '#111827',
          'text-secondary': '#4B5563',
          'text-muted': '#6B7280',
          'text-quaternary': '#9CA3AF',
          border: '#D1D5DB',
          'border-subtle': '#E5E7EB',
        },
      },
    },
  },
  plugins: [],
};
