import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Pitch Dark - Primary
        'pitch-dark': {
          950: '#0a0e27',
          900: '#0f1535',
          800: '#151f47',
          700: '#1a2557',
          600: '#243366',
        },

        // Glow Neon - Energy
        'glow-neon': {
          300: '#66f0ff',
          400: '#33e6ff',
          500: '#00d9ff',
          600: '#00a6cc',
        },

        // Tactical Slate - Text
        'tactical-slate': {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },

      boxShadow: {
        // Glow shadows
        'glow-sm': '0 0 8px 0 rgba(0, 217, 255, 0.3)',
        'glow-md': '0 0 16px 0 rgba(0, 217, 255, 0.5)',
        'glow-lg': '0 0 32px 0 rgba(0, 217, 255, 0.7)',
        'glow-xl': '0 0 48px 0 rgba(0, 217, 255, 1)',

        // Card effects
        'card-glow': '0 0 20px rgba(0, 217, 255, 0.2), 0 4px 6px -1px rgba(10, 14, 39, 0.1)',
        'card-hover': '0 0 30px rgba(0, 217, 255, 0.4), 0 20px 25px -5px rgba(10, 14, 39, 0.3)',
      },

      animation: {
        // Fade in
        'fade-in': 'fadeIn 300ms ease-in-out',

        // Fade in up
        'fade-in-up': 'fadeInUp 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',

        // Slide up with fade
        'slide-in-from-bottom-4': 'slideUpFade 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-in-from-left-8': 'slideInLeft 1000ms ease-out',
        'slide-in-from-right-8': 'slideInRight 1000ms ease-out',
        'slide-in-from-bottom-8': 'slideInBottom 800ms ease-out',

        // Glow pulse
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',

        // Scale in
        'scale-in': 'scaleIn 200ms ease-out',

        // Float
        'float': 'float 3s ease-in-out infinite',

        // Shimmer for loading states
        'shimmer': 'shimmer 2s infinite',

        // Pop effect for interactions
        'pop': 'pop 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },

        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },

        slideUpFade: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },

        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-32px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },

        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(32px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },

        slideInBottom: {
          '0%': { opacity: '0', transform: 'translateY(32px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },

        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 16px rgba(0, 217, 255, 0.5)' },
          '50%': { boxShadow: '0 0 32px rgba(0, 217, 255, 1)' },
        },

        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },

        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },

        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },

        pop: {
          '0%': { transform: 'scale(0.95)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
      },

      transitionDuration: {
        'fast': '150ms',
        'base': '250ms',
        'slow': '400ms',
        'slower': '600ms',
      },

      transitionTimingFunction: {
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
