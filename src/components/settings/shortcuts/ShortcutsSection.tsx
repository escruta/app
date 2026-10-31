import { useMemo, useState } from "react";
import { TextField } from "@/components/ui";
import {
  formatShortcutKeys,
  groupShortcuts,
  isMacPlatform,
  SHORTCUTS,
  type ShortcutDefinition,
} from "@/lib/shortcuts";
import { SettingsGroup, SettingsSection } from "../shared/SettingsSection";

function KeyCaps({ keys, isMac }: { keys: readonly string[]; isMac: boolean }) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      {formatShortcutKeys(keys, isMac).map((key, index) => (
        <kbd
          key={`${key}-${index}`}
          title={keys[index]}
          className="inline-flex h-6 min-w-6 items-center justify-center rounded-xs border border-gray-300 bg-gray-50 px-1.5 font-sans text-[11px] font-medium text-gray-700 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}

function ShortcutKeys({ shortcut, isMac }: { shortcut: ShortcutDefinition; isMac: boolean }) {
  return (
    <span className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
      <KeyCaps keys={shortcut.keys} isMac={isMac} />
      {shortcut.alternateKeys && (
        <>
          <span className="text-xs text-gray-500 dark:text-gray-400">or</span>
          <KeyCaps keys={shortcut.alternateKeys} isMac={isMac} />
        </>
      )}
    </span>
  );
}

export function ShortcutsSection() {
  const [query, setQuery] = useState("");
  const isMac = useMemo(() => isMacPlatform(), []);

  const filteredShortcuts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return SHORTCUTS;

    return SHORTCUTS.filter((shortcut) =>
      [
        shortcut.label,
        shortcut.description,
        ...shortcut.keys,
        ...(shortcut.alternateKeys ?? []),
      ].some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [query]);

  const groups = useMemo(() => groupShortcuts(filteredShortcuts), [filteredShortcuts]);

  return (
    <SettingsSection
      title="Keyboard shortcuts"
      description="Browse every shortcut available. Combinations adapt automatically to your operating system."
    >
      <TextField
        id="shortcut-search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClear={() => setQuery("")}
        placeholder="Search shortcuts..."
        search
      />

      {groups.length === 0 ? (
        <div className="rounded-xs border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          No shortcuts match “{query}”.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <SettingsGroup key={group.id} title={group.title} description={group.description}>
              <div className="divide-y divide-gray-200 overflow-hidden rounded-xs border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className="flex items-start justify-between gap-4 px-4 py-3"
                  >
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {shortcut.label}
                      </span>
                      <span className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                        {shortcut.description}
                      </span>
                    </div>
                    <ShortcutKeys shortcut={shortcut} isMac={isMac} />
                  </div>
                ))}
              </div>
            </SettingsGroup>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Shortcuts shown for {isMac ? "macOS" : "Windows / Linux"}.
      </p>
    </SettingsSection>
  );
}
