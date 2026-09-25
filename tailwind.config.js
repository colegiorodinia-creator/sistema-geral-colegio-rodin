/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rodin: {
          orange: '#F45206',
          'orange-hover': '#ED6A2A',
          'orange-light': '#FFF0E6',
          graphite: '#1E293B',
          'cool-gray': '#64748B',
          beige: '#F1F5F9',
          paper: '#F8FAFC',
          line: '#E2E8F0',
          concrete: '#AAA38E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'rodin-card': '0 4px 12px rgba(0, 0, 0, 0.02)',
        'rodin-hover': '0 12px 28px rgba(0, 0, 0, 0.08)',
        'rodin-modal': '0 25px 60px rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [],
}
