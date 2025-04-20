import { useState, useEffect, useCallback } from "react";
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

// 页面Hook
export function usePages() {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // 获取所有页面
  const fetchPages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/pages");

      if (!response.ok) {
        throw new Error(`获取页面失败: ${response.status}`);
      }

      const data = await response.json();
      setPages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取页面失败");
      toast({
        title: "获取页面列表失败",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // 获取单个页面
  const fetchPage = useCallback(
    async (id: string) => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/pages/${id}`);

        if (!response.ok) {
          throw new Error(`获取页面失败: ${response.status}`);
        }

        return await response.json();
      } catch (err) {
        toast({
          title: "获取页面详情失败",
          variant: "destructive",
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  // 创建页面
  const createPage = useCallback(
    async (pageData: CreatePageData) => {
      try {
        setIsLoading(true);
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

        // 更新页面列表
        setPages((prevPages) => [...prevPages, data]);
        toast({
          title: "页面创建成功",
          variant: "success",
        });
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "创建页面失败";
        toast({
          title: message,
          variant: "destructive",
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  // 更新页面
  const updatePage = useCallback(
    async (id: string, pageData: UpdatePageData) => {
      try {
        setIsLoading(true);
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

        // 更新页面列表
        setPages((prevPages) =>
          prevPages.map((page) => (page.id === id ? data : page)),
        );

        toast({
          title: "页面更新成功",
          variant: "success",
        });
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "更新页面失败";
        toast({
          title: message,
          variant: "destructive",
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  // 删除页面
  const deletePage = useCallback(
    async (id: string) => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/pages/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "删除页面失败");
        }

        // 更新页面列表
        setPages((prevPages) => prevPages.filter((page) => page.id !== id));
        toast({
          title: "页面删除成功",
          variant: "success",
        });
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "删除页面失败";
        toast({
          title: message,
          variant: "destructive",
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  // 切换页面状态（草稿/发布）
  const togglePageStatus = useCallback(
    async (id: string, currentStatus: "Published" | "Draft") => {
      const newStatus = currentStatus === "Published" ? "Draft" : "Published";
      return updatePage(id, { status: newStatus });
    },
    [updatePage],
  );

  // 初始加载
  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  return {
    pages,
    isLoading,
    error,
    fetchPages,
    fetchPage,
    createPage,
    updatePage,
    deletePage,
    togglePageStatus,
  };
}
