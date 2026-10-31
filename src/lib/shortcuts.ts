export type ShortcutCategoryId =
  | "general"
  | "tabs"
  | "editor-formatting"
  | "editor-blocks"
  | "chat"
  | "tools"
  | "dialogs";

export interface ShortcutCategoryDefinition {
  id: ShortcutCategoryId;
  title: string;
  description: string;
}

export interface ShortcutDefinition {
  id: string;
  label: string;
  description: string;
  keys: readonly string[];
  alternateKeys?: readonly string[];
  category: ShortcutCategoryId;
}

export const SHORTCUT_CATEGORIES = [
  {
    id: "general",
    title: "General",
    description: "Application-wide actions available from most screens.",
  },
  {
    id: "tabs",
    title: "Tabs",
    description: "Move between the tabs open in a notebook.",
  },
  {
    id: "editor-formatting",
    title: "Editor: formatting",
    description: "Inline styles and text history while writing a note.",
  },
  {
    id: "editor-blocks",
    title: "Editor: blocks & lists",
    description: "Insert and transform the blocks that make up a note.",
  },
  {
    id: "chat",
    title: "Chat",
    description: "Write and send messages in a conversation.",
  },
  {
    id: "tools",
    title: "Learning tools",
    description: "Browse generated study material without leaving the keyboard.",
  },
  {
    id: "dialogs",
    title: "Dialogs & menus",
    description: "Confirm, close and navigate overlays.",
  },
] as const satisfies readonly ShortcutCategoryDefinition[];

