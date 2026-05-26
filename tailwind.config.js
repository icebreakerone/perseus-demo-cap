const plugin = require('tailwindcss/plugin')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './stories/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      width: {
        'panel-sm': '150px',
        'panel-md': '300px',
        'panel-lg': '450px',
        'fit-content': 'fit-content',
      },
    },
  },
  plugins: [
    plugin(function ({ addComponents, theme }) {
      addComponents({
        'h1, h2, h3, h4, h5, h6': {
          color: theme('colors.gray.900'),
          fontWeight: theme('fontWeight.bold'),
        },
        '.cl-btn': {
          backgroundColor: theme('colors.white'),
          border: `2px solid ${theme('colors.blue.500')}`,
          borderRadius: theme('borderRadius.md'),
          color: theme('colors.black'),
          '&:hover': {
            backgroundColor: theme('colors.blue.300'),
          },
          fontsize: theme('fontSize.md'),
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          '&:disabled': {
            backgroundColor: theme('colors.gray.300'),
            border: `2px solid ${theme('colors.gray.300')}`,
            color: theme('colors.gray.500'),
          },
        },
        '.cl-btn-primary': {
          backgroundColor: theme('colors.blue.500'),
          border: `1px solid ${theme('colors.blue.800')}`,
          color: theme('colors.white'),
          '&:hover': {
            backgroundColor: theme('colors.blue.600'),
          },
        },
      })
    }),
  ],
}
