# FMTC 爬虫测试套件

统一整合的 FMTC 爬虫测试套件，提供完整的端到端测试功能。

## 📁 测试文件结构

### 🎯 核心测试

- **`fmtc-complete-test.ts`** - ⭐ **主要测试** 完整集成测试（登录+导航+搜索+抓取+导出）
- **`run-tests.ts`** - 🚀 **测试运行器** 统一的测试入口

### 🔧 单元测试

- **`test-results-parser.ts`** - 结果解析器单元测试
- **`test-types.ts`** - TypeScript 类型定义

### 🛠️ 诊断工具

- **`test-network-connectivity.ts`** - 网络连接诊断
- **`debug-category-options.ts`** - 分类选项调试

## 🚀 快速开始

### 环境配置

在项目根目录的 `.env` 文件中配置：

```bash
# 基础配置
FMTC_USERNAME=your-email@example.com
FMTC_PASSWORD=your-password
FMTC_HEADLESS_MODE=false  # 开发时建议 false
FMTC_MAX_PAGES=3          # 测试时限制页数

# reCAPTCHA 配置 (重要!)
FMTC_RECAPTCHA_MODE=auto  # auto | manual | skip
FMTC_2CAPTCHA_API_KEY=your-api-key  # auto 模式必需

# 搜索配置
FMTC_SEARCH_CATEGORY=2    # 分类 ID (如：2 = Clothing & Apparel)
FMTC_SEARCH_DISPLAY_TYPE=all

# 调试配置
FMTC_DEBUG_MODE=false
FMTC_REQUEST_DELAY=2000
```

### 推荐使用方式

#### 1. 🧪 运行单元测试

```bash
cd /root/TrendHub/packages/scraper/src/test/fmtc
npx tsx run-tests.ts --unit
```

#### 2. 🚀 运行完整集成测试

```bash
# 基本运行（自动使用保存的会话）
npx tsx run-tests.ts --complete

# 清理会话状态后运行
npx tsx run-tests.ts --complete --clear-session

# 强制重新登录（忽略保存的会话）
npx tsx run-tests.ts --complete --force-login
```

#### 3. 🔄 运行所有测试

```bash
npx tsx run-tests.ts --all
```

#### 4. ❓ 查看帮助

```bash
npx tsx run-tests.ts --help
```

### 直接运行完整测试

```bash
# 基本运行（自动使用保存的会话）
npx tsx fmtc-complete-test.ts

# 清理会话状态后运行
npx tsx fmtc-complete-test.ts --clear-session

# 强制重新登录
npx tsx fmtc-complete-test.ts --force-login

# 仅清理会话状态（不运行测试）
npx tsx fmtc-complete-test.ts --clear-session-only

# 查看帮助
npx tsx fmtc-complete-test.ts --help
```

## 📊 完整集成测试功能

`fmtc-complete-test.ts` 包含以下完整流程：

### 🔍 阶段1: 环境准备

- ✅ 环境变量自动加载
- ✅ 配置验证（账户、reCAPTCHA、搜索参数）
- ✅ 网络连接检查（Google + FMTC主站）

### 🔐 阶段2: 用户登录

- ✅ 自动 reCAPTCHA 处理（支持 2captcha.com）
- ✅ 登录重试机制
- ✅ 登录状态验证

### 🧭 阶段3: 页面导航

- ✅ 导航到Directory页面
- ✅ 页面状态验证

### 🔍 阶段4: 执行搜索

- ✅ 搜索参数配置
- ✅ 搜索表单提交
- ✅ 结果验证

### 📊 阶段5: 分页数据抓取

- ✅ 多页商家数据抓取
- ✅ 分页导航
- ✅ 数据解析和聚合

### 📤 阶段6: 数据导出

- ✅ JSON 格式导出
- ✅ CSV 格式导出
- ✅ 文件自动保存

### 📋 阶段7: 报告生成

- ✅ 详细测试报告
- ✅ 性能统计
- ✅ 错误记录

## 💾 会话管理功能

### 🎯 功能概述

新的会话管理功能可以显著提高开发效率，避免重复登录和reCAPTCHA费用：