const SHORTCUT_DEFINITIONS = [
  {
    id: "close-tab",
    label: "Close current tab",
    description:
      "Closes the notebook tab you are currently viewing. In the desktop app this also works when the tab has focus.",
    keys: ["Mod", "W"],
    category: "general",
  },
  {
    id: "toggle-sidebar",
    label: "Toggle sidebar",
    description:
      "Collapses or expands the left sidebar. While the editor is focused, Mod+B applies bold instead.",
    keys: ["Mod", "B"],
    category: "general",
  },

  {
    id: "next-tab",
    label: "Next tab",
    description: "Switches to the tab on the right, wrapping around at the end.",
    keys: ["Ctrl", "Tab"],
    category: "tabs",
  },
  {
    id: "previous-tab",
    label: "Previous tab",
    description: "Switches to the tab on the left, wrapping around at the start.",
    keys: ["Ctrl", "Shift", "Tab"],
    category: "tabs",
  },
  {
    id: "cancel-tab-drag",
    label: "Cancel tab drag",
    description: "Stops dragging a tab and leaves it in its original position.",
    keys: ["Escape"],
    category: "tabs",
  },

  {
    id: "editor-bold",
    label: "Bold",
    keys: ["Mod", "B"],
    description: "Toggles bold on the current selection.",
    category: "editor-formatting",
  },
  {
    id: "editor-italic",
    label: "Italic",
    keys: ["Mod", "I"],
    description: "Toggles italics on the current selection.",
    category: "editor-formatting",
  },
  {
    id: "editor-underline",
    label: "Underline",
    keys: ["Mod", "U"],
    description: "Toggles underline on the current selection.",
    category: "editor-formatting",
  },
  {
    id: "editor-strike",
    label: "Strikethrough",
    keys: ["Mod", "Shift", "S"],
    description: "Toggles strikethrough on the current selection.",
    category: "editor-formatting",
  },
  {
    id: "editor-highlight",
    label: "Highlight",
    keys: ["Mod", "Shift", "H"],
    description: "Highlights or unhighlights the current selection.",
    category: "editor-formatting",
  },
  {
    id: "editor-inline-code",
    label: "Inline code",
    keys: ["Mod", "E"],
    description: "Formats the current selection as inline code.",
    category: "editor-formatting",
  },
  {
    id: "editor-undo",
    label: "Undo",
    keys: ["Mod", "Z"],
    description: "Reverts the last change in the note.",
    category: "editor-formatting",
  },
  {
    id: "editor-redo",
    label: "Redo",
    keys: ["Mod", "Shift", "Z"],
    description: "Reapplies the last undone change. Mod+Y also works on Windows and Linux.",
    category: "editor-formatting",
  },

  {
    id: "editor-slash-command",
    label: "Open block menu",
    description:
      "Type / on an empty line to insert headings, lists, quotes, code blocks, math and more.",
    keys: ["/"],
    category: "editor-blocks",
  },
  {
    id: "editor-heading-1",
    label: "Heading 1",
    keys: ["Mod", "Alt", "1"],
    description: "Converts the current block into a level 1 heading.",
    category: "editor-blocks",
  },
  {
    id: "editor-heading-2",
    label: "Heading 2",
    keys: ["Mod", "Alt", "2"],
    description: "Converts the current block into a level 2 heading.",
    category: "editor-blocks",
  },
  {
    id: "editor-heading-3",
    label: "Heading 3",
    keys: ["Mod", "Alt", "3"],
    description: "Converts the current block into a level 3 heading.",
    category: "editor-blocks",
  },
  {
    id: "editor-bullet-list",
    label: "Bullet list",
    keys: ["Mod", "Shift", "8"],
    description: "Toggles an unordered list.",
    category: "editor-blocks",
  },
  {
    id: "editor-ordered-list",
    label: "Numbered list",
    keys: ["Mod", "Shift", "7"],
    description: "Toggles an ordered list.",
    category: "editor-blocks",
  },
  {
    id: "editor-task-list",
    label: "Task list",
    keys: ["Mod", "Shift", "9"],
    description: "Toggles a checklist.",
    category: "editor-blocks",
  },
  {
    id: "editor-blockquote",
    label: "Blockquote",
    keys: ["Mod", "Shift", "B"],
    description: "Turns the current block into a quote.",
    category: "editor-blocks",
  },
  {
    id: "editor-code-block",
    label: "Code block",
    keys: ["Mod", "Alt", "C"],
    description: "Turns the current block into a syntax-highlighted code block.",
    category: "editor-blocks",
  },
  {
    id: "editor-indent-list",
    label: "Indent list item",
    keys: ["Tab"],
    description: "Nests the current list item under the previous one.",
    category: "editor-blocks",
  },
  {
    id: "editor-outdent-list",
    label: "Outdent list item",
    keys: ["Shift", "Tab"],
    description: "Moves the current list item one level up.",
    category: "editor-blocks",
  },
  {
    id: "editor-hard-break",
    label: "Line break",
    keys: ["Shift", "Enter"],
    alternateKeys: ["Mod", "Enter"],
    description: "Inserts a line break without starting a new paragraph.",
    category: "editor-blocks",
  },

  {
    id: "chat-send",
    label: "Send message",
    keys: ["Enter"],
    description: "Sends the message you have written to the assistant.",
    category: "chat",
  },
  {
    id: "chat-new-line",
    label: "New line",
    keys: ["Shift", "Enter"],
    description: "Adds a new line to your message instead of sending it.",
    category: "chat",
  },

  {
    id: "flashcards-flip",
    label: "Flip card",
    keys: ["Space"],
    alternateKeys: ["Enter"],
    description: "Reveals the answer on the current flashcard.",
    category: "tools",
  },
  {
    id: "flashcards-next",
    label: "Next card",
    keys: ["→"],
    description: "Moves to the next flashcard.",
    category: "tools",
  },
  {
    id: "flashcards-previous",
    label: "Previous card",
    keys: ["←"],
    description: "Moves to the previous flashcard.",
    category: "tools",
  },
  {
    id: "flashcards-known",
    label: "Mark as known",
    keys: ["K"],
    description: "Marks the current flashcard as known and moves on.",
    category: "tools",
  },

  {
    id: "dialog-close",
    label: "Close dialog or menu",
    keys: ["Escape"],
    description: "Dismisses the open modal, menu, dropdown or context menu.",
    category: "dialogs",
  },
  {
    id: "dialog-confirm",
    label: "Confirm / save",
    keys: ["Enter"],
    description:
      "Submits the focused input, such as renaming a notebook, saving a note title or running a search.",
    category: "dialogs",
  },
  {
    id: "dialog-activate",
    label: "Activate focused item",
    keys: ["Enter"],
    alternateKeys: ["Space"],
    description: "Opens or activates the button, card or menu item that has keyboard focus.",
    category: "dialogs",
  },
  {
    id: "block-menu-previous",
    label: "Previous block suggestion",
    keys: ["↑"],
    description: "Moves to the previous suggestion in the / block menu.",
    category: "dialogs",
  },
  {
    id: "block-menu-next",
    label: "Next block suggestion",
    keys: ["↓"],
    description: "Moves to the next suggestion in the / block menu.",
    category: "dialogs",
  },
  {
    id: "block-menu-select",
    label: "Select block suggestion",
    keys: ["Enter"],
    description: "Inserts the highlighted suggestion from the / block menu.",
    category: "dialogs",
  },
] as const satisfies readonly ShortcutDefinition[];

export const SHORTCUTS: readonly ShortcutDefinition[] = SHORTCUT_DEFINITIONS;

export type ShortcutId = (typeof SHORTCUT_DEFINITIONS)[number]["id"];

const MAC_KEY_LABELS: Record<string, string> = {
  Mod: "⌘",
  Ctrl: "⌃",
  Shift: "⇧",
  Alt: "⌥",
};

