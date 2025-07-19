import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import * as eslintPluginImport from "eslint-plugin-import";
import eslintPluginUnusedImports from "eslint-plugin-unused-imports";
import eslintPluginBetterTailwindCSS from "eslint-plugin-better-tailwindcss";
import angular from "@angular-eslint/eslint-plugin";

export default tseslint.config(
    {
        ignores: [
            "**/node_modules",
            "**/dist",
            "**/temp",
            "**/coverage",
            "**/build",
            "**/.angular",
            "apps/frontend/src/index.html",
            "apps/frontend/src/app/app.html",
            "apps/frontend/**/*.html"
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

    // Frontend (Angular) TypeScript専用設定
    {
        files: ["apps/frontend/**/*.ts"],
        plugins: {
            "@angular-eslint": angular,
        },
        rules: {
            "@typescript-eslint/explicit-function-return-type": "off", // Angularでは不要
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

    // Better TailwindCSS 設定
    {
        files: ["apps/frontend/**/*.{ts,html}"],
        plugins: {
            "better-tailwindcss": eslintPluginBetterTailwindCSS,
        },
        rules: {
            "better-tailwindcss/enforce-consistent-class-order": "warn",
            "better-tailwindcss/no-duplicate-classes": "error",
        },
        settings: {
            "better-tailwindcss": {
                // TailwindCSS v4対応 - CSSエントリーポイントを指定
                entryPoint: "apps/frontend/src/styles.css",
            },
        },
    },


    // Prettier との競合回避
    eslintConfigPrettier,
);