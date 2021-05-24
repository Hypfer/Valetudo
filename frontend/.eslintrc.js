// eslint-disable-next-line no-undef
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['react', '@typescript-eslint'],
  settings: {
    react: {
      version: 'detect',
    },
    linkComponents: [
      // Components used as alternatives to <a> for linking, eg. <Link to={ url } />
      'Hyperlink',
      { name: 'Link', linkAttribute: 'to' },
    ],
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',

    // Not necessary with React 17
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off',

    // Not necessary with TypeScript
    'react/prop-types': 'off',
  },
};
