# Discount Management 模块开发文档

## 目录

- [模块概述](#模块概述)
- [架构设计](#架构设计)
- [数据库设计](#数据库设计)
- [API接口](#api接口)
- [前端组件](#前端组件)
- [服务层](#服务层)
- [核心功能](#核心功能)
- [配置和部署](#配置和部署)
- [扩展开发](#扩展开发)

## 模块概述

Discount Management 是 TrendHub 管理后台的核心模块之一，用于管理电商平台的折扣和优惠券信息。该模块支持从 FMTC (FirstPromotions/MediaTransition Commerce) 等外部数据源导入折扣信息，并提供智能品牌匹配、自动化过期处理、统计分析等功能。

### 主要特性

- **批量导入**: 支持 FMTC 格式的折扣数据导入
- **智能品牌匹配**: 基于算法的商家名称到品牌的自动匹配
- **过期管理**: 自动检测和处理过期折扣
- **统计分析**: 丰富的折扣数据统计和趋势分析
- **调度系统**: 自动化的后台任务调度
- **多语言支持**: 中英文界面

## 架构设计

### 技术栈

- **后端**: Next.js 15+ API Routes, Prisma ORM
- **前端**: React 18+, TypeScript, TailwindCSS, HeroUI
- **数据库**: PostgreSQL
- **国际化**: next-intl
- **状态管理**: React Hooks + Context

### 目录结构

```
apps/admin/src/
├── app/api/discounts/                # API路由层
│   ├── route.ts                      # 主CRUD操作
│   ├── [id]/route.ts                 # 单个折扣操作
│   ├── import/route.ts               # 导入功能
│   ├── brand-matching/               # 品牌匹配
│   │   ├── route.ts                  # 主匹配API
│   │   ├── batch/route.ts            # 批量匹配
│   │   ├── mappings/route.ts         # 映射管理
│   │   └── unmatched/route.ts        # 未匹配商家
│   ├── stats/route.ts                # 统计数据
│   ├── scheduler/route.ts            # 调度器控制
│   ├── settings/route.ts             # 系统设置
│   ├── notifications/route.ts        # 通知系统
│   └── expiry/route.ts               # 过期处理
├── components/discounts/             # 前端组件
│   ├── DiscountDataTable.tsx         # 数据表格
│   ├── DiscountStats.tsx             # 统计仪表板
│   ├── BrandMatchingPanel.tsx        # 品牌匹配面板
│   ├── DiscountImportModal.tsx       # 导入模态框
│   ├── DiscountImportForm.tsx        # 导入表单
│   ├── DiscountFilters.tsx           # 筛选器
│   ├── DiscountEditModal.tsx         # 编辑模态框
│   ├── DiscountDetailModal.tsx       # 详情模态框
│   ├── DiscountSettingsModal.tsx     # 设置模态框
│   ├── NotificationPanel.tsx         # 通知面板
│   └── SchedulerStatusCard.tsx       # 调度器状态卡片
└── lib/services/                     # 服务层
    ├── brand-matching.service.ts     # 品牌匹配服务
    ├── discount-scheduler.service.ts # 调度服务
    ├── discount-expiration.service.ts# 过期处理服务
    ├── fmtc-parser.service.ts        # FMTC解析器
    └── discount-notification.service.ts# 通知服务
```

## 数据库设计

### 核心模型

#### Discount 模型

```prisma
model Discount {
  id          String       @id @default(cuid())
  merchantName String      // FMTC商家名称
  title       String       // 折扣标题
  code        String?      // 折扣码
  type        DiscountType @default(OTHER)
  value       Decimal?     // 折扣值
  minAmount   Decimal?     // 最小订单金额
  maxAmount   Decimal?     // 最大折扣金额

  // FMTC特有字段
  fmtcUpdated DateTime?    // FMTC更新时间
  startDate   DateTime?    // 开始时间
  endDate     DateTime?    // 结束时间
  rating      Decimal?     // FMTC评分
  dealStatus  String?      // 折扣状态

  // 系统管理字段
  isActive    Boolean      @default(true)
  isExpired   Boolean      @default(false)
  source      String       @default("FMTC")
  brandId     String?      // 关联品牌ID
  brand       Brand?       @relation(fields: [brandId], references: [id])
  useCount    Int          @default(0)

  // 元数据
  rawData     Json?        // 原始导入数据
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([merchantName])
  @@index([brandId])
  @@index([isActive, isExpired])
  @@index([endDate])
}
```

#### DiscountImport 模型

```prisma
model DiscountImport {
  id           String       @id @default(cuid())
  fileName     String?      // 导入文件名
  rawContent   String       @db.Text
  parsedData   Json         // 解析后数据
  status       ImportStatus @default(PENDING)
  totalRecords Int          @default(0)
  successCount Int          @default(0)
  errorCount   Int          @default(0)
  skippedCount Int          @default(0)
  errors       Json?        // 错误详情
  importType   ImportType   @default(PASTE)
  userId       String?
  user         User?        @relation(fields: [userId], references: [id])
  createdAt    DateTime     @default(now())
  completedAt  DateTime?
}
```

#### BrandMapping 模型

```prisma
model BrandMapping {
  id           String   @id @default(cuid())
  merchantName String   @unique  // FMTC商家名称
  brandId      String?  // 系统品牌ID
  brand        Brand?   @relation(fields: [brandId], references: [id])
  isConfirmed  Boolean  @default(false)
  confidence   Decimal? @db.Decimal(3, 2)  // 匹配置信度
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### 枚举类型

```prisma
enum DiscountType {
  PERCENTAGE    // 百分比折扣
  FIXED_AMOUNT  // 固定金额折扣
  FREE_SHIPPING // 免费送货
  BUY_X_GET_Y   // 买X送Y
  OTHER         // 其他类型
}

enum ImportStatus {
  PENDING      // 等待处理
  PROCESSING   // 处理中
  COMPLETED    // 完成
  FAILED       // 失败
  PARTIAL      // 部分成功
}

enum ImportType {
  PASTE        // 粘贴文本
  FILE         // 文件上传
  API          // API导入
}
```

## API接口

### 主要API端点

#### 1. 折扣管理 API (`/api/discounts`)

**GET /api/discounts**

- 功能: 获取折扣列表
- 参数: `page`, `limit`, `brandId`, `merchantName`, `status`, `type`, `search`, `sortBy`, `sortOrder`
- 返回: 分页折扣数据 + 统计信息

**POST /api/discounts**

- 功能: 创建新折扣
- 请求体: 折扣信息
- 返回: 创建的折扣数据

**PUT /api/discounts**

- 功能: 批量更新折扣状态
- 请求体: `{ ids: string[], action: string, data?: object }`
- 支持操作: `activate`, `deactivate`, `delete`, `update_brand`

**DELETE /api/discounts**

- 功能: 批量删除折扣
- 参数: `ids` (逗号分隔的ID列表)

#### 2. 导入API (`/api/discounts/import`)

**POST /api/discounts/import**

- 功能: 批量导入折扣
- 请求体: `{ discounts: FMTCDiscountData[], source: string, importType: ImportType }`
- 返回: 导入结果和统计信息

**GET /api/discounts/import**

- 功能: 获取导入历史
- 参数: `page`, `limit`
- 返回: 导入记录列表

#### 3. 品牌匹配API (`/api/discounts/brand-matching`)

**GET /api/discounts/brand-matching**

- 功能: 获取品牌匹配信息
- 参数: `action` (`stats`, `unmatched`, `suggestions`, 默认为mappings)

**POST /api/discounts/brand-matching**

- 功能: 创建或确认品牌映射
- 支持操作: `confirm`, `auto_match`, `batch_auto_match`

**DELETE /api/discounts/brand-matching**

- 功能: 删除品牌映射
- 参数: `merchantName`

#### 4. 统计API (`/api/discounts/stats`)

**GET /api/discounts/stats**

- 功能: 获取折扣统计信息
- 参数: `timeRange` (`7d`, `30d`, `90d`, `1y`, `all`), `brandId`
- 返回: 综合统计数据

#### 5. 调度器API (`/api/discounts/scheduler`)

**GET /api/discounts/scheduler**

- 功能: 获取调度器状态

**POST /api/discounts/scheduler**

- 功能: 控制调度器 (`start`, `stop`, `restart`, `trigger`)

**PUT /api/discounts/scheduler**

- 功能: 更新调度器配置

## 前端组件

### 主要组件

#### 1. DiscountDataTable 组件

**文件**: `src/components/discounts/DiscountDataTable.tsx`

主要的折扣数据表格组件，提供：

- 分页显示折扣列表
- 多种筛选和排序选项
- 批量操作功能 (激活/停用/删除)
- 折扣详情查看和编辑
- 复制折扣码功能

**关键功能**:

```typescript
// 获取折扣数据
const fetchDiscounts = useCallback(async () => {
  const queryString = buildQueryString();
  const response = await fetch(`/api/discounts?${queryString}`);
  // 处理返回数据
}, [buildQueryString]);

// 批量操作
const handleBatchAction = async (
  action: string,
  data?: Record<string, unknown>,
) => {
  const response = await fetch("/api/discounts", {
    method: "PUT",
    body: JSON.stringify({ ids: selectedIds, action, data }),
  });
};
```

#### 2. DiscountStats 组件

**文件**: `src/components/discounts/DiscountStats.tsx`

统计仪表板组件，展示：

- 总体折扣统计 (总数/活跃/过期/未匹配)
- 时间趋势分析
- 即将过期的折扣列表
- 评分统计

#### 3. BrandMatchingPanel 组件

**文件**: `src/components/discounts/BrandMatchingPanel.tsx`

品牌匹配管理面板，包含：

- 未匹配商家列表
- 品牌映射管理
- 批量自动匹配功能
- 手动确认映射

#### 4. DiscountImportModal 组件

**文件**: `src/components/discounts/DiscountImportModal.tsx`

折扣导入模态框，支持：

- FMTC格式数据解析
- 文件上传和文本粘贴
- 导入预览和验证
- 错误处理和重试

## 服务层

### 1. BrandMatchingService

**文件**: `src/lib/services/brand-matching.service.ts`

智能品牌匹配服务，提供：

**核心方法**:

```typescript
class BrandMatchingService {
  // 单个品牌匹配
  async matchBrand(merchantName: string): Promise<BrandMatchResult>;

  // 批量品牌匹配
  async batchMatchBrands(
    merchantNames: string[],
  ): Promise<Map<string, BrandMatchResult>>;

  // 获取品牌建议
  async getBrandSuggestions(
    merchantName: string,
    limit: number,
  ): Promise<BrandMatchSuggestion[]>;

  // 确认品牌映射
  async confirmBrandMapping(
    merchantName: string,
    brandId: string,
  ): Promise<BrandMapping>;

  // 获取匹配统计
  async getMatchingStats(): Promise<MatchingStats>;
}
```

**匹配算法**:

- 精确匹配 (归一化名称对比)
- 模糊匹配 (Levenshtein距离算法)
- 置信度评分 (0-1分数)

### 2. DiscountSchedulerService

**文件**: `src/lib/services/discount-scheduler.service.ts`

自动化调度服务，功能：

**核心功能**:

```typescript
class DiscountSchedulerService {
  // 启动调度器
  start(): void;

  // 停止调度器
  stop(): void;

  // 手动触发任务
  async triggerManual(): Promise<ExpirationResult[]>;

  // 获取调度器状态
  getStatus(): ScheduleStatus & { config: ScheduleConfig };

  // 更新配置
  updateConfig(newConfig: Partial<ScheduleConfig>): void;
}
```

**配置选项**:

```typescript
interface ScheduleConfig {
  enabled: boolean; // 是否启用
  intervalMinutes: number; // 检查间隔(分钟)
  maxConcurrentRuns: number; // 最大并发运行数
  retryAttempts: number; // 重试次数
  retryDelayMinutes: number; // 重试延迟
}
```

### 3. FMTCParserService

**文件**: `src/lib/services/fmtc-parser.service.ts`

FMTC数据解析服务，支持：

**解析功能**:

```typescript
class FMTCParserService {
  // 解析粘贴内容
  async parsePastedContent(content: string): Promise<{
    data: FMTCDiscountData[];
    stats: ParseStats;
  }>;

  // 验证解析数据
  validateDiscountData(data: FMTCDiscountData[]): ValidationResult;

  // 解析折扣信息
  private parseDiscountInfo(title: string): {
    type: DiscountType;
    value?: number;
    minAmount?: number;
    maxAmount?: number;
  };
}
```

**支持格式**:

- 表格格式 (Tab分隔)
- 文本格式 (规则解析)
- 日期格式自动识别
- 折扣类型智能推断

### 4. DiscountExpirationService

**文件**: `src/lib/services/discount-expiration.service.ts`

过期处理服务，自动化：

**核心功能**:

```typescript
class DiscountExpirationService {
  // 处理过期折扣
  async processExpiredDiscounts(): Promise<ExpirationResult[]>;

  // 检查并标记过期
  async checkAndMarkExpired(): Promise<ExpirationResult>;

  // 清理旧的过期折扣
  async cleanupOldExpiredDiscounts(): Promise<ExpirationResult>;

  // 发送过期提醒
  async sendExpiryNotifications(): Promise<ExpirationResult>;

  // 获取过期统计
  async getExpirationStats(timeRange?: number): Promise<ExpirationStats>;
}
```

## 核心功能

### 1. 折扣导入流程

#### 步骤一：数据解析

```typescript
// 1. 检测内容格式
if (this.isTabularFormat(content)) {
  return this.parseTabularContent(content);
}

// 2. 逐行解析
for (const line of lines) {
  const discount = this.parseDiscountLine(line);
  if (discount) {
    discounts.push(discount);
  }
}
```

#### 步骤二：品牌匹配

```typescript
// 批量获取品牌匹配
const merchantNames = [...new Set(discounts.map((d) => d.merchantName))];
const brandMatches = await brandMatchingService.batchMatchBrands(merchantNames);

// 应用匹配结果
for (const discountData of discounts) {
  const brandMatch = brandMatches.get(discountData.merchantName);
  const brandId = brandMatch?.brandId || null;
}
```

#### 步骤三：重复检测

```typescript
async function findDuplicateDiscount(discountData: FMTCDiscountData) {
  // 检查相同商家+折扣码
  if (discountData.code) {
    const existing = await db.discount.findFirst({
      where: { merchantName, code: discountData.code, isActive: true },
    });
  }

  // 检查时间重叠
  if (hasTimeOverlap) return existing;
}
```

#### 步骤四：数据入库

```typescript
// 创建导入记录
const importRecord = await db.discountImport.create({
  data: { fileName, rawContent, parsedData, status: ImportStatus.PROCESSING },
});

// 批量创建折扣
for (const discountData of discounts) {
  const discount = await db.discount.create({ data: transformedData });
  successCount++;
}

// 更新导入记录
await db.discountImport.update({
  where: { id: importRecord.id },
  data: { status: finalStatus, successCount, errorCount },
});
```

### 2. 品牌匹配算法

#### 匹配策略

1. **精确匹配**: 归一化后的字符串完全相同
2. **模糊匹配**: 基于编辑距离的相似度计算
3. **置信度评分**: 0-1分数，>=0.8自动匹配

#### 匹配算法实现

```typescript
private calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = this.normalizeBrandName(str1);
  const normalized2 = this.normalizeBrandName(str2);

  // Levenshtein距离算法
  const matrix = Array(normalized2.length + 1)
    .fill(null)
    .map(() => Array(normalized1.length + 1).fill(null));

  // 初始化矩阵
  for (let i = 0; i <= normalized1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= normalized2.length; j++) matrix[j][0] = j;

  // 计算编辑距离
  for (let j = 1; j <= normalized2.length; j++) {
    for (let i = 1; i <= normalized1.length; i++) {
      const indicator = normalized1[i - 1] === normalized2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  const distance = matrix[normalized2.length][normalized1.length];
  const maxLength = Math.max(normalized1.length, normalized2.length);
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}
```

### 3. 过期处理机制

#### 自动检测

```typescript
// 查找过期折扣
const expiredDiscounts = await db.discount.findMany({
  where: {
    endDate: { lt: new Date() },
    isExpired: false,
  },
});

// 批量标记过期
await db.discount.updateMany({
  where: { id: { in: expiredDiscounts.map((d) => d.id) } },
  data: { isExpired: true, isActive: false },
});
```

#### 自动清理

```typescript
// 清理旧的过期折扣
const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - this.config.cleanupOlderThanDays);

await db.discount.deleteMany({
  where: {
    isExpired: true,
    endDate: { lt: cutoffDate },
  },
});
```

### 4. 统计分析

#### 基础统计

```typescript
const [totalDiscounts, activeDiscounts, expiredDiscounts] = await Promise.all([
  db.discount.count({ where: baseWhere }),
  db.discount.count({
    where: { ...baseWhere, isActive: true, isExpired: false },
  }),
  db.discount.count({ where: { ...baseWhere, isExpired: true } }),
]);
```

#### 分组统计

```typescript
// 按类型分组
const discountsByType = await db.discount.groupBy({
  by: ["type"],
  where: baseWhere,
  _count: true,
  orderBy: { _count: { type: "desc" } },
});

// 按来源分组
const discountsBySource = await db.discount.groupBy({
  by: ["source"],
  where: baseWhere,
  _count: true,
});
```

#### 时间趋势

```typescript
const trendData = await Promise.all(
  dateRange.map(async (date) => {
    const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    const [created, expired] = await Promise.all([
      db.discount.count({
        where: { ...baseWhere, createdAt: { gte: date, lt: nextDay } },
      }),
      db.discount.count({
        where: {
          ...baseWhere,
          endDate: { gte: date, lt: nextDay },
          isExpired: true,
        },
      }),
    ]);
    return { date: date.toISOString().split("T")[0], created, expired };
  }),
);
```

## 配置和部署

### 环境变量

```env
# 数据库连接
DATABASE_URL=postgresql://username:password@localhost:5432/trendhub

# 调度器配置
DISCOUNT_SCHEDULER_ENABLED=true
DISCOUNT_SCHEDULER_INTERVAL_MINUTES=60
DISCOUNT_SCHEDULER_RETRY_ATTEMPTS=3
DISCOUNT_SCHEDULER_RETRY_DELAY_MINUTES=5

# 过期处理配置
DISCOUNT_AUTO_DISABLE_EXPIRED=true
DISCOUNT_AUTO_DELETE_AFTER_DAYS=30
DISCOUNT_CLEANUP_OLDER_THAN_DAYS=90

# 通知配置
DISCOUNT_NOTIFY_BEFORE_EXPIRY=true
DISCOUNT_NOTIFY_DAYS_BEFORE=3
DISCOUNT_NOTIFY_EMAIL=admin@trendhub.com
```

### 调度器初始化

**文件**: `src/lib/services/scheduler-init.ts`

```typescript
import { discountSchedulerService } from "./discount-scheduler.service";

// 应用启动时初始化调度器
export function initializeScheduler() {
  if (process.env.DISCOUNT_SCHEDULER_ENABLED === "true") {
    discountSchedulerService.start();
    console.log("Discount scheduler started");
  }
}
```

### 数据库迁移

```bash
# 推送模式变更到数据库
cd apps/admin
pnpm db:push

# 添加初始数据
pnpm db:seed
```

## 扩展开发

### 1. 添加新的折扣类型

#### 步骤一：更新枚举

```prisma
enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
  FREE_SHIPPING
  BUY_X_GET_Y
  TIERED_DISCOUNT  // 新增阶梯折扣
  OTHER
}
```

#### 步骤二：更新解析器

```typescript
// 在 fmtc-parser.service.ts 中添加
private parseDiscountInfo(title: string): DiscountInfo {
  // 阶梯折扣检测
  const tieredMatch = title.match(/spend\s*[¥$£€](\d+)\s*save\s*[¥$£€](\d+)/i);
  if (tieredMatch) {
    return {
      type: DiscountType.TIERED_DISCOUNT,
      value: parseInt(tieredMatch[2]),
      minAmount: parseInt(tieredMatch[1])
    };
  }
  // 其他现有逻辑...
}
```

#### 步骤三：更新前端显示

```typescript
// 在组件中添加新类型的显示逻辑
const getDiscountTypeLabel = (type: DiscountType) => {
  const labels = {
    // 现有类型...
    [DiscountType.TIERED_DISCOUNT]: t("types.tieredDiscount"),
  };
  return labels[type] || t("status.unknown");
};
```

### 2. 集成新的数据源

#### 步骤一：创建解析器

```typescript
// 新文件: src/lib/services/new-source-parser.service.ts
export class NewSourceParserService {
  async parseData(content: string): Promise<{
    data: FMTCDiscountData[];
    stats: ParseStats;
  }> {
    // 实现新数据源的解析逻辑
  }
}
```

#### 步骤二：更新导入API

```typescript
// 在 /api/discounts/import/route.ts 中
export async function POST(request: NextRequest) {
  const { discounts, source, importType } = await request.json();

  // 根据来源选择解析器
  let parsedData;
  switch (source) {
    case "FMTC":
      parsedData = await fmtcParserService.parseData(content);
      break;
    case "NEW_SOURCE":
      parsedData = await newSourceParserService.parseData(content);
      break;
  }
}
```

### 3. 自定义通知渠道

#### 步骤一：创建通知服务

```typescript
// 新文件: src/lib/services/notification-channels/slack.service.ts
export class SlackNotificationService {
  async sendExpiryNotification(discounts: Discount[]): Promise<void> {
    // 实现Slack通知逻辑
  }
}
```

#### 步骤二：集成到过期服务

```typescript
// 在 discount-expiration.service.ts 中
async sendExpiryNotifications(): Promise<ExpirationResult> {
  // 现有逻辑...

  // 发送通知
  if (this.config.notifyEmail) {
    await emailService.sendExpiryNotification(expiringSoon);
  }

  if (process.env.SLACK_WEBHOOK_URL) {
    await slackService.sendExpiryNotification(expiringSoon);
  }
}
```

### 4. 添加新的统计维度

#### 步骤一：更新统计API

```typescript
// 在 /api/discounts/stats/route.ts 中添加
// 按评分分组统计
const discountsByRating = await db.discount.groupBy({
  by: ["rating"],
  where: baseWhere,
  _count: true,
  _avg: { value: true },
});
```

#### 步骤二：更新前端展示

```typescript
// 在 DiscountStats.tsx 中添加新的图表组件
<Card>
  <CardTitle>按评分分布</CardTitle>
  <CardContent>
    {/* 添加评分分布图表 */}
  </CardContent>
</Card>
```

## 最佳实践

### 1. 性能优化

#### 数据库查询优化

```typescript
// 使用索引优化查询
const discounts = await db.discount.findMany({
  where: { isActive: true, isExpired: false }, // 使用复合索引
  include: { brand: { select: { id: true, name: true, logo: true } } }, // 只选择需要的字段
  take: limit,
  skip: offset,
});
```

#### 缓存策略

```typescript
// 使用缓存减少数据库查询
class BrandMatchingService {
  private brandCache: Map<string, Brand[]> = new Map();

  private async getAllBrands(): Promise<Brand[]> {
    if (!this.brandCache.has("all")) {
      const brands = await db.brand.findMany({ where: { isActive: true } });
      this.brandCache.set("all", brands);
    }
    return this.brandCache.get("all")!;
  }
}
```

### 2. 错误处理

#### API错误处理

```typescript
export async function GET(request: NextRequest) {
  try {
    // 业务逻辑
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Discount API Error:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}
```

#### 前端错误处理

```typescript
const fetchDiscounts = useCallback(async () => {
  try {
    setLoading(true);
    const response = await fetch(`/api/discounts?${queryString}`);
    const result = await response.json();

    if (result.success) {
      setDiscounts(result.data);
    } else {
      toast.error(result.error || t("messages.fetchError"));
    }
  } catch (error) {
    toast.error(t("messages.networkError"));
  } finally {
    setLoading(false);
  }
}, [queryString, t]);
```

### 3. 安全性

#### 输入验证

```typescript
// 服务端验证
export async function POST(request: NextRequest) {
  const body = await request.json();

  // 验证必填字段
  if (!body.merchantName?.trim()) {
    return NextResponse.json(
      { success: false, error: "商家名称不能为空" },
      { status: 400 },
    );
  }

  // 验证数据格式
  if (body.value && (isNaN(body.value) || body.value < 0)) {
    return NextResponse.json(
      { success: false, error: "折扣值必须为有效的正数" },
      { status: 400 },
    );
  }
}
```

#### SQL注入防护

```typescript
// 使用Prisma的参数化查询
const discounts = await db.discount.findMany({
  where: {
    merchantName: { contains: searchTerm, mode: "insensitive" }, // 安全的模糊查询
    isActive: true,
  },
});
```

## 故障排除

### 常见问题

#### 1. 导入失败

**问题**: 折扣导入时出现解析错误
**解决方案**:

- 检查数据格式是否符合FMTC标准
- 查看错误日志定位具体解析问题
- 验证日期格式是否正确

#### 2. 品牌匹配不准确

**问题**: 自动品牌匹配结果置信度低
**解决方案**:

- 手动确认正确的品牌映射
- 调整匹配算法的置信度阈值
- 清理品牌名称数据提高匹配准确性

#### 3. 调度器未运行

**问题**: 自动过期检查不工作
**解决方案**:

- 检查环境变量 `DISCOUNT_SCHEDULER_ENABLED`
- 查看调度器状态和日志
- 验证时间间隔配置是否正确

#### 4. 性能问题

**问题**: 大量数据时界面响应慢
**解决方案**:

- 优化数据库查询和索引
- 实现前端分页和虚拟滚动
- 使用缓存减少重复查询

---

本文档提供了Discount Management模块的完整开发指南。如需进一步了解特定功能或遇到问题，请参考代码注释或联系开发团队。

# FMTC 商户信息抓取集成规划

## 概述

本章节详细规划了 FMTC 商户信息抓取功能的集成方案，该功能将作为 Discount Management 模块的重要扩展，用于自动化获取 FMTC 平台的商户详细信息，增强品牌匹配的准确性和折扣管理的完整性。

### 功能目标

- **自动化商户信息收集**: 从 FMTC 平台自动抓取商户基本信息和详细信息
- **智能品牌关联**: 将抓取的商户信息与现有品牌系统进行智能匹配
- **完善折扣管理**: 为折扣数据提供更准确的商户背景信息
- **数据同步**: 定期更新商户信息，保持数据的时效性

### 技术框架集成

基于现有的技术栈进行扩展：

- **爬虫框架**: 扩展现有 `@repo/scraper` 包，基于 Crawlee + Playwright
- **数据存储**: 扩展 Prisma 数据模型，新增 FMTC 商户相关表
- **API层**: 扩展现有折扣管理 API，新增商户管理端点
- **前端界面**: 在现有管理后台中集成商户管理界面

## 数据模型设计

### 1. FMTCMerchant 主模型

```prisma
/// FMTC 商户信息
model FMTCMerchant {
  /// 唯一标识符
  id                    String               @id @default(cuid())

  // 基本信息 (来自列表页)
  /// 商户名称
  name                  String
  /// 商户国家
  country               String?
  /// 网络平台 (联盟平台名称)
  network               String?
  /// 在FMTC上的添加日期
  dateAdded             DateTime?
  /// 高级订阅数量
  premiumSubscriptions  Int?                 @default(0)

  // 详细信息 (来自详情页)
  /// 官方网站 URL
  homepage              String?
  /// 主要分类
  primaryCategory       String?
  /// 主要国家
  primaryCountry        String?
  /// 配送地区
  shipsTo               String[]             @default([])
  /// FMTC 内部 ID
  fmtcId                String?              @unique
  /// 网络 ID (如 AW ID)
  networkId             String?
  /// 商户状态
  status                String?
  /// 是否支持 FreshReach
  freshReachSupported   Boolean              @default(false)

  // 品牌图片信息
  /// 120x60 Logo URL
  logo120x60            String?
  /// 88x31 Logo URL
  logo88x31             String?
  /// 280x210 截图 URL
  screenshot280x210     String?
  /// 600x450 截图 URL
  screenshot600x450     String?

  // 关联链接
  /// 联盟链接 (如 AW URL)
  affiliateUrl          String?
  /// 预览优惠链接
  previewDealsUrl       String?

  // 数据管理
  /// 数据来源页面 URL
  sourceUrl             String?
  /// 最后抓取时间
  lastScrapedAt         DateTime?
  /// 是否激活
  isActive              Boolean              @default(true)
  /// 原始数据 (JSON)
  rawData               Json?

  // 品牌关联
  /// 关联的系统品牌ID
  brandId               String?
  /// 关联的系统品牌
  brand                 Brand?               @relation(fields: [brandId], references: [id])
  /// 匹配置信度
  brandMatchConfidence  Decimal?             @db.Decimal(3, 2)
  /// 是否已确认品牌匹配
  brandMatchConfirmed   Boolean              @default(false)

  // 网络关联信息
  networks              FMTCMerchantNetwork[]

  // 时间戳
  createdAt             DateTime             @default(now())
  updatedAt             DateTime             @updatedAt

  @@index([name])
  @@index([country])
  @@index([network])
  @@index([fmtcId])
  @@index([brandId])
  @@index([isActive])
  @@index([lastScrapedAt])
}

/// FMTC 商户网络关联信息
model FMTCMerchantNetwork {
  /// 唯一标识符
  id           String       @id @default(cuid())
  /// 商户ID
  merchantId   String
  /// 网络名称
  networkName  String
  /// 网络ID
  networkId    String?
  /// 加入状态 (Joined, Not Joined, Relationship Not Verified)
  status       String
  /// 是否激活
  isActive     Boolean      @default(true)
  /// 关联的商户
  merchant     FMTCMerchant @relation(fields: [merchantId], references: [id], onDelete: Cascade)
  /// 创建时间
  createdAt    DateTime     @default(now())
  /// 更新时间
  updatedAt    DateTime     @updatedAt

  @@index([merchantId])
  @@index([networkName])
  @@index([status])
}

/// FMTC 抓取任务配置
model FMTCScraperTask {
  /// 唯一标识符
  id                    String                    @id @default(cuid())
  /// 任务名称
  name                  String                    @unique
  /// 任务描述
  description           String?
  /// FMTC 登录凭据 (加密存储)
  credentials           Json
  /// 抓取配置 (页数限制、过滤条件等)
  config                Json
  /// 是否启用
  isEnabled             Boolean                   @default(true)
  /// CRON 表达式 (定时执行)
  cronExpression        String?
  /// 最后执行时间
  lastExecutedAt        DateTime?
  /// 下次执行时间
  nextExecuteAt         DateTime?
  /// 执行记录
  executions            FMTCScraperExecution[]
  /// 创建时间
  createdAt             DateTime                  @default(now())
  /// 更新时间
  updatedAt             DateTime                 @updatedAt

  @@index([isEnabled])
  @@index([nextExecuteAt])
}

/// FMTC 抓取执行记录
model FMTCScraperExecution {
  /// 唯一标识符
  id              String            @id @default(cuid())
  /// 任务ID
  taskId          String
  /// 执行状态
  status          ScraperTaskStatus @default(IDLE)
  /// 开始时间
  startedAt       DateTime?
  /// 完成时间
  completedAt     DateTime?
  /// 抓取统计
  metrics         Json?
  /// 错误信息
  errorMessage    String?
  /// 错误堆栈
  errorStack      String?
  /// 抓取的商户数量
  merchantsCount  Int               @default(0)
  /// 新增商户数量
  newMerchantsCount Int             @default(0)
  /// 更新商户数量
  updatedMerchantsCount Int         @default(0)
  /// 关联任务
  task            FMTCScraperTask   @relation(fields: [taskId], references: [id], onDelete: Cascade)
  /// 创建时间
  createdAt       DateTime          @default(now())
  /// 更新时间
  updatedAt       DateTime          @updatedAt

  @@index([taskId])
  @@index([status])
  @@index([startedAt])
}
```

### 2. 扩展现有模型

```prisma
// 扩展 Brand 模型
model Brand {
  // ... 现有字段 ...

  /// 关联的 FMTC 商户
  fmtcMerchants FMTCMerchant[]
}

// 扩展 BrandMapping 模型以支持 FMTC 商户
model BrandMapping {
  // ... 现有字段 ...

  /// 关联的 FMTC 商户ID
  fmtcMerchantId String?
  /// 关联的 FMTC 商户
  fmtcMerchant   FMTCMerchant? @relation(fields: [fmtcMerchantId], references: [id])
}
```

## 爬虫架构设计

### 1. FMTC 爬虫实现

基于现有 scraper 架构，新增 FMTC 特定实现：

```typescript
// packages/scraper/src/sites/fmtc/index.ts
export interface FMTCScraperOptions extends ScraperOptions {
  credentials: {
    username: string;
    password: string;
  };
  maxPages?: number;
  includeDetails?: boolean;
  downloadImages?: boolean;
}

export interface FMTCMerchantData {
  // 列表页数据
  name: string;
  country?: string;
  network?: string;
  dateAdded?: Date;
  premiumSubscriptions?: number;
  detailUrl?: string;

  // 详情页数据 (可选)
  homepage?: string;
  primaryCategory?: string;
  primaryCountry?: string;
  shipsTo?: string[];
  fmtcId?: string;
  networkId?: string;
  status?: string;
  freshReachSupported?: boolean;

  // 图片信息
  logo120x60?: string;
  logo88x31?: string;
  screenshot280x210?: string;
  screenshot600x450?: string;

  // 链接信息
  affiliateUrl?: string;
  previewDealsUrl?: string;

  // 网络关联
  networks?: Array<{
    networkName: string;
    networkId?: string;
    status: string;
  }>;
}

export default async function scrapeFMTC(
  options: FMTCScraperOptions,
  executionId?: string,
): Promise<FMTCMerchantData[]>;
```

### 2. 关键组件设计

#### 登录处理器

```typescript
// packages/scraper/src/sites/fmtc/login-handler.ts
export class FMTCLoginHandler {
  async login(page: Page, credentials: FMTCCredentials): Promise<boolean>;
  async isLoggedIn(page: Page): Promise<boolean>;
  async getLoginForm(page: Page): Promise<ElementHandle | null>;
}
```

#### 商户列表处理器

```typescript
// packages/scraper/src/sites/fmtc/merchant-list-handler.ts
export class FMTCMerchantListHandler {
  async scrapeMerchantList(
    page: Page,
    pageNum: number,
  ): Promise<FMTCMerchantData[]>;
  async getTotalPages(page: Page): Promise<number>;
  async navigateToPage(page: Page, pageNum: number): Promise<void>;
}
```

#### 商户详情处理器

```typescript
// packages/scraper/src/sites/fmtc/merchant-detail-handler.ts
export class FMTCMerchantDetailHandler {
  async scrapeMerchantDetails(
    page: Page,
    merchantUrl: string,
  ): Promise<Partial<FMTCMerchantData>>;
  async downloadImages(
    page: Page,
    merchant: FMTCMerchantData,
  ): Promise<string[]>;
  async extractNetworks(
    page: Page,
  ): Promise<
    Array<{ networkName: string; networkId?: string; status: string }>
  >;
}
```

#### 主要抓取流程

```typescript
// packages/scraper/src/sites/fmtc/request-handler.ts
export function createFMTCRequestHandler(options: FMTCRequestHandlerOptions) {
  return async function requestHandler({
    request,
    page,
    log,
  }: PlaywrightCrawlingContext) {
    const { label, userData } = request;

    switch (label) {
      case "LOGIN":
        await handleLogin(page, userData.credentials, log);
        break;

      case "MERCHANT_LIST":
        await handleMerchantList(page, userData, log);
        break;

      case "MERCHANT_DETAIL":
        await handleMerchantDetail(page, userData, log);
        break;

      default:
        log.warning(`Unknown request label: ${label}`);
    }
  };
}
```

### 3. 反检测策略

FMTC 作为商业平台可能有较强的反爬虫机制，需要加强反检测：

```typescript
// packages/scraper/src/sites/fmtc/anti-detection.ts
export class FMTCAntiDetection {
  // 模拟真实用户行为
  async simulateRealUserBehavior(page: Page): Promise<void>;

  // 处理验证码
  async handleCaptcha(page: Page): Promise<boolean>;

  // 检测是否被封
  async detectBlocking(page: Page): Promise<boolean>;

  // 重新建立会话
  async recreateSession(page: Page): Promise<void>;
}
```

## API 接口设计

### 1. FMTC 商户管理 API

```typescript
// apps/admin/src/app/api/fmtc-merchants/route.ts

/**
 * GET /api/fmtc-merchants
 * 获取 FMTC 商户列表
 * 查询参数: page, limit, search, country, network, status, brandMatched
 */
export async function GET(request: NextRequest) {
  // 支持分页、搜索、过滤
  // 返回商户列表和统计信息
}

/**
 * POST /api/fmtc-merchants
 * 创建或更新商户信息
 */
export async function POST(request: NextRequest) {
  // 手动创建商户或批量导入
}

/**
 * PUT /api/fmtc-merchants
 * 批量更新商户信息
 */
export async function PUT(request: NextRequest) {
  // 批量操作: 激活/停用、品牌匹配、删除等
}
```

### 2. FMTC 抓取任务 API

```typescript
// apps/admin/src/app/api/fmtc-merchants/scraper/route.ts

/**
 * GET /api/fmtc-merchants/scraper
 * 获取抓取任务状态和配置
 */
export async function GET(request: NextRequest) {
  // 返回任务列表、执行历史、配置信息
}

/**
 * POST /api/fmtc-merchants/scraper
 * 启动抓取任务
 */
export async function POST(request: NextRequest) {
  // 手动触发抓取、创建新任务、更新配置
}

/**
 * PUT /api/fmtc-merchants/scraper/[taskId]
 * 更新抓取任务配置
 */
export async function PUT(request: NextRequest) {
  // 更新 CRON 表达式、抓取参数等
}
```

### 3. 品牌匹配增强 API

```typescript
// apps/admin/src/app/api/fmtc-merchants/brand-matching/route.ts

/**
 * GET /api/fmtc-merchants/brand-matching
 * 获取品牌匹配状态
 */
export async function GET(request: NextRequest) {
  // 返回未匹配商户、匹配建议、统计信息
}

/**
 * POST /api/fmtc-merchants/brand-matching
 * 执行品牌匹配
 */
export async function POST(request: NextRequest) {
  // 手动匹配、批量自动匹配、确认匹配
}
```

## 前端界面设计

### 1. FMTC 商户管理页面

```typescript
// apps/admin/src/app/[locale]/admin/fmtc-merchants/page.tsx

export default function FMTCMerchantsPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <FMTCMerchantsHeader />

      {/* 统计仪表板 */}
      <FMTCMerchantsStats />

      {/* 抓取任务状态 */}
      <FMTCScraperStatus />

      {/* 筛选器 */}
      <FMTCMerchantsFilters />

      {/* 商户数据表格 */}
      <FMTCMerchantsDataTable />
    </div>
  );
}
```

### 2. 主要组件设计

#### 商户数据表格

```typescript
// apps/admin/src/components/fmtc-merchants/FMTCMerchantsDataTable.tsx
export function FMTCMerchantsDataTable() {
  // 功能包括:
  // - 分页显示商户列表
  // - 支持搜索和筛选
  // - 批量操作 (品牌匹配、激活/停用、删除)
  // - 商户详情查看和编辑
  // - 品牌匹配状态显示
  // - 最后抓取时间显示
}
```

#### 抓取任务管理

```typescript
// apps/admin/src/components/fmtc-merchants/FMTCScraperPanel.tsx
export function FMTCScraperPanel() {
  // 功能包括:
  // - 抓取任务配置
  // - 手动触发抓取
  // - 执行历史查看
  // - 抓取状态监控
  // - 错误日志查看
}
```

#### 品牌匹配增强

```typescript
// apps/admin/src/components/fmtc-merchants/FMTCBrandMatchingPanel.tsx
export function FMTCBrandMatchingPanel() {
  // 功能包括:
  // - 未匹配商户列表
  // - 智能匹配建议
  // - 批量匹配操作
  // - 匹配结果确认
  // - 匹配置信度显示
}
```

#### 商户详情模态框

```typescript
// apps/admin/src/components/fmtc-merchants/FMTCMerchantDetailModal.tsx
export function FMTCMerchantDetailModal() {
  // 功能包括:
  // - 完整商户信息展示
  // - 品牌图片预览
  // - 网络关联信息
  // - 手动编辑功能
  // - 重新抓取操作
}
```

### 3. 国际化支持

```json
// apps/admin/src/messages/cn.json
{
  "fmtcMerchants": {
    "title": "FMTC 商户管理",
    "description": "管理从 FMTC 平台抓取的商户信息",
    "stats": {
      "totalMerchants": "总商户数",
      "brandMatched": "已匹配品牌",
      "unmatched": "未匹配",
      "lastUpdate": "最后更新"
    },
    "scraper": {
      "title": "抓取任务",
      "status": "状态",
      "lastRun": "最后执行",
      "nextRun": "下次执行",
      "runNow": "立即执行",
      "configure": "配置"
    },
    "filters": {
      "search": "搜索商户名称",
      "country": "国家",
      "network": "网络平台",
      "brandStatus": "品牌匹配状态"
    },
    "actions": {
      "matchBrand": "匹配品牌",
      "viewDetails": "查看详情",
      "editMerchant": "编辑商户",
      "refreshData": "刷新数据"
    }
  }
}
```

## 系统集成规划

### 1. 与现有折扣管理系统的集成

#### 增强品牌匹配服务

```typescript
// apps/admin/src/lib/services/enhanced-brand-matching.service.ts
export class EnhancedBrandMatchingService extends BrandMatchingService {
  // 结合 FMTC 商户信息提升匹配准确性
  async matchBrandWithFMTCData(
    merchantName: string,
  ): Promise<BrandMatchResult> {
    // 1. 检查是否有对应的 FMTC 商户记录
    const fmtcMerchant = await this.findFMTCMerchant(merchantName);

    // 2. 使用 FMTC 商户的详细信息辅助匹配
    if (fmtcMerchant) {
      return this.matchWithFMTCMerchantData(fmtcMerchant);
    }

    // 3. 回退到原有匹配逻辑
    return super.matchBrand(merchantName);
  }

  private async matchWithFMTCMerchantData(
    merchant: FMTCMerchant,
  ): Promise<BrandMatchResult> {
    // 使用网站域名、分类信息等进行更精确的匹配
  }
}
```

#### 折扣数据增强

```typescript
// apps/admin/src/lib/services/discount-enhancement.service.ts
export class DiscountEnhancementService {
  // 为折扣数据添加 FMTC 商户信息
  async enhanceDiscountWithFMTCData(
    discount: Discount,
  ): Promise<EnhancedDiscount> {
    const fmtcMerchant = await this.findFMTCMerchantByName(
      discount.merchantName,
    );

    if (fmtcMerchant) {
      return {
        ...discount,
        fmtcMerchant: {
          homepage: fmtcMerchant.homepage,
          primaryCategory: fmtcMerchant.primaryCategory,
          country: fmtcMerchant.country,
          logo: fmtcMerchant.logo120x60,
          affiliateUrl: fmtcMerchant.affiliateUrl,
        },
      };
    }

    return discount;
  }
}
```

### 2. 与现有爬虫系统的集成

#### 统一任务调度

```typescript
// apps/admin/src/lib/services/unified-scraper-scheduler.service.ts
export class UnifiedScraperSchedulerService {
  // 将 FMTC 抓取任务集成到现有调度系统
  async scheduleFMTCTask(task: FMTCScraperTask): Promise<void> {
    // 使用现有的 ScraperTaskDefinition 框架
    const taskDefinition = await this.createTaskDefinition({
      name: `fmtc-${task.name}`,
      targetSite: "FMTC",
      cronExpression: task.cronExpression,
      // ...其他配置
    });

    return this.scheduleTask(taskDefinition);
  }
}
```

### 3. 数据同步策略

#### 定期同步服务

```typescript
// apps/admin/src/lib/services/fmtc-sync.service.ts
export class FMTCSyncService {
  // 定期同步 FMTC 商户信息到品牌匹配系统
  async syncMerchantsWithBrands(): Promise<SyncResult> {
    // 1. 获取所有活跃的 FMTC 商户
    const merchants = await this.getActiveFMTCMerchants();

    // 2. 批量执行品牌匹配
    const matchResults = await this.batchMatchBrands(merchants);

    // 3. 更新品牌映射表
    await this.updateBrandMappings(matchResults);

    // 4. 更新相关折扣的品牌关联
    await this.updateDiscountBrandAssociations();

    return this.generateSyncReport(matchResults);
  }
}
```

## 开发实施计划

### 阶段一：基础设施搭建 (1-2周)

1. **数据模型实现**

   - 扩展 Prisma schema 添加 FMTC 相关模型
   - 数据库迁移和种子数据
   - TypeScript 类型定义

2. **爬虫基础架构**
   - 创建 FMTC 爬虫基础结构
   - 实现登录处理机制
   - 基础反检测功能

### 阶段二：核心功能开发 (2-3周)

1. **商户信息抓取**

   - 商户列表页面抓取
   - 分页处理机制
   - 商户详情页面抓取
   - 图片下载功能 (可选)

2. **API 接口开发**
   - FMTC 商户管理 API
   - 抓取任务控制 API
   - 与现有品牌匹配 API 的集成

### 阶段三：前端界面开发 (2周)

1. **管理界面实现**

   - FMTC 商户管理页面
   - 数据表格和筛选器
   - 抓取任务管理面板

2. **用户体验优化**
   - 响应式设计适配
   - 加载状态和错误处理
   - 国际化文本完善

### 阶段四：系统集成和优化 (1-2周)

1. **深度集成**

   - 与现有折扣管理的深度集成
   - 智能品牌匹配增强
   - 数据同步机制完善

2. **性能优化**
   - 抓取性能优化
   - 数据库查询优化
   - 缓存策略实现

### 阶段五：测试和部署 (1周)

1. **全面测试**

   - 单元测试
   - 集成测试
   - 用户接受测试

2. **生产部署**
   - 生产环境部署
   - 监控和日志配置
   - 文档完善

## 配置和环境变量

### 新增环境变量

```env
# FMTC 抓取配置
FMTC_USERNAME=your-fmtc-username
FMTC_PASSWORD=your-fmtc-password
FMTC_LOGIN_URL=https://account.fmtc.co/cp/login
FMTC_MERCHANTS_URL=https://account.fmtc.co/cp/program_directory/index/net/0/opm/0/cntry/0/cat/2/unsmrch/0

# 抓取行为配置
FMTC_MAX_PAGES_PER_RUN=10
FMTC_REQUEST_DELAY_MS=2000
FMTC_ENABLE_IMAGE_DOWNLOAD=false
FMTC_CONCURRENT_DETAILS=1

# 调度配置
FMTC_AUTO_SCRAPE_ENABLED=true
FMTC_SCRAPE_CRON="0 2 * * *"  # 每天凌晨2点执行
FMTC_RETRY_FAILED_TASKS=true

# 安全配置
FMTC_CREDENTIALS_ENCRYPTION_KEY=your-encryption-key
FMTC_SESSION_TIMEOUT_MINUTES=30
```

## 监控和日志

### 关键指标监控

1. **抓取性能指标**

   - 抓取成功率
   - 平均抓取时间
   - 数据质量评分

2. **系统健康指标**
   - API 响应时间
   - 数据库查询性能
   - 错误率统计

### 日志策略

```typescript
// 结构化日志记录
interface FMTCScraperLog {
  executionId: string;
  phase: "login" | "list" | "detail" | "processing";
  merchantName?: string;
  action: string;
  result: "success" | "error" | "warning";
  duration?: number;
  metadata?: Record<string, unknown>;
}
```

## 安全考虑

### 1. 凭据安全

- FMTC 登录凭据加密存储
- 会话令牌安全管理
- 定期凭据轮换提醒

### 2. 抓取合规

- 遵守 robots.txt 规则
- 实现合理的请求间隔
- 监控并避免过度请求

### 3. 数据隐私

- 商户信息脱敏处理
- 访问权限控制
- 审计日志记录

## 故障排除指南

### 常见问题和解决方案

1. **登录失败**

   - 检查凭据配置
   - 验证 FMTC 网站变更
   - 处理验证码挑战

2. **抓取数据不完整**

   - 检查页面结构变化
   - 调整选择器配置
   - 增加等待时间

3. **品牌匹配不准确**

   - 调整匹配算法参数
   - 完善品牌名称标准化
   - 手动确认关键匹配

4. **性能问题**
   - 优化数据库索引
   - 调整并发配置
   - 实现增量更新

---

此 FMTC 集成规划为 Discount Management 模块提供了完整的商户信息抓取和管理解决方案。通过系统化的开发和部署，将显著提升品牌匹配的准确性和折扣管理的效率。
