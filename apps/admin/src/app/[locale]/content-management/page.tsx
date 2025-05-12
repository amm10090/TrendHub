"use client";

import {
  MoreHorizontal,
  Plus,
  Loader2,
  Edit,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState, useEffect } from "react";
import { toast } from "sonner";

import type { ContentBlockFormValues } from "@/components/content-blocks/ContentBlockForm";
import { CustomNavbar } from "@/components/custom-navbar";
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Dialog as Modal,
  DialogContent as ModalContent,
  DialogHeader as ModalHeader,
  DialogFooter as ModalFooter,
  DialogTitle as ModalTitle,
  DropdownMenuContent,
} from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import {
  useContentBlocks,
  type ContentBlockListResponse,
} from "@/hooks/use-content-blocks";

// ContentBlock 类型定义
export interface ContentBlockAdminUI {
  id: string;
  identifier: string;
  name: string;
  type: string;
  description?: string | null;
  isActive: boolean;
  updatedAt: string;
  items?: object[]; // 使用 object[] 替代 any[]
  targetPrimaryCategory?: {
    // 新增
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface SortDescriptor {
  column: keyof ContentBlockAdminUI | undefined;
  direction: "ascending" | "descending" | undefined;
}

// 默认每页显示数量
const ROWS_PER_PAGE = 10;

export default function ContentManagementPage() {
  const t = useTranslations("contentManagement");
  const commonT = useTranslations("common");
  const router = useRouter();

  const {
    isLoading: isHookLoading, // 重命名以避免与组件内部 isLoading 冲突
    error: hookError, // 重命名
    fetchContentBlocks,
    deleteContentBlock,
    updateContentBlock,
  } = useContentBlocks();

  const [contentBlocks, setContentBlocks] = useState<ContentBlockAdminUI[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingTable, setIsLoadingTable] = useState(true); // 用于表格数据加载状态

  const fetchData = useCallback(
    async (currentPage = 1) => {
      setIsLoadingTable(true);
      try {
        const params = new URLSearchParams();

        params.append("page", currentPage.toString());
        params.append("limit", ROWS_PER_PAGE.toString());
        // 可以根据需要添加排序参数: params.append("sort", "updatedAt:desc");

        const response: ContentBlockListResponse =
          await fetchContentBlocks(params);

        setContentBlocks(response.data);
        setTotalPages(response.meta.totalPages);
        setPage(response.meta.page);
      } catch {
        // useContentBlocks hook 内部已用 toast 显示错误
        // console.error("Fetch error in page:", err);
        // 可以在这里设置一个页面级别的错误状态，如果需要
      } finally {
        setIsLoadingTable(false);
      }
    },
    [fetchContentBlocks],
  );

  useEffect(() => {
    fetchData(page);
  }, [fetchData, page]);

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "updatedAt",
    direction: "descending",
  });

  const [isDeleting, setIsDeleting] = useState(false); // 用于删除操作的加载状态
  const [blockToDelete, setBlockToDelete] =
    useState<ContentBlockAdminUI | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const onDeleteOpen = useCallback(() => setIsDeleteOpen(true), []);
  const onDeleteClose = useCallback(() => {
    setIsDeleteOpen(false);
    setBlockToDelete(null);
  }, []);

  const statusVariantMap = useMemo(
    () => ({
      active: "secondary" as const,
      inactive: "outline" as const,
    }),
    [],
  );

  const statusTextMap = useMemo(
    () => ({
      active: commonT("status.active"),
      inactive: commonT("status.inactive"),
    }),
    [commonT],
  );

  const columns = useMemo(
    () => [
      {
        name: t("fields.name"),
        uid: "name" as keyof ContentBlockAdminUI,
        sortable: true,
      },
      {
        name: t("fields.identifier"),
        uid: "identifier" as keyof ContentBlockAdminUI,
        sortable: true,
      },
      {
        name: t("fields.targetPrimaryCategory"),
        uid: "targetPrimaryCategory" as keyof ContentBlockAdminUI,
        sortable: false,
      },
      {
        name: t("fields.type"),
        uid: "type" as keyof ContentBlockAdminUI,
        sortable: true,
      },
      {
        name: t("fields.lastUpdated"),
        uid: "updatedAt" as keyof ContentBlockAdminUI,
        sortable: true,
      },
      {
        name: t("fields.status"),
        uid: "isActive" as keyof ContentBlockAdminUI,
        sortable: true,
      },
      { name: t("fields.actions"), uid: "actions" as const },
    ],
    [t],
  );

