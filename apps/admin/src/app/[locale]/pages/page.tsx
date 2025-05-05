"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MoreHorizontal, Plus, Loader2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
  Input,
  Textarea,
  DropdownMenuContent,
} from "@/components/ui";
import { usePages, type Page } from "@/hooks/use-pages";

// 页面表单模式
type FormMode = "create" | "edit";

export default function PagesPage() {
  const t = useTranslations("pages");

  // 页面表单校验规则
  const PageFormSchema = z.object({
    title: z.string().min(1, t("validation.titleRequired")),
    url: z.string().min(1, t("validation.urlRequired")),
    content: z.string().optional(),
    mainImage: z.string().optional(),
    status: z.enum(["Published", "Draft"]),
  });

  type PageFormValues = z.infer<typeof PageFormSchema>;

  // 创建页面数据类型，确保必填字段
  type CreatePageData = {
    title: string;
    url: string;
    content?: string;
    mainImage?: string;
    status: "Published" | "Draft";
  };

  // 直接调用 usePages hook 并解构
  const {
    pages,
    isLoading,
    createPage,
    updatePage,
    deletePage,
    togglePageStatus,
  } = usePages();

  // 状态管理（虽然目前未使用选择功能，但保留以便将来实现）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_selectedKeys, _setSelectedKeys] = useState<Set<string>>(new Set([]));
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sortDescriptor, _setSortDescriptor] = useState({
    column: "updatedAt",
    direction: "descending",
  });

  // 模态框状态
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const onDeleteOpen = () => setIsDeleteOpen(true);
  const onDeleteClose = () => setIsDeleteOpen(false);

  // 表单
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PageFormValues>({
    resolver: zodResolver(PageFormSchema),
    defaultValues: {
      title: "",
      url: "",
      content: "",
      status: "Draft",
    },
  });

  // 状态样式映射
  const statusStyleMap = useMemo(
    () => ({
      Published: "bg-green-50 text-green-700",
      Draft: "bg-yellow-50 text-yellow-700",
    }),
    [],
  );

  // 表格列定义
  const columns = useMemo(
    () => [
      { name: t("fields.title"), uid: "title", sortable: true },
      { name: t("fields.url"), uid: "url", sortable: true },
      { name: t("fields.mainImage"), uid: "mainImage", sortable: false },
      { name: t("fields.lastUpdated"), uid: "updatedAt", sortable: true },
      { name: t("fields.status"), uid: "status", sortable: true },
      { name: t("fields.actions"), uid: "actions" },
    ],
    [t],
  );

  // 排序处理
  const sortedItems = useMemo(() => {
    return [...pages].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof Page];
      const second = b[sortDescriptor.column as keyof Page];
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [pages, sortDescriptor]);

  // 打开创建页面模态框
  const openCreateModal = useCallback(() => {
    setFormMode("create");
    reset({
      title: "",
      url: "",
      content: "",
      mainImage: "",
      status: "Draft",
    });
    onOpen();
  }, [reset]);

  // 打开编辑页面模态框
  const openEditModal = useCallback(
    (page: Page) => {
      setFormMode("edit");
      setEditingPage(page);

      setValue("title", page.title);
      setValue("url", page.url);
      setValue("content", page.content || "");
      setValue("mainImage", page.mainImage || "");
      setValue("status", page.status as "Published" | "Draft");

      onOpen();
    },
    [setValue],
  );

  // 打开删除确认模态框
  const openDeleteModal = useCallback((page: Page) => {
    setPageToDelete(page);
    onDeleteOpen();
  }, []);

  // 提交表单
  const onSubmit = useCallback(
    async (data: PageFormValues) => {
      try {
        setIsSubmitting(true);

        if (formMode === "create") {
          // 确保创建时所有必填字段都存在
          const createData: CreatePageData = {
            title: data.title,
            url: data.url,
            content: data.content,
            mainImage: data.mainImage,
            status: data.status,
          };

          await createPage(createData);
        } else if (formMode === "edit" && editingPage) {
          await updatePage(editingPage.id, data);
        }

        onClose();
      } catch {
        reset();
      } finally {
        setIsSubmitting(false);
      }
    },
    [formMode, createPage, updatePage, editingPage, reset],
  );

  // 确认删除
  const confirmDelete = useCallback(async () => {
    if (!pageToDelete) return;

    try {
      setIsDeleting(true);
      await deletePage(pageToDelete.id);
      onDeleteClose();
    } catch {
      return;
    } finally {
      setIsDeleting(false);
      setPageToDelete(null);
    }
  }, [pageToDelete, deletePage]);

  // 切换页面状态
  const handleToggleStatus = useCallback(
    async (page: Page) => {
      try {
        await togglePageStatus(page.id, page.status as "Published" | "Draft");
      } catch {
        return;
      }
    },
    [togglePageStatus],
  );

  // 渲染单元格
  const renderCell = useCallback(
    (page: Page, columnKey: React.Key) => {
      switch (columnKey) {
        case "status":
          return (
            <div
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                statusStyleMap[page.status as keyof typeof statusStyleMap]
              }`}
            >
              {page.status === "Published"
                ? t("status.published")
                : t("status.draft")}
            </div>
          );
        case "updatedAt":
          return new Date(page.updatedAt).toLocaleString();
        case "mainImage":
          return page.mainImage ? (
            <div className="w-16 h-16 relative border rounded overflow-hidden">
              <Image
                src={page.mainImage}
                alt={page.title}
                width={64}
                height={64}
                className="object-cover w-full h-full"
                onError={(e) => {
                  // 使用类型断言确保TypeScript理解这是一个有效操作
                  const imgElement = e.target as HTMLImageElement;

                  // 检查是否已应用回退，防止无限循环
                  if (imgElement.getAttribute("data-fallback-applied")) {
                    return;
                  }

                  imgElement.src = "/placeholder-image.jpg";
                  // 标记已应用回退
                  imgElement.setAttribute("data-fallback-applied", "true");
                }}
              />
            </div>
          ) : (
            <span className="text-gray-400">{t("fields.noImage")}</span>
          );
        case "actions":
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">打开菜单</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => openEditModal(page)}>
                    {t("actions.edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleToggleStatus(page)}
                    className={
                      page.status === "Published"
                        ? "text-yellow-600"
                        : "text-green-600"
                    }
                  >
                    {page.status === "Published"
                      ? t("actions.unpublish")
                      : t("actions.publish")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => openDeleteModal(page)}
                  >
                    {t("actions.delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        default:
          return page[columnKey as keyof Page];
      }
    },
    [t, openEditModal, handleToggleStatus, openDeleteModal, statusStyleMap],
  );

  return (
    <div className="flex min-h-screen flex-col">
      <CustomNavbar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
          <div className="flex items-center space-x-2">
            <Button color="primary" onClick={openCreateModal}>
              {t("addPage")}
              <Plus className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Table aria-label={t("title")} className="mt-4">
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableColumn
                    key={column.uid}
                    className={column.uid === "actions" ? "text-right" : ""}
                  >
                    {column.name}
                  </TableColumn>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems.length === 0 ? (
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
                    {columns.map((column) => (
                      <TableCell key={column.uid}>
                        {renderCell(item, column.uid)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* 创建/编辑页面模态框 */}
      <Modal open={isOpen} onOpenChange={setIsOpen}>
        <ModalContent className="sm:max-w-[600px]">
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>
              <ModalTitle>
                {formMode === "create" ? t("createPage") : t("editPage")}
              </ModalTitle>
            </ModalHeader>
            <div className="p-6 pt-0 pb-0">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    {t("fields.title")}
                  </label>
                  <Input
                    id="title"
                    placeholder={t("placeholders.title")}
                    {...register("title")}
                    className={errors.title ? "border-red-500" : ""}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <label htmlFor="url" className="text-sm font-medium">
                    {t("fields.url")}
                  </label>
                  <Input
                    id="url"
                    placeholder={t("placeholders.url")}
                    {...register("url")}
                    className={errors.url ? "border-red-500" : ""}
                  />
                  {errors.url && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.url.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <label htmlFor="content" className="text-sm font-medium">
                    {t("fields.content")}
                  </label>
                  <Textarea
                    id="content"
                    placeholder={t("placeholders.content")}
                    rows={6}
                    {...register("content")}
                  />
                </div>

                <div className="grid gap-2">
                  <label htmlFor="mainImage" className="text-sm font-medium">
                    {t("fields.mainImage")}
                  </label>
                  <Input
                    id="mainImage"
                    placeholder={t("placeholders.mainImage")}
                    {...register("mainImage")}
                  />
                  <p className="text-xs text-gray-500">
                    {t("placeholders.mainImageHelp")}
                  </p>
                  {watch("mainImage") && (
                    <div className="mt-2">
                      <p className="text-xs mb-1">{t("preview")}</p>
                      <div className="w-full h-40 relative border rounded overflow-hidden">
                        <Image
                          src={watch("mainImage")}
                          alt="预览"
                          width={320}
                          height={160}
                          className="object-contain w-full h-full"
                          onError={(e) => {
                            // 使用类型断言确保TypeScript理解这是一个有效操作
                            const imgElement = e.target as HTMLImageElement;

                            // 检查是否已应用回退，防止无限循环
                            if (
                              imgElement.getAttribute("data-fallback-applied")
                            ) {
                              return;
                            }

                            imgElement.src = "/placeholder-image.jpg";
                            // 标记已应用回退
                            imgElement.setAttribute(
                              "data-fallback-applied",
                              "true",
                            );
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <label htmlFor="status" className="text-sm font-medium">
                    {t("fields.status")}
                  </label>
                  <select
                    id="status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue={
                      formMode === "create"
                        ? "Draft"
                        : editingPage?.status || "Draft"
                    }
                    {...register("status")}
                  >
                    <option value="Draft">{t("status.draft")}</option>
                    <option value="Published">{t("status.published")}</option>
                  </select>
                </div>
              </div>
            </div>
            <ModalFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {t("actions.cancel")}
              </Button>
              <Button type="submit" color="primary" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {formMode === "create"
                  ? t("actions.create")
                  : t("actions.save")}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* 删除确认模态框 */}
      <Modal open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{t("confirmDelete")}</ModalTitle>
          </ModalHeader>
          <div className="p-6 pt-0 pb-0">
            <p>{t("deleteConfirmation", { title: pageToDelete?.title })}</p>
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={onDeleteClose}>
              {t("actions.cancel")}
            </Button>
            <Button
              color="danger"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("actions.delete")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
