import { cn } from "@/lib/utils";

export function SimpleBackground({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("fixed inset-0 z-0 bg-white dark:bg-gray-950 opacity-30", className)}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/60 via-gray-50/30 to-blue-100/40 dark:from-blue-950/10 dark:via-gray-950/5 dark:to-blue-900/10" />
    </div>
  );
}
