module.exports = [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".github/**",
      ".DS_Store",
      "package-lock.json",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      react: require("eslint-plugin-react"),
      prettier: require("eslint-plugin-prettier"),
    },
    rules: {
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error",
      "prettier/prettier": "error",
    },
  },
];
