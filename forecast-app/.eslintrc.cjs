module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  ignores: ["node_modules/", "src/Backup/", "vitest.config.js", "REFACTORING_GUIDE.md"],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    // make unused-vars warnings to avoid failing CI while developing
    'no-unused-vars': 'warn',
    // react automatic runtime (no need to import React in every file)
    'react/react-in-jsx-scope': 'off',
  },
};
