import { lazy, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  Button,
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuTrigger,
  Spinner,
  Tooltip,
} from "@/components/ui";
import {
  CheckIcon,
  ChevronIcon,
  CopyIcon,
  FileTextIcon,
  NoteIcon,
  RestartIcon,
} from "@/components/icons";
import type { AgentStep } from "@/interfaces";
import { writeClipboardText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import { useAccessibility } from "@/hooks";
import { AnimatePresence, motion } from "motion/react";
import { AgentThinkingPanel } from "./AgentThinkingPanel";

const Markdown = lazy(() => import("../Markdown").then((module) => ({ default: module.Markdown })));
const CodeBlock = lazy(() =>
  import("../CodeBlock").then((module) => ({ default: module.CodeBlock })),
);

type Sender = "user" | "ai";

export interface CitedSource {
  id: string;
  documentId: string;
  title: string;
  text?: string;
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  citedSources?: CitedSource[];
  thinkingSteps?: AgentStep[];
  thinkingDurationMs?: number;
  isStreaming?: boolean;
  error?: true;
  selectedSourcesCount?: number;
}

type RenderSegment =
  | { kind: "agent"; key: string; steps: AgentStep[] }
  | { kind: "text"; key: string; text: string };

function stripSourceCitations(text: string): string {
  return text.replace(/[ \t]*\[source_([a-fA-F0-9-]+)\]/g, "").trim();
}

function renderMarkdownText(
  text: string,
  citedSources: CitedSource[] | undefined,
  showCitedSources: boolean,
  onSourceClick?: (sourceId: string) => void,
): ReactNode {
  if (!text) {
    return null;
  }

  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match = codeBlockRegex.exec(text);

  while (match !== null) {
    if (match.index > lastIndex) {
      const beforeCode = text.slice(lastIndex, match.index);
      if (beforeCode.trim()) {
        parts.push({ type: "text", content: beforeCode });
      }
    }

    parts.push({
      type: "code",
      language: match[1] || "",
      content: match[2],
    });

    lastIndex = match.index + match[0].length;
    match = codeBlockRegex.exec(text);
  }

  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    if (remaining.trim()) {
      parts.push({ type: "text", content: remaining });
    }
  }

  if (parts.length === 0) {
    parts.push({ type: "text", content: text });
  }

  return parts.map((part, index) => {
    if (part.type === "code") {
      return (
        <CodeBlock
          key={index}
          className={cn({ [`language-${part.language}`]: Boolean(part.language) })}
        >
          {part.content}
        </CodeBlock>
      );
    }

    return (
      <div key={index}>
        <Markdown
          text={
            showCitedSources
              ? part.content.replace(/\[source_([a-fA-F0-9-]+)\]/g, "[cite](#cite-$1)")
              : part.content.replace(/[ \t]*\[source_([a-fA-F0-9-]+)\]/g, "")
          }
          citedSources={showCitedSources ? citedSources : undefined}
          onSourceClick={onSourceClick}
          showLinks={false}
        />
      </div>
    );
  });
}

function buildSegments(message: Message, showThinking: boolean): RenderSegment[] {
  const steps = message.thinkingSteps ?? [];
  const hasInterleavedText = steps.some((s) => s.type === "text" && Boolean(s.detail));

  if (!hasInterleavedText) {
    const segments: RenderSegment[] = [];
    if (showThinking && steps.length > 0) {
      segments.push({ kind: "agent", key: "agent-0", steps });
    }
    if (message.text) {
      segments.push({ kind: "text", key: "text-0", text: message.text });
    }
    return segments;
  }

  const segments: RenderSegment[] = [];
  let pendingAgentSteps: AgentStep[] = [];

  const flushAgent = () => {
    if (showThinking && pendingAgentSteps.length > 0) {
      const hasVisible = pendingAgentSteps.some(
        (s) =>
          s.type !== "synthesize" &&
          s.type !== "analyze" &&
          (s.type !== "thought" || Boolean(s.detail?.trim())),
      );
      if (hasVisible) {
        segments.push({
          kind: "agent",
          key: `agent-${pendingAgentSteps[0].id}`,
          steps: pendingAgentSteps,
        });
      }
    }
    pendingAgentSteps = [];
  };

  for (const step of steps) {
    if (step.type === "text") {
      flushAgent();
      if (step.detail) {
        segments.push({ kind: "text", key: `text-${step.id}`, text: step.detail });
      }
    } else {
      pendingAgentSteps.push(step);
    }
  }
  flushAgent();

  return segments;
}

interface ChatMessageProps {
  message: Message;
  index: number;
  showCitedSources?: boolean;
  showThinking?: boolean;
  autoExpandThinking?: boolean;
  onRetryFromError: (index: number) => void;
  onSourceClick: (sourceId: string) => void;
  onSaveAsNote?: (content: string, index: number) => Promise<boolean> | boolean;
}

