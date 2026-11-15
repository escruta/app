import { lazy, type ReactNode } from "react";
import { Alert, Button, Chip, Spinner } from "@/components/ui";
import { FileIcon, RestartIcon } from "@/components/icons";
import type { AgentStep } from "@/interfaces";
import { cn } from "@/lib/utils";
import { useAccessibility } from "@/hooks";
import { motion } from "motion/react";
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
              : part.content.replace(/\s*\[source_([a-fA-F0-9-]+)\]/g, "")
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
}

export function ChatMessage({
  message,
  index,
  showCitedSources = true,
  showThinking = true,
  autoExpandThinking = true,
  onRetryFromError,
  onSourceClick,
}: ChatMessageProps) {
  const { effectiveReducedMotion } = useAccessibility();
  const isAI = message.sender === "ai";
  const segments = isAI && !message.error ? buildSegments(message, showThinking) : [];
  const showInitialThinkingIndicator =
    isAI && !message.error && message.isStreaming && segments.length === 0;

  return (
    <motion.div
      data-sender={message.sender}
      initial={
        effectiveReducedMotion
          ? false
          : isAI
            ? { opacity: 0, y: -5, clipPath: "inset(0 0 100% 0)" }
            : { opacity: 0, y: 15, scale: 0.98 }
      }
      animate={
        isAI ? { opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" } : { opacity: 1, y: 0, scale: 1 }
      }
      exit={effectiveReducedMotion ? undefined : { opacity: 0, y: -10, scale: 0.98 }}
      transition={
        effectiveReducedMotion
          ? { duration: 0 }
          : isAI
            ? { duration: 0.7, ease: [0.2, 0.65, 0.3, 0.9] }
            : { type: "spring", stiffness: 250, damping: 25 }
      }
      className={cn("message-item scroll-mt-4 flex flex-col mb-4", {
        "justify-end items-end": message.sender === "user",
        "justify-start items-start": message.sender === "ai",
      })}
    >
      <div
        className={cn("w-full flex flex-col gap-3 select-none transition-all duration-200", {
          "max-w-[85%] sm:max-w-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 p-4 rounded-xs self-end ml-12 shadow-sm":
            message.sender === "user",
          "max-w-3xl self-start mr-12 py-2": message.sender === "ai" && !message.error,
          "max-w-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 p-4 rounded-xs self-start mr-12":
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
        ) : message.sender === "user" ? (
          <div className="text-base leading-relaxed font-medium text-gray-900 dark:text-gray-100 [&_blockquote]:select-text [&_code]:select-text [&_h1]:select-text [&_h2]:select-text [&_h3]:select-text [&_h4]:select-text [&_h5]:select-text [&_h6]:select-text [&_li]:select-text [&_p]:select-text [&_pre]:select-text [&_td]:select-text [&_th]:select-text">
            {renderMarkdownText(message.text, undefined, false)}
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

        {showCitedSources &&
          message.sender === "ai" &&
          message.citedSources &&
          message.citedSources.length > 0 && (
            <div className="border-t border-gray-200/65 pt-4 dark:border-gray-800/65">
              <div className="mb-3 text-xs font-bold tracking-widest text-gray-500 uppercase select-none dark:text-gray-400">
                Cited sources
              </div>
              <div className="flex flex-wrap gap-2 px-1">
                {Object.values(
                  message.citedSources.reduce(
                    (acc, source) => {
                      if (!acc[source.documentId]) {
                        acc[source.documentId] = source;
                      }
                      return acc;
                    },
                    {} as Record<string, CitedSource>,
                  ),
                ).map((source, idx) => (
                  <Chip
                    key={source.documentId}
                    onClick={() => onSourceClick(source.documentId)}
                    title={source.title}
                    size="sm"
                    className="max-w-full"
                  >
                    <span className="max-w-44 truncate">{source.title || `Source ${idx + 1}`}</span>
                  </Chip>
                ))}
              </div>
            </div>
          )}
      </div>

      {message.sender === "user" &&
        message.selectedSourcesCount !== undefined &&
        message.selectedSourcesCount > 0 && (
          <div className="mt-2 mr-1 flex justify-end">
            <Chip size="sm" icon={<FileIcon className="size-2.5" />}>
              {message.selectedSourcesCount} source
              {message.selectedSourcesCount !== 1 ? "s" : ""} selected
            </Chip>
          </div>
        )}
    </motion.div>
  );
}
