import { useEffect, useRef, useState, type ReactNode } from "react";
import { Extension, type Editor, type Range } from "@tiptap/core";
import Suggestion, {
  type SuggestionKeyDownProps,
  type SuggestionOptions,
} from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import { cn } from "@/lib/utils";
import {
  BoldIcon,
  CodeIcon,
  FormatListBulletedIcon,
  FormatListNumberedIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  HighlightIcon,
  ItalicIcon,
  MathIcon,
  QuoteIcon,
  TaskListIcon,
  TextIcon,
  UnderlineIcon,
} from "@/components/icons";

export type PromptUser = (title: string, initialValue: string) => Promise<string | null>;

export interface SlashCommandItem {
  title: string;
  description: string;
  group: string;
  aliases: string[];
  icon: ReactNode;
  action: (props: { editor: Editor; range: Range }) => void | boolean | Promise<void>;
}

const iconClassName = "size-4";

function getSlashCommandItems(promptUser: PromptUser): SlashCommandItem[] {
  return [
    {
      title: "Text",
      description: "Start writing with plain text",
      group: "Basic",
      aliases: ["paragraph", "plain", "body", "p"],
      icon: <TextIcon className={iconClassName} />,
      action: ({ editor }) => editor.chain().focus().setParagraph().run(),
    },
    {
      title: "Heading 1",
      description: "Big section heading",
      group: "Basic",
      aliases: ["h1", "title", "heading", "#"],
      icon: <Heading1Icon className={iconClassName} />,
      action: ({ editor }) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      title: "Heading 2",
      description: "Medium section heading",
      group: "Basic",
      aliases: ["h2", "subtitle", "heading", "##"],
      icon: <Heading2Icon className={iconClassName} />,
      action: ({ editor }) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      title: "Heading 3",
      description: "Small section heading",
      group: "Basic",
      aliases: ["h3", "heading", "###"],
      icon: <Heading3Icon className={iconClassName} />,
      action: ({ editor }) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      title: "Bullet List",
      description: "Create a simple bullet list",
      group: "Lists",
      aliases: ["ul", "unordered", "bullet", "list", "-"],
      icon: <FormatListBulletedIcon className={iconClassName} />,
      action: ({ editor }) => editor.chain().focus().toggleBulletList().run(),
    },
    {
      title: "Numbered List",
      description: "Create a list with numbering",
      group: "Lists",
      aliases: ["ol", "ordered", "number", "list", "1."],
      icon: <FormatListNumberedIcon className={iconClassName} />,
      action: ({ editor }) => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      title: "Task List",
      description: "Track tasks with a checklist",
      group: "Lists",
      aliases: ["todo", "checklist", "checkbox", "task", "[]"],
      icon: <TaskListIcon className={iconClassName} />,
      action: ({ editor }) => editor.chain().focus().toggleTaskList().run(),
    },
    {
      title: "Quote",
      description: "Capture a quotation",
      group: "Blocks",
      aliases: ["blockquote", "citation", "quote", ">"],
      icon: <QuoteIcon className={iconClassName} />,
      action: ({ editor }) => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      title: "Code Block",
      description: "Insert a code snippet",
      group: "Blocks",
      aliases: ["code", "pre", "snippet", "```"],
      icon: <CodeIcon className={iconClassName} />,
      action: ({ editor }) => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      title: "Mathematical Formula",
      description: "Insert a LaTeX expression",
      group: "Blocks",
      aliases: ["math", "latex", "katex", "formula", "equation"],
      icon: <MathIcon className={iconClassName} />,
      action: async ({ editor }) => {
        const isInline = editor.isActive("inlineMath");
        const isBlock = editor.isActive("blockMath");
        const { empty, from, to, $from, $to } = editor.state.selection;
        const selectedText = empty ? "" : editor.state.doc.textBetween(from, to, "\n");

        const currentLatex = isInline
          ? editor.getAttributes("inlineMath").latex
          : isBlock
            ? editor.getAttributes("blockMath").latex
            : selectedText;

        let latex: string | null = currentLatex;

        if (empty || isInline || isBlock) {
          latex = await promptUser("Type your math expression (LaTeX):", currentLatex);
        }

        if (latex !== null && latex.trim() !== "") {
          if (isInline) {
            editor.chain().focus().updateInlineMath({ latex }).run();
          } else if (isBlock) {
            editor.chain().focus().updateBlockMath({ latex }).run();
          } else {
            if (!empty) {
              const isEntireNodeSelected =
                $from.parent === $to.parent &&
                $from.parentOffset === 0 &&
                $to.parentOffset === $to.parent.content.size;
              const spansMultipleBlocks = $from.parent !== $to.parent;
              const shouldBeBlock = isEntireNodeSelected || spansMultipleBlocks;

              if (shouldBeBlock) {
                editor.chain().focus().deleteSelection().insertBlockMath({ latex }).run();
              } else {
                editor.chain().focus().deleteSelection().insertInlineMath({ latex }).run();
              }
            } else {
              const isCurrentNodeEmpty =
                editor.state.selection.$head.parent.textContent.trim() === "";
              if (isCurrentNodeEmpty) {
                editor.chain().focus().insertBlockMath({ latex }).run();
              } else {
                editor.chain().focus().insertInlineMath({ latex }).run();
              }
            }
          }
        } else if (latex !== null && latex.trim() === "") {
          if (isInline) {
            editor.chain().focus().deleteInlineMath().run();
          } else if (isBlock) {
            editor.chain().focus().deleteBlockMath().run();
          }
        }
      },
    },
    {
      title: "Bold",
      description: "Make the text bold",
      group: "Formatting",
      aliases: ["strong", "b", "bold"],
      icon: <BoldIcon className={iconClassName} />,
      action: ({ editor }) => editor.chain().focus().toggleBold().run(),
    },
    {
      title: "Italic",
      description: "Make the text italic",
      group: "Formatting",
      aliases: ["em", "i", "italic"],
      icon: <ItalicIcon className={iconClassName} />,
      action: ({ editor }) => editor.chain().focus().toggleItalic().run(),
    },
    {
      title: "Underline",
      description: "Underline the text",
      group: "Formatting",
      aliases: ["u", "underline"],
      icon: <UnderlineIcon className={iconClassName} />,
      action: ({ editor }) => editor.chain().focus().toggleUnderline().run(),
    },
    {
      title: "Highlight",
      description: "Highlight the text",
      group: "Formatting",
      aliases: ["mark", "highlight"],
      icon: <HighlightIcon className={iconClassName} />,
      action: ({ editor }) => editor.chain().focus().toggleMark("highlight").run(),
    },
  ];
}

