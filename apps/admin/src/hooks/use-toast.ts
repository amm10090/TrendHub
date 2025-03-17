import { toast } from "@heroui/react";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "success" | "destructive";
}

export function useToast() {
  const showToast = (options: ToastOptions) => {
    const { variant = "default", ...rest } = options;

    toast({
      ...rest,
      variant: "solid",
      color:
        variant === "success"
          ? "success"
          : variant === "destructive"
            ? "danger"
            : "default",
    });
  };

  return { toast: showToast };
}
