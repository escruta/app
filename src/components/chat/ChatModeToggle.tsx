import { ChatIcon, StudyIcon } from "@/components/icons";
import { Select, type SelectOption } from "@/components/ui";
import type { ChatMode } from "@/interfaces";

const MODE_LABELS: Record<ChatMode, string> = {
  NORMAL: "Normal",
  LEARNING: "Learning",
};

const MODE_OPTIONS: SelectOption<ChatMode>[] = [
  {
    value: "NORMAL",
    label: MODE_LABELS.NORMAL,
    icon: <ChatIcon className="size-4" />,
  },
  {
    value: "LEARNING",
    label: MODE_LABELS.LEARNING,
    icon: <StudyIcon className="size-4" />,
  },
];

interface ChatModeToggleProps {
  value: ChatMode;
  onChange: (mode: ChatMode) => void;
  disabled?: boolean;
}

export function ChatModeToggle({ value, onChange, disabled = false }: ChatModeToggleProps) {
  return (
    <Select
      variant="compact"
      size="sm"
      options={MODE_OPTIONS}
      value={value}
      onChange={onChange}
      heading="Chat mode"
      ariaLabel={`Chat mode: ${MODE_LABELS[value]}`}
      align="right"
      disabled={disabled}
    />
  );
}
