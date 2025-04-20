"use client";

import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Chip,
  Selection,
  SortDescriptor,
  ChipProps,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { MoreHorizontal, Plus, Loader2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { usePages, type Page } from "@/hooks/use-pages";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { CustomNavbar } from "@/components/custom-navbar";

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

  // 获取页面数据和操作方法
  const {
    pages,
    isLoading,
    createPage,
    updatePage,
    deletePage,
    togglePageStatus,
  } = usePages();

  // 状态管理
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "updatedAt",
    direction: "descending",
  });

  // 模态框状态
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null);
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

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

  // 状态标签配置
  const statusColorMap = useMemo(
    () => ({
      Published: "success" as ChipProps["color"],
      Draft: "warning" as ChipProps["color"],
    }),
    [],
  );

  // 表格列定义
  const columns = [
    { name: t("fields.title"), uid: "title", sortable: true },
    { name: t("fields.url"), uid: "url", sortable: true },
    { name: t("fields.mainImage"), uid: "mainImage", sortable: false },
    { name: t("fields.lastUpdated"), uid: "updatedAt", sortable: true },
    { name: t("fields.status"), uid: "status", sortable: true },
    { name: t("fields.actions"), uid: "actions" },
  ];

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
  }, [reset, onOpen]);

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
    [setValue, onOpen],
  );

  // 打开删除确认模态框
  const openDeleteModal = useCallback(
    (page: Page) => {
      setPageToDelete(page);
      onDeleteOpen();
    },
    [onDeleteOpen],
  );

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
      } catch (error) {
        console.error("提交页面表单失败:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formMode, createPage, updatePage, editingPage, onClose],
  );

  // 确认删除
  const confirmDelete = useCallback(async () => {
    if (!pageToDelete) return;

    try {
      setIsDeleting(true);
      await deletePage(pageToDelete.id);
      onDeleteClose();
    } catch (error) {
      console.error("删除页面失败:", error);
    } finally {
      setIsDeleting(false);
      setPageToDelete(null);
    }
  }, [pageToDelete, deletePage, onDeleteClose]);

  // 切换页面状态
  const handleToggleStatus = useCallback(
    async (page: Page) => {
      try {
        await togglePageStatus(page.id, page.status as "Published" | "Draft");
      } catch (error) {
        console.error("切换页面状态失败:", error);
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
            <Chip
              className="capitalize"
              color={statusColorMap[page.status]}
              size="sm"
              variant="flat"
            >
              {page.status === "Published"
                ? t("status.published")
                : t("status.draft")}
            </Chip>
          );
        case "updatedAt":
          return new Date(page.updatedAt).toLocaleString();
        case "mainImage":
          return page.mainImage ? (
            <div className="w-16 h-16 relative border rounded overflow-hidden">
              <img
                src={page.mainImage}
                alt={page.title}
                className="object-cover w-full h-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder-image.jpg";
                }}
              />
            </div>
          ) : (
            <span className="text-gray-400">{t("fields.noImage")}</span>
          );
        case "actions":
          return (
            <div className="flex justify-end">
              <Dropdown>
                <DropdownTrigger>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">打开菜单</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label={t("fields.actions")}>
                  <DropdownItem key="edit" onClick={() => openEditModal(page)}>
                    {t("actions.edit")}
                  </DropdownItem>
                  <DropdownSection showDivider>
                    <DropdownItem
                      key="publish"
                      onClick={() => handleToggleStatus(page)}
                    >
                      {page.status === "Published"
                        ? t("status.unpublish")
                        : t("status.publish")}
                    </DropdownItem>
                    <DropdownItem
                      key="delete"
                      className="text-danger"
                      onClick={() => openDeleteModal(page)}
                    >
                      {t("actions.delete")}
                    </DropdownItem>
                  </DropdownSection>
                </DropdownMenu>
              </Dropdown>
            </div>
          );
        default:
          return page[columnKey as keyof Page];
      }
    },
    [t, openEditModal, openDeleteModal, handleToggleStatus, statusColorMap],
  );

  return (
    <div className="flex min-h-screen flex-col">
      <CustomNavbar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
          <div className="flex items-center space-x-2">
            <Button
              color="primary"
              endContent={<Plus className="h-4 w-4" />}
              onClick={openCreateModal}
            >
              {t("addPage")}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Table
            aria-label={t("title")}
            selectionMode="multiple"
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
            className="mt-4"
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn
                  key={column.uid}
                  align={column.uid === "actions" ? "end" : "start"}
                  allowsSorting={column.sortable}
                >
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              items={sortedItems}
              emptyContent={t("table.emptyContent")}
            >
              {(item) => (
                <TableRow key={item.id}>
                  {(columnKey) => (
                    <TableCell>{renderCell(item, columnKey)}</TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* 创建/编辑页面模态框 */}
      <Modal isOpen={isOpen} onClose={onClose} size="3xl">
        <ModalContent>
          {(onClose) => (
            <form onSubmit={handleSubmit(onSubmit)}>
              <ModalHeader className="flex flex-col gap-1">
                {formMode === "create" ? t("createPage") : t("editPage")}
              </ModalHeader>
              <ModalBody>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="title">{t("fields.title")}</label>
                    <Input
                      id="title"
                      placeholder={t("placeholders.title")}
                      {...register("title")}
                      isInvalid={!!errors.title}
                      errorMessage={errors.title?.message}
                    />
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="url">{t("fields.url")}</label>
                    <Input
                      id="url"
                      placeholder={t("placeholders.url")}
                      {...register("url")}
                      isInvalid={!!errors.url}
                      errorMessage={errors.url?.message}
                    />
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="content">{t("fields.content")}</label>
                    <Textarea
                      id="content"
                      placeholder={t("placeholders.content")}
                      rows={6}
                      {...register("content")}
                    />
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="mainImage">{t("fields.mainImage")}</label>
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
                          <img
                            src={watch("mainImage")}
                            alt="预览"
                            className="object-contain w-full h-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/placeholder-image.jpg";
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="status">{t("fields.status")}</label>
                    <Select
                      id="status"
                      defaultSelectedKeys={[
                        formMode === "create"
                          ? "Draft"
                          : editingPage?.status || "Draft",
                      ]}
                      {...register("status")}
                    >
                      <SelectItem key="Draft">{t("status.draft")}</SelectItem>
                      <SelectItem key="Published">
                        {t("status.published")}
                      </SelectItem>
                    </Select>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button type="button" variant="bordered" onClick={onClose}>
                  {t("actions.cancel")}
                </Button>
                <Button type="submit" color="primary" isLoading={isSubmitting}>
                  {formMode === "create"
                    ? t("actions.create")
                    : t("actions.save")}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      {/* 删除确认模态框 */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {t("confirmDelete")}
              </ModalHeader>
              <ModalBody>
                <p>{t("deleteConfirmation", { title: pageToDelete?.title })}</p>
              </ModalBody>
              <ModalFooter>
                <Button variant="bordered" onClick={onClose}>
                  {t("actions.cancel")}
                </Button>
                <Button
                  color="danger"
                  onClick={confirmDelete}
                  isLoading={isDeleting}
                >
                  {t("actions.delete")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
