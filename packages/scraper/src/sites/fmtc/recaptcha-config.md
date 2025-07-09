# FMTC reCAPTCHA 配置指南

## 环境变量配置

### 基本配置

```bash
# reCAPTCHA 处理模式
FMTC_RECAPTCHA_MODE=manual    # manual(手动) | auto(自动) | skip(跳过)

# 手动模式超时时间(毫秒)
FMTC_RECAPTCHA_MANUAL_TIMEOUT=60000

# 自动模式超时时间(毫秒)
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

## 注意事项

1. 确保 2captcha.com 账户有足够的余额
2. 自动模式可能需要 20-120 秒来解决 reCAPTCHA
3. 频繁的 reCAPTCHA 验证可能表明账户存在问题
4. 建议在测试环境中使用手动模式，在生产环境中使用自动模式
