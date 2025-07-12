# FMTC 爬虫测试套件

这个目录包含了 FMTC 爬虫的所有测试文件，按功能和复杂程度分类。

## 📁 测试文件结构

### 🔧 基础测试

- **`test-types.ts`** - 测试相关的 TypeScript 类型定义
- **`simple-test.ts`** - 基础的选择器和页面结构测试

### 🔐 登录功能测试

- **`standalone-login-test.ts`** - ⭐ **推荐** 独立登录测试（不依赖后端）
- **`enhanced-login-test.ts`** - 增强登录测试（包含反检测和会话管理）
- **`full-login-test.ts`** - 完整登录流程测试
- **`debug-login-test.ts`** - 🔍 登录调试测试（详细页面分析）

### 🧭 导航和搜索测试

- **`complete-navigation-test.ts`** - 页面导航功能测试
- **`complete-search-test.ts`** - 完整搜索流程测试
- **`debug-category-options.ts`** - 分类选项调试测试

## 🚀 快速开始

### 环境配置

在项目根目录创建 `.env` 文件：

```bash
# 基础配置
FMTC_USERNAME=your-email@example.com
FMTC_PASSWORD=your-password
FMTC_HEADLESS_MODE=false  # 开发时建议 false

# reCAPTCHA 配置
FMTC_RECAPTCHA_MODE=manual  # manual | auto | skip
FMTC_2CAPTCHA_API_KEY=your-api-key  # 仅 auto 模式需要

# 调试配置
FMTC_DEBUG_MODE=true
FMTC_REQUEST_DELAY=2000
```

### 推荐测试顺序

#### 1. 🔍 基础验证

```bash
cd /root/TrendHub/packages/scraper
npx tsx src/test/fmtc/simple-test.ts selectors
```

#### 2. 🔐 登录测试（推荐先做）

```bash
npx tsx src/test/fmtc/standalone-login-test.ts
```

#### 3. 🧭 导航测试

```bash
npx tsx src/test/fmtc/complete-navigation-test.ts
```

#### 4. 🔍 搜索测试

```bash
npx tsx src/test/fmtc/complete-search-test.ts
```

### 🐛 调试模式

如果遇到问题，使用调试测试：

```bash
# 详细的登录页面分析
npx tsx src/test/fmtc/debug-login-test.ts

# 分类选项调试
npx tsx src/test/fmtc/debug-category-options.ts
```

## 📊 测试文件功能对比

| 测试文件                      | 功能范围          | 复杂度   | 推荐用途         |
| ----------------------------- | ----------------- | -------- | ---------------- |
| `simple-test.ts`              | 基础选择器        | ⭐       | 快速验证页面结构 |
| `standalone-login-test.ts`    | 登录 + 会话持久化 | ⭐⭐     | **日常开发推荐** |
| `debug-login-test.ts`         | 登录 + 详细分析   | ⭐⭐⭐   | 问题诊断         |
| `enhanced-login-test.ts`      | 登录 + 反检测     | ⭐⭐⭐   | 完整功能测试     |
| `complete-navigation-test.ts` | 登录 + 导航       | ⭐⭐⭐   | 导航功能验证     |
| `complete-search-test.ts`     | 全流程            | ⭐⭐⭐⭐ | 端到端测试       |

## 🔧 测试配置说明

### reCAPTCHA 处理模式

- **manual** (推荐开发用)：等待手动完成验证码
- **auto**：使用 2captcha.com 自动解决（需要 API 密钥）
- **skip**：跳过验证码（可能导致登录失败）

### 浏览器模式

- **headless=false**：显示浏览器窗口（开发推荐）
- **headless=true**：无头模式（生产环境）

### 会话持久化

`standalone-login-test.ts` 支持会话状态保存：

```bash
# 清理保存的认证状态
npx tsx src/test/fmtc/standalone-login-test.ts clear
```

## 📝 测试输出说明

### 成功的登录测试输出

```
✅ 浏览器启动成功
✅ 页面加载完成
✅ 表单验证通过
✅ 表单填写完成
✅ reCAPTCHA 验证完成 (如果需要)
✅ 登录成功！
✅ 认证状态已保存
✅ 会话验证通过
🎉 测试完成
```

### 常见错误和解决方案

#### 1. "登录表单验证失败"

- **原因**：页面结构可能已更改
- **解决**：运行 `debug-login-test.ts` 分析页面结构

#### 2. "reCAPTCHA 验证失败"

- **原因**：验证码未正确完成
- **解决**：确保在手动模式下完整完成验证

#### 3. "会话状态检测失败"

- **原因**：反检测机制触发
- **解决**：增加延迟，使用非无头模式

## 🚀 生产环境配置

```bash
# 生产环境推荐配置
FMTC_HEADLESS_MODE=true
FMTC_DEBUG_MODE=false
FMTC_RECAPTCHA_MODE=auto
FMTC_REQUEST_DELAY=2000
FMTC_MAX_CONCURRENCY=1
```

## 📞 技术支持

如果测试遇到问题：

1. 检查环境变量配置
2. 运行调试模式测试
3. 查看详细的错误日志
4. 确认网络连接和账户状态

---

💡 **提示**：建议从 `standalone-login-test.ts` 开始，它是最稳定和功能完整的测试。