export function ChatMessage({
  message,
  index,
  showCitedSources = true,
  showThinking = true,
  autoExpandThinking = true,
  onRetryFromError,
  onSourceClick,
  onSaveAsNote,
}: ChatMessageProps) {
  const { effectiveReducedMotion } = useAccessibility();
  const isAI = message.sender === "ai";
  const [copied, setCopied] = useState(false);
  const [saveNoteState, setSaveNoteState] = useState<"idle" | "saving" | "saved">("idle");

  const segments = isAI && !message.error ? buildSegments(message, showThinking) : [];
  const showInitialThinkingIndicator =
    isAI && !message.error && message.isStreaming && segments.length === 0;

  const cleanMessageText = useMemo(() => stripSourceCitations(message.text), [message.text]);

  const uniqueCitedSources = useMemo(() => {
    if (!message.citedSources?.length) return [];
    const seen = new Set<string>();
    const result: CitedSource[] = [];
    for (const source of message.citedSources) {
      if (!seen.has(source.documentId)) {
        seen.add(source.documentId);
        result.push(source);
      }
    }
    return result;
  }, [message.citedSources]);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  useEffect(() => {
    if (saveNoteState !== "saved") return;
    const timeout = window.setTimeout(() => setSaveNoteState("idle"), 2500);
    return () => window.clearTimeout(timeout);
  }, [saveNoteState]);

  const handleCopyMessage = () => {
    if (!cleanMessageText) return;
    void writeClipboardText(cleanMessageText).catch((error) => {
      console.warn("Clipboard write failed:", error);
    });
    setCopied(true);
  };

  const handleSaveNote = async () => {
    if (!onSaveAsNote || !cleanMessageText || saveNoteState === "saving") return;
    setSaveNoteState("saving");
    try {
      const ok = await onSaveAsNote(cleanMessageText, index);
      setSaveNoteState(ok ? "saved" : "idle");
    } catch {
      setSaveNoteState("idle");
    }
  };

  const showAIActions =
    isAI && !message.error && !message.isStreaming && cleanMessageText.length > 0;
  const hasVisibleCitedSources = showCitedSources && uniqueCitedSources.length > 0;

  return (
    <motion.div
      data-sender={message.sender}
      initial={
        effectiveReducedMotion
          ? false
          : isAI
            ? { opacity: 0, y: -5 }
            : { opacity: 0, y: 15, scale: 0.98 }
      }
      animate={isAI ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, scale: 1 }}
      exit={effectiveReducedMotion ? undefined : { opacity: 0, y: -10, scale: 0.98 }}
      transition={
        effectiveReducedMotion
          ? { duration: 0 }
          : isAI
            ? { duration: 0.35, ease: [0.2, 0.65, 0.3, 0.9] }
            : { type: "spring", stiffness: 250, damping: 25 }
      }
      className={cn("message-item group scroll-mt-4 flex flex-col mb-4", {
        "justify-end items-end": message.sender === "user",
        "justify-start items-start": message.sender === "ai",
      })}
    >
      {message.sender === "user" ? (
        <div className="flex w-full flex-col items-end">
          <div className="flex w-full items-center justify-end gap-1.5">
            <Tooltip text={copied ? "Copied" : "Copy"} position="top">
              <IconButton
                variant="ghost"
                size="xs"
                className={cn(
                  "shrink-0 transition-opacity duration-150",
                  copied
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
                )}
                onClick={handleCopyMessage}
                ariaLabel={copied ? "Copied message" : "Copy message"}
                icon={copied ? <CheckIcon className="text-green-500" /> : <CopyIcon />}
              />
            </Tooltip>

            <div className="user-message-bubble w-fit max-w-[85%] min-w-0 rounded-xs border border-blue-300/80 bg-blue-100 px-3.5 py-2.5 transition-colors duration-200 select-text sm:max-w-xl dark:border-blue-700/60 dark:bg-blue-900/45">
              <div className="text-base leading-relaxed font-medium wrap-break-word text-gray-900 dark:text-gray-100 [&_code:not(.block)]:bg-blue-200/70 [&_code:not(.block)]:text-blue-950 dark:[&_code:not(.block)]:bg-blue-800/60 dark:[&_code:not(.block)]:text-blue-100">
                {renderMarkdownText(message.text, undefined, false)}
              </div>
            </div>
          </div>

          {message.selectedSourcesCount !== undefined && message.selectedSourcesCount > 0 && (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-xs border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600 select-none dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
              <FileTextIcon className="size-3 shrink-0" />
              <span>
                {message.selectedSourcesCount} source
                {message.selectedSourcesCount !== 1 ? "s" : ""}
              </span>
            </span>
          )}
        </div>
      ) : (
        <div
          className={cn("flex w-full flex-col gap-3 transition-all duration-200 select-none", {
            "mr-12 max-w-3xl self-start py-2": !message.error,
            "mr-12 max-w-2xl self-start rounded-xs border border-red-100 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/40":
              message.error,
          })}
        >
          {message.error ? (
            <div className="flex flex-col gap-3">
              <Alert message={message.text} variant="danger" />
              <Button
                onClick={() => onRetryFromError(index)}
                variant="ghost"
                size="sm"
                icon={<RestartIcon className="size-4" />}
              >
                Try again
              </Button>
            </div>
          ) : (
            <>
              {showInitialThinkingIndicator && (
                <div className="flex items-center gap-2 py-0.5 text-xs text-gray-500 dark:text-gray-400">
                  <Spinner size={13} className="text-blue-500 dark:text-blue-400" />
                  <span>{showThinking ? "Thinking..." : "Generating..."}</span>
                </div>
              )}

              {segments.map((segment) =>
                segment.kind === "agent" ? (
                  <AgentThinkingPanel
                    key={segment.key}
                    steps={segment.steps}
                    isMessageStreaming={Boolean(message.isStreaming)}
                    autoExpand={autoExpandThinking}
                    fallbackDurationMs={
                      segments.filter((s) => s.kind === "agent").length === 1
                        ? message.thinkingDurationMs
                        : undefined
                    }
                  />
                ) : (
                  <div
                    key={segment.key}
                    className="text-base leading-relaxed font-medium text-gray-950 dark:text-gray-50 [&_blockquote]:select-text [&_code]:select-text [&_h1]:select-text [&_h2]:select-text [&_h3]:select-text [&_h4]:select-text [&_h5]:select-text [&_h6]:select-text [&_li]:select-text [&_p]:select-text [&_pre]:select-text [&_td]:select-text [&_th]:select-text"
                  >
                    {renderMarkdownText(
                      segment.text,
                      message.citedSources,
                      showCitedSources,
                      onSourceClick,
                    )}
                  </div>
                ),
              )}
            </>
          )}

          {showAIActions && (
            <div className="flex flex-wrap items-center gap-2 pt-1 select-none">
              <Tooltip text={copied ? "Copied" : "Copy"} position="top">
                <IconButton
                  variant="secondary"
                  size="sm"
                  className="border p-2"
                  onClick={handleCopyMessage}
                  ariaLabel={copied ? "Copied response" : "Copy response"}
                  icon={
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={copied ? "check" : "copy"}
                        initial={effectiveReducedMotion ? false : { opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={effectiveReducedMotion ? undefined : { opacity: 0, scale: 0.8 }}
                        transition={effectiveReducedMotion ? { duration: 0 } : { duration: 0.15 }}
                        className="flex size-full items-center justify-center [&>svg]:size-full"
                      >
                        {copied ? <CheckIcon className="text-green-500" /> : <CopyIcon />}
                      </motion.span>
                    </AnimatePresence>
                  }
                />
              </Tooltip>

              {onSaveAsNote && (
                <Tooltip
                  text={
                    saveNoteState === "saving"
                      ? "Saving note..."
                      : saveNoteState === "saved"
                        ? "Saved to notes"
                        : "Save as note"
                  }
                  position="top"
                >
                  <IconButton
                    variant="secondary"
                    size="sm"
                    className="border p-2"
                    onClick={() => void handleSaveNote()}
                    disabled={saveNoteState === "saving"}
                    ariaLabel="Save response as note"
                    icon={
                      saveNoteState === "saving" ? (
                        <Spinner size={14} />
                      ) : (
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.span
                            key={saveNoteState}
                            initial={effectiveReducedMotion ? false : { opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={effectiveReducedMotion ? undefined : { opacity: 0, scale: 0.8 }}
                            transition={
                              effectiveReducedMotion ? { duration: 0 } : { duration: 0.15 }
                            }
                            className="flex size-full items-center justify-center [&>svg]:size-full"
                          >
                            {saveNoteState === "saved" ? (
                              <CheckIcon className="text-green-500" />
                            ) : (
                              <NoteIcon />
                            )}
                          </motion.span>
                        </AnimatePresence>
                      )
                    }
                  />
                </Tooltip>
              )}

              {hasVisibleCitedSources && (
                <Menu>
                  <MenuTrigger>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<FileTextIcon />}
                      className="px-2.5"
                      title="Cited sources"
                    >
                      <span className="flex items-center gap-1.5">
                        <span>
                          {uniqueCitedSources.length} source
                          {uniqueCitedSources.length === 1 ? "" : "s"}
                        </span>
                        <ChevronIcon
                          direction="down"
                          className="size-3 opacity-70 transition-transform duration-150 in-aria-expanded:rotate-180"
                        />
                      </span>
                    </Button>
                  </MenuTrigger>
                  <MenuContent align="left">
                    <MenuLabel>Cited sources</MenuLabel>
                    {uniqueCitedSources.map((source, idx) => (
                      <MenuItem
                        key={source.documentId}
                        icon={<FileTextIcon />}
                        label={source.title || `Source ${idx + 1}`}
                        onClick={() => onSourceClick(source.documentId)}
                      />
                    ))}
                  </MenuContent>
                </Menu>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
