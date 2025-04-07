
/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:security/recommended',
    'plugin:testing-library/react',
    'prettier',
  ],

  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
    projectService: true, // Use projectService instead of project to fix TypeScript project references issue
  },
  plugins: [
    'react',
    'react-hooks',
    '@typescript-eslint',
    'jsx-a11y',
    'import',
    'security',
    'prettier',
    'testing-library'
  ],
  rules: {
    // React
    'react/react-in-jsx-scope': 'off', // Not needed in React 18 with automatic JSX transform
    'react/prop-types': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/jsx-uses-react': 'off', // Not needed in React 18
    'react/jsx-uses-vars': 'error',
    'react/jsx-no-target-blank': 'error',
    'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
    'react/self-closing-comp': ['error', { component: true, html: true }],
    'react/display-name': 'off',

    // Accessibility
    'jsx-a11y/no-autofocus': 'warn',

    // TypeScript
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    '@typescript-eslint/strict-boolean-expressions': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/explicit-function-return-type': ['off', {
      allowExpressions: true,
      allowTypedFunctionExpressions: true,
    }],
    '@typescript-eslint/consistent-type-imports': ['warn', {
      prefer: 'type-imports',
      disallowTypeAnnotations: false,
    }],
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // Import
    'import/order': ['error', {
      'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always',
      'alphabetize': { 'order': 'asc', 'caseInsensitive': true }
    }],
    'import/no-cycle': 'error',
    'import/no-unresolved': 'error',
    'import/first': 'error',
    'import/no-duplicates': 'error',
    'import/no-useless-path-segments': 'error',

    // Security
    'security/detect-object-injection': 'warn',
    'security/detect-unsafe-regex': 'warn',
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-non-literal-regexp': 'warn',

    // Prettier
    'prettier/prettier': ['error', {
      endOfLine: 'auto'
    }],
    'linebreak-style': ['error', 'unix'],
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      },
      alias: {
        map: [
          ['@', './src']
        ],
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }
    },
  },
  ignorePatterns: [
    'dist',
    'node_modules',
    'coverage',
    '.eslintrc.cjs',
    'public',
    'vite.config.ts',
    'pwa-assets.config.ts'
  ],
  overrides: [
    // React Testing Library test files
    {
      files: ['**/__tests__/**/*', '**/*.{test,spec}.{ts,tsx}'],
      excludedFiles: ['e2e/**/*.{ts,tsx}'],
      extends: ['plugin:testing-library/react'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        'testing-library/prefer-screen-queries': 'warn',
        'testing-library/no-node-access': 'warn',
        'testing-library/no-container': 'warn',
        'testing-library/render-result-naming-convention': 'warn',
        'testing-library/no-wait-for-multiple-assertions': 'warn',
        'testing-library/no-debugging-utils': 'warn'
      }
    },
    // Playwright e2e test files
    {
      files: ['e2e/**/*.{ts,tsx}'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'testing-library/prefer-screen-queries': 'off',
        'testing-library/no-node-access': 'off',
        'testing-library/no-container': 'off'
      }
    },
    // Configuration files
    {
      files: ['*.config.ts', '*.config.js'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'import/no-default-export': 'off'
      }
    },
    // Virtual modules
    {
      files: ['**/*.{ts,tsx}'],
      rules: {
        'import/no-unresolved': [
          'error',
          {
            ignore: ['^virtual:.*$', '@vite-pwa/.*']
          }
        ]
      }
    },
    // Service Worker
    {
      files: ['src/sw.ts'],
      env: {
        worker: true,
        serviceworker: true
      },
      rules: {
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off'
      }
    }
  ]
}
