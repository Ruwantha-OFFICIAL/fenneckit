import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/src/**/*.{js,ts}"],
    extends: [js.configs.recommended],
    languageOptions: { 
      globals: globals.browser 
    },
  },
  tseslint.configs.recommended,
]);