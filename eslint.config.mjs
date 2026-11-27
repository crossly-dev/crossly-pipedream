import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
    ],
  },
  js.configs.recommended,
  {
    files: [
      "**/*.mjs",
      "**/*.js",
    ],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
        },
      ],
      "comma-dangle": [
        "error",
        "always-multiline",
      ],
      "quotes": [
        "error",
        "double",
        {
          avoidEscape: true,
        },
      ],
      "semi": [
        "error",
        "always",
      ],
      "indent": [
        "error",
        2,
        {
          SwitchCase: 1,
        },
      ],
      "eol-last": "error",
      "no-trailing-spaces": "error",
    },
  },
];
