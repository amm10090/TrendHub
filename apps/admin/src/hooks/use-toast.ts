import { addToast } from "@heroui/react";

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
      title,
      description,
      variant = "default",
      duration = 3000,
      // 暂时移除placement，因为HeroUI的addToast可能不支持此参数
      // placement = "top-right",
    } = options;

    addToast({
      title,
      description,
      variant: "solid",
      color:
        variant === "success"
          ? "success"
          : variant === "destructive"
            ? "danger"
            : variant === "info"
              ? "primary"
              : "default",
      timeout: duration,
    });
  };

  return { toast: showToast };
}
