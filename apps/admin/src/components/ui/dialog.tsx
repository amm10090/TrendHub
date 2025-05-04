import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Slot } from "@radix-ui/react-slot";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

// 添加VisuallyHidden组件
const VisuallyHidden = ({
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"span"> & { asChild?: boolean }) => {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      className="absolute w-[1px] h-[1px] p-0 -m-[1px] overflow-hidden clip-rect-0 whitespace-nowrap border-0"
      {...props}
    >
      {children}
    </Comp>
  );
};

VisuallyHidden.displayName = "VisuallyHidden";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));

DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  // 提供默认标题，解决可访问性问题
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className,
        )}
        {...props}
      >
        {/* 始终添加一个隐藏的标题，解决可访问性问题 */}
        <VisuallyHidden asChild>
          <DialogTitle>对话框</DialogTitle>
        </VisuallyHidden>
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">关闭</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});

DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);

DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className,
    )}
    {...props}
  />
);

DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));

DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));

DialogDescription.displayName = DialogPrimitive.Description.displayName;

// 自定义Drawer组件（基于Dialog但位于右侧）
const Drawer = ({
  isOpen,
  onOpenChange,
  children,
  ...props
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  placement?: "left" | "right" | "top" | "bottom";
  size?: "sm" | "md" | "lg" | "xl" | "full";
  children: React.ReactNode;
}) => {
  const [open, setOpen] = React.useState(isOpen);

  React.useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} {...props}>
      {children}
    </Dialog>
  );
};

// Drawer 内容组件
const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    placement?: "left" | "right" | "top" | "bottom";
    size?: "sm" | "md" | "lg" | "xl" | "full";
  }
>(
  (
    { className, placement = "right", size = "md", children, ...props },
    ref,
  ) => {
    // 根据size和placement设置尺寸和位置
    const sizeClasses = {
      sm: "w-[300px]",
      md: "w-[390px]",
      lg: "w-[480px]",
      xl: "w-[570px]",
      full: "w-screen",
    };

    // 根据placement设置位置
    const placementClasses = {
      right: "right-0 top-0 bottom-0 translate-x-0 translate-y-0 rounded-l-lg",
      left: "left-0 top-0 bottom-0 translate-x-0 translate-y-0 rounded-r-lg",
      top: "top-0 left-0 right-0 translate-x-0 translate-y-0 rounded-b-lg",
      bottom:
        "bottom-0 left-0 right-0 translate-x-0 translate-y-0 rounded-t-lg",
    };

    const widthClass = sizeClasses[size] || sizeClasses.md;
    const positionClass = placementClasses[placement] || placementClasses.right;

    return (
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "fixed z-50 h-full border bg-background shadow-lg duration-300 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out",
            (placement === "right" || placement === "left") && [
              widthClass,
              positionClass,
              placement === "right"
                ? "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
                : "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
            ],
            (placement === "top" || placement === "bottom") && [
              "h-auto w-full",
              positionClass,
              placement === "top"
                ? "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top"
                : "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
            ],
            className,
          )}
          {...props}
        >
          {/* 始终添加一个隐藏的标题，解决可访问性问题 */}
          <VisuallyHidden asChild>
            <DialogTitle>抽屉面板</DialogTitle>
          </VisuallyHidden>
          {children}
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">关闭</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  },
);

DrawerContent.displayName = "DrawerContent";

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col p-6 pb-0 space-y-1.5", className)}
    {...props}
  />
);

DrawerHeader.displayName = "DrawerHeader";

const DrawerBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6", className)} {...props} />
);

DrawerBody.displayName = "DrawerBody";

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-row items-center justify-end p-6 pt-0 space-x-2",
      className,
    )}
    {...props}
  />
);

DrawerFooter.displayName = "DrawerFooter";

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  // Drawer 组件
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  // 导出VisuallyHidden组件
  VisuallyHidden,
};
