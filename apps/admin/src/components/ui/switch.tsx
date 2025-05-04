import * as SwitchPrimitives from "@radix-ui/react-switch";
import * as React from "react";

import { cn } from "@/lib/utils";

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  isSelected?: boolean;
  onValueChange?: (checked: boolean) => void;
  color?: "default" | "primary" | "success" | "danger" | "warning";
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(
  (
    { className, isSelected, onValueChange, color = "default", ...props },
    ref,
  ) => {
    // 映射color到具体的样式
    const colorClasses = {
      default: "data-[state=checked]:bg-primary",
      primary: "data-[state=checked]:bg-primary",
      success: "data-[state=checked]:bg-green-500",
      danger: "data-[state=checked]:bg-destructive",
      warning: "data-[state=checked]:bg-yellow-500",
    };

    const colorClass = colorClasses[color] || colorClasses.default;

    return (
      <SwitchPrimitives.Root
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=unchecked]:bg-input",
          colorClass,
          className,
        )}
        ref={ref}
        checked={isSelected}
        onCheckedChange={onValueChange}
        {...props}
      >
        <SwitchPrimitives.Thumb
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
          )}
        />
      </SwitchPrimitives.Root>
    );
  },
);

Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
