/**
 * FMTC 导航处理器 - 处理登录后的页面导航
 */

import type { Page, ElementHandle } from "playwright";
import type { Log } from "crawlee";
import { delay } from "../../utils.js";

/**
 * 导航结果接口
 */
export interface NavigationResult {
  success: boolean;
  currentUrl?: string;
  error?: string;
}

/**
 * 页面检测结果接口
 */
export interface PageDetectionResult {
  isDashboard: boolean;
  isDirectory: boolean;
  isLoggedIn: boolean;
  currentUrl: string;
  pageTitle: string;
}

/**
 * FMTC 导航处理器类
 */
export class FMTCNavigationHandler {
  private page: Page;
  private log: Log;

  constructor(page: Page, log: Log) {
    this.page = page;
    this.log = log;
  }

  /**
   * 检测当前页面状态
   */
  async detectCurrentPage(): Promise<PageDetectionResult> {
    const currentUrl = this.page.url();
    const pageTitle = await this.page.title();

    this.log.info(`检测当前页面: ${currentUrl}`);

    const result = await this.page.evaluate(() => {
      return {
        // 检测是否登录
        hasUserMenu: !!document.querySelector(
          '.user-menu, .logout, [href*="logout"]',
        ),
        hasNavbar: !!document.querySelector(".navbar, .sidebar, .nav"),

        // 检测是否在仪表盘
        isDashboardPage:
          window.location.pathname.includes("/cp/") &&
          !window.location.pathname.includes("/login"),

        // 检测是否在目录页面
        isDirectoryPage:
          window.location.pathname.includes("/program_directory"),

        // 检测侧边栏导航
        hasSidebar: !!document.querySelector(
          ".navbar-nav, .nav-item, .nav-link",
        ),
        hasLinksToolsMenu: !!document.querySelector(
          '[data-target="#set_3"], [href*="javascript"]',
        ),
        hasDirectoryLink: !!document.querySelector(
          'a[href="/cp/program_directory"], a[href*="program_directory"]',
        ),
      };
    });

    const pageDetection: PageDetectionResult = {
      isDashboard: result.isDashboardPage && !result.isDirectoryPage,
      isDirectory: result.isDirectoryPage,
      isLoggedIn: result.hasUserMenu && result.hasNavbar,
      currentUrl,
      pageTitle,
    };

    this.log.info(`页面检测结果:`, pageDetection);
    return pageDetection;
  }

  /**
   * 模拟人类滚动行为
   */
  async simulateHumanScrolling(): Promise<void> {
    this.log.debug("模拟人类滚动行为");

    // 随机小幅滚动
    const scrollAmount = Math.floor(Math.random() * 300) + 100;
    await this.page.evaluate((amount) => {
      window.scrollBy(0, amount);
    }, scrollAmount);

    await delay(Math.floor(Math.random() * 1000) + 500); // 0.5-1.5秒

    // 滚动回顶部
    await this.page.evaluate(() => {
      window.scrollTo(0, 0);
    });

    await delay(Math.floor(Math.random() * 500) + 300); // 0.3-0.8秒
  }

  /**
   * 模拟鼠标移动到元素
   */
  async simulateMouseMovement(element: ElementHandle): Promise<void> {
    const box = await element.boundingBox();
    if (box) {
      // 先移动到元素附近
      await this.page.mouse.move(
        box.x + box.width / 2 + Math.random() * 20 - 10,
        box.y + box.height / 2 + Math.random() * 20 - 10,
      );
      await delay(Math.floor(Math.random() * 300) + 200);

      // 再移动到元素中心
      await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await delay(Math.floor(Math.random() * 200) + 100);
    }
  }

  /**
   * 展开"Links & Tools"菜单（如果需要）
   */
  async expandLinksToolsMenu(): Promise<boolean> {
    this.log.info("检查并展开 Links & Tools 菜单");

    try {
      // 检查菜单是否已经展开
      const isExpanded = await this.page.evaluate(() => {
        const collapseElement = document.querySelector("#set_3");
        return collapseElement && collapseElement.classList.contains("show");
      });

      if (isExpanded) {
        this.log.info("Links & Tools 菜单已经展开");
        return true;
      }

      // 查找"Links & Tools"菜单触发器
      const menuTrigger = await this.page.$(
        'a[data-target="#set_3"], a[data-toggle="collapse"][data-target="#set_3"]',
      );

      if (!menuTrigger) {
        this.log.warning("未找到 Links & Tools 菜单触发器");
        return false;
      }

      this.log.info("找到 Links & Tools 菜单触发器，准备点击");

      // 滚动到元素可见
      await menuTrigger.scrollIntoViewIfNeeded();
      await delay(500);

      // 模拟鼠标移动
      await this.simulateMouseMovement(menuTrigger);

      // 点击展开菜单
      await menuTrigger.click();
      this.log.info("已点击 Links & Tools 菜单");

      // 等待菜单展开动画
      await delay(1000);

      // 验证菜单是否展开
      const expandedAfterClick = await this.page.evaluate(() => {
        const collapseElement = document.querySelector("#set_3");
        return collapseElement && collapseElement.classList.contains("show");
      });

      if (expandedAfterClick) {
        this.log.info("✅ Links & Tools 菜单展开成功");
        return true;
      } else {
        this.log.warning("⚠️ Links & Tools 菜单可能未完全展开");
        return false;
      }
    } catch {
      this.log.error(`展开 Links & Tools 菜单失败`);
      return false;
    }
  }

