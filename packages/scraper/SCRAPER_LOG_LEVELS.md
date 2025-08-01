# 爬虫日志级别控制

## 概述

我们的爬虫系统现在支持多种日志级别，可以通过环境变量控制日志的详细程度，以便在生产环境中减少日志输出，提高性能。

## 日志级别

### 级别定义

1. **SILENT (0)** - 静默模式，无日志输出
2. **MINIMAL (1)** - 最小模式，只输出关键进度信息
3. **NORMAL (2)** - 正常模式，输出一般信息（默认）
4. **VERBOSE (3)** - 详细模式，输出所有调试信息

### 默认行为

- **生产环境 (NODE_ENV=production)**: 默认使用 `MINIMAL` 级别
- **开发环境**: 默认使用 `NORMAL` 级别

## 配置方法

### 方法 1: 环境变量

```bash
# 设置为静默模式
export SCRAPER_LOG_LEVEL=SILENT

# 设置为最小模式（推荐生产环境）
export SCRAPER_LOG_LEVEL=MINIMAL

# 设置为正常模式（推荐开发环境）
export SCRAPER_LOG_LEVEL=NORMAL

# 设置为详细模式（调试时使用）
export SCRAPER_LOG_LEVEL=VERBOSE
```

### 方法 2: 在运行时设置

```bash
# 运行爬虫时临时设置日志级别
SCRAPER_LOG_LEVEL=MINIMAL npm run scraper

# 或者在 Docker 容器中
docker run -e SCRAPER_LOG_LEVEL=MINIMAL your-scraper-image
```

## 各级别输出内容

### SILENT (静默)

- 无任何日志输出
- 适用于: 批量生产任务

### MINIMAL (最小)

- 只显示关键进度信息
- 输出内容:
  - 抓取器启动/完成
  - URL处理开始/完成
  - 商品总数统计
  - 错误信息
- 适用于: 生产环境

### NORMAL (正常)

- 显示一般操作信息
- 输出内容:
  - MINIMAL 级别的所有内容
  - 页面导航信息
  - 商品提取进度
  - 详情页处理状态
- 适用于: 开发环境

### VERBOSE (详细)

- 显示所有调试信息
- 输出内容:
  - NORMAL 级别的所有内容
  - 元素选择器尝试过程
  - 鼠标操作详情
  - 页面加载等待过程
  - 每个商品的详细信息
- 适用于: 问题调试

## 使用示例

### 生产环境 Docker 部署

```dockerfile
# Dockerfile
ENV SCRAPER_LOG_LEVEL=MINIMAL
ENV NODE_ENV=production
```

### 开发环境调试

```bash
# 查看详细调试信息
SCRAPER_LOG_LEVEL=VERBOSE npm run dev

# 模拟生产环境日志级别
SCRAPER_LOG_LEVEL=MINIMAL npm run dev
```

### PM2 配置

```json
{
  "name": "scraper",
  "script": "dist/main.js",
  "env": {
    "NODE_ENV": "production",
    "SCRAPER_LOG_LEVEL": "MINIMAL"
  }
}
```

## 性能对比

基于 Mytheresa 抓取 20 个商品的测试:

- **VERBOSE**: ~2000 条日志消息
- **NORMAL**: ~500 条日志消息
- **MINIMAL**: ~50 条日志消息
- **SILENT**: 0 条日志消息

生产环境建议使用 `MINIMAL` 级别，可以减少约 90% 的日志输出，显著提高性能。

## 注意事项

1. 错误日志 (ERROR) 在所有级别下都会输出
2. 后台任务建议使用 `MINIMAL` 或 `SILENT` 级别
3. 调试问题时可以临时切换到 `VERBOSE` 级别
4. 日志级别不会影响发送到后端的结构化日志
