import { useState, useEffect, useCallback, useRef } from "react";

import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const toastRef = useRef(toast); // 保持 toast 引用稳定

  toastRef.current = toast;

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
      const message = err instanceof Error ? err.message : "获取页面列表失败";

      setError(message);
      toastRef.current({
        title: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []); // 依赖为空，只在 Hook 初始化时创建一次

  // 在 Hook 挂载时获取初始数据
  useEffect(() => {
    fetchPages();
  }, [fetchPages]); // 依赖 fetchPages

  // 获取单个页面 (此功能似乎未在 PagesPage 中使用，但保留)
  const fetchPage = useCallback(async (id: string): Promise<Page | null> => {
    // 单个获取时，可以不全局 isLoading，或者引入局部 loading 状态
    try {
      const response = await fetch(`/api/pages/${id}`);

      if (!response.ok) {
        throw new Error(`获取页面详情失败: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : "获取页面详情失败";

      toastRef.current({
        title: message,
        variant: "destructive",
      });
      // 返回 null 或抛出错误，取决于调用处的期望

      return null;
    }
  }, []);

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
        toastRef.current({
          title: "页面创建成功",
          variant: "success",
        });

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "创建页面失败";

        toastRef.current({
          title: message,
          variant: "destructive",
        });

        return null;
      }
    },
    [], // 依赖为空
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
        toastRef.current({
          title: "页面更新成功",
          variant: "success",
        });

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "更新页面失败";

        toastRef.current({
          title: message,
          variant: "destructive",
        });

        return null;
      }
    },
    [], // 依赖为空
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
        toastRef.current({
          title: "页面删除成功",
          variant: "success",
        });

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "删除页面失败";

        toastRef.current({
          title: message,
          variant: "destructive",
        });

        return false;
      }
    },
    [], // 依赖为空
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
