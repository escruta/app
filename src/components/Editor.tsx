import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createLowlight, common } from "lowlight";
import { Mark, mergeAttributes } from "@tiptap/core";
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
import { createSlashCommandExtension, type PromptUser } from "./EditorSlashCommand";
import { CopyIcon, CutIcon, PasteIcon } from "@/components/icons";
import {
  Divider,
  Modal,
  TextField,
  Button,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "./ui";
import "katex/dist/katex.min.css";
import "./Editor.css";

const lowlight = createLowlight(common);

const Highlight = Mark.create({
  name: "highlight",
  addOptions() {
    return {
      HTMLAttributes: {
        class:
          "bg-blue-500/15 dark:bg-blue-500/30 text-black dark:text-white px-1 py-0.5 rounded-xs",
      },
    };
  },
  parseHTML() {
    return [{ tag: "mark" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["mark", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
  addKeyboardShortcuts() {
    return {
      "Mod-Shift-h": () => this.editor.commands.toggleMark(this.name),
    };
  },
});

interface EditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  scrollable?: boolean;
}

export function Editor({
  initialContent = "",
  onContentChange,
  placeholder,
  autoFocus,
  scrollable = true,
}: EditorProps) {
  const isUpdatingRef = useRef(false);
  const [, setForceUpdate] = useState(0);

  const [promptState, setPromptState] = useState<{
    isOpen: boolean;
    title: string;
    value: string;
    onConfirm: (value: string | null) => void;
  }>({
    isOpen: false,
    title: "",
    value: "",
    onConfirm: () => {},
  });

  const promptUser: PromptUser = useCallback((title, initialValue) => {
    return new Promise((resolve) => {
      setPromptState({
        isOpen: true,
        title,
        value: initialValue,
        onConfirm: (val) => {
          setPromptState((prev) => ({ ...prev, isOpen: false }));
          resolve(val);
        },
      });
    });
  }, []);

  const slashCommand = useMemo(() => createSlashCommandExtension(promptUser), [promptUser]);

  const editor = useEditor({
    extensions: [
      Mathematics.configure({
        katexOptions: {
          throwOnError: false,
        },
        inlineOptions: {
          onClick: async (node, pos) => {
            const katex = await promptUser("Enter a new calculation:", node.attrs.latex);
            if (katex !== null) {
              editor.chain().setNodeSelection(pos).updateInlineMath({ latex: katex }).focus().run();
            }
          },
        },
        blockOptions: {
          onClick: async (node, pos) => {
            const katex = await promptUser("Enter a new calculation:", node.attrs.latex);
            if (katex !== null) {
              editor.chain().setNodeSelection(pos).updateBlockMath({ latex: katex }).focus().run();
            }
          },
        },
      }),
      StarterKit.configure({
        heading: false,
        code: false,
        codeBlock: false,
      }),
      Highlight,
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
      slashCommand,
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
              console.warn("Markdown paste failed, falling back to plain text:", e);
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

  const [menuHasSelection, setMenuHasSelection] = useState(false);

  const handleContextMenu = () => {
    if (!editor) return;
    setMenuHasSelection(!editor.state.selection.empty);
  };

  const handleCopy = () => {
    if (!editor) return;
    const { from, to, empty } = editor.state.selection;
    if (empty) return;
    const manager = editor.storage.markdown?.manager;
    if (manager) {
      const slice = editor.state.selection.content();
      const markdown = manager.serialize({
        type: "doc",
        content: slice.content.toJSON(),
      });
      navigator.clipboard?.writeText(markdown);
    } else {
      const text = editor.state.doc.textBetween(from, to, "\n");
      navigator.clipboard?.writeText(text);
    }
  };

  const handleCut = () => {
    if (!editor) return;
    const { from, to, empty } = editor.state.selection;
    if (empty) return;
    const manager = editor.storage.markdown?.manager;
    if (manager) {
      const slice = editor.state.selection.content();
      const markdown = manager.serialize({
        type: "doc",
        content: slice.content.toJSON(),
      });
      navigator.clipboard?.writeText(markdown);
      editor.chain().focus().deleteRange({ from, to }).run();
    } else {
      const text = editor.state.doc.textBetween(from, to, "\n");
      navigator.clipboard?.writeText(text);
      editor.chain().focus().deleteRange({ from, to }).run();
    }
  };

  const handlePaste = async () => {
    if (!editor || editor.isActive("codeBlock")) return;
    const { from } = editor.state.selection;
    let text: string | null = null;
    try {
      text = await navigator.clipboard.readText();
    } catch {
      document.execCommand("paste");
      return;
    }
    const trimmed = text?.trim();
    if (!trimmed) return;
    if (trimmed.includes("\n") || /^[-*#>`*~_[$]/.test(trimmed)) {
      try {
        editor.chain().focus().insertContentAt(from, trimmed, { contentType: "markdown" }).run();
        return;
      } catch (e) {
        console.warn("Markdown paste failed, falling back to plain text:", e);
      }
    }
    editor.chain().focus().insertContent(text).run();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("relative flex w-full flex-col", { "h-full": scrollable })}>
      {scrollable && <Divider orientation="horizontal" className="my-0" />}

      <ContextMenu>
        <ContextMenuTrigger>
          <EditorContent
            editor={editor}
            onContextMenu={handleContextMenu}
            className={cn("flex w-full flex-col", {
              "min-h-0 flex-1 overflow-hidden [&>div]:flex-1 [&>div]:overflow-y-auto": scrollable,
              "[&>div]:overflow-visible min-h-[60vh]": !scrollable,
            })}
          />
        </ContextMenuTrigger>
        <ContextMenuContent compact>
          {menuHasSelection && (
            <>
              <ContextMenuItem
                label="Cut"
                icon={<CutIcon className="size-3.5" />}
                onClick={handleCut}
              />
              <ContextMenuItem
                label="Copy"
                icon={<CopyIcon className="size-3.5" />}
                onClick={handleCopy}
              />
            </>
          )}
          <ContextMenuItem
            label="Paste"
            icon={<PasteIcon className="size-3.5" />}
            onClick={handlePaste}
          />
        </ContextMenuContent>
      </ContextMenu>

      <Modal
        isOpen={promptState.isOpen}
        onClose={() => promptState.onConfirm(null)}
        title={promptState.title}
        width="md"
        actions={
          <>
            <Button variant="secondary" onClick={() => promptState.onConfirm(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => promptState.onConfirm(promptState.value)}>
              Save
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <TextField
            id="editor-prompt-input"
            value={promptState.value}
            onChange={(e) => setPromptState((prev) => ({ ...prev, value: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                promptState.onConfirm(promptState.value);
              }
            }}
            multiline
            minRows={3}
            maxRows={6}
            autoFocus
          />
        </div>
      </Modal>
    </div>
  );
}
