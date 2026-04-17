/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ═══ Rebaid-style dark SaaS palette ═══ */
        bg: {
          DEFAULT: '#2a2d36',   // outer app canvas
          tint:    '#323640',
          mist:    '#242730',
        },
        surface: {
          DEFAULT: '#16181d',   // main dashboard card + sidebar
          soft:    '#1c1f26',
          sunk:    '#22252e',   // inner cards (bar chart, stat tiles)
          raised:  '#2a2d36',
        },
        text: {
          DEFAULT: '#f3f3f5',
          soft:    '#c8cad1',
          mute:    '#8a8d97',
          faint:   '#5a5d67',
        },
        line: {
          DEFAULT: 'rgba(255,255,255,0.06)',
          strong:  'rgba(255,255,255,0.12)',
          soft:    'rgba(255,255,255,0.03)',
        },
        iris: {
          DEFAULT: '#9b8cff',   // PRIMARY accent (softer for dark)
          deep:    '#7a6bff',
          soft:    'rgba(155,140,255,0.16)',
          glow:    'rgba(155,140,255,0.22)',
          50:      '#f3f1ff',
          100:     '#e6e2ff',
          200:     '#cec6ff',
          300:     '#b5a9ff',
          400:     '#9b8cff',
          500:     '#7a6bff',
          600:     '#5e4ce0',
          700:     '#4a3bb5',
        },
        /* Campaign tile accent tints */
        tile: {
          cream:  '#ede6d6',
          amber:  '#d4b27a',
          coral:  '#d88f7e',
          lilac:  '#9e8ec2',
        },
        up:      '#34d399',
        down:    '#f87171',
        amber:   '#f5c268',
        sky:     '#7dd3fc',
        mint:    '#5fd3b4',
        peach:   '#f4b89d',
        rose:    '#f4a0b4',

        /* ═══ Legacy aliases — keep old callers rendering with the new look ═══ */
        paper: {
          DEFAULT: '#2a2d36',
          deep:    '#323640',
          bone:    '#22252e',
          linen:   '#1c1f26',
        },
        ink: {
          DEFAULT: '#f3f3f5',
          soft:    '#c8cad1',
          70:      'rgba(243,243,245,0.70)',
          50:      'rgba(243,243,245,0.50)',
          30:      'rgba(243,243,245,0.30)',
          15:      'rgba(243,243,245,0.12)',
          08:      'rgba(243,243,245,0.06)',
        },
        coral: {
          DEFAULT: '#9b8cff',
          deep:    '#7a6bff',
          glow:    'rgba(155,140,255,0.22)',
        },
        ember: '#7a6bff',
        moss:  '#34d399',
        gold:  '#f5c268',
        dark: {
          DEFAULT: '#16181d', 50: '#22252e', 100: '#1c1f26',
          200: '#16181d', 300: '#111317', 400: '#0c0e11', 500: '#07080a',
          surface: '#16181d', card: '#22252e', sidebar: '#16181d', nav: '#16181d',
        },
        accent: {
          peach: '#f4b89d', salmon: '#f4a0b4', rose: '#f4a0b4',
          lilac: '#b5a9ff', mint: '#5fd3b4', DEFAULT: '#9b8cff',
        },
        muted:   { DEFAULT: '#8a8d97', light: '#5a5d67', lighter: '#3d404a' },
        success: '#34d399',
        warning: '#f5c268',
        danger:  '#f87171',
      },
      fontFamily: {
        display: ['"Geist"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif:   ['"Geist"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans:    ['"Geist"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:    ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'edition': ['10px', { lineHeight: '1', letterSpacing: '0.14em' }],
        'meta':    ['11px', { lineHeight: '1.3', letterSpacing: '0.02em' }],
        'kicker':  ['11px', { lineHeight: '1.3', letterSpacing: '0.02em' }],
      },
      spacing: {
        'sidebar':        '232px',
        'sidebar-narrow': '72px',
        'navbar':         '64px',
        'rightpanel':     '312px',
      },
      borderRadius: {
        'none': '0',
        'sm':   '8px',
        DEFAULT:'10px',
        'md':   '12px',
        'lg':   '16px',
        'xl':   '18px',
        '2xl':  '22px',
        '3xl':  '28px',
        'full': '9999px',
      },
      boxShadow: {
        'soft':  '0 1px 2px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)',
        'card':  '0 1px 2px rgba(0,0,0,0.2), 0 14px 34px -14px rgba(0,0,0,0.5)',
        'pop':   '0 22px 60px -22px rgba(0,0,0,0.7)',
        'ring':  '0 0 0 4px rgba(155,140,255,0.22)',
        'float': '0 24px 70px -30px rgba(0,0,0,0.8)',
        'inset-line': 'inset 0 0 0 1px rgba(255,255,255,0.06)',
        /* legacy */
        'glow':    '0 0 20px rgba(155,140,255,0.28)',
        'sidebar': '0 4px 24px rgba(0,0,0,0.5)',
        'print':   '0 1px 2px rgba(0,0,0,0.2), 0 12px 40px -20px rgba(0,0,0,0.5)',
        'ink':     '0 8px 24px rgba(0,0,0,0.4)',
        'coral':   '0 8px 24px rgba(155,140,255,0.35)',
      },
      letterSpacing: {
        'editorial': '-0.02em',
        'wider-x':   '0.06em',
        'widest-x':  '0.1em',
      },
      backgroundImage: {
        'mesh': `
          radial-gradient(1200px 800px at -10% -20%, rgba(155,140,255,0.12), transparent 60%),
          radial-gradient(900px 600px at 115% 5%, rgba(244,184,157,0.08), transparent 55%)
        `,
        'iris-grad':   'linear-gradient(135deg, #b5a9ff 0%, #9b8cff 55%, #7a6bff 100%)',
        'peach-grad':  'linear-gradient(135deg, #f9d2b8 0%, #f4b89d 60%, #d88f7e 100%)',
        'help-grad':   'linear-gradient(135deg, #c6b8e8 0%, #e6b8c8 55%, #f4c8a8 100%)',
        'sheen':       'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
        'tile-cream':  'linear-gradient(135deg, #f4eede 0%, #e6ddc8 100%)',
        'tile-amber':  'linear-gradient(135deg, #e4c187 0%, #c89a5c 100%)',
        'tile-coral':  'linear-gradient(135deg, #e8a593 0%, #c87562 100%)',
        'tile-lilac':  'linear-gradient(135deg, #a797c8 0%, #7c6ba5 100%)',
      },
      keyframes: {
        riseIn: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        drawLine: {
          '0%':   { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulseDot: {
          '0%,100%': { opacity: '.5', transform: 'scale(.9)' },
          '50%':     { opacity: '1',  transform: 'scale(1.1)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        growBar: {
          '0%':   { transform: 'scaleY(0)', transformOrigin: 'bottom' },
          '100%': { transform: 'scaleY(1)', transformOrigin: 'bottom' },
        },
      },
      animation: {
        'rise-in':   'riseIn .6s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'draw-line': 'drawLine 1.2s cubic-bezier(0.65, 0, 0.35, 1) both',
        'marquee':   'marquee 40s linear infinite',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'fade-in':   'fadeIn .5s ease-out both',
        'grow-bar':  'growBar .7s cubic-bezier(0.2, 0.8, 0.2, 1) both',
      },
    },
  },
  plugins: [],
}
