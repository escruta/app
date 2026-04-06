interface HomeChipProductProps {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  date?: string;
}

export function HomeChipProduct({ title, icon, onClick, date }: HomeChipProductProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-1.5 rounded-xs border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-xs transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-800 dark:hover:text-blue-100"
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <div className="shrink-0">{icon}</div>
        <span className="truncate">{title}</span>
      </div>
      {date && <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{date}</span>}
    </button>
  );
}
