module.exports = {
  ignores: [
    "node_modules/**",
    "dist/**",
    ".github/**",
    ".DS_Store",
    "package-lock.json",
  ],
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
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
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:prettier/recommended",
  ],
};
