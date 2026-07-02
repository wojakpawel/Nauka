module.exports = {
  env: {
    browser: true,
    es2024: true,
  },
  parserOptions: {
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
  plugins: ["react", "prettier"],
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:prettier/recommended",
  ],
  ignorePatterns: [
    "node_modules/",
    "dist/",
    ".github/",
    ".DS_Store",
    "package-lock.json",
  ],
};
