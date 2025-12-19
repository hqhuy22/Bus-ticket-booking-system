/**
 * Global Design Tokens
 * Centralized design system for consistent UI across the application
 */

export const colors = {
  // Primary colors
  primary: {
    50: '#E6F4ED',
    100: '#CCE9DB',
    200: '#99D3B7',
    300: '#66BD93',
    400: '#33A76F',
    500: '#0D8A4F', // Main primary
    600: '#0A6E3F',
    700: '#08532F',
    800: '#053720',
    900: '#031C10',
  },

  // Secondary colors
  secondary: {
    50: '#F2FAF6',
    100: '#E5F5ED',
    200: '#CBEBDB',
    300: '#B1E1C9',
    400: '#97D7B7',
    500: '#8FD3B5', // Main secondary
    600: '#72A991',
    700: '#567F6D',
    800: '#395448',
    900: '#1D2A24',
  },

  // Surface colors (for backgrounds, cards, etc.)
  surface: {
    white: '#FFFFFF',
    light: '#F9FAFB',
    base: '#F3F4F6',
    dark: '#E5E7EB',
    darker: '#D1D5DB',
  },

  // Error colors
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444', // Main error
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  // Success colors
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E', // Main success
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },

  // Warning colors
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Main warning
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Info colors
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6', // Main info
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Text colors
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    disabled: '#D1D5DB',
    inverse: '#FFFFFF',
  },

  // Border colors
  border: {
    light: '#F3F4F6',
    base: '#E5E7EB',
    dark: '#D1D5DB',
    darker: '#9CA3AF',
  },

  // Accent colors (for special elements)
  accent: {
    orange: '#f2802f',
    purple: '#8B5CF6',
    pink: '#EC4899',
    teal: '#14B8A6',
  },
};

export const typography = {
  // Font families
  fontFamily: {
    sans: [
      'Inter',
      'ui-sans-serif',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'Noto Sans',
      'sans-serif',
      'Apple Color Emoji',
      'Segoe UI Emoji',
      'Segoe UI Symbol',
      'Noto Color Emoji',
    ].join(', '),
    mono: [
      'ui-monospace',
      'SFMono-Regular',
      'Menlo',
      'Monaco',
      'Consolas',
      'Liberation Mono',
      'Courier New',
      'monospace',
    ].join(', '),
  },

  // Font sizes with line heights
  fontSize: {
    h1: {
      size: '3rem', // 48px
      lineHeight: '1.2',
      weight: '700',
      letterSpacing: '-0.02em',
    },
    h2: {
      size: '2.25rem', // 36px
      lineHeight: '1.3',
      weight: '700',
      letterSpacing: '-0.01em',
    },
    h3: {
      size: '1.875rem', // 30px
      lineHeight: '1.3',
      weight: '600',
      letterSpacing: '-0.01em',
    },
    h4: {
      size: '1.5rem', // 24px
      lineHeight: '1.4',
      weight: '600',
      letterSpacing: '0',
    },
    h5: {
      size: '1.25rem', // 20px
      lineHeight: '1.5',
      weight: '600',
      letterSpacing: '0',
    },
    h6: {
      size: '1rem', // 16px
      lineHeight: '1.5',
      weight: '600',
      letterSpacing: '0',
    },
    'body-lg': {
      size: '1.125rem', // 18px
      lineHeight: '1.75',
      weight: '400',
      letterSpacing: '0',
    },
    body: {
      size: '1rem', // 16px
      lineHeight: '1.5',
      weight: '400',
      letterSpacing: '0',
    },
    'body-sm': {
      size: '0.875rem', // 14px
      lineHeight: '1.5',
      weight: '400',
      letterSpacing: '0',
    },
    caption: {
      size: '0.75rem', // 12px
      lineHeight: '1.5',
      weight: '400',
      letterSpacing: '0.025em',
    },
    overline: {
      size: '0.75rem', // 12px
      lineHeight: '1.5',
      weight: '600',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
    },
  },

  // Font weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
};

export const spacing = {
  // Spacing scale in rem
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '3rem', // 48px
  '3xl': '4rem', // 64px
  '4xl': '6rem', // 96px
  '5xl': '8rem', // 128px

  // Component specific spacing
  component: {
    buttonPaddingX: '1rem',
    buttonPaddingY: '0.5rem',
    inputPaddingX: '0.75rem',
    inputPaddingY: '0.5rem',
    cardPadding: '1.5rem',
    sectionPadding: '3rem',
  },
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem', // 2px
  base: '0.25rem', // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
};

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
};

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
};

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

// Breakpoints for responsive design
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  breakpoints,
};