  /**
   * 点击Directory链接导航到目录页面
   */
  async navigateToDirectory(): Promise<NavigationResult> {
    this.log.info("开始导航到 Directory 页面");

    try {
      // 1. 检测当前页面状态
      const pageStatus = await this.detectCurrentPage();

      if (!pageStatus.isLoggedIn) {
        return {
          success: false,
          error: "用户未登录，无法访问目录页面",
        };
      }

      if (pageStatus.isDirectory) {
        this.log.info("已经在目录页面");
        return {
          success: true,
          currentUrl: pageStatus.currentUrl,
        };
      }

      if (!pageStatus.isDashboard) {
        this.log.warning("当前不在仪表盘页面，尝试导航到仪表盘");
        await this.page.goto("https://account.fmtc.co/cp/", {
          waitUntil: "networkidle",
          timeout: 30000,
        });
        await delay(2000);
      }

      // 2. 模拟人类行为 - 滚动查看页面
      await this.simulateHumanScrolling();

      // 3. 展开 Links & Tools 菜单
      const menuExpanded = await this.expandLinksToolsMenu();
      if (!menuExpanded) {
        this.log.warning(
          "无法展开 Links & Tools 菜单，尝试直接查找 Directory 链接",
        );
      }

      // 4. 查找并点击 Directory 链接
      this.log.info("查找 Directory 链接");

      // 多种选择器策略
      const directorySelectors = [
        'a[href="/cp/program_directory"]',
        'a[href*="program_directory"]',
        '.nav-link:has-text("Directory")',
        'a:has-text("Directory")',
        '.nav-item a[href*="directory"]',
      ];

      let directoryLink = null;
      for (const selector of directorySelectors) {
        try {
          directoryLink = await this.page.$(selector);
          if (directoryLink) {
            this.log.info(`找到 Directory 链接: ${selector}`);
            break;
          }
        } catch {
          // 继续尝试下一个选择器
        }
      }

      if (!directoryLink) {
        // 备用方案：查找包含"Directory"文本的链接
        directoryLink = await this.page.$(
          'xpath=//a[contains(text(), "Directory")]',
        );
      }

      if (!directoryLink) {
        return {
          success: false,
          error: "未找到 Directory 链接",
        };
      }

      this.log.info("找到 Directory 链接，准备点击");

      // 5. 滚动到链接可见
      await directoryLink.scrollIntoViewIfNeeded();
      await delay(500);

      // 6. 模拟鼠标移动到链接
      await this.simulateMouseMovement(directoryLink);

      // 7. 模拟人类点击行为
      this.log.info("模拟点击 Directory 链接");

      // 监听导航
      const navigationPromise = this.page.waitForURL("**/program_directory**", {
        timeout: 15000,
      });

      // 点击链接
      await directoryLink.click();

      // 等待导航完成
      try {
        await navigationPromise;
        this.log.info("页面导航完成");
      } catch {
        this.log.warning("导航超时，检查当前页面状态");
      }

      // 8. 等待页面加载（使用更宽松的策略）
      try {
        await this.page.waitForLoadState("networkidle", { timeout: 30000 });
      } catch {
        this.log.warning("网络状态等待超时，但继续检查页面状态");
        // 即使网络状态超时，也给页面一些时间稳定
        await delay(3000);
      }

      // 9. 验证是否成功进入目录页面
      const finalPageStatus = await this.detectCurrentPage();

      if (finalPageStatus.isDirectory) {
        this.log.info("✅ 成功导航到 Directory 页面");
        return {
          success: true,
          currentUrl: finalPageStatus.currentUrl,
        };
      } else {
        return {
          success: false,
          currentUrl: finalPageStatus.currentUrl,
          error: `导航失败，当前页面: ${finalPageStatus.currentUrl}`,
        };
      }
    } catch (error) {
      this.log.error(`导航到 Directory 页面失败: ${(error as Error).message}`);
      return {
        success: false,
        error: `导航失败: ${(error as Error).message}`,
      };
    }
  }

  /**
   * 等待页面加载完成
   */
  async waitForPageLoad(timeout: number = 30000): Promise<boolean> {
    try {
      await this.page.waitForLoadState("networkidle", { timeout });
      return true;
    } catch (error) {
      this.log.warning(`等待页面加载超时: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * 检查是否在目标页面
   */
  async isOnDirectoryPage(): Promise<boolean> {
    const pageStatus = await this.detectCurrentPage();
    return pageStatus.isDirectory;
  }

  /**
   * 获取当前页面信息
   */
  async getCurrentPageInfo(): Promise<{ url: string; title: string }> {
    return {
      url: this.page.url(),
      title: await this.page.title(),
    };
  }

  /**
   * 调试：打印页面结构信息
   */
  async debugPageStructure(): Promise<void> {
    this.log.info("调试页面结构...");

    const structure = await this.page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasNavbar: !!document.querySelector(".navbar, .sidebar"),
        navItems: Array.from(document.querySelectorAll(".nav-item")).length,
        hasLinksTools: !!document.querySelector('[data-target="#set_3"]'),
        hasDirectoryLink: !!document.querySelector(
          'a[href*="program_directory"]',
        ),
        allNavLinks: Array.from(document.querySelectorAll(".nav-link")).map(
          (link) => ({
            text: link.textContent?.trim(),
            href: (link as HTMLAnchorElement).href,
            visible: !!(link as HTMLElement).offsetParent,
          }),
        ),
        sidebarHTML: document
          .querySelector(".navbar-nav")
          ?.innerHTML?.substring(0, 500),
      };
    });

    this.log.info("页面结构信息:", structure);
  }
}