- ✅ **自动保存会话状态** - 登录成功后自动保存浏览器会话
- ✅ **智能会话恢复** - 下次运行时自动检查并恢复有效会话
- ✅ **会话验证** - 验证恢复的会话是否仍然有效
- ✅ **自动清理** - 自动清理过期或无效的会话状态
- ✅ **灵活控制** - 支持强制重新登录和手动清理

### 🔧 工作原理

1. **首次运行**：执行完整登录流程，成功后保存会话状态到 `fmtc-session.json`
2. **后续运行**：检查保存的会话状态，如果有效则跳过登录步骤
3. **会话验证**：访问受保护页面验证会话是否仍然有效
4. **自动清理**：如果会话过期或无效，自动清理并重新登录

### 📁 会话文件

- **文件位置**：项目根目录 `/root/TrendHub/fmtc-session.json`
- **包含内容**：浏览器cookies、localStorage、用户名、时间戳
- **有效期**：4小时（可配置）
- **安全性**：仅包含会话数据，不包含敏感信息如密码

### ⚡ 性能优势

| 场景          | 传统方式  | 会话管理   | 节省时间 |
| ------------- | --------- | ---------- | -------- |
| 首次登录      | ~60秒     | ~60秒      | 0秒      |
| 重复测试      | ~60秒     | ~5秒       | ~55秒    |
| reCAPTCHA费用 | $0.001/次 | 首次后免费 | 节省费用 |

### 🎮 使用示例

```bash
# 场景1: 首次运行或会话过期
npx tsx fmtc-complete-test.ts
# → 执行完整登录 → 保存会话状态 → 继续测试

# 场景2: 会话有效时再次运行
npx tsx fmtc-complete-test.ts
# → 加载会话状态 → 验证有效 → 跳过登录 → 直接测试

# 场景3: 强制重新登录
npx tsx fmtc-complete-test.ts --force-login
# → 忽略保存的会话 → 执行完整登录 → 保存新会话

# 场景4: 清理会话后运行
npx tsx fmtc-complete-test.ts --clear-session
# → 删除旧会话 → 执行完整登录 → 保存新会话

# 场景5: 仅清理会话（不运行测试）
npx tsx fmtc-complete-test.ts --clear-session-only
# → 删除会话文件 → 退出
```

### 🔍 会话状态检查

测试运行时会显示详细的会话状态信息：

```
📂 未找到保存的会话状态
# 或
💾 找到有效的会话状态 (23分钟前保存)
🔍 验证保存的会话状态...
✅ 会话状态有效，跳过登录步骤
```

### ⚠️ 故障排除

#### 会话恢复失败

```bash
# 清理会话状态重新开始
npx tsx fmtc-complete-test.ts --clear-session
```

#### 强制重新登录

```bash
# 忽略保存的会话，重新登录
npx tsx fmtc-complete-test.ts --force-login
```

#### 手动清理会话

```bash
# 仅清理会话文件
npx tsx fmtc-complete-test.ts --clear-session-only
# 或直接删除文件
rm /root/TrendHub/fmtc-session.json
```

### ⚙️ 配置选项

会话管理配置位于代码中的 `SESSION_CONFIG`：

```typescript
const SESSION_CONFIG = {
  sessionFile: "fmtc-session.json", // 会话文件名
  maxAge: 4 * 60 * 60 * 1000, // 4小时有效期
  autoSave: true, // 自动保存开关
};
```

## 🛠️ 诊断工具

如果遇到问题，可使用诊断工具：

```bash
# 网络连接诊断
npx tsx test-network-connectivity.ts

# 分类选项调试
npx tsx debug-category-options.ts
```

## 📈 测试输出示例

### 成功的完整测试输出

