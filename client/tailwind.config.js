/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          healing: '#0D9488',
          DEFAULT: '#0D9488',
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        royal: {
          blue: '#4169E1',
          DEFAULT: '#4169E1',
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#6366F1',
          600: '#4169E1',
          700: '#3730A3',
        },
        coral: {
          warm: '#FF7868',
          DEFAULT: '#FF7868',
          50: '#FFF5F4',
          100: '#FFEBE8',
          500: '#FF7868',
          600: '#E65D4D',
        },
        lavender: {
          soft: '#8B5CF6',
          DEFAULT: '#8B5CF6',
          50: '#F5F3FF',
          100: '#EDE9FE',
          500: '#8B5CF6',
        },
        mint: {
          green: '#B8F2E6',
          DEFAULT: '#B8F2E6',
        },
        peach: {
          pastel: '#FFE5D9',
          DEFAULT: '#FFE5D9',
        },
        navy: {
          deep: '#132238',
          DEFAULT: '#132238',
          800: '#1E293B',
          900: '#132238',
          950: '#0B1320',
        },
        cloud: {
          white: '#F7FAFC',
          DEFAULT: '#F7FAFC',
        },
      },
      fontFamily: {
        headline: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.15)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.15)' },
          '70%': { transform: 'scale(1)' },
        },
      },
      boxShadow: {
        'soft-glow': '0 10px 25px -5px rgba(13, 148, 136, 0.15), 0 8px 10px -6px rgba(13, 148, 136, 0.1)',
        'card-hover': '0 20px 30px -10px rgba(19, 34, 56, 0.08), 0 10px 15px -5px rgba(65, 105, 225, 0.05)',
      },
    },
  },
  plugins: [],
}
