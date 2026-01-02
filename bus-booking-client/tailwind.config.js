/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
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
          DEFAULT: '#0D8A4F',
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
          DEFAULT: '#8FD3B5',
        },
        // Tertiary/Accent
        tertiary: '#f2802f',
        // Surface colors
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
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
          DEFAULT: '#EF4444',
        },
        // Success colors
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
          DEFAULT: '#22C55E',
        },
        // Warning colors
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          DEFAULT: '#F59E0B',
        },
        // Info colors
        info: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          DEFAULT: '#3B82F6',
        },
      },
      fontFamily: {
        body: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'system-ui',
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
        ],
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'system-ui',
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
        ],
      },
      fontSize: {
        h1: [
          '3rem',
          { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' },
        ],
        h2: [
          '2.25rem',
          { lineHeight: '1.3', fontWeight: '700', letterSpacing: '-0.01em' },
        ],
        h3: [
          '1.875rem',
          { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.01em' },
        ],
        h4: ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
        h5: ['1.25rem', { lineHeight: '1.5', fontWeight: '600' }],
        h6: ['1rem', { lineHeight: '1.5', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.75' }],
        body: ['1rem', { lineHeight: '1.5' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        caption: ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
        '4xl': '6rem',
        '5xl': '8rem',
      },
    },
    backgroundImage: {
      'gradient-blue':
        'radial-gradient(100% 100% at 50% 50%, rgba(30,167,253,0) 0%, #1ea7fd 100%)',
      'gradient-purple':
        'radial-gradient(100% 100% at 50% 50%, rgba(111,44,172,0) 0%, #6f2cac 100%)',
    },
    animation: {
      '3d-scale': 'scale3d 3s ease-in-out infinite',
      expandCircle: 'circleExpand 0.3s ease-in-out forwards',
    },
    keyframes: {
      scale3d: {
        '0%': { transform: 'scale(1)' },
        '50%': { transform: 'scale(0.8)' },
        '100%': { transform: 'scale(1)' },
      },
    },
    clipPath: {
      triangle: 'polygon(50% 0%, 0% 100%, 100% 100%)',
      circleExpand: {
        '0%': {
          transform: 'translate(-150%, -50%) scale(1)',
          borderRadius: '50%',
        },
        '100%': {
          transform: 'translate(100%, -50%) scale(1.5)',
          borderRadius: '0%',
        },
      },
    },
  },
  plugins: [require('tailwind-clip-path')],
};
