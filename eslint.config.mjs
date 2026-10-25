import js from "@eslint/js";
import globals from "globals";
export default [
  {
    ignores: [
      "node_modules/**",
      "vendor/**",
      "shared/icons.js",
      "artifacts/**",
      "test-results/**",
      "playwright-report/**",
    ],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        chrome: "readonly",
        Readability: "readonly",
        BookitCore: "readonly",
      },
    },
    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrors: "none",
          varsIgnorePattern: "^(dlgAnn|inline)$",
        },
      ],
    },
  },
];
