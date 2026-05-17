import { cn } from "@/lib/utils";
import React from "react";

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ButtonGroup({ children, className, ...props }: ButtonGroupProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-xs",
        "[&>button]:rounded-none [&>button:first-child]:rounded-l-xs [&>button:last-child]:rounded-r-xs [&>button:not(:first-child)]:-ml-px",
        "[&>div>button]:rounded-none [&>div:first-child>button]:rounded-l-xs [&>div:last-child>button]:rounded-r-xs [&>div:not(:first-child)>button]:-ml-px",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
