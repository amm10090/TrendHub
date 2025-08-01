# 在服务器端运行有头浏览器指南

## 概述

某些网站（如 Mytheresa）具有高级的反爬虫检测机制，使用无头浏览器（headless）模式可能会被识别并阻止。为了绕过这些检测，我们需要在服务器环境中运行有头（non-headless）浏览器。

## 问题说明

在没有图形界面的服务器环境中运行有头浏览器时，会遇到以下错误：

```
Missing X server or $DISPLAY
```

这是因为服务器缺少 X Window System（图形显示服务器）。

## 解决方案

我们使用 Xvfb（X Virtual Framebuffer）来创建虚拟显示器，让有头浏览器能在服务器环境中运行。

### 1. 环境准备

确保系统已安装必要的依赖（已在 Dockerfile 中配置）：

- xvfb
- chromium 及相关依赖
- dbus

### 2. 使用 xvfb 启动脚本

我们创建了 `scripts/start-with-display.sh` 脚本，它会：

- 自动检测 DISPLAY 环境变量
- 如果没有 DISPLAY，使用 xvfb-run 创建虚拟显示器
- 如果有 DISPLAY，正常启动应用

### 3. 启动方式

#### 本地开发环境

```bash
# 普通启动（适用于有图形界面的环境）
pnpm start

# 使用 xvfb（模拟服务器环境）
pnpm start:xvfb
```

#### 服务器/Docker 环境

Docker 容器会自动使用 xvfb 启动脚本：

```dockerfile
CMD ["/app/scripts/start-with-display.sh", "dbus-run-session", "--", "pnpm", "start"]
```

#### 手动使用 xvfb-run

```bash
# 直接使用 xvfb-run
xvfb-run -a -s "-screen 0 1920x1080x24" pnpm start

# 带自定义显示编号
xvfb-run --server-num=99 -s "-screen 0 1920x1080x24" pnpm start
```

### 4. 环境变量

如果已有虚拟显示器运行，可以设置 DISPLAY 环境变量：

```bash
export DISPLAY=:99
pnpm start
```

### 5. PM2 配置

在 PM2 中使用 xvfb：

```json
{
  "name": "trend-hub-admin",
  "script": "./scripts/start-with-display.sh",
  "args": "pnpm start:production",
  "env": {
    "NODE_ENV": "production"
  }
}
```

## 抓取器配置

### Mytheresa 抓取器

Mytheresa 抓取器默认使用有头模式（`headless: false`）以避免反爬检测。在服务器环境中运行时：

1. 抓取器会自动检测环境
2. 如果检测到服务器环境且没有 DISPLAY，会提示使用 xvfb
3. 配置位于 `packages/scraper/src/sites/mytheresa/simple-scraper.ts`

```javascript
// 环境检测
const isServerEnvironment =
  !process.env.DISPLAY && process.platform === "linux";

if (isServerEnvironment) {
  console.log("⚠️  检测到服务器环境，需要虚拟显示器支持");
  console.log("   请使用 xvfb-run 启动应用，或设置 DISPLAY 环境变量");
}
```

### 其他抓取器

FMTC 等其他抓取器默认使用无头模式（`headless: true`），不需要特殊配置。

## 故障排除

### 1. xvfb-run 未找到

```bash
# Ubuntu/Debian
sudo apt-get install xvfb

# Alpine Linux (Docker)
apk add --no-cache xvfb
```

### 2. 显示器冲突

如果遇到 "Server is already active for display" 错误：

```bash
# 查找并结束已有的 Xvfb 进程
ps aux | grep Xvfb
kill -9 <PID>

# 或使用不同的显示编号
xvfb-run --server-num=100 pnpm start
```

### 3. 权限问题

确保脚本有执行权限：

```bash
chmod +x scripts/start-with-display.sh
```

### 4. Docker 内存限制

有头浏览器需要更多内存，建议增加 Docker 容器内存限制：

```bash
docker run -m 2g ...
```

## 性能考虑

1. **资源消耗**：有头模式比无头模式消耗更多 CPU 和内存
2. **并发限制**：建议降低并发数以避免资源耗尽
3. **监控**：定期监控服务器资源使用情况

## 最佳实践

1. 只对需要的网站使用有头模式（如 Mytheresa）
2. 其他网站继续使用无头模式以节省资源
3. 在生产环境使用进程管理器（如 PM2）管理应用
4. 定期更新浏览器和相关依赖以维持兼容性
