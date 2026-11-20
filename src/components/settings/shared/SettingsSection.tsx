import { useId } from "react";
import { Divider, Switch } from "@/components/ui";
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

export function SettingsDivider({ className }: { className?: string }) {
  return <Divider className={cn("-mx-4 my-0 md:-mx-6", className)} />;
}

interface SettingsSwitchRowProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function SettingsSwitchRow({
  title,
  description,
  checked,
  onChange,
  disabled = false,
  className,
}: SettingsSwitchRowProps) {
  const switchId = useId();
  const labelId = useId();
  const descriptionId = useId();

  return (
    <label
      htmlFor={switchId}
      className={cn(
        "group flex items-center justify-between gap-4 px-4 py-3.5 transition-colors select-none",
        disabled
          ? "cursor-not-allowed"
          : "cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-800/40",
        className,
      )}
    >
      <span className={cn("block min-w-0", disabled && "opacity-50")}>
        <span id={labelId} className="block text-sm font-medium text-gray-900 dark:text-gray-100">
          {title}
        </span>
        <span
          id={descriptionId}
          className="mt-0.5 block text-xs leading-relaxed text-gray-500 dark:text-gray-400"
        >
          {description}
        </span>
      </span>
      <Switch
        id={switchId}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        ariaLabelledBy={labelId}
        ariaDescribedBy={descriptionId}
      />
    </label>
  );
}
