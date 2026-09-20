import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist/", "node_modules/", "test"]),
  {
    files: ["**/*.{js,ts}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      globals: globals.browser
    },
    rules:{
      "@typescript-eslint/no-explicit-any": "off"
    }
  },
]);