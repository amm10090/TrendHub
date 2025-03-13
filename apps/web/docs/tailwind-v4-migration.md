# Tailwind CSS v4 迁移指南

本文档提供了将 TrendHub 项目从 Tailwind CSS v3 升级到 v4 的详细指南，并确保与 HeroUI 2.7.6-beta.2 兼容。

## 已完成的升级步骤

1. 更新依赖包：

   ```bash
   pnpm add -D tailwindcss@latest postcss@latest autoprefixer@latest
   ```

2. 更新 Tailwind 配置文件 (`tailwind.config.js`)：

   - 添加 `future` 配置以启用 v4 新特性
   - 保持与 HeroUI 的兼容性

3. 更新 PostCSS 配置文件 (`postcss.config.js`)：
   - 添加 `tailwindcss/nesting` 插件支持

## Tailwind CSS v4 主要变化

### 1. 新的 JIT 引擎

Tailwind CSS v4 使用全新的 Oxide 引擎，比 v3 更快、更高效。这个引擎是用 Rust 编写的，提供了更好的性能和更快的构建时间。

### 2. 类名变化

一些类名在 v4 中发生了变化：

- `space-y-*` 和 `space-x-*` 现在使用 `gap-*` 替代
- `divide-y-*` 和 `divide-x-*` 现在需要与 `divide` 类一起使用
- 一些颜色类名已更改

### 3. 新增功能

- 支持嵌套 CSS
- 改进的暗模式支持
- 新的 `@layer` 指令
- 新的 `theme()` 函数

### 4. 移除的功能

- 移除了对 IE11 的支持
- 移除了一些过时的 API

## 与 HeroUI 的兼容性

HeroUI 2.7.6-beta.2 已经适配了 Tailwind CSS v4。需要注意以下几点：

1. 组件属性变化：

   - Button 组件的 `size` 属性现在接受 `"small"`, `"medium"`, `"large"` 而不是 `"sm"`, `"md"`, `"lg"`

2. 样式变化：
   - 一些组件可能需要调整样式以适应 Tailwind CSS v4 的变化

## 需要注意的问题

1. 检查自定义组件中的 Tailwind 类名，确保它们在 v4 中仍然有效
2. 测试暗模式功能，确保它在 v4 中正常工作
3. 检查响应式设计，确保它在所有设备上正常工作

## 参考资料

- [Tailwind CSS v4 官方升级指南](https://tailwindcss.com/docs/upgrade-guide)
- [HeroUI 文档](https://beta.heroui.com/docs/guide/tailwind-v4)
