/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: { dashboard: { 50: '#f4f9fc', 100: '#e8f4fa', 500: '#278cc2', 600: '#1778ad', 900: '#192b38' } },
      boxShadow: { sidebar: '10px 0 35px rgba(25, 43, 56, 0.08)' },
    },
  },
  plugins: [],
};