function filterSlashCommandItems(items: SlashCommandItem[], query: string): SlashCommandItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) return items;

  return items.filter((item) =>
    [item.title, ...item.aliases].some((value) => value.toLowerCase().includes(normalizedQuery)),
  );
}

type SlashCommandKeyDownHandler = (props: SuggestionKeyDownProps) => boolean;

interface SlashCommandListProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
  loading?: boolean;
  keyDownRef: { current: SlashCommandKeyDownHandler | null };
}

function SlashCommandList({ items, command, loading, keyDownRef }: SlashCommandListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useEffect(() => {
    containerRef.current
      ?.querySelector<HTMLElement>(`[data-index="${selectedIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  keyDownRef.current = ({ event }) => {
    if (items.length === 0) return false;

    if (event.key === "ArrowUp") {
      setSelectedIndex((selectedIndex + items.length - 1) % items.length);
      return true;
    }

    if (event.key === "ArrowDown") {
      setSelectedIndex((selectedIndex + 1) % items.length);
      return true;
    }

    if (event.key === "Enter") {
      const item = items[selectedIndex];
      if (item) command(item);
      return true;
    }

    return false;
  };

  return (
    <div
      ref={containerRef}
      className="z-50 max-h-72 max-w-64 min-w-56 overflow-y-auto rounded-xs border border-gray-300 bg-white p-1 shadow-lg ring-1 shadow-gray-500/10 ring-gray-500/5 dark:border-gray-600 dark:bg-gray-900 dark:shadow-black/20 dark:ring-gray-500/10"
    >
      {loading && items.length === 0 && (
        <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">Loading…</div>
      )}

      {!loading && items.length === 0 && (
        <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">No results</div>
      )}

      {items.map((item, index) => (
        <button
          key={item.title}
          type="button"
          data-index={index}
          onClick={() => command(item)}
          onMouseEnter={() => setSelectedIndex(index)}
          className={cn(
            "flex w-full cursor-pointer items-center gap-2 rounded-xs px-2 py-1 text-left text-sm transition-colors duration-150 select-none",
            {
              "bg-blue-50 text-blue-600 dark:bg-gray-800 dark:text-blue-400":
                index === selectedIndex,
              "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800/60":
                index !== selectedIndex,
            },
          )}
        >
          <span
            className={cn(
              "flex size-4 shrink-0 items-center justify-center transition-colors duration-150",
              {
                "text-blue-600 dark:text-blue-400": index === selectedIndex,
                "text-gray-500 dark:text-gray-400": index !== selectedIndex,
              },
            )}
          >
            {item.icon}
          </span>
          <span className="truncate font-medium">{item.title}</span>
        </button>
      ))}
    </div>
  );
}

interface SlashCommandExtensionOptions {
  suggestion: Omit<SuggestionOptions<SlashCommandItem, SlashCommandItem>, "editor">;
}

export function createSlashCommandExtension(promptUser: PromptUser) {
  const items = getSlashCommandItems(promptUser);

  return Extension.create<SlashCommandExtensionOptions>({
    name: "slashCommand",
    addOptions() {
      return {
        suggestion: {
          char: "/",
          allowSpaces: false,
          allowedPrefixes: [" "],
          startOfLine: false,
          allow: ({ editor }) => !editor.isActive("codeBlock"),
          items: ({ query }) => filterSlashCommandItems(items, query),
          command: ({ editor, range, props }) => {
            editor.chain().focus().deleteRange(range).run();
            props.action({ editor, range });
          },
          render: () => {
            let component: ReactRenderer<unknown, SlashCommandListProps> | null = null;
            let unmount: (() => void) | null = null;
            const keyDownRef: { current: SlashCommandKeyDownHandler | null } = { current: null };

            return {
              onStart: (props) => {
                component = new ReactRenderer<unknown, SlashCommandListProps>(SlashCommandList, {
                  props: {
                    items: props.items,
                    command: props.command,
                    loading: props.loading,
                    keyDownRef,
                  },
                  editor: props.editor,
                });

                unmount = props.mount(component.element);
              },
              onUpdate: (props) => {
                component?.updateProps({
                  items: props.items,
                  command: props.command,
                  loading: props.loading,
                  keyDownRef,
                });
              },
              onKeyDown: (props) => keyDownRef.current?.(props) ?? false,
              onExit: () => {
                keyDownRef.current = null;
                unmount?.();
                unmount = null;
                component?.destroy();
                component = null;
              },
            };
          },
        },
      };
    },
    addProseMirrorPlugins() {
      return [Suggestion({ editor: this.editor, ...this.options.suggestion })];
    },
  });
}
