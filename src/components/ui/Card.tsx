import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 p-4 rounded-xs border border-gray-200 dark:border-gray-700 ring-1 ring-gray-500/5 dark:ring-gray-500/10",
        className,
      )}
    >
      {children}
    </div>
  );
}
