import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules/", "data/", "test-results/", "playwright-report/"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts", "e2e/**/*.ts", "bin/**/*.mjs", "playwright.config.ts", "eslint.config.js"],
    languageOptions: { globals: globals.node },
    rules: { "@typescript-eslint/no-explicit-any": "error" },
  },
  {
    files: ["public/**/*.js"],
    languageOptions: { globals: globals.browser },
  },
);
