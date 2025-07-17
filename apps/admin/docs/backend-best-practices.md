# TrendHub 后端开发最佳实践

## 概述

本文档基于 Next.js 15+ 和 TypeScript 的最佳实践，为 TrendHub 后端开发提供详细的指导原则。

## 目录

1. [API 路由最佳实践](#api-路由最佳实践)
2. [服务器发送事件 (SSE) 实现](#服务器发送事件-sse-实现)
3. [流式响应](#流式响应)
4. [TypeScript 类型安全](#typescript-类型安全)
5. [错误处理](#错误处理)
6. [性能优化](#性能优化)
7. [安全性考虑](#安全性考虑)
8. [实时日志系统实现](#实时日志系统实现)

## API 路由最佳实践

### 1. Route Handler 结构

使用 Next.js 15+ App Router 的 Route Handler 替代传统的 API Routes：

```typescript
// app/api/admin/scraper-tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// 定义请求和响应类型
const GetTasksQuerySchema = z.object({
  page: z.string().optional().default("1").transform(Number),
  limit: z.string().optional().default("20").transform(Number),
  status: z.enum(["PENDING", "RUNNING", "COMPLETED", "FAILED"]).optional(),
});

type TasksResponse = {
  data: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validationResult = GetTasksQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          issues: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { page, limit, status } = validationResult.data;

    // 业务逻辑处理
    const tasks = await getTasksFromDB({ page, limit, status });

    return NextResponse.json<TasksResponse>(tasks);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

### 2. HTTP 方法处理

为不同的 HTTP 方法创建单独的导出函数：

```typescript
// app/api/admin/scraper-tasks/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // GET 逻辑
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // PUT 逻辑
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // DELETE 逻辑
}
```

### 3. 配置选项

使用路由配置来优化性能和行为：

```typescript
// 动态路由强制重新验证
export const dynamic = "force-dynamic";

// 设置重新验证间隔
export const revalidate = 60;

// 运行时配置
export const runtime = "nodejs"; // 或 'edge'

// 最大执行时间
export const maxDuration = 30;
```

## 服务器发送事件 (SSE) 实现

### 1. 基础 SSE 实现

```typescript
// app/api/admin/scraper-tasks/logs/stream/route.ts
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const executionId = searchParams.get("executionId");

  if (!executionId) {
    return new Response("Missing executionId", { status: 400 });
  }

  // 设置 SSE 响应头
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  const stream = new ReadableStream({
    start(controller) {
      let intervalId: NodeJS.Timeout;
      let lastTimestamp = new Date();

      const sendData = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(new TextEncoder().encode(message));
      };

      const sendEvent = (event: string, data: any) => {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(new TextEncoder().encode(message));
      };

      // 发送初始连接确认
      sendEvent("connected", { executionId, timestamp: new Date() });

      // 定时查询新日志
      const pollLogs = async () => {
        try {
          const newLogs = await getNewLogs(executionId, lastTimestamp);

          if (newLogs.length > 0) {
            sendEvent("logs", newLogs);
            lastTimestamp = newLogs[newLogs.length - 1].timestamp;
          }

          // 检查执行状态
          const execution = await getExecutionStatus(executionId);
          if (
            execution.status === "COMPLETED" ||
            execution.status === "FAILED"
          ) {
            sendEvent("status", { status: execution.status });
            cleanup();
          }
        } catch (error) {
          console.error("SSE polling error:", error);
          sendEvent("error", { message: "Polling error" });
        }
      };

      // 设置定时器
      intervalId = setInterval(pollLogs, 1000);

      // 清理函数
      const cleanup = () => {
        if (intervalId) clearInterval(intervalId);
        controller.close();
      };

      // 处理客户端断开连接
      request.signal.addEventListener("abort", cleanup);

      // 设置超时
      setTimeout(cleanup, 30 * 60 * 1000); // 30分钟超时
    },
  });

  return new Response(stream, { headers });
}
```

### 2. 高级 SSE 功能

```typescript
// 支持事件过滤和重连机制
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const executionId = searchParams.get("executionId");
  const lastEventId = searchParams.get("lastEventId");
  const levels = searchParams.getAll("level"); // 支持多个日志级别过滤

  const stream = new ReadableStream({
    start(controller) {
      let eventId = parseInt(lastEventId || "0");

      const sendEvent = (event: string, data: any, id?: number) => {
        const eventIdStr = id ? `id: ${id}\n` : "";
        const eventStr = `event: ${event}\n`;
        const dataStr = `data: ${JSON.stringify(data)}\n\n`;
        const message = eventIdStr + eventStr + dataStr;
        controller.enqueue(new TextEncoder().encode(message));
      };

      // 支持重连时的历史数据恢复
      const restoreFromLastEventId = async () => {
        if (lastEventId) {
          const missedLogs = await getLogsSinceEventId(
            executionId,
            parseInt(lastEventId),
          );
          for (const log of missedLogs) {
            sendEvent("log", log, ++eventId);
          }
        }
      };

      // 立即执行历史数据恢复
      restoreFromLastEventId();

      // 其他实现...
    },
  });

  return new Response(stream, { headers });
}
```

## 流式响应

### 1. 使用 ReadableStream 实现流式响应

```typescript
// app/api/admin/data/export/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "json";

  // 创建异步生成器
  async function* dataGenerator() {
    const encoder = new TextEncoder();

    // 流式处理大量数据
    const batchSize = 100;
    let offset = 0;

    yield encoder.encode(`{"data": [`);

    let isFirst = true;
    while (true) {
      const batch = await getDataBatch(offset, batchSize);

      if (batch.length === 0) break;

      for (const item of batch) {
        if (!isFirst) {
          yield encoder.encode(",");
        }
        yield encoder.encode(JSON.stringify(item));
        isFirst = false;
      }

      offset += batchSize;
    }

    yield encoder.encode(`]}`);
  }

  // 转换为 ReadableStream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of dataGenerator()) {
          controller.enqueue(chunk);
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="export.${format}"`,
    },
  });
}
```

### 2. 流式 JSON 解析

```typescript
// 处理大型 JSON 数据的流式解析
import { StreamingJsonParser } from "streaming-json-parser";

export async function POST(request: NextRequest) {
  const parser = new StreamingJsonParser();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = request.body?.getReader();

      if (!reader) {
        controller.error(new Error("No request body"));
        return;
      }

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          // 增量解析 JSON
          const chunks = parser.parse(value);

          for (const chunk of chunks) {
            // 处理每个完整的 JSON 对象
            const processed = await processChunk(chunk);
            controller.enqueue(
              new TextEncoder().encode(JSON.stringify(processed) + "\n"),
            );
          }
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson" },
  });
}
```

## TypeScript 类型安全

### 1. 严格类型定义

```typescript
// types/api.ts
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ScraperTaskExecution {
  id: string;
  taskDefinitionId: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
  startedAt: Date;
  completedAt?: Date;
  metrics?: Record<string, any>;
  errorMessage?: string;
}

export interface ScraperTaskLog {
  id: string;
  executionId: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}
```

### 2. 请求验证架构

```typescript
// schemas/scraper.ts
import { z } from "zod";

export const CreateTaskSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  targetSite: z.enum(["Mytheresa", "Italist", "Yoox", "Farfetch", "Cettire"]),
  startUrls: z.array(z.string().url()).min(1),
  cronExpression: z.string().regex(/^[\d\*\-\,\/\s]+$/),
  maxRequests: z.number().int().min(1).max(10000).default(1000),
  maxLoadClicks: z.number().int().min(0).max(100).default(10),
  maxProducts: z.number().int().min(1).max(50000).default(5000),
  isEnabled: z.boolean().default(true),
  isDebugModeEnabled: z.boolean().default(false),
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

export const ExecuteTaskSchema = z.object({
  taskId: z.string().cuid(),
  priority: z.enum(["LOW", "NORMAL", "HIGH"]).default("NORMAL"),
  overrides: z
    .object({
      maxRequests: z.number().int().min(1).max(10000).optional(),
      maxProducts: z.number().int().min(1).max(50000).optional(),
    })
    .optional(),
});

export type CreateTaskRequest = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskRequest = z.infer<typeof UpdateTaskSchema>;
export type ExecuteTaskRequest = z.infer<typeof ExecuteTaskSchema>;
```

### 3. 类型安全的 API 客户端

```typescript
// lib/api-client.ts
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = "/api") {
    this.baseUrl = baseUrl;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(response.status, error.message || "Request failed");
    }

    return response.json();
  }

  // 类型安全的方法
  async getTasks(
    params: GetTasksParams = {},
  ): Promise<PaginatedResponse<ScraperTaskExecution>> {
    const searchParams = new URLSearchParams(
      Object.entries(params).filter(([_, value]) => value !== undefined),
    );

    return this.request(`/admin/scraper-tasks?${searchParams}`);
  }

  async createTask(
    data: CreateTaskRequest,
  ): Promise<ApiResponse<ScraperTaskExecution>> {
    return this.request("/admin/scraper-tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async streamLogs(executionId: string): Promise<EventSource> {
    return new EventSource(
      `${this.baseUrl}/admin/scraper-tasks/logs/stream?executionId=${executionId}`,
    );
  }
}

export const apiClient = new ApiClient();
```

## 错误处理

### 1. 全局错误处理

```typescript
// lib/error-handler.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string,
    public errors: Record<string, string[]>,
  ) {
    super(400, message, "VALIDATION_ERROR");
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error("API Error:", error);

  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.errors,
      },
      { status: error.status },
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.status },
    );
  }

  // 未知错误
  return NextResponse.json(
    {
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    },
    { status: 500 },
  );
}
```

### 2. 错误边界包装器

```typescript
// lib/with-error-handling.ts
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

// 使用示例
export const GET = withErrorHandling(async (request: NextRequest) => {
  // 业务逻辑
  const data = await getTasksFromDB();
  return NextResponse.json(data);
});
```

## 性能优化

### 1. 响应缓存

```typescript
// app/api/admin/scraper-tasks/route.ts
export const revalidate = 60; // 60秒缓存

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cacheKey = `tasks-${searchParams.toString()}`;

  // 尝试从缓存获取
  const cached = await getFromCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        "Cache-Control": "public, max-age=60",
        "X-Cache": "HIT",
      },
    });
  }

  // 获取新数据
  const data = await getTasksFromDB();

  // 存储到缓存
  await setCache(cacheKey, data, 60);

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=60",
      "X-Cache": "MISS",
    },
  });
}
```

### 2. 数据库查询优化

```typescript
// lib/db-queries.ts
export async function getTasksWithPagination(options: {
  page: number;
  limit: number;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const {
    page,
    limit,
    status,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = options;

  const where: Prisma.ScraperTaskExecutionWhereInput = {};

  if (status) {
    where.status = status as any;
  }

  // 使用 Promise.all 并行查询
  const [tasks, total] = await Promise.all([
    db.scraperTaskExecution.findMany({
      where,
      include: {
        taskDefinition: {
          select: {
            id: true,
            name: true,
            targetSite: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.scraperTaskExecution.count({ where }),
  ]);

  return {
    data: tasks,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
```

### 3. 连接池优化

```typescript
// lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "info", "warn", "error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // 连接池配置
    connectionLimit: 10,
    poolTimeout: 60000,
    transactionOptions: {
      maxWait: 5000,
      timeout: 10000,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
```

## 安全性考虑

### 1. 输入验证和清理

```typescript
// lib/validation.ts
import { z } from "zod";
import DOMPurify from "dompurify";

export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}

export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): T {
  const parsed = schema.parse(data);

  // 递归清理字符串字段
  function sanitizeObject(obj: any): any {
    if (typeof obj === "string") {
      return sanitizeInput(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === "object") {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  }

  return sanitizeObject(parsed);
}
```

### 2. 访问控制

```typescript
// lib/auth.ts
import { NextRequest } from "next/server";
import { verify } from "jsonwebtoken";

export interface UserContext {
  userId: string;
  role: "ADMIN" | "USER";
  permissions: string[];
}

export async function authenticate(request: NextRequest): Promise<UserContext> {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "No authentication token provided");
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET!) as any;

    // 验证用户是否仍然有效
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      include: { permissions: true },
    });

    if (!user || !user.isActive) {
      throw new ApiError(401, "User not found or inactive");
    }

    return {
      userId: user.id,
      role: user.role,
      permissions: user.permissions.map((p) => p.name),
    };
  } catch (error) {
    throw new ApiError(401, "Invalid authentication token");
  }
}

export function requirePermission(permission: string) {
  return (context: UserContext) => {
    if (!context.permissions.includes(permission)) {
      throw new ApiError(403, `Permission '${permission}' required`);
    }
  };
}
```

### 3. 速率限制

```typescript
// lib/rate-limiter.ts
import { NextRequest } from "next/server";

interface RateLimitConfig {
  windowMs: number; // 时间窗口(毫秒)
  maxRequests: number; // 最大请求数
  keyGenerator?: (request: NextRequest) => string;
}

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(config: RateLimitConfig) {
  return async (request: NextRequest) => {
    const key = config.keyGenerator
      ? config.keyGenerator(request)
      : request.ip || "unknown";

    const now = Date.now();
    const windowStart = now - config.windowMs;

    // 清理过期记录
    for (const [k, v] of requestCounts.entries()) {
      if (v.resetTime < now) {
        requestCounts.delete(k);
      }
    }

    const current = requestCounts.get(key) || {
      count: 0,
      resetTime: now + config.windowMs,
    };

    if (current.count >= config.maxRequests) {
      throw new ApiError(429, "Too many requests");
    }

    current.count++;
    requestCounts.set(key, current);
  };
}

// 使用示例
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  maxRequests: 100,
  keyGenerator: (req) =>
    req.headers.get("x-forwarded-for") || req.ip || "unknown",
});
```

## 实时日志系统实现

### 1. 完整的实时日志 API

```typescript
// app/api/admin/scraper-tasks/logs/stream/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { ScraperLogLevel } from "@prisma/client";
import { db } from "@/lib/db";
import { authenticate } from "@/lib/auth";

const StreamLogsQuerySchema = z.object({
  executionId: z.string().cuid(),
  level: z.nativeEnum(ScraperLogLevel).optional(),
  lastTimestamp: z.string().optional(),
  includeContext: z.boolean().optional().default(false),
});

export async function GET(request: NextRequest) {
  try {
    // 身份验证
    const userContext = await authenticate(request);

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = StreamLogsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: "Invalid parameters" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { executionId, level, lastTimestamp, includeContext } =
      validation.data;

    // 验证执行权限
    const execution = await db.scraperTaskExecution.findUnique({
      where: { id: executionId },
      include: { taskDefinition: true },
    });

    if (!execution) {
      return new Response(JSON.stringify({ error: "Execution not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 设置SSE头部
    const headers = new Headers({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });

    const stream = new ReadableStream({
      start(controller) {
        let intervalId: NodeJS.Timeout;
        let heartbeatId: NodeJS.Timeout;
        let lastSentTimestamp = lastTimestamp
          ? new Date(lastTimestamp)
          : new Date(0);
        let isActive = true;

        const encoder = new TextEncoder();

        const sendEvent = (event: string, data: any) => {
          if (!isActive) return;

          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        const sendHeartbeat = () => {
          if (!isActive) return;
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        };

        // 发送连接确认
        sendEvent("connected", {
          executionId,
          timestamp: new Date().toISOString(),
          taskName: execution.taskDefinition.name,
        });

        // 查询新日志
        const pollLogs = async () => {
          if (!isActive) return;

          try {
            const whereClause: any = {
              executionId,
              timestamp: { gt: lastSentTimestamp },
            };

            if (level) {
              whereClause.level = level;
            }

            const newLogs = await db.scraperTaskLog.findMany({
              where: whereClause,
              orderBy: { timestamp: "asc" },
              take: 50, // 限制单次查询数量
              select: {
                id: true,
                level: true,
                message: true,
                timestamp: true,
                ...(includeContext && { context: true }),
              },
            });

            if (newLogs.length > 0) {
              sendEvent("logs", newLogs);
              lastSentTimestamp = newLogs[newLogs.length - 1].timestamp;
            }

            // 检查执行状态
            const currentExecution = await db.scraperTaskExecution.findUnique({
              where: { id: executionId },
              select: { status: true, completedAt: true, errorMessage: true },
            });

            if (currentExecution) {
              const isFinished = ["COMPLETED", "FAILED", "CANCELLED"].includes(
                currentExecution.status,
              );

              sendEvent("status", {
                status: currentExecution.status,
                completedAt: currentExecution.completedAt,
                errorMessage: currentExecution.errorMessage,
                isFinished,
              });

              if (isFinished) {
                cleanup();
              }
            }
          } catch (error) {
            console.error("SSE polling error:", error);
            sendEvent("error", {
              message: "Failed to fetch logs",
              timestamp: new Date().toISOString(),
            });
          }
        };

        // 清理函数
        const cleanup = () => {
          isActive = false;
          if (intervalId) clearInterval(intervalId);
          if (heartbeatId) clearInterval(heartbeatId);

          sendEvent("close", {
            reason: "Stream closed",
            timestamp: new Date().toISOString(),
          });

          controller.close();
        };

        // 立即执行一次
        pollLogs();

        // 设置定时器
        intervalId = setInterval(pollLogs, 2000); // 每2秒检查
        heartbeatId = setInterval(sendHeartbeat, 30000); // 每30秒心跳

        // 处理客户端断开
        request.signal.addEventListener("abort", cleanup);

        // 最大连接时间 (1小时)
        setTimeout(cleanup, 60 * 60 * 1000);
      },
    });

    return new Response(stream, { headers });
  } catch (error) {
    console.error("Stream logs error:", error);
    return new Response(JSON.stringify({ error: "Stream creation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
```

### 2. 客户端实时日志组件

```typescript
// components/realtime-logs.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { ScraperLogLevel } from '@prisma/client';

interface LogEntry {
  id: string;
  level: ScraperLogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

interface RealtimeLogsProps {
  executionId: string;
  level?: ScraperLogLevel;
  onStatusChange?: (status: string) => void;
}

export function RealtimeLogs({ executionId, level, onStatusChange }: RealtimeLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ executionId });
    if (level) params.append('level', level);

    const eventSource = new EventSource(`/api/admin/scraper-tasks/logs/stream?${params}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.addEventListener('connected', (event) => {
      const data = JSON.parse(event.data);
      console.log('Connected to log stream:', data);
    });

    eventSource.addEventListener('logs', (event) => {
      const newLogs = JSON.parse(event.data) as LogEntry[];
      setLogs(prev => [...prev, ...newLogs]);
    });

    eventSource.addEventListener('status', (event) => {
      const data = JSON.parse(event.data);
      onStatusChange?.(data.status);

      if (data.isFinished) {
        eventSource.close();
        setIsConnected(false);
      }
    });

    eventSource.addEventListener('error', (event) => {
      const data = JSON.parse(event.data);
      setError(data.message);
    });

    eventSource.addEventListener('close', (event) => {
      const data = JSON.parse(event.data);
      console.log('Stream closed:', data.reason);
      setIsConnected(false);
    });

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setError('Connection error');
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [executionId, level, onStatusChange]);

  const reconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    // 重新创建连接...
  };

  return (
    <div className="realtime-logs">
      <div className="connection-status">
        {isConnected ? (
          <span className="connected">● Connected</span>
        ) : (
          <span className="disconnected">● Disconnected</span>
        )}
        {error && <span className="error">{error}</span>}
        {!isConnected && (
          <button onClick={reconnect} className="reconnect-btn">
            Reconnect
          </button>
        )}
      </div>

      <div className="logs-container">
        {logs.map((log) => (
          <div key={log.id} className={`log-entry level-${log.level.toLowerCase()}`}>
            <span className="timestamp">{new Date(log.timestamp).toLocaleTimeString()}</span>
            <span className={`level level-${log.level.toLowerCase()}`}>{log.level}</span>
            <span className="message">{log.message}</span>
            {log.context && (
              <details className="context">
                <summary>Context</summary>
                <pre>{JSON.stringify(log.context, null, 2)}</pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 总结

本文档涵盖了基于 Next.js 15+ 和 TypeScript 的后端开发最佳实践，包括：

1. **类型安全的 API 路由**：使用 Zod 进行验证，TypeScript 提供编译时类型检查
2. **高性能的实时通信**：通过 SSE 实现实时日志流，支持自动重连和错误处理
3. **安全性考虑**：输入验证、访问控制、速率限制等安全措施
4. **性能优化**：缓存策略、数据库查询优化、连接池管理
5. **错误处理**：统一的错误处理机制和用户友好的错误消息

遵循这些最佳实践将帮助我们构建一个可靠、高性能和易于维护的后端系统。
