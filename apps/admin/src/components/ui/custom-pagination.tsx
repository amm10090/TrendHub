"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CustomPaginationProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Number of sibling pages to show on each side */
  siblingCount?: number;
}

function CustomPagination({
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className,
  ...props
}: CustomPaginationProps) {
  const handlePrevious = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      onPageChange(page + 1);
    }
  };

  // Basic pagination logic (can be expanded later for ellipsis, etc.)
  const renderPageNumbers = () => {
    const pages = [];
    // Simple range for now
    const startPage = Math.max(1, page - siblingCount);
    const endPage = Math.min(totalPages, page + siblingCount);

    if (startPage > 1) {
      pages.push(
        <PaginationItem
          key={1}
          page={1}
          onClick={() => onPageChange(1)}
          isActive={false}
        />,
      );
      if (startPage > 2) {
        pages.push(<PaginationEllipsis key="start-ellipsis" />);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem
          key={i}
          page={i}
          onClick={() => onPageChange(i)}
          isActive={i === page}
        />,
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<PaginationEllipsis key="end-ellipsis" />);
      }
      pages.push(
        <PaginationItem
          key={totalPages}
          page={totalPages}
          onClick={() => onPageChange(totalPages)}
          isActive={false}
        />,
      );
    }

    return pages;
  };

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    >
      <ul className="flex flex-row items-center gap-1">
        <PaginationPrevious onClick={handlePrevious} disabled={page <= 1} />
        {renderPageNumbers()}
        <PaginationNext onClick={handleNext} disabled={page >= totalPages} />
      </ul>
    </nav>
  );
}
CustomPagination.displayName = "CustomPagination";

const PaginationItem = ({
  page,
  onClick,
  isActive,
  disabled,
}: {
  page: number;
  onClick: () => void;
  isActive: boolean;
  disabled?: boolean;
}) => (
  <li>
    <Button
      aria-label={`Go to page ${page}`}
      size="icon"
      variant={isActive ? "outline" : "ghost"}
      onClick={onClick}
      disabled={disabled}
    >
      {page}
    </Button>
  </li>
);

PaginationItem.displayName = "PaginationItem";

const PaginationPrevious = ({
  onClick,
  disabled,
  className,
  ...props
}: React.ComponentProps<typeof Button>) => (
  <li>
    <Button
      aria-label="Go to previous page"
      size="default"
      variant="ghost"
      onClick={onClick}
      disabled={disabled}
      className={cn("gap-1 pl-2.5", className)}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span>Previous</span>
    </Button>
  </li>
);

PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = ({
  onClick,
  disabled,
  className,
  ...props
}: React.ComponentProps<typeof Button>) => (
  <li>
    <Button
      aria-label="Go to next page"
      size="default"
      variant="ghost"
      onClick={onClick}
      disabled={disabled}
      className={cn("gap-1 pr-2.5", className)}
      {...props}
    >
      <span>Next</span>
      <ChevronRight className="h-4 w-4" />
    </Button>
  </li>
);

PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <li aria-hidden>
    <span
      className={cn("flex h-9 w-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  </li>
);

PaginationEllipsis.displayName = "PaginationEllipsis";

export { CustomPagination };
