import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
// 导入 useTranslations
// 添加 sonner 的 toast 导入
import { toast } from "sonner";

// 页面类型定义
export type Page = {
  id: string;
  title: string;
  url: string;
  content: string | null;
  mainImage: string | null;
  status: "Published" | "Draft";
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

type CreatePageData = {
  title: string;
  url: string;
  content?: string;
  mainImage?: string;
  status: "Published" | "Draft";
};

type UpdatePageData = Partial<CreatePageData>;

// 重构后的 usePages Hook
export function usePages() {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // 初始设为 true
  const [error, setError] = useState<string | null>(null);
  // 使用 useTranslations
  const t = useTranslations("pages");
  // 移除 useToast 调用和 useRef
  // const { toast } = useToast();
  // const toastRef = useRef(toast); // 保持 toast 引用稳定

  // toastRef.current = toast;

  // 获取所有页面
  const fetchPages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/pages");

      if (!response.ok) {
        throw new Error(`获取页面失败: ${response.status}`);
      }

      const data = await response.json();

      setPages(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("messages.fetchError"); // 使用翻译

      setError(message);
      toast.error(message); // 错误消息优先显示 API 返回的，或翻译后的默认错误
    } finally {
      setIsLoading(false);
    }
  }, [t]); // 添加 t 依赖

  // 在 Hook 挂载时获取初始数据
  useEffect(() => {
    fetchPages();
  }, [fetchPages]); // 依赖 fetchPages

  // 获取单个页面 (此功能似乎未在 PagesPage 中使用，但保留)
  const fetchPage = useCallback(
    async (id: string): Promise<Page | null> => {
      // 单个获取时，可以不全局 isLoading，或者引入局部 loading 状态
      try {
        const response = await fetch(`/api/pages/${id}`);

        if (!response.ok) {
          throw new Error(`获取页面详情失败: ${response.status}`);
        }

        return await response.json();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t("messages.fetchDetailError"); // 使用翻译

        toast.error(message); // 错误消息优先显示 API 返回的，或翻译后的默认错误
        // 返回 null 或抛出错误，取决于调用处的期望

        return null;
      }
    },
    [t],
  ); // 添加 t 依赖

  // 创建页面
  const createPage = useCallback(
    async (pageData: CreatePageData): Promise<Page | null> => {
      // 可以添加局部 submitting 状态
      try {
        const response = await fetch("/api/pages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pageData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "创建页面失败");
        }

        // 更新本地状态
        setPages((prevPages) => [...prevPages, data]);
        toast.success(t("messages.createSuccess")); // 使用翻译

        return data;
      } catch (err) {
        // API 返回的错误优先，否则使用翻译
        const message =
          err instanceof Error && err.message
            ? err.message
            : t("messages.createError");

        toast.error(message);

        return null;
      }
    },
    [t], // 添加 t 依赖
  );

  // 更新页面
  const updatePage = useCallback(
    async (id: string, pageData: UpdatePageData): Promise<Page | null> => {
      // 可以添加局部 submitting 状态
      try {
        const response = await fetch(`/api/pages/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pageData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "更新页面失败");
        }

        // 更新本地状态
        setPages((prevPages) =>
          prevPages.map((page) => (page.id === id ? data : page)),
        );
        toast.success(t("messages.updateSuccess")); // 使用翻译

        return data;
      } catch (err) {
        // API 返回的错误优先，否则使用翻译
        const message =
          err instanceof Error && err.message
            ? err.message
            : t("messages.updateError");

        toast.error(message);

        return null;
      }
    },
    [t], // 添加 t 依赖
  );

  // 删除页面
  const deletePage = useCallback(
    async (id: string): Promise<boolean> => {
      // 可以添加局部 deleting 状态
      try {
        const response = await fetch(`/api/pages/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({})); // 尝试解析错误信息

          throw new Error(data?.error || "删除页面失败");
        }

        // 更新本地状态
        setPages((prevPages) => prevPages.filter((page) => page.id !== id));
        toast.success(t("messages.deleteSuccess")); // 使用翻译

        return true;
      } catch (err) {
        // API 返回的错误优先，否则使用翻译
        const message =
          err instanceof Error && err.message
            ? err.message
            : t("messages.deleteError");

        toast.error(message);

        return false;
      }
    },
    [t], // 添加 t 依赖
  );

  // 切换页面状态
  const togglePageStatus = useCallback(
    async (
      id: string,
      currentStatus: "Published" | "Draft",
    ): Promise<Page | null> => {
      const newStatus = currentStatus === "Published" ? "Draft" : "Published";

      // 直接调用 updatePage 来处理状态切换
      return updatePage(id, { status: newStatus });
    },
    [updatePage], // 依赖 updatePage
  );

  return {
    pages,
    isLoading,
    error,
    fetchPages, // 可以暴露给外部用于手动刷新
    fetchPage,
    createPage,
    updatePage,
    deletePage,
    togglePageStatus,
  };
}
