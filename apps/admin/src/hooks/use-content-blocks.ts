import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";
import { toast } from "sonner";

import type { ContentBlockAdminUI } from "@/app/[locale]/content-management/page";
import type { ContentBlockFormValues } from "@/components/content-blocks/ContentBlockForm";

// API 响应类型定义
export interface ContentBlockListResponse {
  data: ContentBlockAdminUI[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 创建时不需要 id，更新时 id 在 URL 中
type ContentBlockCreateData = Omit<ContentBlockFormValues, "id">;
type ContentBlockUpdateData = ContentBlockFormValues;

export function useContentBlocks() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("contentManagement.hooks");
  const commonT = useTranslations("common");

  const handleApiError = useCallback(
    async (response: Response, defaultErrorKey: string) => {
      if (!response.ok) {
        try {
          const errorData = await response.json();
          const specificMessage =
            errorData.error || errorData.details?.[0]?.message;
          const message =
            specificMessage ||
            t(defaultErrorKey) ||
            commonT("errors.unknownApiError");

          setError(message);
          toast.error(message);

          return Promise.reject(new Error(message));
        } catch {
          const message =
            t(defaultErrorKey) || commonT("errors.unknownApiError");

          setError(message);
          toast.error(message);

          return Promise.reject(new Error(message));
        }
      }

      return response;
    },
    [t, commonT],
  );

  const fetchContentBlocks = useCallback(
    async (params?: URLSearchParams): Promise<ContentBlockListResponse> => {
      setIsLoading(true);
      setError(null);
      try {
        const queryString = params ? `?${params.toString()}` : "";
        const response = await fetch(`/api/admin/content-blocks${queryString}`);

        await handleApiError(response, "fetchListError");
        const result: ContentBlockListResponse = await response.json();

        // 确保 meta 字段存在
        if (!result.meta) {
          return {
            ...result,
            meta: {
              total: result.data.length,
              page: 1,
              limit: result.data.length || 10,
              totalPages: 1,
            },
          };
        }

        return result;
      } catch (err) {
        return Promise.reject(err);
      } finally {
        setIsLoading(false);
      }
    },
    [handleApiError],
  );

  const fetchContentBlock = useCallback(
    async (id: string): Promise<ContentBlockAdminUI | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/admin/content-blocks/${id}`);

        if (response.status === 404) {
          toast.error(t("fetchSingleErrorNotFound"));
          setError(t("fetchSingleErrorNotFound"));

          return null;
        }
        await handleApiError(response, "fetchSingleError");

        return await response.json();
      } catch (err) {
        return Promise.reject(err);
      } finally {
        setIsLoading(false);
      }
    },
    [handleApiError, t],
  );

  const createContentBlock = useCallback(
    async (data: ContentBlockCreateData): Promise<ContentBlockAdminUI> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/admin/content-blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        await handleApiError(response, "createError");

        return await response.json();
      } catch (err) {
        return Promise.reject(err);
      } finally {
        setIsLoading(false);
      }
    },
    [handleApiError],
  );

  const updateContentBlock = useCallback(
    async (
      id: string,
      data: ContentBlockUpdateData,
    ): Promise<ContentBlockAdminUI> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/admin/content-blocks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        await handleApiError(response, "updateError");

        return await response.json();
      } catch (err) {
        return Promise.reject(err);
      } finally {
        setIsLoading(false);
      }
    },
    [handleApiError],
  );

  const deleteContentBlock = useCallback(
    async (id: string): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/admin/content-blocks/${id}`, {
          method: "DELETE",
        });

        await handleApiError(response, "deleteError");
      } catch (err) {
        return Promise.reject(err);
      } finally {
        setIsLoading(false);
      }
    },
    [handleApiError],
  );

  return {
    isLoading,
    error,
    fetchContentBlocks,
    fetchContentBlock,
    createContentBlock,
    updateContentBlock,
    deleteContentBlock,
  };
}

// i18n keys:
// contentManagement.hooks.fetchListError
// contentManagement.hooks.fetchSingleError
// contentManagement.hooks.fetchSingleErrorNotFound
// contentManagement.hooks.createError
// contentManagement.hooks.updateError
// contentManagement.hooks.deleteError
// common.errors.unknownApiError
