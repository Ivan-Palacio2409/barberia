import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ── Tokens semánticos (CSS vars de shadcn/ui) ──────────────────
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // ── Paleta de marca ──────────────────────────────────────────
        // Grafito profundo — color principal
        ink: {
          50:  '#f5f4f3',
          100: '#e8e5e3',
          200: '#d1cbc6',
          300: '#b0a69d',
          400: '#8a7d72',
          500: '#5f544a',   // primario
          600: '#453c34',
          700: '#332c26',
          800: '#292421',   // texto/fondo oscuro
          900: '#1c1815',
        },
        // Piedra cálida — fondo base
        cream: {
          50:  '#ffffff',
          100: '#fdfcfa',
          200: '#f2ece3',   // fondo principal
          300: '#e9dfd1',
          400: '#ddceba',
          500: '#cbb99f',
          600: '#b39d7f',
          700: '#957f62',
          800: '#786450',
          900: '#5f4f40',
        },
        // Dorado latón — acento
        gold: {
          50:  '#faf5ec',
          100: '#f0e2c4',
          200: '#e2c690',
          300: '#d1a860',
          400: '#bd9350',
          500: '#ab8140',   // acento principal
          600: '#8f6a34',
          700: '#73562b',
          800: '#5c4522',
          900: '#4a381c',
        },
        // Semánticos de estado
        success: {
          DEFAULT: '#4caf50',
          light:   '#e8f5e9',
          dark:    '#2e7d32',
        },
        warning: {
          DEFAULT: '#ff9800',
          light:   '#fff3e0',
          dark:    '#e65100',
        },
        error: {
          DEFAULT: '#f44336',
          light:   '#ffebee',
          dark:    '#b71c1c',
        },
        // Grises neutrales
        gray: {
          50:  '#fafafa',
          100: '#f5f5f5',
          200: '#eeeeee',
          300: '#e0e0e0',
          400: '#bdbdbd',
          500: '#9e9e9e',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
      },

      // ── Tipografía ───────────────────────────────────────────────
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans:    ['var(--font-sans)',  'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs:   ['0.75rem',  { lineHeight: '1rem' }],         // 12px
        sm:   ['0.875rem', { lineHeight: '1.25rem' }],      // 14px
        base: ['1rem',     { lineHeight: '1.5rem' }],       // 16px
        lg:   ['1.125rem', { lineHeight: '1.75rem' }],      // 18px
        xl:   ['1.5rem',   { lineHeight: '2rem' }],         // 24px
        '2xl':['2rem',     { lineHeight: '2.5rem' }],       // 32px
        '3xl':['3rem',     { lineHeight: '3.5rem' }],       // 48px
        '4xl':['4rem',     { lineHeight: '4.5rem' }],       // 64px
      },

      // ── Espaciado (cuadrícula de 8px) ────────────────────────────
      spacing: {
        '0.5': '0.125rem',  // 2px
        '1':   '0.25rem',   // 4px
        '1.5': '0.375rem',  // 6px
        '2':   '0.5rem',    // 8px   ← unidad base
        '3':   '0.75rem',   // 12px
        '4':   '1rem',      // 16px
        '5':   '1.25rem',   // 20px
        '6':   '1.5rem',    // 24px
        '8':   '2rem',      // 32px
        '10':  '2.5rem',    // 40px
        '11':  '2.75rem',   // 44px  ← tap target mínimo
        '12':  '3rem',      // 48px
        '16':  '4rem',      // 64px
        '20':  '5rem',      // 80px
        '24':  '6rem',      // 96px
        '32':  '8rem',      // 128px
      },

      // ── Breakpoints ──────────────────────────────────────────────
      screens: {
        sm:  '390px',   // mobile (iPhone 14)
        md:  '768px',   // tablet
        lg:  '1024px',  // laptop
        xl:  '1440px',  // desktop
        '2xl':'1920px', // widescreen
      },

      borderRadius: {
        lg:   'var(--radius)',
        md:   'calc(var(--radius) - 2px)',
        sm:   'calc(var(--radius) - 4px)',
        full: '9999px',
      },

      // ── Sombras ──────────────────────────────────────────────────
      boxShadow: {
        xs:  '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        sm:  '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        md:  '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
        lg:  '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)',
        xl:  '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04)',
        warm:'0 4px 24px -4px rgb(212 165 165 / 0.25)',  // sombra rosada de marca
        gold:'0 4px 24px -4px rgb(201 169 110 / 0.30)',  // sombra dorada
      },

      // ── Animaciones ──────────────────────────────────────────────
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'accordion-down':  'accordion-down 0.2s ease-out',
        'accordion-up':    'accordion-up 0.2s ease-out',
        'fade-in':         'fade-in 0.25s ease-out',
        'slide-in-right':  'slide-in-right 0.25s ease-out',
        shimmer:           'shimmer 2s infinite linear',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
