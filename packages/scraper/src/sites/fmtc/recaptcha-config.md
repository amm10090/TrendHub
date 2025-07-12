# FMTC reCAPTCHA 配置指南

FMTC 爬虫集成了先进的 reCAPTCHA 处理功能，支持手动和自动两种验证模式，并包含反检测机制和会话持久化功能。

## 环境变量配置

### 完整配置示例

```bash
# FMTC 基本配置
FMTC_USERNAME=your-fmtc-username@example.com
FMTC_PASSWORD=your-fmtc-password
FMTC_HEADLESS_MODE=false                    # 开发时建议 false，生产时 true
FMTC_DEBUG_MODE=false
FMTC_MAX_CONCURRENCY=1

# reCAPTCHA 处理模式
FMTC_RECAPTCHA_MODE=manual                  # manual(手动) | auto(自动) | skip(跳过)

# 手动模式超时时间(毫秒) - 建议 2-10 分钟
FMTC_RECAPTCHA_MANUAL_TIMEOUT=120000

# 自动模式超时时间(毫秒) - 建议 3-10 分钟
FMTC_RECAPTCHA_AUTO_TIMEOUT=180000

# 重试次数
FMTC_RECAPTCHA_RETRY_ATTEMPTS=3

# 重试延迟(毫秒)
FMTC_RECAPTCHA_RETRY_DELAY=5000
```

### 2captcha.com API 配置

```bash
# 必需: 2captcha API 密钥
FMTC_2CAPTCHA_API_KEY=your_api_key_here

# 可选: 软件ID (默认: 4580)
FMTC_2CAPTCHA_SOFT_ID=4580

# 可选: 服务器域名 (默认: 2captcha.com)
FMTC_2CAPTCHA_SERVER_DOMAIN=2captcha.com

# 可选: 回调 URL
FMTC_2CAPTCHA_CALLBACK=https://your-callback-url.com
```

## 使用方式

### 1. 手动模式 (默认)

```bash
FMTC_RECAPTCHA_MODE=manual
FMTC_RECAPTCHA_MANUAL_TIMEOUT=60000
```

在手动模式下，系统会等待用户手动完成 reCAPTCHA 验证。

### 2. 自动模式

```bash
FMTC_RECAPTCHA_MODE=auto
FMTC_2CAPTCHA_API_KEY=your_api_key_here
FMTC_RECAPTCHA_AUTO_TIMEOUT=180000
```

在自动模式下，系统会使用 2captcha.com API 自动解决 reCAPTCHA。

### 3. 跳过模式

```bash
FMTC_RECAPTCHA_MODE=skip
```

在跳过模式下，系统会跳过 reCAPTCHA 验证。如果页面确实有验证码，登录将失败。

## 代码示例

```typescript
import { getRecaptchaConfig } from "./config.js";
import { FMTCLoginHandler } from "./login-handler.js";

// 获取 reCAPTCHA 配置
const recaptchaConfig = getRecaptchaConfig();

// 创建登录处理器
const loginHandler = new FMTCLoginHandler(
  page,
  log,
  executionId,
  recaptchaConfig,
);

// 执行登录
const result = await loginHandler.login(credentials);

// 检查余额 (仅在自动模式下可用)
if (recaptchaConfig.mode === "auto") {
  const balance = await loginHandler.getRecaptchaBalance();
  console.log(`2captcha 余额: $${balance}`);
}
```

## 费用说明

使用 2captcha.com 自动解决 reCAPTCHA 会产生费用：

- reCAPTCHA v2: 约 $0.001 (0.1 美分) 每次
- reCAPTCHA v3: 约 $0.002 (0.2 美分) 每次

## 错误处理

系统会自动重试失败的 reCAPTCHA 验证。可以通过以下环境变量配置：

- `FMTC_RECAPTCHA_RETRY_ATTEMPTS`: 重试次数
- `FMTC_RECAPTCHA_RETRY_DELAY`: 重试延迟

## 日志记录

所有 reCAPTCHA 处理活动都会记录到系统日志中，包括：

- 检测到的 reCAPTCHA 类型
- 处理方法 (手动/自动)
- 处理时间
- 费用 (如果适用)
- 错误信息

## 反检测配置

FMTC 爬虫内置了先进的反检测机制，无需额外配置即可自动启用：

### 自动启用的反检测功能

- **浏览器指纹伪装**: 自动修改 `navigator.webdriver`、`plugins`、`languages` 等属性
- **自动化特征隐藏**: 使用 `--disable-blink-features=AutomationControlled` 等关键参数
- **真实用户代理**: 自动使用最新的 Chrome 用户代理字符串
- **HTTP 头部优化**: 设置真实的 Accept、Accept-Language 等头部信息

