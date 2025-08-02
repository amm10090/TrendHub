# 在 Admin 应用中运行 Mytheresa 爬虫指南

## 概述

Mytheresa 爬虫使用非无头模式（headless: false）来避开反爬虫检测。在无图形界面的服务器环境中，需要使用虚拟显示器（Xvfb）支持。

## 爬虫执行方式

Admin 应用中有两种执行爬虫的方式：

### 1. 通过任务系统执行（推荐）

任务系统通过 `TaskExecutor` 类执行爬虫，支持定时任务和手动触发。

#### 配置步骤：

1. **启动 Xvfb**：

   ```bash
   # 在服务器上确保 Xvfb 运行
   ./scripts/ensure-xvfb.sh
   ```

2. **启动 Admin 应用**：

   ```bash
   # 使用包含 DISPLAY 环境变量的 PM2 配置
   pm2 start ecosystem.xvfb.simple.json --env production

   # 或在 admin 目录下
   cd apps/admin
   pm2 start ecosystem.config.json --env production
   ```

3. **创建爬虫任务**：
   - 在 Admin 界面中创建 Mytheresa 爬虫任务
   - 任务会自动使用配置的虚拟显示器

### 2. 通过 API 路由执行

直接调用 `/api/scraping/[site]` 路由执行爬虫。

#### 请求示例：

```bash
curl -X POST http://localhost:3001/api/scraping/Mytheresa \
  -H "Content-Type: application/json" \
  -d '{
    "startUrl": "https://www.mytheresa.com/us/en/women/new-arrivals/current-week",
    "maxProducts": 50,
    "maxRequests": 90,
    "defaultInventory": 99
  }'
```

## 环境配置

### 必需的环境变量

```bash
# 虚拟显示器
DISPLAY=:99

# 强制无头模式（仅在需要时使用）
FORCE_HEADLESS=true  # 默认为 false
```

### PM2 配置

确保 PM2 配置包含 DISPLAY 环境变量：

```json
{
  "env": {
    "NODE_ENV": "production",
    "DISPLAY": ":99"
  }
}
```

## 故障排除

### 1. 爬虫被阻止

如果爬虫仍然被检测到：

- 确认使用的是非无头模式（检查日志中的 "使用有头模式运行"）
- 确认 DISPLAY 环境变量已设置
- 检查 Xvfb 是否正在运行：`ps aux | grep Xvfb`

### 2. Xvfb 启动失败

```bash
# 检查 Xvfb 进程
ps aux | grep Xvfb

# 清理锁文件
rm -f /tmp/.X99-lock

# 重新启动
./scripts/ensure-xvfb.sh
```

### 3. 内存不足

有头模式消耗更多资源，建议：

- 增加服务器内存
- 减少并发爬虫数量
- 调整 PM2 的 `max_memory_restart` 配置

## 性能优化

1. **批量处理**：使用任务系统的批量功能，避免同时运行多个爬虫实例
2. **定时执行**：在服务器负载较低的时段执行爬虫任务
3. **监控资源**：定期检查服务器资源使用情况

## 日志查看

```bash
# 查看 PM2 日志
pm2 logs trend-hub-admin

# 查看爬虫任务日志
tail -f apps/admin/storage/scraper_storage_runs/Mytheresa/*/debug.log

# 查看任务执行日志（在数据库中）
# 通过 Admin 界面的 Scraper Management 页面查看
```

## 最佳实践

1. **使用任务系统**：优先使用任务系统而不是直接调用 API
2. **监控执行状态**：定期检查任务执行状态和错误日志
3. **合理设置参数**：
   - `maxProducts`: 根据需要设置，建议不超过 100
   - `maxRequests`: 控制请求数量，避免过度爬取
4. **定期维护**：
   - 清理旧的爬虫日志和存储文件
   - 更新爬虫代码以应对网站变化