const DEFAULT_KEY_LABELS: Record<string, string> = {
  Mod: "Ctrl",
  Ctrl: "Ctrl",
  Shift: "Shift",
  Alt: "Alt",
};

export function isMacPlatform(): boolean {
  if (typeof window === "undefined") return false;
  if (window.electronAPI?.platform === "darwin") return true;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
}

export function formatShortcutKeys(keys: readonly string[], isMac = isMacPlatform()): string[] {
  const labels = isMac ? MAC_KEY_LABELS : DEFAULT_KEY_LABELS;
  return keys.map((key) => labels[key] ?? key);
}

export function groupShortcuts(shortcuts: readonly ShortcutDefinition[] = SHORTCUTS) {
  return SHORTCUT_CATEGORIES.map((category) => ({
    ...category,
    shortcuts: shortcuts.filter((shortcut) => shortcut.category === category.id),
  })).filter((category) => category.shortcuts.length > 0);
}

const SHORTCUTS_BY_ID = new Map<string, ShortcutDefinition>(
  SHORTCUTS.map((shortcut) => [shortcut.id, shortcut]),
);

export function getShortcut(id: ShortcutId | string): ShortcutDefinition | undefined {
  return SHORTCUTS_BY_ID.get(id);
}

export interface ShortcutKeyEvent {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}

const MODIFIER_KEYS = new Set(["Mod", "Ctrl", "Shift", "Alt"]);

const KEY_ALIASES: Record<string, string[]> = {
  " ": [" ", "Space", "Spacebar"],
  Space: [" ", "Space", "Spacebar"],
  "→": ["ArrowRight"],
  "←": ["ArrowLeft"],
  "↑": ["ArrowUp"],
  "↓": ["ArrowDown"],
  Esc: ["Escape"],
  Escape: ["Escape"],
  Enter: ["Enter"],
  Tab: ["Tab"],
};

function keyMatches(expected: string, actual: string): boolean {
  const aliases = KEY_ALIASES[expected];
  if (aliases) {
    const normalizedActual = actual === "Spacebar" ? " " : actual;
    return aliases.some((alias) => (alias === " " ? normalizedActual === " " : alias === actual));
  }
  return expected.toLowerCase() === actual.toLowerCase();
}

function combinationMatches(keys: readonly string[], event: ShortcutKeyEvent): boolean {
  const hasMod = keys.includes("Mod");
  const hasCtrl = keys.includes("Ctrl");
  const hasShift = keys.includes("Shift");
  const hasAlt = keys.includes("Alt");

  const primaryModifierMatches = hasMod
    ? event.ctrlKey || event.metaKey
    : hasCtrl
      ? event.ctrlKey && !event.metaKey
      : !event.ctrlKey && !event.metaKey;
  if (!primaryModifierMatches) return false;
  if (event.shiftKey !== hasShift) return false;
  if (event.altKey !== hasAlt) return false;

  const expectedKey = keys.find((key) => !MODIFIER_KEYS.has(key));
  return expectedKey ? keyMatches(expectedKey, event.key) : false;
}

export function matchesShortcut(id: ShortcutId | string, event: ShortcutKeyEvent): boolean {
  const shortcut = getShortcut(id);
  if (!shortcut) return false;

  if (combinationMatches(shortcut.keys, event)) return true;
  return shortcut.alternateKeys ? combinationMatches(shortcut.alternateKeys, event) : false;
}

export function isTypingSensitiveShortcut(id: ShortcutId | string): boolean {
  const shortcut = getShortcut(id);
  if (!shortcut) return false;

  const keys = shortcut.keys;
  const hasPrimaryModifier = keys.some((key) => key === "Mod" || key === "Ctrl" || key === "Alt");
  if (hasPrimaryModifier) return false;

  const expectedKey = keys.find((key) => !MODIFIER_KEYS.has(key));
  if (!expectedKey) return false;
  if (expectedKey === "Space" || expectedKey === " ") return true;
  if (KEY_ALIASES[expectedKey]) return false;
  return expectedKey.length === 1;
}

export function toTiptapShortcut(id: ShortcutId | string): string {
  const shortcut = getShortcut(id);
  if (!shortcut) throw new Error(`Unknown shortcut: ${id}`);

  return shortcut.keys
    .map((key) => {
      if (key === "Mod") return "Mod";
      if (key === "Ctrl") return "Ctrl";
      if (key === "Shift") return "Shift";
      if (key === "Alt") return "Alt";
      const alias = KEY_ALIASES[key];
      if (alias?.[0] && alias[0] !== " ") return alias[0];
      return key.length === 1 ? key.toLowerCase() : key;
    })
    .join("-");
}
