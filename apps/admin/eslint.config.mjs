import { FlatCompat } from '@eslint/eslintrc';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';

// 使用FlatCompat来帮助Next.js识别配置
const compat = new FlatCompat({
    baseDirectory: import.meta.dirname,
});

// 获取Next.js配置
const nextjsConfig = compat.config({
    extends: ['next/core-web-vitals'],
    settings: {
        next: {
            rootDir: '.',  // 修改为当前目录
        },
    },
});

// 主ESLint配置
const eslintConfig = [
    // Next.js配置
    ...nextjsConfig,

    // 基础配置
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: 'module',
            globals: {
                React: 'readonly',
            },
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        linterOptions: {
            reportUnusedDisableDirectives: true,
        },

        // 规则配置
        rules: {
            // JavaScript规则
            'no-undef': 'error',
            'no-unused-vars': ['warn', {
                vars: 'all',
                varsIgnorePattern: '^_',
                args: 'after-used',
                argsIgnorePattern: '^_'
            }],

            // React规则
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/display-name': 'off',
            'react/jsx-uses-react': 'off',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            'react/self-closing-comp': 'warn',
            'react/jsx-sort-props': 'off', // 关闭props字母排序规则

            // 可访问性规则
            'jsx-a11y/click-events-have-key-events': 'warn',
            'jsx-a11y/interactive-supports-focus': 'warn',

            // 导入规则
            'unused-imports/no-unused-imports': 'warn',
            'import/order': [
                'warn',
                {
                    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
                    pathGroups: [
                        {
                            pattern: 'react',
                            group: 'external',
                            position: 'before',
                        },
                        {
                            pattern: 'next/**',
                            group: 'external',
                            position: 'before',
                        },
                    ],
                    'newlines-between': 'always',
                    alphabetize: { order: 'asc', caseInsensitive: true },
                },
            ],
            'unused-imports/no-unused-vars': [
                'warn',
                {
                    vars: 'all',
                    varsIgnorePattern: '^_',
                    args: 'after-used',
                    argsIgnorePattern: '^_',
                },
            ],

            // 代码格式规则
            'no-console': 'warn',
            'padding-line-between-statements': [
                'warn',
                { blankLine: 'always', prev: '*', next: 'return' },
                { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
                { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
            ],

            // Next.js规则
            '@next/next/no-html-link-for-pages': ['off', ['pages', 'app']], // 显式指定pages和app目录
        },

        // 插件配置
        plugins: {
            react: reactPlugin,
            'react-hooks': reactHooksPlugin,
            'jsx-a11y': jsxA11yPlugin,
            import: importPlugin,
            'unused-imports': unusedImportsPlugin,
            ...tseslint.plugins,
        },

        // React设置
        settings: {
            react: {
                version: 'detect',
            },
            next: {
                rootDir: '.',
                pagesDir: ['./pages', './app'],  // 显式设置pages和app目录
            },
        },
    },

    // 您移动后的覆盖配置 (路径已修正)
    {
        files: [
            "src/lib/services/task-executor.ts",    // 修正路径
            "src/lib/services/task-queue-manager.ts" // 修正路径
        ],
        rules: {
            "no-console": "off" // 特定文件覆盖
        }
    },

    // Prettier配置
    eslintConfigPrettier,

    // TypeScript配置
    ...tseslint.configs.recommended,

    // 忽略文件配置
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/.next/**',
            '**/coverage/**',
            '**/public/**',
            '**/*.config.js',
            '**/*.config.ts',
            '**/next-env.d.ts',
            '**/app/[locale]/layout.tsx',
            '**/postcss.config.js',
            '**/tailwind.config.js',
            '**/.turbo/**',
        ],
    },
];

export default eslintConfig; 