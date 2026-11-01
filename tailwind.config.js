/** @type {import('tailwindcss').Config} */
// Design tokens follow the Figma kit "Food Delivery Website & App Design UI Kit".
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Ember brand palette (exact values from the kit)
        ember: {
          orange: '#FC8A06',
          navy: '#03081F',
          green: '#028643',
          'green-light': '#00F076',
          gray: '#D9D9D9',
          'gray-dark': '#A6A6A6',
          light: '#FAFAFA',
          card: '#FDFDFD',
          section: '#F6F6F6',
          line: '#EEEEEE',
          red: '#D03131',
        },
        // shadcn/ui tokens (admin & dialogs) — mapped to the same palette in index.css
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))', '2': 'hsl(var(--chart-2))', '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))', '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))', foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))', 'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))', 'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))', ring: 'hsl(var(--sidebar-ring))',
        },
      },
      fontFamily: {
        // Poppins for Latin (EN/TK); Montserrat only supplies Cyrillic glyphs (RU) — Poppins has none
        sans: ['Poppins', 'Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'Montserrat', 'sans-serif'],
        body: ['Poppins', 'Montserrat', 'sans-serif'],
        display: ['Poppins', 'Montserrat', 'sans-serif'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        card: '12px',
        pill: '120px',
      },
      boxShadow: {
        card: '5px 5px 34px 0 rgba(0, 0, 0, 0.25)',
        'card-sm': '5px 5px 14px 0 rgba(0, 0, 0, 0.25)',
        popup: '20px 24px 44px 0 rgba(0, 0, 0, 0.5)',
        soft: '0 4px 4px 0 rgba(0, 0, 0, 0.25)',
      },
      maxWidth: {
        ember: '1528px',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