  const sortedItems = useMemo(() => {
    if (!sortDescriptor.column || !sortDescriptor.direction)
      return contentBlocks;
    const columnToSort = sortDescriptor.column;

    return [...contentBlocks].sort((a, b) => {
      const first = a[columnToSort];
      const second = b[columnToSort];
      let cmp = 0;

      if (first === null || first === undefined) cmp = -1;
      else if (second === null || second === undefined) cmp = 1;
      else if (first < second) cmp = -1;
      else if (first > second) cmp = 1;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [contentBlocks, sortDescriptor]);

  const openCreatePage = useCallback(() => {
    router.push("./content-management/create");
  }, [router]);

  const openEditPage = useCallback(
    (blockId: string) => {
      router.push(`./content-management/edit/${blockId}`);
    },
    [router],
  );

  const openDeleteModal = useCallback(
    (block: ContentBlockAdminUI) => {
      setBlockToDelete(block);
      onDeleteOpen();
    },
    [onDeleteOpen],
  ); // 确保 onDeleteOpen 在依赖项中

  const confirmDelete = useCallback(async () => {
    if (!blockToDelete) return;
    setIsDeleting(true);
    try {
      await deleteContentBlock(blockToDelete.id);
      onDeleteClose();
      fetchData(page); // 重新获取当前页数据
      toast.success(t("messages.deleteSuccess", { name: blockToDelete.name }));
    } catch {
      // useContentBlocks hook 内部已用 toast 显示错误
      // console.error("Delete error in page:", err);
    } finally {
      setIsDeleting(false);
    }
  }, [blockToDelete, deleteContentBlock, onDeleteClose, t, fetchData, page]);

  const handleToggleStatus = useCallback(
    async (block: ContentBlockAdminUI) => {
      const blockIdToToggle = block.id;

      setContentBlocks((prevBlocks) =>
        prevBlocks.map((b) =>
          b.id === blockIdToToggle ? { ...b, _isTogglingStatus: true } : b,
        ),
      );
      try {
        await updateContentBlock(block.id, {
          isActive: !block.isActive,
        } as ContentBlockFormValues);
        fetchData(page);
        toast.success(
          t("messages.statusToggleSuccess", {
            name: block.name,
            status: block.isActive
              ? commonT("status.inactive")
              : commonT("status.active"),
          }),
        );
      } catch {
        fetchData(page);
      } finally {
        setContentBlocks((prevBlocks) =>
          prevBlocks.map((b) =>
            b.id === blockIdToToggle
              ? { ...b, _isTogglingStatus: undefined }
              : b,
          ),
        );
      }
    },
    [updateContentBlock, t, commonT, fetchData, page],
  );

  const renderCell = useCallback(
    (
      block: ContentBlockAdminUI & { _isTogglingStatus?: boolean },
      columnKey: React.Key,
    ) => {
      const key = columnKey as keyof ContentBlockAdminUI | "actions";
      const isToggling = block._isTogglingStatus;

      switch (key) {
        case "isActive":
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => !isToggling && handleToggleStatus(block)}
              disabled={isToggling}
              className="p-0 h-auto"
            >
              {isToggling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Badge
                  variant={
                    statusVariantMap[block.isActive ? "active" : "inactive"]
                  }
                >
                  {statusTextMap[block.isActive ? "active" : "inactive"]}
                </Badge>
              )}
            </Button>
          );
        case "targetPrimaryCategory":
          return block.targetPrimaryCategory?.name || commonT("notApplicable");
        case "updatedAt":
          return new Date(block.updatedAt).toLocaleString();
        case "type":
          return <Badge variant="secondary">{block.type}</Badge>;
        case "actions":
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">
                      {commonT("actions.openMenu")}
                    </span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => openEditPage(block.id)}
                    disabled={isToggling}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    {commonT("actions.edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => !isToggling && handleToggleStatus(block)}
                    disabled={isToggling}
                  >
                    {isToggling ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : block.isActive ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4 text-yellow-600" />{" "}
                        <span className="text-yellow-600">
                          {commonT("actions.deactivate")}
                        </span>
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4 text-green-600" />{" "}
                        <span className="text-green-600">
                          {commonT("actions.activate")}
                        </span>
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => openDeleteModal(block)}
                    disabled={isToggling}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {commonT("actions.delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        default: {
          const blockValue = block[key as keyof ContentBlockAdminUI];

          if (
            typeof blockValue === "string" ||
            typeof blockValue === "number" ||
            typeof blockValue === "boolean"
          ) {
            return (
              <span
                className="truncate max-w-[150px] sm:max-w-[200px] inline-block"
                title={String(blockValue)}
              >
                {String(blockValue)}
              </span>
            );
          }

          return "";
        }
      }
    },
    [
      commonT,
      openEditPage,
      handleToggleStatus,
      openDeleteModal,
      statusVariantMap,
      statusTextMap,
    ],
  );

  // 分页逻辑
  const onPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      // fetchData(newPage); // fetchData will be called by useEffect on page change
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <CustomNavbar />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t("title")}
          </h2>
          <div className="flex items-center space-x-2">
            <Button color="primary" onClick={openCreatePage}>
              {t("addBlock")}
              <Plus className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {(isLoadingTable && contentBlocks.length === 0) || isHookLoading ? ( // 显示主加载状态，或表格初次加载状态
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : hookError && contentBlocks.length === 0 ? ( // 如果 hook 有错误且无数据
          <div className="text-center py-10 text-red-500">
            {hookError || t("table.fetchError", { error: "Unknown" })}
          </div>
        ) : (
          <>
            <Table aria-label={t("title")} className="mt-4">
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableColumn
                      key={column.uid}
                      className={`${column.uid === "actions" ? "text-right" : ""} ${column.sortable ? "cursor-pointer" : ""}`}
                      onClick={() => {
                        if (column.sortable && column.uid !== "actions") {
                          const sortableColumn =
                            column.uid as keyof ContentBlockAdminUI;

                          setSortDescriptor((prev) => ({
                            column: sortableColumn,
                            direction:
                              prev.column === sortableColumn &&
                              prev.direction === "ascending"
                                ? "descending"
                                : "ascending",
                          }));
                        }
                      }}
                    >
                      {column.name}
                      {sortDescriptor.column === column.uid ? (
                        <span>
                          {sortDescriptor.direction === "ascending"
                            ? " ▲"
                            : " ▼"}
                        </span>
                      ) : null}
                    </TableColumn>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.length === 0 && !isLoadingTable ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="text-center py-6"
                    >
                      {t("table.emptyContent")}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedItems.map((item) => (
                    <TableRow key={item.id}>
                      {columns.map((cc) => (
                        <TableCell key={cc.uid}>
                          {renderCell(item, cc.uid)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
                {/* 如果表格正在加载但已有数据，可以显示一个小的加载指示器覆盖在表格上，或者在分页处显示 */}
                {isLoadingTable && contentBlocks.length > 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="text-center py-6"
                    >
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {/* 分页组件 - 简单实现 */}
            {totalPages > 1 && (
              <div className="mt-4 flex justify-center items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1 || isLoadingTable}
                >
                  {commonT("pagination.previous")}
                </Button>
                <span className="text-sm">
                  {commonT("pagination.pageInfo", {
                    currentPage: page,
                    totalPages,
                  })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages || isLoadingTable}
                >
                  {commonT("pagination.next")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <Modal open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{t("confirmDelete.title")}</ModalTitle>
          </ModalHeader>
          <div className="p-6 pt-0 pb-0">
            <p>
              {t("confirmDelete.message", { name: blockToDelete?.name || "" })}
            </p>
          </div>
          <ModalFooter>
            <Button
              variant="outline"
              onClick={onDeleteClose}
              disabled={isDeleting}
            >
              {commonT("actions.cancel")}
            </Button>
            <Button
              color="danger" // Button 组件可能没有 color prop，通常通过 variant 或 className 控制
              variant="destructive" // 使用 destructive variant
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {commonT("actions.delete")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
