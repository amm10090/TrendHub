import { Loader2 } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

// export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> { }
export type SpinnerProps = React.SVGAttributes<SVGSVGElement>;

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, ...props }, ref) => {
    return (
      <Loader2 className={cn("animate-spin", className)} ref={ref} {...props} />
    );
  },
);

Spinner.displayName = "Spinner";

export { Spinner };
