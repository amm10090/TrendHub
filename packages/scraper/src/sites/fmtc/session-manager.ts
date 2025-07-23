/**
 * FMTC 爬虫会话管理器
 * 提供会话状态的持久化存储、恢复和验证功能
 * 使用数据库存储替代文件系统存储
 */

import { writeFileSync, readFileSync, existsSync, unlinkSync } from "fs";
import { resolve, join } from "path";
import type { BrowserContext, Page } from "playwright";
import type { Log } from "crawlee";
import { PrismaClient, type Prisma } from "@prisma/client";

/**
 * 会话管理配置
 */
export interface SessionConfig {
  sessionFile: string;
  maxAge: number; // 会话最大有效期（毫秒）
  autoSave: boolean;
  baseDir?: string; // 基础目录，默认为项目根目录
  useDatabase?: boolean; // 是否使用数据库存储，默认true
  fallbackToFile?: boolean; // 数据库失败时是否回退到文件存储
}

/**
 * 会话数据结构
 */
export interface SessionData {
  state: unknown; // Playwright 的 storageState
  timestamp: number;
  username?: string;
  metadata?: {
    userAgent?: string;
    lastActivity?: number;
    loginMethod?: string;
  };
}

/**
 * FMTC 会话管理器
 */
export class FMTCSessionManager {
  private config: SessionConfig;
  private log: Log;
  private sessionFilePath: string;
  private prisma: PrismaClient;

  constructor(log: Log, config?: Partial<SessionConfig>) {
    this.log = log;

    // 默认配置
    const defaultConfig: SessionConfig = {
      sessionFile: "fmtc-session.json",
      maxAge: 4 * 60 * 60 * 1000, // 4小时
      autoSave: true,
      baseDir: this.findProjectRoot(),
      useDatabase: true, // 默认使用数据库
      fallbackToFile: true, // 允许回退到文件存储
    };

    this.config = { ...defaultConfig, ...config };
    this.sessionFilePath = join(
      this.config.baseDir || process.cwd(),
      this.config.sessionFile,
    );

    // 初始化 Prisma 客户端
    this.prisma = new PrismaClient();

    this.log.debug(
      `[SessionManager] 使用数据库存储: ${this.config.useDatabase}`,
    );
    if (this.config.fallbackToFile) {
      this.log.debug(`[SessionManager] 备用文件路径: ${this.sessionFilePath}`);
    }
  }

  /**
   * 查找项目根目录
   */
  private findProjectRoot(): string {
    let currentDir = process.cwd();

    // 向上查找，直到找到根目录的标识文件
    while (currentDir !== "/" && currentDir !== ".") {
      // 查找包含 pnpm-workspace.yaml 或 pnpm-lock.yaml 的目录（monorepo 根目录）
      if (
        existsSync(join(currentDir, "pnpm-workspace.yaml")) ||
        existsSync(join(currentDir, "pnpm-lock.yaml"))
      ) {
        this.log.debug(`[SessionManager] 找到项目根目录: ${currentDir}`);
        return currentDir;
      }

      // 查找包含 .git 的目录
      if (existsSync(join(currentDir, ".git"))) {
        this.log.debug(
          `[SessionManager] 通过 .git 找到项目根目录: ${currentDir}`,
        );
        return currentDir;
      }

      // 查找包含 package.json 的目录
      if (existsSync(join(currentDir, "package.json"))) {
        this.log.debug(
          `[SessionManager] 通过 package.json 找到目录: ${currentDir}`,
        );
        return currentDir;
      }

      currentDir = resolve(currentDir, "..");
    }

    this.log.warning(
      `[SessionManager] 未找到项目根目录，使用当前工作目录: ${process.cwd()}`,
    );
    return process.cwd(); // 如果找不到，使用当前工作目录
  }

