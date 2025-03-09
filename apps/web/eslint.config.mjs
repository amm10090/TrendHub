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

// 合并Next.js推荐配置
const nextjsConfig = compat.config({
    extends: ['next/core-web-vitals'],
    settings: {
        next: {
            rootDir: '.', // 针对monorepo环境，指定Next.js应用的位置
        },
    },
});

// 主ESLint配置
const eslintConfig = [
    ...nextjsConfig, // 引入Next.js官方配置

    // 全局设置
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
    },

    // JavaScript特定规则
    {
        files: ['**/*.js'],
        languageOptions: {
            sourceType: 'module',
        },
        rules: {
            // JavaScript特定的规则
            'no-undef': 'error',
            'no-unused-vars': ['warn', {
                vars: 'all',
                varsIgnorePattern: '^_',
                args: 'after-used',
                argsIgnorePattern: '^_'
            }],
        },
    },

    // TypeScript配置 - 仅应用于TS文件
    {
        files: ['**/*.{ts,tsx}'],
        ...tseslint.configs.recommended,
    },

    // React 基本规则
    {
        files: ['**/*.{jsx,tsx,js}'],  // 添加.js以包含React JS文件
        plugins: {
            react: reactPlugin,
            'react-hooks': reactHooksPlugin,
            'jsx-a11y': jsxA11yPlugin,
        },
        rules: {
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/display-name': 'off',
            'react/jsx-uses-react': 'off',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            'react/self-closing-comp': 'warn',
            'react/jsx-sort-props': [
                'warn',
                {
                    callbacksLast: true,
                    shorthandFirst: true,
                    noSortAlphabetically: false,
                    reservedFirst: true,
                },
            ],
            'jsx-a11y/click-events-have-key-events': 'warn',
            'jsx-a11y/interactive-supports-focus': 'warn',
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },

    // 导入规则优化
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        plugins: {
            import: importPlugin,
            'unused-imports': unusedImportsPlugin,
        },
        rules: {
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
            'no-unused-vars': 'off',
            'unused-imports/no-unused-vars': [
                'warn',
                {
                    vars: 'all',
                    varsIgnorePattern: '^_',
                    args: 'after-used',
                    argsIgnorePattern: '^_',
                },
            ],
        },
    },

    // 代码格式优化
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        rules: {
            'no-console': 'warn',
            'padding-line-between-statements': [
                'warn',
                { blankLine: 'always', prev: '*', next: 'return' },
                { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
                { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
            ],
        },
    },

    // Pages目录下的JS文件特殊处理
    {
        files: ['**/pages/**/*.js'],
        rules: {
            // 对Pages目录下的特殊JS文件的规则调整
            'no-unused-vars': 'off', // 这些文件可能有特殊的变量使用模式
            'react/display-name': 'off',
            'react/prop-types': 'off',
        },
    },

    // Prettier 集成
    eslintConfigPrettier,

    // 排除特定文件和目录
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/.next/**',
            '**/coverage/**',
            '**/public/**',
            '**/*.config.js', // 保留对配置文件的排除
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