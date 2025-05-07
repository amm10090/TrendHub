"use client";

import { MoreHorizontal, Plus, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

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
import { usePages, type Page } from "@/hooks/use-pages";

export default function PagesPage() {
  const t = useTranslations("pages");
  const router = useRouter();

  const { pages, isLoading, deletePage, togglePageStatus } = usePages();

  const [sortDescriptor] = useState({
    column: "updatedAt",
    direction: "descending",
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const onDeleteOpen = () => setIsDeleteOpen(true);
  const onDeleteClose = useCallback(() => setIsDeleteOpen(false), []);

  const statusStyleMap = useMemo(
    () => ({
      Published: "bg-green-50 text-green-700",
      Draft: "bg-yellow-50 text-yellow-700",
    }),
    [],
  );

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

  const sortedItems = useMemo(() => {
    return [...pages].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof Page];
      const second = b[sortDescriptor.column as keyof Page];
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [pages, sortDescriptor]);

  const openCreatePage = useCallback(() => {
    router.push("./pages/create");
  }, [router]);

  const openEditPage = useCallback(
    (pageId: string) => {
      router.push(`./pages/edit/${pageId}`);
    },
    [router],
  );

  const openDeleteModal = useCallback((page: Page) => {
    setPageToDelete(page);
    onDeleteOpen();
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!pageToDelete) return;
    try {
      setIsDeleting(true);
      await deletePage(pageToDelete.id);
      onDeleteClose();
    } catch {
      // Error toast handled by usePages hook or here if needed
    } finally {
      setIsDeleting(false);
      setPageToDelete(null);
    }
  }, [pageToDelete, deletePage, onDeleteClose]);

  const handleToggleStatus = useCallback(
    async (page: Page) => {
      try {
        await togglePageStatus(page.id, page.status as "Published" | "Draft");
      } catch {
        // Error toast handled by usePages hook or here if needed
      }
    },
    [togglePageStatus],
  );

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
                  const imgElement = e.target as HTMLImageElement;

                  if (imgElement.getAttribute("data-fallback-applied")) return;
                  imgElement.src = "/placeholder-image.jpg";
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
                    <span className="sr-only">{t("actions.openMenu")}</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => openEditPage(page.id)}>
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
        default: {
          const pageKey = columnKey as keyof Page;

          if (pageKey === "title" || pageKey === "url") {
            return (
              <span
                className="truncate max-w-[200px] inline-block"
                title={String(page[pageKey])}
              >
                {String(page[pageKey])}
              </span>
            );
          }

          return String(page[pageKey]);
        }
      }
    },
    [t, openEditPage, handleToggleStatus, openDeleteModal, statusStyleMap],
  );

  return (
    <div className="flex min-h-screen flex-col">
      <CustomNavbar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
          <div className="flex items-center space-x-2">
            <Button color="primary" onClick={openCreatePage}>
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

      <Modal open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{t("confirmDelete")}</ModalTitle>
          </ModalHeader>
          <div className="p-6 pt-0 pb-0">
            <p>
              {t("deleteConfirmation", { title: pageToDelete?.title || "" })}
            </p>
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
