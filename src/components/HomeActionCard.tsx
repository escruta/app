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
        "group flex w-full items-start justify-between rounded-xs border border-gray-200 bg-white p-4 text-left transition-all duration-200 hover:border-blue-500 hover:bg-blue-50/50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-800 dark:bg-gray-900/50 dark:hover:border-blue-500/80 dark:hover:bg-blue-900/10 dark:focus:ring-offset-gray-950",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xs border border-gray-200 bg-gray-50 text-gray-600 transition-colors group-hover:border-blue-200 group-hover:bg-blue-100/50 group-hover:text-blue-600 dark:border-gray-800 dark:bg-gray-800/80 dark:text-gray-400 dark:group-hover:border-blue-900/50 dark:group-hover:bg-blue-900/20 dark:group-hover:text-blue-400">
          <div className="size-4">{icon}</div>
        </div>
        <div className="flex flex-col">
          <h3 className="text-sm leading-tight font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <p className="text-xs leading-snug text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <div className="flex h-8 shrink-0 items-center justify-center text-gray-400 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-blue-500 group-hover:opacity-100 dark:text-gray-600 dark:group-hover:text-blue-400">
        <ChevronIcon direction="right" className="size-5" />
      </div>
    </button>
  );
}