```
🧪 开始 FMTC 完整集成测试
================================================================================
开始时间: 2025-01-13T10:30:00.000Z
================================================================================

📋 阶段1: 环境准备
--------------------------------------------------
✅ 环境变量加载成功
🌐 检查网络连接...
✅ 基本网络连接正常
✅ FMTC 主站访问正常
🔍 验证配置...
✅ 所有配置验证通过
  - reCAPTCHA模式: auto
  - 最大页数: 3
  - 搜索分类: 2

🔐 阶段2: 用户登录
--------------------------------------------------
✅ reCAPTCHA模式: auto
🌐 导航到登录页面...
✅ 登录页面加载成功
✅ reCAPTCHA 自动处理成功 (耗时: 45.2秒)
✅ 登录成功 (耗时: 52.8秒)

🧭 阶段3: 页面导航
--------------------------------------------------
✅ 成功导航到Directory页面 (耗时: 3.1秒)

🔍 阶段4: 执行搜索
--------------------------------------------------
✅ 搜索成功，找到 57 个结果 (耗时: 2.5秒)

📊 阶段5: 分页数据抓取
--------------------------------------------------
📄 处理第 1 页
✅ 第1页解析成功: 10 个商家
📄 处理第 2 页
✅ 第2页解析成功: 10 个商家
📄 处理第 3 页
✅ 第3页解析成功: 10 个商家

📤 阶段6: 数据导出
--------------------------------------------------
✅ 数据已保存到文件: fmtc-complete-test-2025-01-13T10-35-00-000Z.*

📋 测试完成 - 生成报告
================================================================================
{
  "🧪 FMTC 完整集成测试报告": "============================================================",
  "⏱️ 测试时间": {
    "总耗时": "325.60秒",
    "登录耗时": "52.80秒",
    "抓取耗时": "245.30秒"
  },
  "📊 抓取统计": {
    "总页数": 3,
    "总商家数": 30,
    "涉及国家": "US, UK, CA",
    "涉及网络": "Awin, Commission Junction, ShareASale"
  },
  "🤖 reCAPTCHA信息": {
    "处理方式": "auto",
    "费用": "$0.0010"
  },
  "🎯 测试结果": "✅ 全部通过"
}
```

## 🔧 reCAPTCHA 配置详解

### Auto 模式 (推荐生产环境)

```bash
FMTC_RECAPTCHA_MODE=auto
FMTC_2CAPTCHA_API_KEY=your-api-key-here
FMTC_RECAPTCHA_AUTO_TIMEOUT=180000    # 3分钟超时
FMTC_RECAPTCHA_RETRY_ATTEMPTS=3       # 重试3次
```

- ✅ 完全自动化，无需人工干预
- ✅ 支持重试机制
- ⚠️ 需要 2captcha.com API 密钥
- 💰 每次约 $0.001 费用

### Manual 模式 (开发调试用)

```bash
FMTC_RECAPTCHA_MODE=manual
FMTC_RECAPTCHA_MANUAL_TIMEOUT=120000  # 2分钟超时
```

- ✅ 免费使用
- ⚠️ 需要手动完成验证码
- 🐌 测试速度较慢

## 💾 输出文件

测试完成后会生成以下文件：

- `fmtc-complete-test-{timestamp}.json` - 商家数据 (JSON格式)
- `fmtc-complete-test-{timestamp}.csv` - 商家数据 (CSV格式)
- `fmtc-test-report-{timestamp}.json` - 详细测试报告

## ⚠️ 常见问题

### 1. "环境变量加载失败"

- **解决**：确保项目根目录有 `.env` 文件

### 2. "reCAPTCHA 验证失败"

- **Auto 模式**：检查 API 密钥是否正确
- **Manual 模式**：确保在超时前完成验证

### 3. "网络连接检查失败"

- **解决**：检查网络连接，确认可访问 Google 和 FMTC

### 4. "登录失败"

- **解决**：检查用户名密码是否正确

### 5. "搜索失败"

- **解决**：检查搜索参数配置

## 🚀 生产环境推荐配置

```bash
# 生产环境优化配置
FMTC_HEADLESS_MODE=true
FMTC_DEBUG_MODE=false
FMTC_RECAPTCHA_MODE=auto
FMTC_REQUEST_DELAY=2000
FMTC_MAX_CONCURRENCY=1
FMTC_MAX_PAGES=50
```

## 📞 技术支持

遇到问题时的诊断步骤：

1. 🔍 运行网络连接测试
2. 🔧 检查环境变量配置
3. 🧪 先运行单元测试
4. 🚀 再运行完整集成测试
5. 📋 查看详细的测试报告

---

💡 **提示**：新的统一测试提供了完整的端到端功能，建议使用 `run-tests.ts --complete` 进行完整测试。
