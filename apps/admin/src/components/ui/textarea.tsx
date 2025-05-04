import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  errorMessage?: string;
  isInvalid?: boolean;
  isRequired?: boolean;
  variant?: "default" | "bordered";
  minRows?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      description,
      errorMessage,
      isInvalid,
      isRequired,
      variant = "default",
      minRows,
      ...props
    },
    ref,
  ) => {
    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={props.id}
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              isInvalid && "text-destructive",
            )}
          >
            {label}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            variant === "bordered" && "border-2",
            isInvalid && "border-destructive focus-visible:ring-destructive",
            className,
          )}
          ref={ref}
          rows={minRows}
          aria-invalid={isInvalid}
          aria-required={isRequired}
          {...props}
        />
        {description && !isInvalid && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {errorMessage && isInvalid && (
          <p className="text-sm font-medium text-destructive">{errorMessage}</p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export { Textarea };
