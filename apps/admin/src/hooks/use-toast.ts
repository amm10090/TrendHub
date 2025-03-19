import { toast } from "@heroui/react";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "success" | "destructive" | "info";
  duration?: number;
  placement?:
    | "top"
    | "bottom"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";
}

export function useToast() {
  const showToast = (options: ToastOptions) => {
    const {
      variant = "default",
      duration = 3000,
      placement = "top-right",
      ...rest
    } = options;

    toast({
      ...rest,
      variant: "solid",
      color:
        variant === "success"
          ? "success"
          : variant === "destructive"
            ? "danger"
            : variant === "info"
              ? "primary"
              : "default",
      duration,
      placement,
    });
  };

  return { toast: showToast };
}
