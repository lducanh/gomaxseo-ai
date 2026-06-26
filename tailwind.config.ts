import type { Config } from 'tailwindcss';

const withAlpha = (v: string) => `hsl(var(${v}) / <alpha-value>)`;

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: withAlpha('--bg'),
        surface: {
          DEFAULT: withAlpha('--surface'),
          hover: withAlpha('--surface-hover'),
        },
        input: withAlpha('--input'),
        border: {
          DEFAULT: withAlpha('--border'),
          strong: withAlpha('--border-strong'),
        },
        fg: withAlpha('--fg'),
        muted: withAlpha('--muted'),
        faint: withAlpha('--faint'),
        accent: {
          DEFAULT: withAlpha('--accent'),
          hover: withAlpha('--accent-hover'),
          active: withAlpha('--accent-active'),
          contrast: withAlpha('--accent-contrast'),
        },
        success: withAlpha('--success'),
        warning: withAlpha('--warning'),
        danger: withAlpha('--danger'),
        info: withAlpha('--info'),
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: 'var(--radius)',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
      boxShadow: {
        subtle: 'var(--shadow-subtle)',
        card: 'var(--shadow-card)',
        pop: 'var(--shadow-pop)',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' } },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out both',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.16,1,0.3,1) both',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
export default config;
