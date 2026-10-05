import { cn } from "@/lib/utils";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsSection({ title, description, children, className }: SettingsSectionProps) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <header className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        {description && (
          <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </header>
      {children}
    </section>
  );
}

interface SettingsGroupProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function SettingsGroup({ title, description, children }: SettingsGroupProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {description && (
          <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
