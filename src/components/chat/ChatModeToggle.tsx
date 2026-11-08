import { ChatIcon, CheckIcon, StudyIcon } from "@/components/icons";
import {
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuTrigger,
  Tooltip,
} from "@/components/ui";
import type { ChatMode } from "@/interfaces";

const MODE_LABELS: Record<ChatMode, string> = {
  NORMAL: "Normal",
  LEARNING: "Learning",
};

const MODES: ChatMode[] = ["NORMAL", "LEARNING"];

function ModeIcon({ mode }: { mode: ChatMode }) {
  return mode === "NORMAL" ? <ChatIcon className="size-4" /> : <StudyIcon className="size-4" />;
}

interface ChatModeToggleProps {
  value: ChatMode;
  onChange: (mode: ChatMode) => void;
  disabled?: boolean;
}

export function ChatModeToggle({ value, onChange, disabled = false }: ChatModeToggleProps) {
  return (
    <Menu>
      <Tooltip text={`Chat mode: ${MODE_LABELS[value]}`} position="left" disabled={disabled}>
        <MenuTrigger>
          <IconButton
            icon={<ModeIcon mode={value} />}
            variant="ghost"
            size="sm"
            ariaLabel={`Chat mode: ${MODE_LABELS[value]}`}
            disabled={disabled}
          />
        </MenuTrigger>
      </Tooltip>
      <MenuContent align="right">
        <MenuLabel>Chat mode</MenuLabel>
        {MODES.map((mode) => (
          <MenuItem
            key={mode}
            icon={mode === value ? <CheckIcon /> : <ModeIcon mode={mode} />}
            label={MODE_LABELS[mode]}
            disabled={disabled}
            onClick={() => onChange(mode)}
          />
        ))}
      </MenuContent>
    </Menu>
  );
}