### 浏览器启动参数

系统自动使用以下反检测参数：

```bash
--disable-blink-features=AutomationControlled
--disable-dev-shm-usage
--no-sandbox
--disable-setuid-sandbox
--disable-gpu
--disable-features=TranslateUI,BlinkGenPropertyTrees
```

## 会话持久化

### 自动会话管理

FMTC 爬虫支持自动会话持久化：

- **自动保存**: 登录成功后自动保存认证状态到 `fmtc-auth-state.json`
- **自动恢复**: 下次启动时自动检查并加载保存的登录状态
- **状态验证**: 自动验证保存的状态是否仍然有效

### 会话文件管理

```bash
# 保存位置
/root/TrendHub/fmtc-auth-state.json

# 清理保存的状态
npx tsx packages/scraper/src/sites/fmtc/standalone-login-test.ts clear
```

## 最新测试方法

### 推荐的测试流程

1. **独立登录测试**（推荐用于开发和调试）:

```bash
npx tsx packages/scraper/src/sites/fmtc/standalone-login-test.ts
```

2. **页面结构调试**（用于诊断页面变化）:

```bash
npx tsx packages/scraper/src/sites/fmtc/debug-login-test.ts
```

3. **清理认证状态**（重新开始测试）:

```bash
npx tsx packages/scraper/src/sites/fmtc/standalone-login-test.ts clear
```

### 测试输出说明

成功的测试输出应包含：

```
✅ 页面加载完成
✅ 表单填写完成
✅ reCAPTCHA 验证完成 (如果需要)
✅ 登录成功！
✅ 认证状态已保存
✅ 成功访问仪表盘，会话保持正常
🎉 成功访问商户列表，会话持久化成功
```

## 故障排除指南

### 常见问题及解决方案

#### 1. "Invalid Captcha" 错误

**原因**: reCAPTCHA 未正确完成或检测失败
**解决方案**:

- 确保在手动模式下完整完成 reCAPTCHA 验证
- 检查网络连接，确保能访问 Google reCAPTCHA 服务
- 尝试使用调试模式查看页面结构：

```bash
npx tsx packages/scraper/src/sites/fmtc/debug-login-test.ts
```

#### 2. 登录后立即跳转到登录页

**原因**: 网站检测到自动化行为
**解决方案**:

- 检查反检测配置是否正确
- 尝试增加请求延迟：`FMTC_REQUEST_DELAY=3000`
- 使用非无头模式进行测试：`FMTC_HEADLESS_MODE=false`

#### 3. 会话状态不保存

**原因**: 文件权限或路径问题
**解决方案**:

- 检查项目根目录写入权限
- 手动删除 `fmtc-auth-state.json` 并重新测试
- 确保从项目根目录运行测试脚本

#### 4. 2captcha 自动模式失败

**原因**: API 密钥或余额问题
**解决方案**:

- 验证 `FMTC_2CAPTCHA_API_KEY` 是否正确
- 检查 2captcha.com 账户余额
- 临时切换到手动模式进行测试

### 调试技巧

1. **启用详细日志**:

```bash
FMTC_DEBUG_MODE=true
```

2. **使用可视模式**:

```bash
FMTC_HEADLESS_MODE=false
```

3. **减少并发**:

```bash
FMTC_MAX_CONCURRENCY=1
```

## 性能优化建议

### 生产环境配置

```bash
# 生产环境推荐配置
FMTC_HEADLESS_MODE=true
FMTC_DEBUG_MODE=false
FMTC_RECAPTCHA_MODE=auto
FMTC_REQUEST_DELAY=2000
FMTC_MAX_CONCURRENCY=1
```

### 开发环境配置

```bash
# 开发环境推荐配置
FMTC_HEADLESS_MODE=false
FMTC_DEBUG_MODE=true
FMTC_RECAPTCHA_MODE=manual
FMTC_REQUEST_DELAY=3000
FMTC_MAX_CONCURRENCY=1
```

## 注意事项

1. **2captcha 费用**: 确保 2captcha.com 账户有足够的余额，每次验证约 $0.001
2. **处理时间**: 自动模式可能需要 20-120 秒来解决 reCAPTCHA
3. **会话有效期**: FMTC 会话通常在 30 分钟后过期，系统会自动检测并重新登录
4. **反检测效果**: 当前反检测配置经过实际测试验证，成功率较高
5. **环境要求**: 建议在测试环境中使用手动模式，在生产环境中使用自动模式
6. **网络要求**: 确保能够访问 Google reCAPTCHA 和 2captcha.com 服务
