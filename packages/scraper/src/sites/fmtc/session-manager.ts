/**
 * FMTC 爬虫会话管理器
 * 提供会话状态的持久化存储、恢复和验证功能
 */

import { writeFileSync, readFileSync, existsSync, unlinkSync } from "fs";
import { resolve, join } from "path";
import type { BrowserContext, Page } from "playwright";
import type { Log } from "crawlee";

/**
 * 会话管理配置
 */
export interface SessionConfig {
  sessionFile: string;
  maxAge: number; // 会话最大有效期（毫秒）
  autoSave: boolean;
  baseDir?: string; // 基础目录，默认为项目根目录
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

  constructor(log: Log, config?: Partial<SessionConfig>) {
    this.log = log;

    // 默认配置
    const defaultConfig: SessionConfig = {
      sessionFile: "fmtc-session.json",
      maxAge: 4 * 60 * 60 * 1000, // 4小时
      autoSave: true,
      baseDir: this.findProjectRoot(),
    };

    this.config = { ...defaultConfig, ...config };
    this.sessionFilePath = join(
      this.config.baseDir || process.cwd(),
      this.config.sessionFile,
    );

    this.log.debug(`[SessionManager] 会话文件路径: ${this.sessionFilePath}`);
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

      writeFileSync(this.sessionFilePath, JSON.stringify(sessionData, null, 2));
      this.log.info("[SessionManager] 会话状态已保存");
      return true;
    } catch (error) {
      this.log.error("[SessionManager] 保存会话状态失败:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * 加载保存的会话状态
   */
  loadSessionState(username?: string): unknown | null {
    try {
      this.log.debug(`[SessionManager] 检查会话文件: ${this.sessionFilePath}`);

      if (!existsSync(this.sessionFilePath)) {
        this.log.info("[SessionManager] 未找到保存的会话状态");
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
        `[SessionManager] 会话状态检查: 年龄=${ageMinutes}分钟, 最大年龄=${maxAgeMinutes}分钟, 保存用户=${sessionData.username}, 请求用户=${username}`,
      );

      if (age > this.config.maxAge) {
        this.log.info(
          `[SessionManager] 会话状态已过期 (${ageMinutes}分钟前保存，最大允许${maxAgeMinutes}分钟)，将重新登录`,
        );
        this.cleanupSessionState();
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
        this.cleanupSessionState();
        return null;
      }

      this.log.info(
        `[SessionManager] 找到有效的会话状态 (${ageMinutes}分钟前保存，用户: ${sessionData.username})`,
      );
      return sessionData.state;
    } catch (error) {
      this.log.warning("[SessionManager] 加载会话状态失败:", {
        error: error instanceof Error ? error.message : String(error),
      });
      this.cleanupSessionState();
      return null;
    }
  }

  /**
   * 清理会话状态
   */
  cleanupSessionState(): void {
    try {
      if (existsSync(this.sessionFilePath)) {
        unlinkSync(this.sessionFilePath);
        this.log.info("[SessionManager] 已清理会话状态");
      }
    } catch (error) {
      this.log.warning("[SessionManager] 清理会话状态失败:", {
        error: error instanceof Error ? error.message : String(error),
      });
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
   * 更新会话的最后活动时间
   */
  updateLastActivity(): void {
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
      this.log.debug("[SessionManager] 已更新最后活动时间");
    } catch (error) {
      this.log.warning("[SessionManager] 更新最后活动时间失败:", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 获取会话信息
   */
  getSessionInfo(): { exists: boolean; age?: number; username?: string } {
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
      };
    } catch (error) {
      this.log.warning("[SessionManager] 获取会话信息失败:", {
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
      `[SessionManager] 配置已更新，会话文件路径: ${this.sessionFilePath}`,
    );
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
