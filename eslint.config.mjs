import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: ['.agents/**', '.claude/**', 'skills-lock.json'],
  react: false,
  extends: ['next/core-web-vitals', 'next/typescript'],
  rules: {
    '@typescript-eslint/no-namespace': 'off',
    'jsx-quotes': ['error', 'prefer-double'],

    'import/no-duplicates': 'error',
    'import/prefer-default-export': 'off',

    'no-irregular-whitespace': 'off',
    'n/prefer-global/process': 'off',

    'e18e/prefer-static-regex': 'off',
    'react-hooks-extra/no-direct-set-state-in-use-effect': 'off',
    'react-hooks/exhaustive-deps': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    'react-refresh/only-export-components': 'off',
    'react/no-nested-components': 'off',

    'react/no-context-provider': 'off',
    'react/no-forward-ref': 'off',

    'style/jsx-sort-props': 'error',
    'on-console': 'off',
    'react/no-array-index-key': 'off',
  },
})
