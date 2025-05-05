"use client";

import { PlusCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  CodeSnippet,
  CodeSnippetService,
} from "@/lib/services/code-snippet.service";

import { getColumns, CodeSnippetActions } from "./CodeSnippetColumns";
import { CodeSnippetDataTable } from "./CodeSnippetDataTable";
import { CodeSnippetForm } from "./CodeSnippetForm";

export function CodeSnippetsTab() {
  const t = useTranslations("codeSnippets");
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(
    null,
  );
  const [snippetToDelete, setSnippetToDelete] = useState<CodeSnippet | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await CodeSnippetService.getAllSnippets();

      if (response.success && response.data) {
        setSnippets(response.data);
      } else {
        toast.error(t("messages.loadError"), {
          description: response.error || t("messages.loadErrorDesc"),
        });
        setSnippets([]);
      }
    } catch {
      toast.error(t("messages.loadError"), {
        description: t("messages.loadErrorNetwork"),
      });
      setSnippets([]);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (snippet: CodeSnippet) => {
    setSelectedSnippet(snippet);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedSnippet(null);
    setIsFormOpen(true);
  };

  const handleToggleActive = useCallback(
    async (snippet: CodeSnippet) => {
      try {
        const response = await CodeSnippetService.toggleSnippetActive(
          snippet.id,
        );

        if (response.success && response.data !== undefined) {
          const status = response.data.isActive
            ? t("messages.statusActive")
            : t("messages.statusInactive");

          toast.success(
            t("messages.toggleSuccess", { name: snippet.name, status: status }),
          );
          setSnippets((prev) =>
            prev.map((s) =>
              s.id === snippet.id
                ? { ...s, isActive: response.data!.isActive }
                : s,
            ),
          );
        } else {
          toast.error(t("messages.toggleError"), {
            description: response.error || t("messages.toggleErrorDesc"),
          });
        }
      } catch {
        toast.error(t("messages.toggleError"), {
          description: t("messages.loadErrorNetwork"),
        });
      }
    },
    [t],
  );

  const handleDeleteConfirmation = (snippet: CodeSnippet) => {
    setSnippetToDelete(snippet);
  };

  const handleDelete = async () => {
    if (!snippetToDelete) return;
    setIsDeleting(true);
    try {
      const response = await CodeSnippetService.deleteSnippet(
        snippetToDelete.id,
      );

      if (response.success) {
        toast.success(
          t("messages.deleteSuccess", { name: snippetToDelete.name }),
        );
        setSnippetToDelete(null);
        fetchData();
      } else {
        toast.error(t("messages.deleteError"), {
          description: response.error || t("messages.deleteErrorDesc"),
        });
      }
    } catch {
      toast.error(t("messages.deleteError"), {
        description: t("messages.loadErrorNetwork"),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const actions: CodeSnippetActions = useMemo(
    () => ({
      onEdit: handleEdit,
      onDelete: handleDeleteConfirmation,
      onToggleActive: handleToggleActive,
    }),
    [handleToggleActive],
  );

  const columns = useMemo(() => getColumns(actions, t), [actions, t]);

  // Extract parts for the confirmation message
  const deleteConfirmationParts = t("deleteConfirmationMessage", {
    name: "__PLACEHOLDER__",
  }).split("__PLACEHOLDER__");
  const beforeName = deleteConfirmationParts[0];
  const afterName = deleteConfirmationParts[1];

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#1A1A1A] shadow-[#0080FF]/5 dark:shadow-[#3D9AFF]/10">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </div>
          <Button onClick={handleAdd} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t("addSnippet")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <CodeSnippetDataTable
          columns={columns}
          data={snippets}
          isLoading={isLoading}
        />
      </CardContent>

      <CodeSnippetForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        snippet={selectedSnippet}
        onSuccess={fetchData}
        useSheet={true}
      />

      <AlertDialog
        open={!!snippetToDelete}
        onOpenChange={(open) => !open && setSnippetToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirmationTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {beforeName}
              <span className="font-semibold">{snippetToDelete?.name}</span>
              {afterName}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setSnippetToDelete(null)}
              disabled={isDeleting}
            >
              {t("actions.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("actions.confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
