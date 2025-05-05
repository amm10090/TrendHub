"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import type { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CodeSnippet,
  SnippetLocation,
  SnippetType,
} from "@/lib/services/code-snippet.service";

// 定义列操作接口
export interface CodeSnippetActions {
  onEdit: (snippet: CodeSnippet) => void;
  onDelete: (snippet: CodeSnippet) => void;
  onToggleActive: (snippet: CodeSnippet) => void;
}

// 接受 t 函数作为参数 - 使用 next-intl 的类型
export const getColumns = (
  actions: CodeSnippetActions,
  t: ReturnType<typeof useTranslations>,
): ColumnDef<CodeSnippet>[] => {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("columns.name")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "type",
      header: t("columns.type"),
      cell: ({ row }) => {
        const type = row.getValue("type") as SnippetType;
        const variant = type === SnippetType.JS ? "secondary" : "outline";
        const typeText = type === SnippetType.JS ? t("type.js") : t("type.css");

        return <Badge variant={variant}>{typeText}</Badge>;
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "location",
      header: t("columns.location"),
      cell: ({ row }) => {
        const location = row.getValue("location") as SnippetLocation;
        let text: string;

        switch (location) {
          case SnippetLocation.HEAD:
            text = t("location.head");
            break;
          case SnippetLocation.BODY_START:
            text = t("location.bodyStart");
            break;
          case SnippetLocation.BODY_END:
            text = t("location.bodyEnd");
            break;
          default:
            text = location;
        }

        return <span className="text-sm text-muted-foreground">{text}</span>;
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "priority",
      header: t("columns.priority"),
      cell: ({ row }) => {
        return <div className="text-center">{row.getValue("priority")}</div>;
      },
    },
    {
      accessorKey: "isActive",
      header: t("columns.status"),
      cell: ({ row }) => {
        const snippet = row.original;
        const label = snippet.isActive
          ? t("actions.deactivate")
          : t("actions.activate");
        const tooltipText = snippet.isActive
          ? t("tooltips.toggleOn")
          : t("tooltips.toggleOff");

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex"
                  type="button"
                >
                  <Switch
                    checked={snippet.isActive}
                    onCheckedChange={() => actions.onToggleActive(snippet)}
                    aria-label={label}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      id: "actions",
      header: t("columns.actions"),
      cell: ({ row }) => {
        const snippet = row.original;
        const toggleLabel = snippet.isActive
          ? t("actions.deactivate")
          : t("actions.activate");

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t("actions.openMenu")}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("columns.actions")}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => actions.onEdit(snippet)}>
                {t("actions.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onToggleActive(snippet)}>
                {toggleLabel}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50"
                onClick={() => actions.onDelete(snippet)}
              >
                {t("actions.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
};
