/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // "Culinary Premium" Palette
        background: '#020617', // slate-950 (Deep Slate)
        surface: '#0f172a',    // slate-900
        surfaceHighlight: '#1e293b', // slate-800
        
        // Primary Action (Heat/Cooking)
        primary: '#f59e0b',    // amber-500
        primaryHover: '#d97706', // amber-600
        
        // Healthy Data Metrics
        healthy: '#14b8a6',    // teal-500
        warning: '#ef4444',    // red-500
        
        // Text
        textMain: '#f8fafc',   // slate-50
        textMuted: '#94a3b8',  // slate-400
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}