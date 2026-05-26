/**
 * Mastro AI Design System
 * Palette: Pitch Dark (#0A0F0D) + Glow Neon (#39FF14 / #10B981) + Tactical Slate (#141E1A)
 * Cyber Pitch Dark Mode - The Stadium AI Assistant
 */

export const designSystem = {
  // Core brand palette
  colors: {
    // Pitch Dark - Primary navigation & backgrounds
    pitchDark: {
      950: '#050704', // Deepest black
      900: '#0A0F0D', // Main background (noir profond + nuance verte)
      800: '#0F1410', // Card backgrounds
      700: '#141E1A', // Hover states (Tactical Slate)
      600: '#1A2520', // Subtle accents
    },

    // Glow Neon - Energy & CTAs (Electric Green)
    glowNeon: {
      300: '#5FFF7F', // Ultra-light neon
      400: '#39FF14', // Primary neon green (electric)
      500: '#10B981', // Secondary green (softer)
      600: '#059669', // Dark green
      700: '#047857', // Very dark green
    },

    // Tactical Slate - Text & structure
    tacticalSlate: {
      50: '#f9fafb',
      100: '#f3f4f6', // Primary text (#F3F4F6)
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af', // Secondary text (#9CA3AF)
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },

    // Accent colors
    accent: {
      success: '#10B981', // Green (analysis success)
      warning: '#FBBF24', // Amber (load warnings)
      danger: '#EF4444', // Red (critical stats)
      info: '#3B82F6', // Blue (information)
    },

    // Container colors
    container: {
      primary: '#141E1A', // Card & container bg (Tactical Slate)
      hover: '#1A2520', // Hover state
      border: 'rgba(57, 255, 20, 0.1)', // Neon green border
      borderHover: 'rgba(57, 255, 20, 0.3)',
    },
  },

  // Typography
  typography: {
    fontFamily: {
      sans: [
        'ui-sans-serif',
        'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ],
      mono: ['"Fira Code"', '"Courier New"', 'monospace'],
      display: [
        'Poppins',
        'ui-sans-serif',
        'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
      ],
    },
    sizes: {
      'display-xl': {
        fontSize: '3.5rem', // 56px
        lineHeight: '1.1',
        fontWeight: '800',
        letterSpacing: '-0.02em',
      },
      'display-lg': {
        fontSize: '3rem', // 48px
        lineHeight: '1.1',
        fontWeight: '700',
        letterSpacing: '-0.015em',
      },
      'display-md': {
        fontSize: '2.25rem', // 36px
        lineHeight: '1.2',
        fontWeight: '700',
        letterSpacing: '-0.01em',
      },
      'heading-lg': {
        fontSize: '1.875rem', // 30px
        lineHeight: '1.3',
        fontWeight: '600',
      },
      'heading-md': {
        fontSize: '1.5rem', // 24px
        lineHeight: '1.4',
        fontWeight: '600',
      },
      'heading-sm': {
        fontSize: '1.25rem', // 20px
        lineHeight: '1.4',
        fontWeight: '600',
      },
      'body-lg': {
        fontSize: '1.125rem', // 18px
        lineHeight: '1.6',
        fontWeight: '400',
      },
      'body-md': {
        fontSize: '1rem', // 16px
        lineHeight: '1.6',
        fontWeight: '400',
      },
      'body-sm': {
        fontSize: '0.875rem', // 14px
        lineHeight: '1.5',
        fontWeight: '400',
      },
      'label-md': {
        fontSize: '0.875rem', // 14px
        lineHeight: '1.4',
        fontWeight: '600',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
      },
    },
  },

  // Spacing scale
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '2.5rem', // 40px
    '3xl': '3rem', // 48px
    '4xl': '3.5rem', // 56px
    '5xl': '4rem', // 64px
  },

  // Border radius
  radius: {
    none: '0',
    sm: '0.375rem', // 6px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },

  // Shadows & glows
  shadows: {
    // Pitch Dark shadows (subtle)
    sm: '0 1px 2px 0 rgba(10, 14, 39, 0.05)',
    md: '0 4px 6px -1px rgba(10, 14, 39, 0.1)',
    lg: '0 10px 15px -3px rgba(10, 14, 39, 0.2)',
    xl: '0 20px 25px -5px rgba(10, 14, 39, 0.3)',

    // Glow Neon (for emphasis)
    'glow-sm': '0 0 8px 0 rgba(0, 217, 255, 0.3)',
    'glow-md': '0 0 16px 0 rgba(0, 217, 255, 0.5)',
    'glow-lg': '0 0 32px 0 rgba(0, 217, 255, 0.7)',
    'glow-xl': '0 0 48px 0 rgba(0, 217, 255, 1)',

    // Combined effect
    'card-glow': '0 0 20px rgba(0, 217, 255, 0.2), 0 4px 6px -1px rgba(10, 14, 39, 0.1)',
    'card-hover': '0 0 30px rgba(0, 217, 255, 0.4), 0 20px 25px -5px rgba(10, 14, 39, 0.3)',
  },

  // Animations
  animations: {
    // Smooth fade in
    fadeIn: {
      keyframes: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      duration: '300ms',
      timingFunction: 'ease-in-out',
    },

    // Slide up with fade
    slideUpFade: {
      keyframes: {
        '0%': { opacity: '0', transform: 'translateY(20px)' },
        '100%': { opacity: '1', transform: 'translateY(0)' },
      },
      duration: '400ms',
      timingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },

    // Glow pulse
    glowPulse: {
      keyframes: {
        '0%, 100%': { boxShadow: '0 0 16px rgba(0, 217, 255, 0.5)' },
        '50%': { boxShadow: '0 0 32px rgba(0, 217, 255, 1)' },
      },
      duration: '2s',
      timingFunction: 'ease-in-out',
      infinite: true,
    },

    // Scale up on hover
    scaleIn: {
      keyframes: {
        '0%': { transform: 'scale(0.95)', opacity: '0' },
        '100%': { transform: 'scale(1)', opacity: '1' },
      },
      duration: '200ms',
      timingFunction: 'ease-out',
    },

    // Float animation
    float: {
      keyframes: {
        '0%, 100%': { transform: 'translateY(0px)' },
        '50%': { transform: 'translateY(-10px)' },
      },
      duration: '3s',
      timingFunction: 'ease-in-out',
      infinite: true,
    },
  },

  // Breakpoints (mobile-first)
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Z-index scale
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    backdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },

  // Transition timing
  transitions: {
    fast: '150ms ease-in-out',
    base: '250ms ease-in-out',
    slow: '400ms ease-in-out',
    slower: '600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

// Utility function to get color by path
export function getColor(path: string, fallback = '#000'): string {
  const keys = path.split('.');
  let value: any = designSystem.colors;

  for (const key of keys) {
    value = value?.[key];
  }

  return typeof value === 'string' ? value : fallback;
}

// Export types
export type DesignSystem = typeof designSystem;
export type ColorPath = keyof typeof designSystem.colors;
