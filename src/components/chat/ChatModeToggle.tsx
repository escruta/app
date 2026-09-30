import { ChatIcon, StudyIcon } from "@/components/icons";
import { Dropdown } from "@/components/ui";
import type { ChatMode } from "@/interfaces";

const MODE_LABELS: Record<ChatMode, string> = {
  NORMAL: "Normal",
  LEARNING: "Learning",
};

const MODES: ChatMode[] = ["NORMAL", "LEARNING"];

function ModeLabel({ mode }: { mode: ChatMode }) {
  return (
    <span className="flex items-center gap-2">
      {mode === "NORMAL" ? <ChatIcon className="size-4" /> : <StudyIcon className="size-4" />}
      {MODE_LABELS[mode]}
    </span>
  );
}

interface ChatModeToggleProps {
  value: ChatMode;
  onChange: (mode: ChatMode) => void;
  disabled?: boolean;
}

export function ChatModeToggle({ value, onChange, disabled = false }: ChatModeToggleProps) {
  return (
    <Dropdown<ChatMode>
      options={MODES}
      selectedOption={value}
      onSelect={onChange}
      disabled={disabled}
      size="sm"
      up
      align="left"
      className="w-36"
      renderOption={(mode) => <ModeLabel mode={mode} />}
    />
  );
}
