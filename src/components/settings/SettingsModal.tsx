import { useState } from "react";
import { Modal } from "@/components/ui";
import { PaletteIcon, UserIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { AccountSection } from "./AccountSection";
import { AppearanceSection } from "./AppearanceSection";

type SectionId = "account" | "appearance";

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: "account", label: "Account", icon: <UserIcon className="size-4" /> },
  { id: "appearance", label: "Appearance", icon: <PaletteIcon className="size-4" /> },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState<SectionId>("account");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      width="3xl"
      noPadding
      contentClassname="md:h-[65vh] md:max-h-[650px]"
    >
      <div className="flex flex-col md:h-full md:flex-row">
        <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-gray-200 p-2 md:w-56 md:flex-col md:overflow-y-auto md:border-r md:border-b-0 md:p-3 dark:border-gray-800">
          {SECTIONS.map((section) => {
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
        </nav>

        <div className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6">
          {activeSection === "account" && <AccountSection />}
          {activeSection === "appearance" && <AppearanceSection />}
        </div>
      </div>
    </Modal>
  );
}
