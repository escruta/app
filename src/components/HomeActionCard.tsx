import { cn } from "@/lib/utils";
import { ChevronIcon } from "@/components/icons/ChevronIcon";

interface HomeActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export function HomeActionCard({ title, description, icon, onClick }: HomeActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-start justify-between rounded-xs border p-4 text-left cursor-pointer",
        "transition-all duration-300 ease-out",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-900",
        "bg-white dark:bg-gray-900",
        "border-gray-200 dark:border-gray-700",
        "hover:bg-blue-50 dark:hover:bg-gray-800",
        "hover:border-blue-300 dark:hover:border-gray-500",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xs bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
          <div className="size-4">{icon}</div>
        </div>
        <div className="flex flex-col">
          <h3 className="text-sm leading-tight font-semibold text-gray-900 transition-colors duration-300 group-hover:text-blue-900 dark:text-gray-100 dark:group-hover:text-blue-100">
            {title}
          </h3>
          <p className="text-xs leading-snug text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <div className="flex h-8 shrink-0 items-center justify-center text-gray-400 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-blue-500 group-hover:opacity-100 dark:text-gray-500 dark:group-hover:text-blue-400">
        <ChevronIcon direction="right" className="size-5" />
      </div>
    </button>
  );
}
