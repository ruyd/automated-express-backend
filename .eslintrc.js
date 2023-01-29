module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'eslint-plugin-import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
  ],
  ignorePatterns: ['dist', 'build', 'node_modules'],
  rules: {
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    'no-console': 'warn',
    'import/no-named-as-default': 'off',
  },
  settings: {
    'import/resolver': {
      node: true,
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
  overrides: [
    {
      files: ['*.js'],
      rules: {
        'no-undef': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
}
