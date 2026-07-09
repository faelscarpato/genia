/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  // Tema controlado pela classe "dark" no <html>
  darkMode: 'class',
  theme: {
    // Container centralizado com padding padrão
    container: {
      center: true,
      padding: '1.5rem',
    },
    extend: {
      colors: {
        // ─── Heritage Intelligence Design System ─────────────────────────────
        // Tokens Material You — modo claro
        'primary':                    '#000000',
        'on-primary':                 '#ffffff',
        'primary-container':          '#131b2e',
        'on-primary-container':       '#7c839b',
        'primary-fixed':              '#dae2fd',
        'primary-fixed-dim':          '#bec6e0',
        'on-primary-fixed':           '#131b2e',
        'on-primary-fixed-variant':   '#3f465c',
        'inverse-primary':            '#bec6e0',

        'secondary':                  '#9b4500',
        'on-secondary':               '#ffffff',
        'secondary-container':        '#fd8a42',
        'on-secondary-container':     '#682c00',
        'secondary-fixed':            '#ffdbca',
        'secondary-fixed-dim':        '#ffb68e',
        'on-secondary-fixed':         '#331200',
        'on-secondary-fixed-variant': '#763300',

        'tertiary':                   '#000000',
        'on-tertiary':                '#ffffff',
        'tertiary-container':         '#351000',
        'on-tertiary-container':      '#c16e44',
        'tertiary-fixed':             '#ffdbcc',
        'tertiary-fixed-dim':         '#ffb693',
        'on-tertiary-fixed':          '#351000',
        'on-tertiary-fixed-variant':  '#76330d',

        'background':                 '#f8f9ff',
        'on-background':              '#0b1c30',

        'surface':                    '#f8f9ff',
        'surface-dim':                '#cbdbf5',
        'surface-bright':             '#f8f9ff',
        'surface-variant':            '#d3e4fe',
        'surface-tint':               '#565e74',
        'surface-container-lowest':   '#ffffff',
        'surface-container-low':      '#eff4ff',
        'surface-container':          '#e5eeff',
        'surface-container-high':     '#dce9ff',
        'surface-container-highest':  '#d3e4fe',

        'on-surface':                 '#0b1c30',
        'on-surface-variant':         '#45464d',
        'inverse-surface':            '#213145',
        'inverse-on-surface':         '#eaf1ff',

        'outline':                    '#76777d',
        'outline-variant':            '#c6c6cd',

        'error':                      '#ba1a1a',
        'on-error':                   '#ffffff',
        'error-container':            '#ffdad6',
        'on-error-container':         '#93000a',

        // ─── Brand palette (derivada do secondary) ───────────────────────────
        // Usada em componentes legados que referenciavam bg-brand-*
        'brand': {
          50:  '#fff4ee',
          100: '#ffe5d0',
          200: '#ffc89e',
          300: '#ffa168',
          400: '#ff7b38',
          500: '#fd8a42',   // secondary-container
          600: '#9b4500',   // secondary
          700: '#7a3600',
          800: '#5a2800',
          900: '#331200',
        },

        // ─── Tokens dark mode (valores invertidos para dark:) ────────────────
        'dark-primary':                    '#bec6e0',
        'dark-on-primary':                 '#283041',
        'dark-primary-container':          '#3f465c',
        'dark-on-primary-container':       '#dae2fd',
        'dark-secondary':                  '#ffb68e',
        'dark-on-secondary':               '#541f00',
        'dark-secondary-container':        '#763300',
        'dark-on-secondary-container':     '#ffdbca',
        'dark-background':                 '#0b1c30',
        'dark-on-background':              '#dbe4f5',
        'dark-surface':                    '#0b1c30',
        'dark-surface-variant':            '#45464d',
        'dark-on-surface':                 '#dbe4f5',
        'dark-on-surface-variant':         '#c6c6cd',
        'dark-outline':                    '#90909a',
        'dark-outline-variant':            '#45464d',
        'dark-surface-container-lowest':   '#060f1e',
        'dark-surface-container-low':      '#131b2e',
        'dark-surface-container':          '#1a2438',
        'dark-surface-container-high':     '#232d43',
        'dark-surface-container-highest':  '#2d3750',
        'dark-error':                      '#ffb4ab',
        'dark-on-error':                   '#690005',
        'dark-error-container':            '#93000a',
        'dark-on-error-container':         '#ffdad6',
      },

      borderRadius: {
        DEFAULT: '2px',
        lg: '4px',
        xl: '8px',
        full: '12px',
      },

      spacing: {
        'xs':            '4px',
        'base':          '4px',
        'sm':            '8px',
        'md':            '16px',
        'gutter':        '24px',
        'lg':            '24px',
        'container-max': '1280px',
        'xl':            '40px',
      },

      fontFamily: {
        'label-md':           ['Inter'],
        'headline-md':        ['Playfair Display'],
        'table-data':         ['Inter'],
        'title-lg':           ['Inter'],
        'body-lg':            ['Inter'],
        'body-md':            ['Inter'],
        'headline-sm':        ['Playfair Display'],
        'display-lg-mobile':  ['Playfair Display'],
        'display-lg':         ['Playfair Display'],
        'serif':              ['Playfair Display', 'serif'],
        'sans':               ['Inter', 'sans-serif'],
      },

      fontSize: {
        'label-md':          ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '500' }],
        'headline-md':       ['30px', { lineHeight: '38px', fontWeight: '600' }],
        'table-data':        ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'title-lg':          ['18px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg':           ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md':           ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'headline-sm':       ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'display-lg-mobile': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'display-lg':        ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
      },

      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
    },
  },
  plugins: [],
};
