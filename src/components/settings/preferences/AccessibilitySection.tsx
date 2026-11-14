import { useId } from "react";
import { Switch } from "@/components/ui";
import { useAccessibility } from "@/hooks";
import { cn } from "@/lib/utils";
import { SettingsGroup } from "../shared/SettingsSection";
import { PreferenceOptionButton, SelectionIndicator } from "./PreferenceCard";

function MotionPreview({
  variant,
  selected,
}: {
  variant: "system" | "full" | "reduced";
  selected: boolean;
}) {
  const accent = selected ? "bg-blue-500 dark:bg-blue-400" : "bg-gray-400 dark:bg-gray-500";
  const trail = selected ? "bg-blue-200 dark:bg-blue-800/70" : "bg-gray-200 dark:bg-gray-700";

  if (variant === "system") {
    return (
      <div className="grid h-full w-full grid-cols-2">
        <div className="flex flex-col items-center justify-center gap-1.5 border-r border-gray-200/80 p-2 dark:border-gray-800">
          <div className="flex items-center gap-1">
            <span className={cn("h-1.5 w-3 rounded-xs opacity-40", trail)} />
            <span className={cn("h-1.5 w-3 rounded-xs opacity-70", trail)} />
            <span className={cn("size-2.5 rounded-xs", accent)} />
          </div>
          <span className="h-1 w-8 rounded-xs bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="flex flex-col items-center justify-center gap-1.5 p-2">
          <span className={cn("size-3 rounded-xs", accent)} />
          <span className="h-1 w-8 rounded-xs bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-2">
        <div className="flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-xs opacity-35", trail)} />
          <span className={cn("h-2.5 w-2.5 rounded-xs opacity-65", trail)} />
          <span className={cn("size-3.5 rounded-xs shadow-xs", accent)} />
        </div>
        <div className="flex w-3/4 flex-col gap-1">
          <span className="h-1 w-full rounded-xs bg-gray-200 dark:bg-gray-700" />
          <span className="mx-auto h-1 w-2/3 rounded-xs bg-gray-200/80 dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-2">
      <div className="flex items-center justify-center">
        <span className={cn("size-3.5 rounded-xs", accent)} />
      </div>
      <div className="flex w-3/4 flex-col gap-1">
        <span className="h-1 w-full rounded-xs bg-gray-200 dark:bg-gray-700" />
        <span className="mx-auto h-1 w-2/3 rounded-xs bg-gray-200/80 dark:bg-gray-800" />
      </div>
    </div>
  );
}

export function AccessibilitySettings() {
  const {
    motionPreference,
    effectiveReducedMotion,
    setMotion,
    MotionOptions,
    reduceTransparency,
    setReduceTransparency,
    enhancedFocus,
    setEnhancedFocus,
  } = useAccessibility();

  const reduceTransparencyLabelId = useId();
  const reduceTransparencyDescId = useId();
  const enhancedFocusLabelId = useId();
  const enhancedFocusDescId = useId();

  const motionOptions = [
    {
      value: MotionOptions.System,
      label: "System",
      description: `Matches device (${effectiveReducedMotion ? "reduced" : "full"})`,
      previewVariant: "system" as const,
    },
    {
      value: MotionOptions.Full,
      label: "Full",
      description: "Smooth transitions and motion",
      previewVariant: "full" as const,
    },
    {
      value: MotionOptions.Reduced,
      label: "Reduced",
      description: "Minimal motion, instant UI",
      previewVariant: "reduced" as const,
    },
  ];

  return (
    <SettingsGroup
      title="Accessibility & Motion"
      description="Adjust animations, visual clarity, and keyboard focus indicators."
    >
      <div role="radiogroup" aria-label="Motion" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {motionOptions.map((option) => {
          const isSelected = motionPreference === option.value;
          return (
            <PreferenceOptionButton
              key={option.value}
              selected={isSelected}
              onSelect={() => setMotion(option.value)}
              className="gap-3"
            >
              <div
                className={cn(
                  "h-20 w-full overflow-hidden rounded-xs border transition-colors duration-200",
                  isSelected
                    ? "border-blue-200 bg-blue-50/60 dark:border-blue-800/70 dark:bg-blue-950/20"
                    : "border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-gray-950/60",
                )}
              >
                <MotionPreview variant={option.previewVariant} selected={isSelected} />
              </div>

              <div className="flex w-full items-start justify-between gap-2">
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm font-semibold transition-colors",
                      isSelected
                        ? "text-blue-700 dark:text-blue-300"
                        : "text-gray-900 dark:text-gray-100",
                    )}
                  >
                    {option.label}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {option.description}
                  </p>
                </div>
                <SelectionIndicator selected={isSelected} className="mt-0.5" />
              </div>
            </PreferenceOptionButton>
          );
        })}
      </div>

      <div className="divide-y divide-gray-200 overflow-hidden rounded-xs border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
          <div className="min-w-0">
            <p
              id={reduceTransparencyLabelId}
              className="text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Reduce transparency
            </p>
            <p
              id={reduceTransparencyDescId}
              className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400"
            >
              Disable backdrop blur on modals, tooltips, and overlays for sharper contrast.
            </p>
          </div>
          <Switch
            checked={reduceTransparency}
            onChange={setReduceTransparency}
            ariaLabelledBy={reduceTransparencyLabelId}
            ariaDescribedBy={reduceTransparencyDescId}
          />
        </div>

        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
          <div className="min-w-0">
            <p
              id={enhancedFocusLabelId}
              className="text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Enhanced focus outlines
            </p>
            <p
              id={enhancedFocusDescId}
              className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400"
            >
              Display stronger high-contrast outlines when navigating with the keyboard.
            </p>
          </div>
          <Switch
            checked={enhancedFocus}
            onChange={setEnhancedFocus}
            ariaLabelledBy={enhancedFocusLabelId}
            ariaDescribedBy={enhancedFocusDescId}
          />
        </div>
      </div>
    </SettingsGroup>
  );
}
