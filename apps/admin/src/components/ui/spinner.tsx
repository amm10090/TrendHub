import * as React from "react";

import { cn } from "@/lib/utils";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl";
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "danger"
    | "warning";
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "md", color = "default", ...props }, ref) => {
    const sizeClass = {
      sm: "h-4 w-4 border-2",
      md: "h-6 w-6 border-2",
      lg: "h-8 w-8 border-3",
      xl: "h-12 w-12 border-4",
    }[size];

    const colorClass = {
      default: "border-current",
      primary: "border-primary",
      secondary: "border-secondary",
      success: "border-green-500",
      danger: "border-destructive",
      warning: "border-yellow-500",
    }[color];

    return (
      <div
        ref={ref}
        className={cn(
          "animate-spin rounded-full border-solid border-t-transparent",
          sizeClass,
          colorClass,
          className,
        )}
        {...props}
      />
    );
  },
);

Spinner.displayName = "Spinner";

export { Spinner };
