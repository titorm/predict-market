import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#ffffff',
        surface: {
          soft: '#f7f7f7',
          strong: '#f2f2f2',
        },
        ink: '#222222',
        body: '#3f3f3f',
        muted: {
          DEFAULT: '#6a6a6a',
          soft: '#929292',
        },
        hairline: {
          DEFAULT: '#dddddd',
          soft: '#ebebeb',
          strong: '#c1c1c1',
        },
        primary: {
          DEFAULT: '#1e4d3b',
          active: '#143629',
          disabled: '#d4e2dc',
        },
        scenario: {
          optimistic: '#1e4d3b',
          realistic: '#222222',
          pessimistic: '#9e3b24',
          shrinkflation: '#7a1c1c',
        },
        error: {
          DEFAULT: '#c13515',
          hover: '#b32505',
        },
        danger: {
          DEFAULT: '#c13515',
          hover: '#b32505',
          active: '#9e2b11',
        },
        warning: {
          DEFAULT: '#b45309',
          hover: '#92400e',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'Circular',
          '-apple-system',
          'BlinkMacSystemFont',
          'Roboto',
          '"Helvetica Neue"',
          'sans-serif',
        ],
      },
      borderRadius: {
        sm: '8px',
        md: '14px',
        xl: '32px',
        full: '9999px',
      },
      spacing: {
        xxs: '2px',
        xs: '4px',
        sm: '8px',
        md: '12px',
        base: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
        section: '64px',
      },
      boxShadow: {
        airbnb:
          'rgba(0, 0, 0, 0.02) 0px 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 2px 6px 0px, rgba(0, 0, 0, 0.10) 0px 4px 8px 0px',
        none: 'none',
      },
    },
  },
  plugins: [],
};

export default config;
