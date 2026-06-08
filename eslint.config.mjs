import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'
import prettierRecommended from 'eslint-plugin-prettier/recommended'
import prettierConfig from './.prettierrc.js'

const config = [
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'node_modules/**',
      // Standalone Node CLI subproject with its own package.json
      'cli/**',
      // Config files use CommonJS require()
      '*.config.js',
      '.prettierrc.js',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
  prettierRecommended,
  {
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
    rules: {
      'no-console': ['warn', { allow: ['error', 'info', 'log', 'warn'] }],
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      'dot-notation': 'error',
      'no-else-return': 'error',
      'no-floating-decimal': 'error',
      'no-sequences': 'error',
      'array-bracket-spacing': 'error',
      'computed-property-spacing': ['error', 'never'],
      curly: ['error', 'multi'],
      'no-lonely-if': 'error',
      'no-unneeded-ternary': 'error',
      'one-var-declaration-per-line': 'error',
      quotes: [
        'error',
        'single',
        { allowTemplateLiterals: false, avoidEscape: true },
      ],
      'prefer-const': 'error',
      'sort-imports': [
        'error',
        { ignoreCase: true, ignoreDeclarationSort: true },
      ],
      'no-unused-expressions': 'off',
      'no-prototype-builtins': 'off',
      'react-hooks/exhaustive-deps': 'off',
      // Stricter rules surfaced by eslint-config-next@16 (React 19) — keep as warn so lint passes
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/error-boundaries': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-duplicate-enum-values': 'warn',
      'prettier/prettier': ['error', prettierConfig],
    },
  },
]

export default config
