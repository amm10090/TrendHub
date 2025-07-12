# FMTC 爬虫模块

这个模块实现了对 FMTC (FirstPromotions/MediaTransition Commerce) 平台的网页抓取功能，包括登录、商户信息抓取等。

## 功能特性

### ✅ 已实现功能

- **登录处理** - 自动登录 FMTC 账户
- **reCAPTCHA 支持** - 检测和处理 reCAPTCHA 验证
- **会话管理** - 维护登录状态和会话刷新
- **错误处理** - 完善的错误检测和重试机制
- **页面特征检测** - 智能检测页面状态和结构变化
- **反检测机制** - 模拟真实用户行为

### 🚧 待实现功能

- **商户列表抓取** - 从商户目录页面提取商户信息
- **商户详情抓取** - 获取单个商户的详细信息
- **图片下载** - 下载商户 Logo 和截图
- **数据存储** - 将抓取的数据保存到数据库

## 文件结构

```
fmtc/
├── README.md                    # 本文档
├── index.ts                     # 主入口文件
├── types.ts                     # TypeScript 类型定义
├── selectors.ts                 # CSS 选择器配置
├── config.ts                    # 配置文件
├── login-handler.ts             # 登录处理器
├── recaptcha-service.ts         # reCAPTCHA 处理服务
├── merchant-list-handler.ts     # 商户列表处理器
├── merchant-detail-handler.ts   # 商户详情处理器
├── navigation-handler.ts        # 页面导航处理器
├── search-handler.ts            # 搜索功能处理器
├── results-parser.ts            # 结果解析器
├── request-handler.ts           # 请求处理器
├── anti-detection.ts            # 反检测机制
└── recaptcha-config.md          # reCAPTCHA 配置文档
```

### 📁 测试文件

所有测试文件已移动到独立的测试目录：

```
../../test/fmtc/
├── README.md                    # 测试说明文档
├── test-types.ts                # 测试类型定义
├── simple-test.ts               # 基础选择器测试
├── standalone-login-test.ts     # ⭐ 推荐：独立登录测试
├── enhanced-login-test.ts       # 增强登录测试
├── full-login-test.ts          # 完整登录测试
├── debug-login-test.ts         # 登录调试测试
├── complete-navigation-test.ts  # 导航功能测试
├── complete-search-test.ts      # 完整搜索测试
└── debug-category-options.ts    # 分类选项调试
```

## 快速开始

### 1. 环境配置

设置环境变量：

```bash
export FMTC_USERNAME="your-email@example.com"
export FMTC_PASSWORD="your-password"
export FMTC_MAX_PAGES="10"
export FMTC_REQUEST_DELAY="2000"
export FMTC_HEADLESS_MODE="true"
export FMTC_DEBUG_MODE="false"
```

### 2. 测试登录功能

#### 推荐测试流程

```bash
cd /root/TrendHub/packages/scraper

# 1. 基础选择器测试
npx tsx src/test/fmtc/simple-test.ts selectors

# 2. 独立登录测试（推荐）
npx tsx src/test/fmtc/standalone-login-test.ts

# 3. 完整搜索流程测试
npx tsx src/test/fmtc/complete-search-test.ts
```

更多测试选项请参考：[测试文档](../../test/fmtc/README.md)

### 3. 代码使用示例

```typescript
import { FMTCLoginHandler } from "./sites/fmtc/login-handler.js";
import { FMTC_CONFIG } from "./sites/fmtc/config.js";
import { playwright } from "crawlee";

// 创建浏览器和页面
const browser = await playwright.chromium.launch({
  headless: FMTC_CONFIG.HEADLESS_MODE,
});
const page = await browser.newPage();

// 创建登录处理器
const loginHandler = new FMTCLoginHandler(page, console, "execution-id");

// 执行登录
const result = await loginHandler.login({
  username: "your-email@example.com",
  password: "your-password",
});

if (result.success) {
  console.log("登录成功!");

  // 检查登录状态
  const isLoggedIn = await loginHandler.isLoggedIn();
  console.log("当前登录状态:", isLoggedIn);

  // 刷新会话
  await loginHandler.refreshSession();

  // 执行其他抓取操作...
} else {
  console.error("登录失败:", result.error);

  if (result.requiresCaptcha) {
    console.log("需要手动完成验证码验证");
  }
}

// 清理资源
await browser.close();
```

## 配置说明

### 基础配置

- `FMTC_USERNAME` - FMTC 账户用户名（邮箱）
- `FMTC_PASSWORD` - FMTC 账户密码
- `FMTC_MAX_PAGES` - 最大抓取页数（默认：10）
- `FMTC_REQUEST_DELAY` - 请求间隔毫秒数（默认：2000）

