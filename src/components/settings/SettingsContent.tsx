import { useState } from "react";
import { DevicesIcon, KeyboardIcon, PaletteIcon, StarsIcon, UserIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { AccountSection } from "./account/AccountSection";
import { AISection } from "./ai/AISection";
import { PreferencesSection } from "./preferences/PreferencesSection";
import { SessionsSection } from "./sessions/SessionsSection";
import { ShortcutsSection } from "./shortcuts/ShortcutsSection";

type SectionId = "preferences" | "ai" | "shortcuts" | "account" | "sessions";

interface SectionItem {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
}

const SECTION_GROUPS: { id: string; label: string; items: SectionItem[] }[] = [
  {
    id: "general",
    label: "General",
    items: [
      { id: "preferences", label: "Preferences", icon: <PaletteIcon className="size-4" /> },
      { id: "ai", label: "AI", icon: <StarsIcon className="size-4" /> },
      { id: "shortcuts", label: "Shortcuts", icon: <KeyboardIcon className="size-4" /> },
    ],
  },
  {
    id: "account",
    label: "Account & Security",
    items: [
      { id: "account", label: "Account", icon: <UserIcon className="size-4" /> },
      { id: "sessions", label: "Sessions", icon: <DevicesIcon className="size-4" /> },
    ],
  },
];

export function SettingsContent() {
  const [activeSection, setActiveSection] = useState<SectionId>("preferences");

  return (
    <div className="h-full w-full overflow-y-scroll">
      <div className="mx-auto flex min-h-full max-w-5xl flex-col md:flex-row">
        <nav
          aria-label="Settings sections"
          className="sticky top-0 z-10 flex shrink-0 items-center gap-1 overflow-x-auto border-b border-gray-200 bg-white p-2 md:w-56 md:flex-col md:items-stretch md:gap-4 md:self-start md:border-b-0 md:p-3 dark:border-gray-800 dark:bg-gray-950"
        >
          {SECTION_GROUPS.map((group, groupIndex) => (
            <div
              key={group.id}
              className="flex shrink-0 items-center gap-1 md:flex-col md:items-stretch"
            >
              {groupIndex > 0 && (
                <div
                  aria-hidden="true"
                  className="mx-1 h-5 w-px shrink-0 bg-gray-200 md:hidden dark:bg-gray-800"
                />
              )}
              <span className="hidden px-3 pb-1 text-[11px] font-semibold tracking-wider text-gray-400 uppercase md:block dark:text-gray-500">
                {group.label}
              </span>
              {group.items.map((section) => {
                const active = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex shrink-0 cursor-pointer items-center gap-2.5 rounded-xs px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                      active
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                    )}
                  >
                    {section.icon}
                    {section.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="min-w-0 flex-1 p-4 md:border-l md:border-gray-200 md:p-6 dark:border-gray-800">
          {activeSection === "preferences" && <PreferencesSection />}
          {activeSection === "ai" && <AISection />}
          {activeSection === "shortcuts" && <ShortcutsSection />}
          {activeSection === "account" && <AccountSection />}
          {activeSection === "sessions" && <SessionsSection />}
        </div>
      </div>
    </div>
  );
}
