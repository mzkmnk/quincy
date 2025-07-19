import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import * as eslintPluginImport from "eslint-plugin-import";
import eslintPluginUnusedImports from "eslint-plugin-unused-imports";
import eslintPluginTailwindCSS from "eslint-plugin-tailwindcss";
import angular from "@angular-eslint/eslint-plugin";

export default tseslint.config(
    {
        ignores: [
            "**/node_modules",
            "**/dist",
            "**/temp",
            "**/coverage",
            "**/build",
        ],
    },
    
    // 基本設定
    {
        extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
        plugins: {
            import: eslintPluginImport,
            "unused-imports": eslintPluginUnusedImports,
        },
        rules: {
            "import/order": ["error", {
                "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
                "newlines-between": "always",
            }],
            "unused-imports/no-unused-imports": "error",
            "unused-imports/no-unused-vars": [
                "error",
                {
                    vars: "all",
                    varsIgnorePattern: "^_",
                    args: "after-used",
                    argsIgnorePattern: "^_",
                },
            ],
        },
    },

    // TypeScript専用設定
    {
        files: ["**/*.{ts,tsx}"],
        rules: {
            "@typescript-eslint/no-unused-vars": "off", // unused-importsプラグインを使用
            "@typescript-eslint/explicit-function-return-type": "warn",
            "@typescript-eslint/no-explicit-any": "warn",
            "prefer-const": "error",
            "@typescript-eslint/no-namespace": "off",
        },
    },

    // Backend専用設定
    {
        files: ["apps/backend/**/*.{ts,js}"],
        rules: {
            "@typescript-eslint/explicit-function-return-type": "error",
            "no-console": "warn",
        },
    },

    // Frontend (Angular) 専用設定
    {
        files: ["apps/frontend/**/*.{ts,html}"],
        plugins: {
            "@angular-eslint": angular,
            tailwindcss: eslintPluginTailwindCSS,
        },
        extends: [...eslintPluginTailwindCSS.configs["flat/recommended"]],
        rules: {
            "@typescript-eslint/explicit-function-return-type": "off", // Angularでは不要
            "tailwindcss/classnames-order": "warn",
            "tailwindcss/no-custom-classname": "off",
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
        },
    },

    // Test用設定
    {
        files: ["**/*.{test,spec}.{ts,js}"],
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "no-console": "off",
        },
    },

    // Prettier との競合回避
    eslintConfigPrettier,
);