import { lazy, type ReactNode } from "react";
import { Alert, Button, Chip } from "@/components/ui";
import { FileIcon, RestartIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

const Markdown = lazy(() => import("../Markdown").then((module) => ({ default: module.Markdown })));
const CodeBlock = lazy(() =>
  import("../CodeBlock").then((module) => ({ default: module.CodeBlock })),
);

type Sender = "user" | "ai";

export interface CitedSource {
  id: string;
  title: string;
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  citedSources?: CitedSource[];
  error?: true;
  selectedSourcesCount?: number;
}

function processMessage(message: Message, onRetry?: () => void): ReactNode {
  if (message.error) {
    return (
      <div className="flex flex-col gap-3">
        <Alert title="Error" message={message.text} variant="danger" />
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="ghost"
            size="sm"
            icon={<RestartIcon className="size-4" />}
          >
            Retry message
          </Button>
        )}
      </div>
    );
  }

  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match = codeBlockRegex.exec(message.text);

  while (match !== null) {
    if (match.index > lastIndex) {
      const beforeCode = message.text.slice(lastIndex, match.index);
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
    match = codeBlockRegex.exec(message.text);
  }

  if (lastIndex < message.text.length) {
    const remaining = message.text.slice(lastIndex);
    if (remaining.trim()) {
      parts.push({ type: "text", content: remaining });
    }
  }

  if (parts.length === 0) {
    parts.push({ type: "text", content: message.text });
  }

  return parts.map((part, index) => {
    if (part.type === "code") {
      return (
        <CodeBlock key={index} className={part.language ? `language-${part.language}` : ""}>
          {part.content}
        </CodeBlock>
      );
    }

    return (
      <div key={index}>
        <Markdown text={part.content} />
      </div>
    );
  });
}

interface ChatMessageProps {
  message: Message;
  index: number;
  onRetryFromError: (index: number) => void;
  onSourceClick: (sourceId: string) => void;
}

export function ChatMessage({ message, index, onRetryFromError, onSourceClick }: ChatMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn("message-item scroll-mt-4 flex flex-col mb-4", {
        "justify-end items-end": message.sender === "user",
        "justify-start items-start": message.sender === "ai",
      })}
    >
      <div
        className={cn("w-full flex flex-col gap-4 select-text transition-all duration-200", {
          "max-w-[85%] sm:max-w-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 p-4 rounded-xs self-end ml-12 shadow-sm":
            message.sender === "user",
          "max-w-3xl self-start mr-12 py-2": message.sender === "ai" && !message.error,
          "max-w-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 p-4 rounded-xs self-start mr-12":
            message.error,
        })}
      >
        <div
          className={cn("text-base font-medium leading-relaxed", {
            "text-gray-900 dark:text-gray-100": message.sender === "user",
            "text-gray-950 dark:text-gray-50": message.sender === "ai",
          })}
        >
          {processMessage(message, message.error ? () => onRetryFromError(index) : undefined)}
        </div>

        {message.sender === "ai" && message.citedSources && message.citedSources.length > 0 && (
          <div className="border-t border-gray-200/65 pt-4 dark:border-gray-800/65">
            <div className="mb-3 text-xs font-bold tracking-widest text-gray-500 uppercase select-none dark:text-gray-400">
              Cited sources
            </div>
            <div className="flex flex-wrap gap-2">
              {message.citedSources.map((source, idx) => (
                <Chip
                  key={source.id}
                  onClick={() => onSourceClick(source.id)}
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
          <div className="mt-2 flex justify-end">
            <Chip size="sm" icon={<FileIcon className="size-2.5" />}>
              {message.selectedSourcesCount} source
              {message.selectedSourcesCount !== 1 ? "s" : ""} selected
            </Chip>
          </div>
        )}
    </motion.div>
  );
}
