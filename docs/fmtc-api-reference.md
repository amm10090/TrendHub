# FMTC 爬虫系统 API 完整参考

## 📋 目录

1. [API概览](#api概览)
2. [认证和授权](#认证和授权)
3. [FMTC核心API](#fmtc核心api)
4. [商户管理API](#商户管理api)
5. [爬虫任务管理API](#爬虫任务管理api)
6. [实时进度API](#实时进度api)
7. [数据导出API](#数据导出api)
8. [系统管理API](#系统管理api)
9. [错误处理](#错误处理)
10. [SDK和代码示例](#sdk和代码示例)

## API概览

### 🌐 基础信息

- **基础URL**: `https://your-domain.com/api`
- **API版本**: v1.0
- **认证方式**: JWT Bearer Token + API Key
- **数据格式**: JSON
- **字符编码**: UTF-8
- **速率限制**: 100 requests/minute (可根据用户等级调整)

### 📊 统一响应格式

所有API端点都遵循统一的响应格式：

```typescript
interface ApiResponse<T> {
  success: boolean; // 请求是否成功
  data?: T; // 响应数据 (成功时)
  error?: string; // 错误信息 (失败时)
  message?: string; // 附加消息
  timestamp: string; // 响应时间戳
  requestId: string; // 请求唯一标识
  pagination?: {
    // 分页信息 (列表接口)
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 🔐 HTTP状态码

| 状态码 | 含义                  | 描述             |
| ------ | --------------------- | ---------------- |
| `200`  | OK                    | 请求成功         |
| `201`  | Created               | 资源创建成功     |
| `400`  | Bad Request           | 请求参数错误     |
| `401`  | Unauthorized          | 未认证或认证失败 |
| `403`  | Forbidden             | 无权限访问       |
| `404`  | Not Found             | 资源不存在       |
| `409`  | Conflict              | 资源冲突         |
| `422`  | Unprocessable Entity  | 数据验证失败     |
| `429`  | Too Many Requests     | 请求频率过高     |
| `500`  | Internal Server Error | 服务器内部错误   |
| `503`  | Service Unavailable   | 服务暂时不可用   |

## 认证和授权

### 🔑 API密钥获取

#### 生成API密钥

```http
POST /api/auth/api-keys
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "FMTC爬虫集成",
  "scopes": ["fmtc:read", "fmtc:write", "scraper:execute"],
  "expiresInDays": 30
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "keyId": "api_1234567890abcdef",
    "secret": "fmtc_1234567890abcdef_AbCdEfGhIjKlMnOpQrStUvWxYz",
    "scopes": ["fmtc:read", "fmtc:write", "scraper:execute"],
    "expiresAt": "2024-03-15T10:30:00.000Z",
    "createdAt": "2024-02-15T10:30:00.000Z"
  }
}
```

### 🛡️ 请求认证

所有API请求需要在请求头中包含认证信息：

```http
Authorization: Bearer <jwt_token>
X-API-Key: <api_key>
X-API-Signature: <request_signature>
X-Timestamp: <unix_timestamp>
```

### 🔐 请求签名

为确保请求安全，部分敏感操作需要请求签名：

```typescript
// 签名算法示例
function generateSignature(
  method: string,
  url: string,
  body: string,
  timestamp: number,
  apiSecret: string,
): string {
  const signatureString = `${method}\n${url}\n${body}\n${timestamp}`;
  return crypto
    .createHmac("sha256", apiSecret)
    .update(signatureString)
    .digest("hex");
}
```

## FMTC核心API

### 📋 配置管理

#### 获取FMTC配置

```http
GET /api/fmtc/config
Authorization: Bearer <jwt_token>
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "config_default",
    "name": "默认FMTC配置",
    "defaultUsername": "user@example.com",
    "defaultPassword": "[ENCRYPTED]",
    "baseUrl": "https://account.fmtc.co",
    "reCaptchaConfig": {
      "provider": "2captcha",
      "apiKey": "[ENCRYPTED]",
      "timeout": 120000
    },
    "searchConfig": {
      "maxPages": 10,
      "enableDetails": true,
      "downloadImages": false
    },
    "antiDetectionConfig": {
      "minDelay": 1000,
      "maxDelay": 3000,
      "enableMouseSimulation": true,
      "enableScrollSimulation": true
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-02-15T10:30:00.000Z"
  }
}
```

#### 更新FMTC配置

```http
PUT /api/fmtc/config
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-API-Signature: <signature>

{
  "name": "生产环境配置",
  "defaultUsername": "prod_user@example.com",
  "defaultPassword": "new_secure_password",
  "searchConfig": {
    "maxPages": 20,
    "enableDetails": true,
    "downloadImages": true
  },
  "antiDetectionConfig": {
    "minDelay": 2000,
    "maxDelay": 5000,
    "enableMouseSimulation": true,
    "enableScrollSimulation": true
  }
}
```

## 商户管理API

### 👥 商户数据操作

#### 获取商户列表

```http
GET /api/fmtc-merchants?page=1&limit=20&country=US&brandMatched=true&sortBy=lastScrapedAt&sortOrder=desc
Authorization: Bearer <jwt_token>
```

**查询参数**:
| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `page` | number | 1 | 页码 |
| `limit` | number | 20 | 每页数量 |
| `search` | string | - | 搜索关键词 |
| `country` | string | - | 国家筛选 |
| `network` | string | - | 联盟网络筛选 |
| `brandMatched` | boolean | - | 是否已匹配品牌 |
| `isActive` | boolean | - | 是否活跃 |
| `sortBy` | string | lastScrapedAt | 排序字段 |
| `sortOrder` | string | desc | 排序方向 |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "merchants": [
      {
        "id": "merchant_123",
        "name": "Amazon US",
        "fmtcId": "amazon-us-1234",
        "country": "US",
        "network": "Commission Junction",
        "homepage": "https://amazon.com",
        "description": "Leading e-commerce platform",
        "primaryCategory": "E-commerce",
        "logo120x60": "https://cdn.example.com/logos/amazon_120x60.png",
        "screenshot280x210": "https://cdn.example.com/screenshots/amazon_280x210.png",
        "networks": [
          {
            "networkName": "Commission Junction",
            "commission": "1-8%",
            "cookieDuration": "24 hours"
          }
        ],
        "affiliateLinks": {
          "Commission Junction": [
            "https://cj.com/link1",
            "https://cj.com/link2"
          ]
        },
        "freshReachSupported": true,
        "brand": {
          "id": "brand_amazon",
          "name": "Amazon",
          "logo": "https://cdn.example.com/brands/amazon.png"
        },
        "isActive": true,
        "lastScrapedAt": "2024-02-15T10:30:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-02-15T10:30:00.000Z"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1250,
    "totalPages": 63
  }
}
```

#### 获取单个商户详情

```http
GET /api/fmtc-merchants/{merchantId}
Authorization: Bearer <jwt_token>
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "merchant_123",
    "name": "Amazon US",
    "fmtcId": "amazon-us-1234",
    "country": "US",
    "network": "Commission Junction",
    "homepage": "https://amazon.com",
    "description": "Amazon.com, Inc. is an American multinational technology company...",
    "primaryCategory": "E-commerce",
    "primaryCountry": "US",
    "logo120x60": "https://cdn.example.com/logos/amazon_120x60.png",
    "logo88x31": "https://cdn.example.com/logos/amazon_88x31.png",
    "screenshot280x210": "https://cdn.example.com/screenshots/amazon_280x210.png",
    "screenshot600x450": "https://cdn.example.com/screenshots/amazon_600x450.png",
    "networks": [
      {
        "networkName": "Commission Junction",
        "commission": "1-8%",
        "cookieDuration": "24 hours",
        "joinDate": "2020-01-01",
        "status": "Active"
      },
      {
        "networkName": "ShareASale",
        "commission": "2-10%",
        "cookieDuration": "30 days",
        "joinDate": "2019-06-15",
        "status": "Active"
      }
    ],
    "affiliateLinks": {
      "Commission Junction": ["https://cj.com/link1", "https://cj.com/link2"],
      "ShareASale": ["https://shareasale.com/link1"]
    },
    "freshReachSupported": true,
    "freshReachUrls": {
      "api": "https://api.freshreach.com/amazon",
      "tracking": "https://tracking.freshreach.com/amazon"
    },
    "sourceUrl": "https://account.fmtc.co/cp/program_directory/m/amazon-us-1234/",
    "brandId": "brand_amazon",
    "brand": {
      "id": "brand_amazon",
      "name": "Amazon",
      "logo": "https://cdn.example.com/brands/amazon.png",
      "description": "Global e-commerce and cloud computing company",
      "website": "https://amazon.com",
      "founded": "1994",
      "headquarters": "Seattle, WA, USA"
    },
    "isActive": true,
    "rawData": {
      "scrapedFields": {
        "merchantTitle": "Amazon.com",
        "merchantId": "amazon-us-1234",
        "lastUpdated": "2024-02-15T10:30:00.000Z"
      }
    },
    "lastScrapedAt": "2024-02-15T10:30:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-02-15T10:30:00.000Z"
  }
}
```

#### 批量刷新商户数据

```http
PUT /api/fmtc-merchants
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-API-Signature: <signature>

{
  "action": "batch_refresh_data",
  "ids": ["merchant_123", "merchant_456", "merchant_789"],
  "options": {
    "downloadImages": false,
    "enableDetails": true,
    "concurrency": 3
  }
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "executionId": "exec_batch_20240215_103000",
    "total": 3,
    "concurrency": 3,
    "estimatedDuration": 180,
    "speedImprovement": "使用3个并发工作线程",
    "message": "批量刷新任务已启动，请通过SSE监听实时进度"
  }
}
```

#### 更新商户信息

```http
PUT /api/fmtc-merchants/{merchantId}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "description": "Updated description for the merchant",
  "primaryCategory": "E-commerce & Shopping",
  "brandId": "brand_new_brand",
  "isActive": true,
  "customFields": {
    "priority": "high",
    "tags": ["premium", "featured"]
  }
}
```

#### 删除商户

```http
DELETE /api/fmtc-merchants/{merchantId}
Authorization: Bearer <jwt_token>
X-API-Signature: <signature>
```

**响应示例**:

```json
{
  "success": true,
  "message": "商户已成功删除",
  "data": {
    "deletedId": "merchant_123",
    "deletedAt": "2024-02-15T10:30:00.000Z"
  }
}
```

### 🔗 品牌匹配管理

#### 获取品牌匹配建议

```http
GET /api/fmtc-merchants/brand-matching/suggestions?merchantId=merchant_123
Authorization: Bearer <jwt_token>
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "merchantId": "merchant_123",
    "merchantName": "Amazon US",
    "suggestions": [
      {
        "brandId": "brand_amazon",
        "brandName": "Amazon",
        "confidence": 0.95,
        "matchReasons": [
          "名称完全匹配",
          "域名匹配: amazon.com",
          "Logo相似度: 92%"
        ]
      },
      {
        "brandId": "brand_amazon_prime",
        "brandName": "Amazon Prime",
        "confidence": 0.78,
        "matchReasons": ["名称部分匹配", "同域名: amazon.com"]
      }
    ],
    "autoMatchRecommendation": {
      "brandId": "brand_amazon",
      "shouldAutoMatch": true,
      "reason": "置信度超过90%且名称完全匹配"
    }
  }
}
```

#### 执行品牌匹配

```http
POST /api/fmtc-merchants/brand-matching
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "merchantId": "merchant_123",
  "brandId": "brand_amazon",
  "matchType": "manual",
  "confidence": 1.0,
  "notes": "手动确认匹配"
}
```

#### 批量品牌匹配

```http
POST /api/fmtc-merchants/brand-matching/batch
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "matches": [
    {
      "merchantId": "merchant_123",
      "brandId": "brand_amazon"
    },
    {
      "merchantId": "merchant_456",
      "brandId": "brand_apple"
    }
  ],
  "options": {
    "autoConfirm": false,
    "minConfidence": 0.8
  }
}
```

## 爬虫任务管理API

### 🤖 任务定义管理

#### 获取爬虫任务列表

```http
GET /api/fmtc-merchants/scraper?page=1&limit=10&status=active
Authorization: Bearer <jwt_token>
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task_daily_fmtc",
        "name": "每日FMTC商户抓取",
        "description": "自动抓取FMTC平台商户信息，每日凌晨2点执行",
        "credentials": {
          "username": "user@example.com",
          "hasPassword": true
        },
        "config": {
          "maxPages": 10,
          "includeDetails": true,
          "downloadImages": false,
          "searchParams": {
            "category": "all",
            "country": "all"
          }
        },
        "isEnabled": true,
        "cronExpression": "0 2 * * *",
        "lastExecutedAt": "2024-02-15T02:00:00.000Z",
        "nextExecuteAt": "2024-02-16T02:00:00.000Z",
        "executions": [
          {
            "id": "exec_20240215_020000",
            "status": "COMPLETED",
            "startedAt": "2024-02-15T02:00:00.000Z",
            "completedAt": "2024-02-15T02:45:30.000Z",
            "merchantsCount": 1250,
            "newMerchantsCount": 15,
            "updatedMerchantsCount": 58,
            "metrics": {
              "avgProcessingTime": 2.3,
              "successRate": 0.98,
              "errorCount": 25
            }
          }
        ],
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-02-15T10:30:00.000Z"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

#### 创建爬虫任务

```http
POST /api/fmtc-merchants/scraper
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-API-Signature: <signature>

{
  "action": "create_task",
  "taskData": {
    "name": "高频FMTC商户更新",
    "description": "每4小时抓取一次FMTC热门商户信息",
    "credentials": {
      "username": "premium_user@example.com",
      "password": "secure_password_123"
    },
    "config": {
      "maxPages": 20,
      "includeDetails": true,
      "downloadImages": true,
      "searchParams": {
        "category": "ecommerce",
        "country": "US,UK,CA"
      },
      "antiDetection": {
        "minDelay": 2000,
        "maxDelay": 5000,
        "enableMouseSimulation": true
      }
    },
    "isEnabled": true,
    "cronExpression": "0 */4 * * *"
  }
}
```

#### 启动爬虫任务

```http
POST /api/fmtc-merchants/scraper/{taskId}
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-API-Signature: <signature>

{
  "action": "start",
  "options": {
    "priority": "high",
    "executeNow": true,
    "overrideConfig": {
      "maxPages": 5
    }
  }
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "executionId": "exec_20240215_103000",
    "taskId": "task_daily_fmtc",
    "status": "QUEUED",
    "estimatedDuration": 2700,
    "startedAt": "2024-02-15T10:30:00.000Z",
    "message": "爬虫任务已加入执行队列"
  }
}
```

#### 停止爬虫任务

```http
POST /api/fmtc-merchants/scraper/{taskId}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "action": "stop",
  "reason": "手动停止进行维护",
  "graceful": true
}
```

### 📊 执行记录管理

#### 获取执行历史

```http
GET /api/fmtc-merchants/scraper/{taskId}/executions?page=1&limit=20&status=COMPLETED
Authorization: Bearer <jwt_token>
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "executions": [
      {
        "id": "exec_20240215_020000",
        "taskId": "task_daily_fmtc",
        "status": "COMPLETED",
        "startedAt": "2024-02-15T02:00:00.000Z",
        "completedAt": "2024-02-15T02:45:30.000Z",
        "duration": 2730000,
        "merchantsCount": 1250,
        "newMerchantsCount": 15,
        "updatedMerchantsCount": 58,
        "errorMessage": null,
        "metrics": {
          "totalPages": 125,
          "avgPageLoadTime": 2.3,
          "avgProcessingTime": 1.8,
          "successRate": 0.98,
          "errorCount": 25,
          "memoryPeakUsage": 1536000000,
          "cpuAvgUsage": 0.45
        },
        "createdAt": "2024-02-15T02:00:00.000Z"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### 获取执行详情

```http
GET /api/fmtc-merchants/scraper/executions/{executionId}
Authorization: Bearer <jwt_token>
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "exec_20240215_020000",
    "taskId": "task_daily_fmtc",
    "task": {
      "id": "task_daily_fmtc",
      "name": "每日FMTC商户抓取"
    },
    "status": "COMPLETED",
    "startedAt": "2024-02-15T02:00:00.000Z",
    "completedAt": "2024-02-15T02:45:30.000Z",
    "duration": 2730000,
    "merchantsCount": 1250,
    "newMerchantsCount": 15,
    "updatedMerchantsCount": 58,
    "metrics": {
      "performance": {
        "totalPages": 125,
        "avgPageLoadTime": 2.3,
        "avgProcessingTime": 1.8,
        "throughput": 0.76
      },
      "quality": {
        "successRate": 0.98,
        "errorCount": 25,
        "validationErrors": 8,
        "duplicatesFound": 3
      },
      "resources": {
        "memoryPeakUsage": 1536000000,
        "cpuAvgUsage": 0.45,
        "networkRequests": 1875,
        "diskUsage": 256000000
      }
    },
    "processedMerchants": [
      {
        "merchantId": "merchant_123",
        "merchantName": "Amazon US",
        "status": "updated",
        "processingTime": 2100,
        "changes": ["description", "networks"]
      }
    ],
    "errors": [
      {
        "type": "network_timeout",
        "message": "页面加载超时",
        "url": "https://account.fmtc.co/cp/program_directory/page/58",
        "timestamp": "2024-02-15T02:35:12.000Z",
        "recoveryAction": "retry_successful"
      }
    ],
    "createdAt": "2024-02-15T02:00:00.000Z"
  }
}
```

## 实时进度API

### 📡 Server-Sent Events

#### 建立进度监听连接

```http
GET /api/fmtc-merchants/progress/{executionId}
Authorization: Bearer <jwt_token>
Accept: text/event-stream
```

**SSE事件格式**:

```
// 连接确认事件
event: connected
data: {"type":"connected","executionId":"exec_20240215_103000","timestamp":"2024-02-15T10:30:00.000Z","taskName":"批量商户刷新","taskSite":"FMTC"}

// 进度更新事件
event: progress
data: {"type":"progress","executionId":"exec_20240215_103000","total":100,"completed":25,"failed":2,"running":3,"pending":70,"percentage":27,"startTime":"2024-02-15T10:30:00.000Z","averageTimePerTask":2300,"estimatedTimeRemaining":172500,"workers":[{"id":"worker_1","isWorking":true,"currentTask":{"id":"task_26","merchantName":"Best Buy","status":"running","startTime":"2024-02-15T10:31:30.000Z"}},{"id":"worker_2","isWorking":true,"currentTask":{"id":"task_27","merchantName":"Target","status":"running","startTime":"2024-02-15T10:31:32.000Z"}},{"id":"worker_3","isWorking":false,"currentTask":null}],"recentCompletedTasks":[{"id":"task_23","merchantName":"Amazon","duration":2100},{"id":"task_24","merchantName":"Walmart","duration":1850},{"id":"task_25","merchantName":"Apple","duration":3200}],"recentFailedTasks":[{"id":"task_22","merchantName":"Nike","error":"页面加载超时"}],"timestamp":"2024-02-15T10:31:35.000Z"}

// 任务完成事件
event: completed
data: {"type":"completed","executionId":"exec_20240215_103000","summary":{"total":100,"completed":95,"failed":5,"successRate":0.95,"totalTime":287500,"averageTimePerTask":2875},"timestamp":"2024-02-15T10:35:47.000Z"}

// 错误事件
event: error
data: {"type":"error","message":"网络连接异常","timestamp":"2024-02-15T10:32:15.000Z"}

// 连接关闭事件
event: close
data: {"type":"close","reason":"任务执行完成","timestamp":"2024-02-15T10:35:50.000Z"}
```

#### 推送进度更新 (内部API)

```http
POST /api/fmtc-merchants/progress/{executionId}
Authorization: Bearer <internal_token>
Content-Type: application/json

{
  "total": 100,
  "completed": 45,
  "failed": 3,
  "running": 2,
  "pending": 50,
  "percentage": 48,
  "averageTimePerTask": 2100,
  "estimatedTimeRemaining": 105000,
  "workers": [
    {
      "id": "worker_1",
      "isWorking": true,
      "currentTask": {
        "id": "task_46",
        "merchantName": "Microsoft Store",
        "status": "running",
        "startTime": "2024-02-15T10:33:15.000Z"
      }
    }
  ]
}
```

### 📊 进度查询API

#### 获取当前进度状态

```http
GET /api/fmtc-merchants/progress/{executionId}/status
Authorization: Bearer <jwt_token>
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "executionId": "exec_20240215_103000",
    "status": "RUNNING",
    "progress": {
      "total": 100,
      "completed": 65,
      "failed": 5,
      "running": 2,
      "pending": 28,
      "percentage": 70
    },
    "timing": {
      "startTime": "2024-02-15T10:30:00.000Z",
      "elapsedTime": 420000,
      "averageTimePerTask": 2400,
      "estimatedTimeRemaining": 67200
    },
    "performance": {
      "throughput": 0.65,
      "successRate": 0.93,
      "errorRate": 0.07
    }
  }
}
```

## 数据导出API

### 📤 导出功能

#### 导出商户数据

```http
POST /api/fmtc-merchants/export
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "format": "xlsx",
  "filters": {
    "country": ["US", "UK"],
    "brandMatched": true,
    "isActive": true,
    "lastScrapedAfter": "2024-01-01T00:00:00.000Z"
  },
  "fields": [
    "name",
    "country",
    "homepage",
    "description",
    "networks",
    "brand.name",
    "lastScrapedAt"
  ],
  "options": {
    "includeImages": false,
    "groupByBrand": true
  }
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "exportId": "export_20240215_103000",
    "format": "xlsx",
    "status": "processing",
    "estimatedSize": "2.5MB",
    "estimatedCompletion": "2024-02-15T10:32:00.000Z",
    "downloadUrl": null
  }
}
```

#### 检查导出状态

```http
GET /api/fmtc-merchants/export/{exportId}/status
Authorization: Bearer <jwt_token>
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "exportId": "export_20240215_103000",
    "status": "completed",
    "progress": 100,
    "fileSize": 2654208,
    "recordCount": 1250,
    "downloadUrl": "https://cdn.example.com/exports/fmtc-merchants-20240215-103000.xlsx",
    "expiresAt": "2024-02-22T10:30:00.000Z",
    "createdAt": "2024-02-15T10:30:00.000Z",
    "completedAt": "2024-02-15T10:31:45.000Z"
  }
}
```

#### 下载导出文件

```http
GET /api/fmtc-merchants/export/{exportId}/download
Authorization: Bearer <jwt_token>
```

返回文件流，支持断点续传。

## 系统管理API

### ⚙️ 系统配置

#### 获取系统状态

```http
GET /api/admin/system/status
Authorization: Bearer <jwt_token>
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "system": {
      "status": "healthy",
      "uptime": 3600000,
      "version": "2.0.0",
      "environment": "production"
    },
    "services": {
      "database": {
        "status": "healthy",
        "connections": 8,
        "responseTime": 12
      },
      "scraper": {
        "status": "healthy",
        "activeExecutions": 2,
        "queuedTasks": 5
      },
      "storage": {
        "status": "healthy",
        "diskUsage": 0.45,
        "availableSpace": "150GB"
      }
    },
    "metrics": {
      "requestsPerMinute": 120,
      "errorRate": 0.02,
      "averageResponseTime": 250
    }
  }
}
```

#### 获取系统统计

```http
GET /api/admin/system/stats?period=7d
Authorization: Bearer <jwt_token>
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "period": "7d",
    "merchants": {
      "total": 12500,
      "active": 11800,
      "brandMatched": 9200,
      "recentlyUpdated": 3400
    },
    "scraping": {
      "totalExecutions": 48,
      "successfulExecutions": 45,
      "failedExecutions": 3,
      "avgExecutionTime": 2850000,
      "totalMerchantsProcessed": 45600,
      "avgThroughput": 0.67
    },
    "api": {
      "totalRequests": 125600,
      "successfulRequests": 123200,
      "errorRate": 0.019,
      "avgResponseTime": 245
    },
    "timeline": [
      {
        "date": "2024-02-09",
        "executions": 7,
        "merchantsProcessed": 6800,
        "successRate": 0.96
      }
    ]
  }
}
```

## 错误处理

### ❌ 错误响应格式

所有API错误都遵循统一格式：

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "请求参数验证失败",
  "details": {
    "field": "merchantId",
    "code": "INVALID_FORMAT",
    "expected": "string with prefix 'merchant_'",
    "received": "123"
  },
  "timestamp": "2024-02-15T10:30:00.000Z",
  "requestId": "req_1234567890abcdef"
}
```

### 🏷️ 错误代码表

| 错误代码                   | HTTP状态码 | 描述              | 解决方案                             |
| -------------------------- | ---------- | ----------------- | ------------------------------------ |
| `INVALID_API_KEY`          | 401        | API密钥无效或过期 | 检查并更新API密钥                    |
| `INSUFFICIENT_PERMISSIONS` | 403        | 权限不足          | 确认用户权限或申请相应权限           |
| `VALIDATION_ERROR`         | 422        | 请求参数验证失败  | 检查请求参数格式和必填字段           |
| `RESOURCE_NOT_FOUND`       | 404        | 请求的资源不存在  | 确认资源ID是否正确                   |
| `DUPLICATE_RESOURCE`       | 409        | 资源已存在        | 使用PUT方法更新或检查唯一性约束      |
| `RATE_LIMIT_EXCEEDED`      | 429        | 请求频率过高      | 降低请求频率或申请更高限额           |
| `SCRAPER_BUSY`             | 503        | 爬虫正在执行中    | 等待当前任务完成或停止正在执行的任务 |
| `EXTERNAL_SERVICE_ERROR`   | 502        | 外部服务错误      | 检查外部服务状态或稍后重试           |
| `INTERNAL_SERVER_ERROR`    | 500        | 服务器内部错误    | 联系技术支持                         |

### 🔄 重试策略

建议客户端实现以下重试策略：

```typescript
class ApiRetryHandler {
  private readonly retryableStatuses = [429, 502, 503, 504];
  private readonly maxRetries = 3;

  async executeWithRetry<T>(
    apiCall: () => Promise<T>,
    retryCount = 0,
  ): Promise<T> {
    try {
      return await apiCall();
    } catch (error) {
      if (
        retryCount < this.maxRetries &&
        this.retryableStatuses.includes(error.status)
      ) {
        const delay = Math.pow(2, retryCount) * 1000; // 指数退避
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.executeWithRetry(apiCall, retryCount + 1);
      }
      throw error;
    }
  }
}
```

## SDK和代码示例

### 📚 JavaScript/TypeScript SDK

#### 安装

```bash
npm install @trendhub/fmtc-api-client
```

#### 基础使用

```typescript
import { FMTCApiClient } from "@trendhub/fmtc-api-client";

// 初始化客户端
const client = new FMTCApiClient({
  baseUrl: "https://your-domain.com/api",
  apiKey: "your_api_key",
  apiSecret: "your_api_secret",
});

// 获取商户列表
const merchants = await client.merchants.list({
  page: 1,
  limit: 50,
  country: "US",
  brandMatched: true,
});

// 启动批量刷新
const refreshResult = await client.merchants.batchRefresh(
  ["merchant_123", "merchant_456"],
  {
    concurrency: 3,
    downloadImages: false,
  },
);

// 监听实时进度
const progressStream = client.progress.listen(refreshResult.executionId);
progressStream.on("progress", (data) => {
  console.log(`进度: ${data.percentage}%`);
});
progressStream.on("completed", (data) => {
  console.log("批量刷新完成:", data.summary);
});
```

#### 高级用法

```typescript
// 自定义配置
const client = new FMTCApiClient({
  baseUrl: "https://your-domain.com/api",
  apiKey: "your_api_key",
  apiSecret: "your_api_secret",
  timeout: 30000,
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
    retryableStatuses: [429, 502, 503],
  },
});

// 爬虫任务管理
const task = await client.scraper.createTask({
  name: "Premium商户抓取",
  credentials: {
    username: "user@example.com",
    password: "password",
  },
  config: {
    maxPages: 20,
    includeDetails: true,
  },
  cronExpression: "0 */6 * * *",
});

// 启动任务并监听进度
const execution = await client.scraper.startTask(task.id);
const progressStream = client.progress.listen(execution.executionId);

progressStream.on("progress", (progress) => {
  console.log(`任务进度: ${progress.percentage}%`);
  console.log(`工作线程: ${progress.workers.length}`);
  console.log(
    `预计剩余时间: ${Math.round(progress.estimatedTimeRemaining / 1000)}秒`,
  );
});
```

### 🐍 Python SDK

```python
from fmtc_api_client import FMTCApiClient

# 初始化客户端
client = FMTCApiClient(
    base_url='https://your-domain.com/api',
    api_key='your_api_key',
    api_secret='your_api_secret'
)

# 获取商户列表
merchants = client.merchants.list(
    page=1,
    limit=50,
    country='US',
    brand_matched=True
)

# 批量刷新商户数据
refresh_result = client.merchants.batch_refresh(
    merchant_ids=['merchant_123', 'merchant_456'],
    options={'concurrency': 3, 'download_images': False}
)

# 监听实时进度
def on_progress(progress):
    print(f"进度: {progress['percentage']}%")

def on_completed(result):
    print(f"批量刷新完成: {result['summary']}")

client.progress.listen(
    execution_id=refresh_result['executionId'],
    on_progress=on_progress,
    on_completed=on_completed
)
```

### 🚀 cURL示例

#### 获取商户列表

```bash
curl -X GET "https://your-domain.com/api/fmtc-merchants?page=1&limit=20&country=US" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "X-API-Key: your_api_key"
```

#### 批量刷新商户数据

```bash
curl -X PUT "https://your-domain.com/api/fmtc-merchants" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "X-API-Key: your_api_key" \
  -H "X-API-Signature: generated_signature" \
  -H "X-Timestamp: 1708000200" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "batch_refresh_data",
    "ids": ["merchant_123", "merchant_456", "merchant_789"],
    "options": {
      "concurrency": 3,
      "downloadImages": false
    }
  }'
```

#### 监听实时进度

```bash
curl -N -H "Authorization: Bearer your_jwt_token" \
  -H "X-API-Key: your_api_key" \
  -H "Accept: text/event-stream" \
  "https://your-domain.com/api/fmtc-merchants/progress/exec_20240215_103000"
```

### 📱 React Hook示例

```typescript
import { useState, useEffect } from "react";
import { FMTCApiClient } from "@trendhub/fmtc-api-client";

export function useFMTCBatchRefresh() {
  const [progress, setProgress] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const startBatchRefresh = async (merchantIds: string[]) => {
    try {
      setIsRefreshing(true);
      setError(null);

      const result = await client.merchants.batchRefresh(merchantIds, {
        concurrency: 3,
      });

      // 建立SSE连接
      const progressStream = client.progress.listen(result.executionId);

      progressStream.on("progress", (data) => {
        setProgress(data);
      });

      progressStream.on("completed", (data) => {
        setProgress(data);
        setIsRefreshing(false);
      });

      progressStream.on("error", (error) => {
        setError(error.message);
        setIsRefreshing(false);
      });
    } catch (error) {
      setError(error.message);
      setIsRefreshing(false);
    }
  };

  return {
    progress,
    isRefreshing,
    error,
    startBatchRefresh,
  };
}
```

这个API参考文档提供了FMTC爬虫系统所有API端点的详细说明，包括请求格式、响应示例、错误处理和代码示例。开发者可以根据这个文档快速集成和使用FMTC爬虫系统的各项功能。
