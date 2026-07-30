/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#080b10',
        panel: '#11161e',
        line: '#242c38',
        lime: '#c7f36b',
        muted: '#8b96a7'
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui'] },
      boxShadow: { glow: '0 0 40px rgba(199,243,107,.08)' }
    }
  },
  plugins: []
};
