# FMTC 爬虫超时优化指南

## 🚀 已完成的优化

### 1. 浏览器启动优化

```javascript
// 添加了更多浏览器参数提高稳定性
args: [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-web-security",
  "--disable-features=VizDisplayCompositor",
  "--disable-blink-features=AutomationControlled",
];
```

### 2. 超时时间优化

- **页面默认超时**: 从30秒增加到60秒
- **导航超时**: 从30秒增加到90秒
- **页面加载**: 使用`domcontentloaded`而不是`networkidle`

### 3. 重试机制

- **登录页面加载**: 最多重试3次
- **递增等待**: 失败后等待5秒再重试
- **智能检测**: 通过页面标题验证加载成功

### 4. 网络连接诊断

新增专门的网络连接测试工具，可以诊断：

- 基本网络连接
- FMTC主站访问
- 账户系统访问
- 登录表单检测

## 🧪 测试命令

### 基础测试（无需网络）

```bash
npm run test:fmtc
```

### 网络连接诊断

```bash
npm run test:fmtc:network
```

### 分页抓取测试

```bash
npm run test:fmtc:pagination
```

### 完整测试套件

```bash
npm run test:fmtc -- --full
```

## 🔧 故障排除步骤

### 如果仍然遇到超时问题：

1. **首先运行网络诊断**

   ```bash
   npm run test:fmtc:network
   ```

2. **检查网络环境**

   - 确保可以访问 https://www.fmtc.co
   - 确保可以访问 https://account.fmtc.co
   - 检查防火墙设置
   - 考虑使用VPN

3. **调整超时时间**
   如果网络较慢，可以在测试文件中进一步增加超时：

   ```javascript
   page.setDefaultTimeout(180000); // 3分钟
   page.setDefaultNavigationTimeout(180000);
   ```

4. **使用headless模式**
   修改测试文件，设置 `headless: true` 可能会更快：
   ```javascript
   const browser = await chromium.launch({
     headless: true, // 改为true
     // ...其他配置
   });
   ```

## 📊 测试输出示例

### 成功的网络诊断：

```
🌐 开始测试 FMTC 网络连接
1️⃣ 测试访问 Google (connectivity check)
✅ 基本网络连接正常
2️⃣ 测试 FMTC 主站访问
✅ FMTC 主站访问成功: FMTC - First Promotions
3️⃣ 测试 FMTC 账户系统访问
第 1 次尝试访问账户系统...
✅ FMTC 账户系统访问成功，找到登录表单
```

### 成功的分页抓取：

```
📄 处理第 1 页
分页信息: 第1页，共6页，总计57条记录
✅ 第1页解析成功: 10 个商家
🏪 第1页商家列表:
  1-1. iHome Dental (US) | US | Awin | 2025/07/11
  1-2. Fashion Store (UK) | UK | Commission Junction | 2025/07/10
📈 累计抓取: 10 个商家
➡️ 准备跳转到第 2 页
✅ 成功跳转到第 2 页
```

## 🎯 推荐测试流程

1. **先运行网络诊断** - 确保基本连接正常
2. **再运行基础测试** - 验证解析器功能
3. **最后运行分页测试** - 测试完整抓取流程

## ⚙️ 配置建议

### 网络环境较差的情况：

- 增加超时时间到3-5分钟
- 减少并发数量
- 增加重试次数
- 使用headless模式

### 生产环境建议：

- 设置合理的超时时间（60-120秒）
- 启用完整的重试机制
- 记录详细的错误日志
- 监控网络连接状态

现在您可以先运行网络诊断测试，确保基本连接正常后再运行完整的抓取测试！