  /**
   * 保存浏览器会话状态
   */
  async saveSessionState(
    context: BrowserContext,
    username?: string,
  ): Promise<boolean> {
    try {
      this.log.info("[SessionManager] 保存会话状态...");

      const state = await context.storageState();
      const sessionData: SessionData = {
        state,
        timestamp: Date.now(),
        username,
        metadata: {
          lastActivity: Date.now(),
          loginMethod: "fmtc_scraper",
        },
      };

      if (this.config.useDatabase) {
        try {
          return await this.saveSessionToDatabase(sessionData, username);
        } catch (dbError) {
          this.log.error("[SessionManager] 数据库保存失败，尝试文件备份:", {
            error: dbError instanceof Error ? dbError.message : String(dbError),
          });

          if (this.config.fallbackToFile) {
            return this.saveSessionToFile(sessionData);
          }
          return false;
        }
      } else {
        return this.saveSessionToFile(sessionData);
      }
    } catch (error) {
      this.log.error("[SessionManager] 保存会话状态失败:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * 加载保存的会话状态 (异步版本)
   */
  async loadSessionStateAsync(username?: string): Promise<unknown | null> {
    if (this.config.useDatabase) {
      try {
        return await this.loadSessionFromDatabase(username);
      } catch (dbError) {
        this.log.warning("[SessionManager] 数据库加载失败，尝试文件备份:", {
          error: dbError instanceof Error ? dbError.message : String(dbError),
        });

        if (this.config.fallbackToFile) {
          return this.loadSessionFromFile(username);
        }
        return null;
      }
    } else {
      return this.loadSessionFromFile(username);
    }
  }

  /**
   * 加载保存的会话状态 (同步版本，保持向后兼容)
   */
  loadSessionState(username?: string): unknown | null {
    if (this.config.useDatabase) {
      this.log.warning(
        "[SessionManager] 使用数据库存储时建议使用异步方法 loadSessionStateAsync",
      );
      // 对于数据库操作，我们只能返回null并记录警告
      // 真正的会话加载需要使用异步方法
      return null;
    } else {
      return this.loadSessionFromFile(username);
    }
  }

  /**
   * 清理会话状态
   */
  cleanupSessionState(): void {
    if (this.config.useDatabase) {
      this.cleanupSessionFromDatabase();
    }

    if (this.config.fallbackToFile || !this.config.useDatabase) {
      this.cleanupSessionFromFile();
    }
  }

  /**
   * 检查当前是否已登录
   */
  async checkAuthenticationStatus(page: Page): Promise<boolean> {
    try {
      this.log.debug("[SessionManager] 检查认证状态...");

      // 尝试访问受保护的页面
      await page.goto("https://account.fmtc.co/cp/dash", {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      // 等待页面稳定
      await page.waitForTimeout(3000);

      // 检查是否被重定向到登录页
      const currentUrl = page.url();
      const isLoggedIn = !currentUrl.includes("login");

      // 进一步验证页面内容
      if (isLoggedIn) {
        try {
          const pageTitle = await page.title();
          const hasDashboard =
            pageTitle.includes("Dashboard") || pageTitle.includes("FMTC");

          if (hasDashboard) {
            this.log.info("[SessionManager] 认证状态有效，已登录");
            return true;
          }
        } catch (error) {
          this.log.warning("[SessionManager] 页面内容验证失败:", {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      this.log.info("[SessionManager] 认证状态无效，需要重新登录");
      return false;
    } catch (error) {
      this.log.warning("[SessionManager] 认证状态检查失败:", {
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * 验证恢复的会话是否有效
   */
  async validateRestoredSession(page: Page): Promise<boolean> {
    try {
      this.log.info("[SessionManager] 验证恢复的会话...");

      const isValid = await this.checkAuthenticationStatus(page);

      if (!isValid) {
        this.log.info("[SessionManager] 恢复的会话无效，清理会话状态");
        this.cleanupSessionState();
      }

      return isValid;
    } catch (error) {
      this.log.error("[SessionManager] 会话验证失败:", {
        error: error instanceof Error ? error.message : String(error),
      });
      this.cleanupSessionState();
      return false;
    }
  }

  /**
   * 数据库会话保存
   */
  private async saveSessionToDatabase(
    sessionData: SessionData,
    username?: string,
  ): Promise<boolean> {
    if (!username) {
      throw new Error("用户名是数据库存储的必需参数");
    }

    const expiresAt = new Date(Date.now() + this.config.maxAge);

    try {
      await this.prisma.fMTCSession.upsert({
        where: { username },
        create: {
          username,
          sessionState: sessionData.state as Prisma.InputJsonValue,
          expiresAt,
          lastActivityAt: new Date(
            sessionData.metadata?.lastActivity || Date.now(),
          ),
          metadata: sessionData.metadata as Prisma.InputJsonValue,
        },
        update: {
          sessionState: sessionData.state as Prisma.InputJsonValue,
          expiresAt,
          lastActivityAt: new Date(
            sessionData.metadata?.lastActivity || Date.now(),
          ),
          metadata: sessionData.metadata as Prisma.InputJsonValue,
          isActive: true,
        },
      });

      this.log.info("[SessionManager] 会话状态已保存到数据库");
      return true;
    } catch (error) {
      this.log.error("[SessionManager] 数据库保存失败:", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 文件会话保存
   */
  private saveSessionToFile(sessionData: SessionData): boolean {
    try {
      writeFileSync(this.sessionFilePath, JSON.stringify(sessionData, null, 2));
      this.log.info("[SessionManager] 会话状态已保存到文件");
      return true;
    } catch (error) {
      this.log.error("[SessionManager] 文件保存失败:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * 数据库会话加载
   */
  private async loadSessionFromDatabase(
    username?: string,
  ): Promise<unknown | null> {
    if (!username) {
      this.log.info("[SessionManager] 未提供用户名，无法从数据库加载会话");
      return null;
    }

    try {
      // 首先清理过期的会话
      await this.cleanupExpiredSessions();

      const session = await this.prisma.fMTCSession.findUnique({
        where: {
          username,
          isActive: true,
        },
      });

      if (!session) {
        this.log.info("[SessionManager] 数据库中未找到有效会话");
        return null;
      }

      // 检查会话是否过期
      const now = new Date();
      if (session.expiresAt <= now) {
        this.log.info(
          `[SessionManager] 数据库会话已过期 (过期时间: ${session.expiresAt.toISOString()})`,
        );
        await this.cleanupSessionFromDatabase(username);
        return null;
      }

      // 更新最后活动时间
      await this.prisma.fMTCSession.update({
        where: { username },
        data: { lastActivityAt: now },
      });

      const ageMinutes = Math.round(
        (now.getTime() - session.createdAt.getTime()) / 1000 / 60,
      );
      this.log.info(
        `[SessionManager] 从数据库找到有效的会话状态 (${ageMinutes}分钟前创建，用户: ${session.username})`,
      );

      return session.sessionState;
    } catch (error) {
      this.log.error("[SessionManager] 数据库加载失败:", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 文件会话加载
   */
  private loadSessionFromFile(username?: string): unknown | null {
    try {
      this.log.debug(`[SessionManager] 检查会话文件: ${this.sessionFilePath}`);

      if (!existsSync(this.sessionFilePath)) {
        this.log.info("[SessionManager] 未找到保存的会话状态文件");
        return null;
      }

      const sessionData: SessionData = JSON.parse(
        readFileSync(this.sessionFilePath, "utf8"),
      );

      // 检查会话是否过期
      const age = Date.now() - sessionData.timestamp;
      const ageMinutes = Math.round(age / 1000 / 60);
      const maxAgeMinutes = Math.round(this.config.maxAge / 1000 / 60);

      this.log.debug(
        `[SessionManager] 文件会话状态检查: 年龄=${ageMinutes}分钟, 最大年龄=${maxAgeMinutes}分钟, 保存用户=${sessionData.username}, 请求用户=${username}`,
      );

      if (age > this.config.maxAge) {
        this.log.info(
          `[SessionManager] 文件会话状态已过期 (${ageMinutes}分钟前保存，最大允许${maxAgeMinutes}分钟)，将重新登录`,
        );
        this.cleanupSessionFromFile();
        return null;
      }

      // 检查用户名是否匹配
      if (
        username &&
        sessionData.username &&
        sessionData.username !== username
      ) {
        this.log.info(
          `[SessionManager] 用户名不匹配 (保存: ${sessionData.username}, 请求: ${username})，将重新登录`,
        );
        this.cleanupSessionFromFile();
        return null;
      }

      this.log.info(
        `[SessionManager] 从文件找到有效的会话状态 (${ageMinutes}分钟前保存，用户: ${sessionData.username})`,
      );
      return sessionData.state;
    } catch (error) {
      this.log.warning("[SessionManager] 文件加载会话状态失败:", {
        error: error instanceof Error ? error.message : String(error),
      });
      this.cleanupSessionFromFile();
      return null;
    }
  }

  /**
   * 数据库会话清理
   */
  private async cleanupSessionFromDatabase(username?: string): Promise<void> {
    try {
      if (username) {
        await this.prisma.fMTCSession.update({
          where: { username },
          data: { isActive: false },
        });
        this.log.info(
          `[SessionManager] 已清理数据库中用户 ${username} 的会话状态`,
        );
      } else {
        // 清理所有过期会话
        await this.cleanupExpiredSessions();
      }
    } catch (error) {
      this.log.warning("[SessionManager] 清理数据库会话状态失败:", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 文件会话清理
   */
  private cleanupSessionFromFile(): void {
    try {
      if (existsSync(this.sessionFilePath)) {
        unlinkSync(this.sessionFilePath);
        this.log.info("[SessionManager] 已清理文件会话状态");
      }
    } catch (error) {
      this.log.warning("[SessionManager] 清理文件会话状态失败:", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 清理过期的数据库会话
   */
  private async cleanupExpiredSessions(): Promise<void> {
    try {
      const result = await this.prisma.fMTCSession.updateMany({
        where: {
          expiresAt: {
            lte: new Date(),
          },
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      if (result.count > 0) {
        this.log.info(
          `[SessionManager] 已清理 ${result.count} 个过期的数据库会话`,
        );
      }
    } catch (error) {
      this.log.warning("[SessionManager] 清理过期会话失败:", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 更新会话的最后活动时间
   */
  updateLastActivity(username?: string): void {
    if (this.config.useDatabase && username) {
      this.updateLastActivityInDatabase(username);
    } else if (this.config.fallbackToFile || !this.config.useDatabase) {
      this.updateLastActivityInFile();
    }
  }

  /**
   * 数据库中更新最后活动时间
   */
  private async updateLastActivityInDatabase(username: string): Promise<void> {
    try {
      await this.prisma.fMTCSession.update({
        where: { username, isActive: true },
        data: { lastActivityAt: new Date() },
      });
      this.log.debug("[SessionManager] 已更新数据库中的最后活动时间");
    } catch (error) {
      this.log.warning("[SessionManager] 更新数据库中最后活动时间失败:", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 文件中更新最后活动时间
   */
  private updateLastActivityInFile(): void {
    try {
      if (!existsSync(this.sessionFilePath)) {
        return;
      }

      const sessionData: SessionData = JSON.parse(
        readFileSync(this.sessionFilePath, "utf8"),
      );
      sessionData.metadata = sessionData.metadata || {};
      sessionData.metadata.lastActivity = Date.now();

      writeFileSync(this.sessionFilePath, JSON.stringify(sessionData, null, 2));
      this.log.debug("[SessionManager] 已更新文件中的最后活动时间");
    } catch (error) {
      this.log.warning("[SessionManager] 更新文件中最后活动时间失败:", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 获取会话信息
   */
  async getSessionInfo(
    username?: string,
  ): Promise<{
    exists: boolean;
    age?: number;
    username?: string;
    source?: string;
  }> {
    if (this.config.useDatabase && username) {
      try {
        const session = await this.prisma.fMTCSession.findUnique({
          where: { username, isActive: true },
        });

        if (!session) {
          return { exists: false };
        }

        const age = Date.now() - session.createdAt.getTime();
        return {
          exists: true,
          age,
          username: session.username,
          source: "database",
        };
      } catch (error) {
        this.log.warning("[SessionManager] 获取数据库会话信息失败:", {
          error: error instanceof Error ? error.message : String(error),
        });

        if (this.config.fallbackToFile) {
          return this.getSessionInfoFromFile();
        }
        return { exists: false };
      }
    } else {
      return this.getSessionInfoFromFile();
    }
  }

  /**
   * 从文件获取会话信息
   */
  private getSessionInfoFromFile(): {
    exists: boolean;
    age?: number;
    username?: string;
    source?: string;
  } {
    try {
      if (!existsSync(this.sessionFilePath)) {
        return { exists: false };
      }

      const sessionData: SessionData = JSON.parse(
        readFileSync(this.sessionFilePath, "utf8"),
      );
      const age = Date.now() - sessionData.timestamp;

      return {
        exists: true,
        age,
        username: sessionData.username,
        source: "file",
      };
    } catch (error) {
      this.log.warning("[SessionManager] 获取文件会话信息失败:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return { exists: false };
    }
  }

  /**
   * 检查会话是否应该保存
   */
  shouldSaveSession(): boolean {
    return this.config.autoSave;
  }

  /**
   * 设置会话配置
   */
  updateConfig(newConfig: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.sessionFilePath = join(
      this.config.baseDir || process.cwd(),
      this.config.sessionFile,
    );
    this.log.debug(
      `[SessionManager] 配置已更新，使用数据库存储: ${this.config.useDatabase}, 会话文件路径: ${this.sessionFilePath}`,
    );
  }

  /**
   * 关闭Prisma连接
   */
  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.log.debug("[SessionManager] Prisma连接已关闭");
    } catch (error) {
      this.log.warning("[SessionManager] 关闭Prisma连接失败:", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

/**
 * 创建默认的会话管理器
 */
export function createSessionManager(
  log: Log,
  customConfig?: Partial<SessionConfig>,
): FMTCSessionManager {
  return new FMTCSessionManager(log, customConfig);
}

/**
 * 会话管理器单例
 */
let globalSessionManager: FMTCSessionManager | null = null;

/**
 * 获取全局会话管理器实例
 */
export function getSessionManager(
  log: Log,
  config?: Partial<SessionConfig>,
): FMTCSessionManager {
  if (!globalSessionManager) {
    globalSessionManager = createSessionManager(log, config);
  }
  return globalSessionManager;
}

/**
 * 重置全局会话管理器
 */
export function resetSessionManager(): void {
  globalSessionManager = null;
}
