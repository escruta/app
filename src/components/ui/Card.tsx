import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xs border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900",
        className,
      )}
    >
      {children}
    </div>
  );
}
