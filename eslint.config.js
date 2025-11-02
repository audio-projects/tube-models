// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const stylistic = require("@stylistic/eslint-plugin");

module.exports = tseslint.config(
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    plugins: {
      "@stylistic": stylistic.default || stylistic,
    },
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
      "@stylistic/brace-style": ["error", "stroustrup", { "allowSingleLine": true }],
      "@stylistic/indent": ["error", 4],
      "@stylistic/semi": ["error", "always"],
      "@stylistic/comma-spacing": ["error", { "before": false, "after": true }],
      "@stylistic/key-spacing": ["error", { "beforeColon": false, "afterColon": true }],
      "@stylistic/space-before-blocks": ["error", "always"],
      "@stylistic/space-infix-ops": ["error"],
      "@stylistic/no-trailing-spaces": ["error"],
      "@stylistic/eol-last": ["error", "always"],
      // Custom rules for specific formatting requirements
      "@stylistic/padding-line-between-statements": [
        "error",
        // Empty line after class declaration
        { "blankLine": "always", "prev": ["export"], "next": ["class"] },
        // Empty line after class body opening
        { "blankLine": "always", "prev": ["class"], "next": "*" }
      ],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  }
);
