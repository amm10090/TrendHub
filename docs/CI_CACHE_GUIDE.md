# TrendHub CI 缓存优化指南

## 🚀 **Turborepo 远程缓存配置**

根据 [Turborepo 缓存文档](https://turborepo.com/docs/crafting-your-repository/caching)，我们已经配置了多层缓存策略来加速 CI 构建。

### 📋 **缓存策略概览**

1. **Turborepo 远程缓存** - 缓存构建产物和任务输出
2. **Docker 构建缓存** - 缓存 Docker 层
3. **Node.js 依赖缓存** - 缓存 pnpm 依赖

### 🔧 **配置步骤**

#### 1. 设置 GitHub Secrets

在你的 GitHub 仓库中添加以下 Secrets：

```bash
# Turborepo 远程缓存 (使用 Vercel)
TURBO_TOKEN=your_vercel_token
TURBO_TEAM=your_team_name

# Docker Hub 配置
DOCKERHUB_USERNAME=your_dockerhub_username
DOCKERHUB_TOKEN=your_dockerhub_token
```

#### 2. 获取 Turborepo 缓存令牌

```bash
# 在本地项目中运行
npx turbo login
npx turbo link
```

这将生成 `TURBO_TOKEN` 和 `TURBO_TEAM`。

### 📊 **缓存效果**

#### 首次构建 (Cache Miss)

```
Tasks:    12 successful, 12 total
Cached:   0 cached, 12 total
Time:     45.2s
```

#### 缓存命中 (Cache Hit)

```
Tasks:    12 successful, 12 total
Cached:   12 cached, 12 total
Time:     80ms >>> FULL TURBO
```

### 🎯 **优化配置详解**

#### Turborepo 配置 (`turbo.json`)

```json
{
  "globalEnv": ["TURBO_REMOTE_CACHE_SIGNATURE_KEY", "NODE_ENV", "CI"],
  "tasks": {
    "build": {
      "outputs": [".next/**", "!.next/cache/**", "dist/**"],
      "outputLogs": "new-only"
    }
  },
  "remoteCache": {
    "signature": true,
    "enabled": true
  }
}
```

#### GitHub Actions 配置

```yaml
- name: 构建项目 (使用 Turborepo 缓存)
  run: pnpm turbo build --cache-dir=.turbo/cache
  env:
    TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
    TURBO_TEAM: ${{ secrets.TURBO_TEAM }}

- name: 构建 Docker 镜像
  uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### 🔍 **缓存调试**

#### 查看缓存状态

```bash
# 本地调试
pnpm turbo build --dry-run
pnpm turbo build --summarize
```

#### CI 日志分析

在 GitHub Actions 日志中查找：

- `>>> FULL TURBO` - 完全缓存命中
- `CACHE HIT` - 部分缓存命中
- `CACHE MISS` - 缓存未命中

### ⚡ **性能优化建议**

#### 1. 任务并行化

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputLogs": "new-only"
    },
    "lint": {
      "outputLogs": "errors-only"
    }
  }
}
```

#### 2. 输出日志优化

- `"new-only"` - 只显示新的日志
- `"errors-only"` - 只显示错误日志
- `"full"` - 显示完整日志

#### 3. 缓存策略

- **构建任务**: 缓存构建产物
- **测试任务**: 缓存测试结果和覆盖率报告
- **Lint 任务**: 不缓存输出，但缓存执行状态

### 📈 **预期性能提升**

| 场景       | 构建时间 | 缓存命中率 | 时间节省 |
| ---------- | -------- | ---------- | -------- |
| 首次构建   | 45s      | 0%         | -        |
| 代码未变更 | 80ms     | 100%       | 99.8%    |
| 部分变更   | 15s      | 70%        | 67%      |
| 依赖更新   | 35s      | 30%        | 22%      |

### 🛠 **故障排除**

#### 缓存未命中原因

1. **环境变量变更** - 检查 `globalEnv` 配置
2. **依赖更新** - `pnpm-lock.yaml` 变更会导致缓存失效
3. **配置文件变更** - `turbo.json`, `package.json` 变更
4. **源代码变更** - 任何源文件变更都会影响相关任务

#### 调试命令

```bash
# 查看任务依赖图
pnpm turbo build --graph

# 强制重新构建
pnpm turbo build --force

# 禁用缓存
pnpm turbo build --no-cache
```

### 🔗 **相关链接**

- [Turborepo 缓存文档](https://turborepo.com/docs/crafting-your-repository/caching)
- [远程缓存配置](https://turborepo.com/docs/core-concepts/remote-caching)
- [GitHub Actions 缓存](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
