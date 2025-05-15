# TrendHub Scraper

TrendHub 爬虫包包含了从各个电商网站抓取产品数据的功能模块。

## 支持的网站

目前支持的电商网站包括：

1. Mytheresa
2. Cettire (新增)
3. Farfetch
4. Italist
5. Yoox

## 安装

在 TrendHub 根目录运行以下命令来安装依赖：

```bash
pnpm install
```

## 构建

```bash
pnpm -r build
# 或者专门构建爬虫包
pnpm --filter="@repo/scraper" build
```

## 使用方法

### 在代码中使用

```typescript
import { scrapeCettire } from "@repo/scraper";

async function fetchProducts() {
  try {
    // 默认抓取 women 和 men 分类
    const products = await scrapeCettire();
    console.log(`抓取到 ${products.length} 个商品`);

    // 处理抓取到的商品数据...
  } catch (error) {
    console.error("抓取失败:", error);
  }
}

// 使用自定义选项和特定的起始 URL
async function fetchCustomProducts() {
  try {
    const options = {
      maxProducts: 50, // 每个性别分类最多抓取 50 个商品
      maxRequests: 100, // 最大请求数
      maxLoadClicks: 5, // 最多点击 "加载更多" 按钮 5 次
    };

    // 只抓取女装
    const products = await scrapeCettire(
      "https://www.cettire.com/collections/women",
      options,
    );
    console.log(`抓取到 ${products.length} 个商品`);
  } catch (error) {
    console.error("抓取失败:", error);
  }
}
```

### 测试爬虫

你可以使用测试脚本来测试 Cettire 爬虫：

```bash
# 从项目根目录运行
pnpm --filter="@repo/scraper" test:cettire

# 或者进入爬虫包目录后运行
cd packages/scraper
pnpm test:cettire
```

测试结果将保存在 `packages/scraper/test-results` 目录下。

## 参数说明

### scrapeCettire(startUrls, options, executionId)

抓取 Cettire 网站的商品数据。

**参数**：

- **startUrls** (可选): `string | string[]` - 起始 URL。默认为 `["https://www.cettire.com/collections/women", "https://www.cettire.com/collections/men"]`。
- **options** (可选): `ScraperOptions` - 爬虫配置选项。
  - **maxProducts**: 每个分类最多抓取的商品数量，默认为 50。
  - **maxRequests**: 最大 HTTP 请求数，默认为 90。
  - **maxLoadClicks**: 最多点击 "加载更多" 按钮的次数，默认为 10。
  - **storageDir**: 存储目录，用于保存爬虫运行状态和数据。
- **executionId** (可选): `string` - 执行 ID，用于日志记录和追踪。

**返回**：`Promise<Product[]>` - 抓取到的商品数据数组。

## 注意事项

1. 爬虫需要安装 Playwright 和 Chromium 浏览器。默认情况下，Playwright 会自动安装所需的浏览器。

2. 如果需要指定自定义的 Chrome 可执行文件路径，请设置环境变量 `CHROME_EXECUTABLE_PATH`。

3. 爬虫可能受到目标网站反爬虫措施的影响。如遇到问题，可尝试调整爬取速度和使用代理。

## 开发

添加对新网站的支持：

1. 在 `src/sites/` 目录下创建新文件，例如 `newsite.ts`
2. 按照现有站点爬虫的模式实现抓取逻辑
3. 在 `src/main.ts` 中导出新的爬虫函数
4. 创建测试脚本进行测试

## 许可证

TrendHub 项目的一部分。
