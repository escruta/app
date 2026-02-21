import { useEffect, useRef, useState } from "react";
import { all, createLowlight } from "lowlight";
import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Mathematics from "@tiptap/extension-mathematics";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Heading from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Code from "@tiptap/extension-code";
import { Markdown } from "@tiptap/markdown";
import { cn } from "@/lib/utils";
import { EditorCodeBlock } from "./EditorCodeBlock";
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  FormatListBulletedIcon,
  FormatListNumberedIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  MathIcon,
  QuoteIcon,
  TaskListIcon,
} from "@/components/icons";
import { Divider, Tooltip } from "./ui";
import "katex/dist/katex.min.css";
import "./Editor.css";

const lowlight = createLowlight(all);

interface ToolbarButtonProps {
  isActive: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({
  isActive,
  onClick,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <Tooltip text={title} position="top">
      <button
        onClick={onClick}
        className={cn(
          "h-8 px-2 rounded-xs flex items-center justify-center transition-all duration-200 focus:outline-none select-none cursor-pointer",
          "border border-transparent",
          {
            "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400":
              isActive,
            "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 active:bg-gray-200 dark:active:bg-gray-700":
              !isActive,
          },
        )}
        aria-label={title}
        type="button"
      >
        {children}
      </button>
    </Tooltip>
  );
}

interface EditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function Editor({
  initialContent = "",
  onContentChange,
  placeholder,
  autoFocus,
}: EditorProps) {
  const isUpdatingRef = useRef(false);
  const [, setForceUpdate] = useState(0);

  const editor = useEditor({
    extensions: [
      Mathematics.configure({
        katexOptions: {
          throwOnError: false,
        },
        inlineOptions: {
          onClick: (node, pos) => {
            const katex = prompt("Enter new calculation:", node.attrs.latex);
            if (katex) {
              editor
                .chain()
                .setNodeSelection(pos)
                .updateInlineMath({ latex: katex })
                .focus()
                .run();
            }
          },
        },
        blockOptions: {
          onClick: (node, pos) => {
            const katex = prompt("Enter new calculation:", node.attrs.latex);
            if (katex) {
              editor
                .chain()
                .setNodeSelection(pos)
                .updateBlockMath({ latex: katex })
                .focus()
                .run();
            }
          },
        },
      }),
      StarterKit.configure({
        heading: false,
        code: false,
        codeBlock: false,
      }),
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(EditorCodeBlock);
        },
      }).configure({
        lowlight,
      }),
      Code.extend({
        excludes: "",
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      Underline,
      Placeholder.configure({
        placeholder: placeholder || "Start writing...",
        emptyEditorClass: "is-editor-empty",
      }),
      Markdown,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    editorProps: {
      handleDOMEvents: {
        cut: (view, event) => {
          const { state } = view;
          const { from, to } = state.selection;

          if (from === to) return false;

          const manager = editor.storage.markdown.manager;

          if (manager) {
            const slice = state.selection.content();

            const jsonContent = slice.content.toJSON();

            const markdown = manager.serialize({
              type: "doc",
              content: jsonContent,
            });

            event.clipboardData?.setData("text/plain", markdown);
            editor.commands.deleteRange({ from, to });
            event.preventDefault();
            return true;
          }

          return false;
        },
        copy: (view, event) => {
          const { state } = view;
          const { from, to } = state.selection;

          if (from === to) return false;

          const manager = editor.storage.markdown.manager;

          if (manager) {
            const slice = state.selection.content();

            const jsonContent = slice.content.toJSON();

            const markdown = manager.serialize({
              type: "doc",
              content: jsonContent,
            });

            event.clipboardData?.setData("text/plain", markdown);
            event.preventDefault();
            return true;
          }

          return false;
        },
        paste: (_view, event) => {
          if (editor.isActive("codeBlock")) return false;

          const clipboardData = event.clipboardData;
          if (!clipboardData) return false;

          const text = clipboardData.getData("text/plain");
          if (!text) return false;

          const trimmed = text.trim();
          if (!trimmed) return false;

          if (trimmed.includes("\n") || /^[-*#>`*~_[$]/.test(trimmed)) {
            const { from } = editor.state.selection;

            try {
              editor
                .chain()
                .focus()
                .insertContentAt(from, trimmed, { contentType: "markdown" })
                .run();

              event.preventDefault();
              return true;
            } catch (e) {
              console.warn(
                "Markdown paste failed, falling back to plain text:",
                e,
              );
            }
          }

          return false;
        },
      },
    },
    content: initialContent,
    onUpdate: ({ editor }) => {
      isUpdatingRef.current = true;
      onContentChange?.(editor.getHTML());
    },
    autofocus: autoFocus ? "end" : false,
    onSelectionUpdate: () => {
      setForceUpdate((n) => n + 1);
    },
  });

  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      if (isUpdatingRef.current) {
        isUpdatingRef.current = false;
        return;
      }
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full w-full relative">
      <div className="top-0 z-10 flex overflow-x-auto overflow-y-hidden items-center gap-1 bg-white dark:bg-gray-900 px-2 py-1">
        <ToolbarButton
          isActive={editor.isActive("heading", { level: 1 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          title="Heading 1"
        >
          <Heading1Icon className="size-4" />
        </ToolbarButton>

        <ToolbarButton
          isActive={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          title="Heading 2"
        >
          <Heading2Icon className="size-4" />
        </ToolbarButton>

        <ToolbarButton
          isActive={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          title="Heading 3"
        >
          <Heading3Icon className="size-4" />
        </ToolbarButton>

        <Divider orientation="vertical" className="h-5" />

        <ToolbarButton
          isActive={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <BoldIcon className="size-4" />
        </ToolbarButton>

        <ToolbarButton
          isActive={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <ItalicIcon className="size-4" />
        </ToolbarButton>

        <ToolbarButton
          isActive={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <UnderlineIcon className="size-4" />
        </ToolbarButton>

        <Divider orientation="vertical" className="h-5" />

        <ToolbarButton
          isActive={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <FormatListBulletedIcon className="size-4" />
        </ToolbarButton>

        <ToolbarButton
          isActive={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        >
          <FormatListNumberedIcon className="size-4" />
        </ToolbarButton>

        <ToolbarButton
          isActive={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          title="Task List"
        >
          <TaskListIcon className="size-4" />
        </ToolbarButton>

        <ToolbarButton
          isActive={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Quote"
        >
          <QuoteIcon className="size-4" />
        </ToolbarButton>

        <Divider orientation="vertical" className="h-5" />

        <ToolbarButton
          isActive={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
        >
          <CodeIcon className="size-4" />
        </ToolbarButton>

        <ToolbarButton
          isActive={
            editor.isActive("inlineMath") || editor.isActive("blockMath")
          }
          onClick={() => {
            const isInline = editor.isActive("inlineMath");
            const isBlock = editor.isActive("blockMath");
            const { empty, from, to, $from, $to } = editor.state.selection;
            const selectedText = empty
              ? ""
              : editor.state.doc.textBetween(from, to, "\n");

            const currentLatex = isInline
              ? editor.getAttributes("inlineMath").latex
              : isBlock
                ? editor.getAttributes("blockMath").latex
                : selectedText;

            let latex: string | null = currentLatex;

            if (empty || isInline || isBlock) {
              latex = window.prompt(
                "Mathematical expression (LaTeX):",
                currentLatex,
              );
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
                  const shouldBeBlock =
                    isEntireNodeSelected || spansMultipleBlocks;

                  if (shouldBeBlock) {
                    editor
                      .chain()
                      .focus()
                      .deleteSelection()
                      .insertBlockMath({ latex })
                      .run();
                  } else {
                    editor
                      .chain()
                      .focus()
                      .deleteSelection()
                      .insertInlineMath({ latex })
                      .run();
                  }
                } else {
                  const isCurrentNodeEmpty =
                    editor.state.selection.$head.parent.textContent.trim() ===
                    "";
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
          }}
          title="Mathematical Formula"
        >
          <MathIcon className="size-4" />
        </ToolbarButton>
      </div>

      <Divider orientation="horizontal" className="my-0" />

      <EditorContent
        editor={editor}
        className="flex-1 min-h-0 w-full flex flex-col overflow-hidden [&>div]:flex-1 [&>div]:overflow-y-auto"
      />
    </div>
  );
}