### 高级配置

- `FMTC_HEADLESS_MODE` - 是否使用无头模式（默认：true）
- `FMTC_DEBUG_MODE` - 是否启用调试模式（默认：false）
- `FMTC_MAX_CONCURRENCY` - 最大并发数（默认：1）
- `FMTC_ENABLE_IMAGE_DOWNLOAD` - 是否下载图片（默认：false）

## 重要注意事项

### 1. reCAPTCHA 处理

FMTC 登录页面使用 Google reCAPTCHA 验证。目前的实现支持：

- ✅ 自动检测 reCAPTCHA 的存在
- ✅ 等待用户手动完成验证
- ✅ 验证完成后继续登录流程
- ❌ 自动解决 reCAPTCHA（需要第三方服务）

当遇到 reCAPTCHA 时，系统会：

1. 暂停执行并显示警告
2. 等待用户在浏览器中手动完成验证
3. 验证完成后自动继续

### 2. 登录页面结构

基于提供的 HTML 结构，登录页面包含：

```html
<!-- 登录表单 -->
<form id="form" action="/cp/login" method="post">
  <!-- 用户名输入框 -->
  <input id="username" name="username" type="text" />

  <!-- 密码输入框 -->
  <input id="password" name="password" type="password" />

  <!-- reCAPTCHA -->
  <div class="g-recaptcha">...</div>

  <!-- 提交按钮 -->
  <button type="submit" class="btn fmtc-primary-btn">Submit</button>
</form>
```

### 3. 错误处理

系统能够检测和处理以下错误情况：

- 🔐 登录凭据错误
- 🚫 账户被锁定或暂停
- 🤖 需要验证码验证
- ⏱️ 会话超时
- 🚷 访问被拒绝
- 🌐 网络连接问题

### 4. 反检测机制

为避免被识别为机器人，实现了以下反检测措施：

- 🎭 随机用户代理轮换
- 📏 随机视口大小
- ⏰ 随机请求延迟
- 🖱️ 模拟鼠标移动
- 📜 模拟页面滚动
- 🕒 请求间隔控制

## 故障排除

### 常见问题

#### 1. "登录表单验证失败"

**原因**: 页面结构可能已更改  
**解决**: 检查并更新 `selectors.ts` 中的选择器

#### 2. "需要手动完成 reCAPTCHA 验证"

**原因**: 遇到验证码挑战  
**解决**: 在浏览器中手动完成验证码

#### 3. "会话已过期"

**原因**: 登录会话超时  
**解决**: 重新执行登录流程

#### 4. "无法找到用户名/密码输入框"

**原因**: 页面加载不完全或结构变化  
**解决**: 增加等待时间或更新选择器

### 调试模式

启用调试模式可以获得更详细的日志：

```bash
export FMTC_DEBUG_MODE="true"
export FMTC_HEADLESS_MODE="false"  # 显示浏览器窗口
```

### 日志级别

系统使用以下日志级别：

- `DEBUG` - 详细的调试信息
- `INFO` - 一般信息
- `WARN` - 警告信息
- `ERROR` - 错误信息

## 下一步计划

### 即将实现的功能

1. **商户列表抓取**

   - 需要提供商户列表页面的 HTML 结构
   - 实现分页处理
   - 提取商户基本信息

2. **商户详情抓取**

   - 需要提供商户详情页面的 HTML 结构
   - 提取完整的商户信息
   - 下载商户图片和截图

3. **数据同步**
   - 与现有品牌匹配系统集成
   - 自动化的数据同步流程

### 需要的信息

为了继续开发，还需要提供：

1. **商户列表页面 HTML** - 包含表格结构和分页
2. **商户详情页面 HTML** - 包含详细信息和图片
3. **网络关联表格 HTML** - 如果存在的话
4. **错误页面 HTML** - 各种错误状态的页面结构

## 贡献指南

### 代码规范

- 使用 TypeScript 进行类型安全
- 遵循现有的代码风格
- 添加适当的错误处理
- 编写必要的注释

### 测试

在提交代码前，请运行测试：

```bash
# 测试页面选择器
npx tsx src/sites/fmtc/simple-test.ts selectors

# 测试登录功能
npx tsx src/sites/fmtc/simple-test.ts
```

### 提交格式

提交消息应该清晰描述更改内容：

```
feat(fmtc): 添加商户列表抓取功能
fix(fmtc): 修复登录失败时的错误处理
docs(fmtc): 更新使用说明文档
```
