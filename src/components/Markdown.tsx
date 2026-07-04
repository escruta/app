import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "../lib/utils";
import { CodeBlock } from "./CodeBlock";
import { type CitedSource } from "./chat/ChatMessage";
import { Tooltip, Chip } from "./ui";

interface MarkdownProps {
  text: string;
  baseUrl?: string;
  showLinks?: boolean;
  citedSources?: CitedSource[];
  onSourceClick?: (sourceId: string) => void;
}

export const Markdown = memo(function Markdown({
  text,
  baseUrl,
  showLinks = true,
  citedSources,
  onSourceClick,
}: MarkdownProps) {
  const processedText = text
    .replace(/\\\[/g, "$$$$")
    .replace(/\\\]/g, "$$$$")
    .replace(/\\\(/g, "$$")
    .replace(/\\\)/g, "$$");

  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath, remarkGfm]}
      rehypePlugins={[rehypeKatex]}
      components={{
        h1: ({ children }) => (
          <h1 className="my-4 text-[1.875rem] leading-[1.2] font-semibold">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="my-4 text-[1.5rem] leading-[1.3] font-semibold">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="my-4 text-[1.25rem] leading-[1.4] font-semibold">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="my-4 text-base leading-normal font-semibold">{children}</h4>
        ),
        h5: ({ children }) => (
          <h5 className="my-4 text-base leading-normal font-semibold">{children}</h5>
        ),
        h6: ({ children }) => (
          <h6 className="my-4 text-base leading-normal font-semibold">{children}</h6>
        ),
        p: ({ children }) => <p>{children}</p>,
        ul: ({ className, children }) => (
          <ul
            className={cn(
              "my-4 pl-6",
              className?.includes("contains-task-list") ? "list-none pl-0" : "list-disc",
              className,
            )}
          >
            {children}
          </ul>
        ),
        ol: ({ className, children }) => (
          <ol className={cn("list-decimal my-4 pl-6", className)}>{children}</ol>
        ),
        li: ({ className, children }) => (
          <li
            className={cn(
              "mb-2 leading-normal",
              className?.includes("task-list-item") ? "flex items-start" : "",
              className,
            )}
          >
            {children}
          </li>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-4 border-l-4 border-gray-200 pl-4 text-gray-600 dark:border-gray-700 dark:text-gray-400">
            {children}
          </blockquote>
        ),
        code: ({ className, children }) => {
          const match = /language-(\w+)/.exec(className || "");
          const inline = !match;
          return (
            <CodeBlock inline={inline} className={className}>
              {String(children).replace(/\n$/, "")}
            </CodeBlock>
          );
        },
        pre: ({ children }) => <>{children}</>,
        hr: () => <hr className="my-8 border-0 border-t border-gray-200 dark:border-gray-700" />,
        strong: ({ children }) => (
          <strong className="font-semibold text-inherit">{children}</strong>
        ),
        em: ({ children }) => <em className="text-inherit italic">{children}</em>,
        u: ({ children }) => (
          <u className="text-inherit underline decoration-blue-500/60 underline-offset-4">
            {children}
          </u>
        ),
        a: ({ href, children }) => {
          if (href?.startsWith("#cite-")) {
            const sourceId = href.replace("#cite-", "");
            const sourceIndex = citedSources?.findIndex((s) => s.id === sourceId) ?? -1;
            const number = sourceIndex !== -1 ? sourceIndex + 1 : "?";
            const source = citedSources?.find((s) => s.id === sourceId);
            const documentId = source?.documentId || sourceId;
            const title = source?.title || "Unknown source";
            const citeText = source?.text || "";

            return (
              <Tooltip
                text={
                  <div className="flex max-h-40 w-full flex-col">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onSourceClick?.(documentId);
                      }}
                      className="sticky top-0 z-10 shrink-0 cursor-pointer truncate rounded-t-xs border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold transition-colors dark:border-gray-700 dark:bg-gray-900"
                    >
                      {title}
                    </div>
                    <div className="overflow-y-auto p-3 text-sm leading-relaxed wrap-break-word whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      <Markdown text={citeText} baseUrl={baseUrl} showLinks={false} />
                    </div>
                  </div>
                }
                position="top"
              >
                <span className="mx-0.5 inline-flex align-text-top">
                  <Chip
                    size="sm"
                    onClick={() => onSourceClick?.(documentId)}
                    className="h-4 min-h-0! px-1.5! py-0! text-[0.65rem]!"
                  >
                    {number}
                  </Chip>
                </span>
              </Tooltip>
            );
          }

          let resolvedHref = href;
          if (baseUrl && href) {
            try {
              resolvedHref = new URL(href, baseUrl).toString();
            } catch (error) {
              console.error(error);
            }
          }

          return showLinks ? (
            <a
              href={resolvedHref}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer text-blue-600 underline dark:text-blue-400"
            >
              {children}
            </a>
          ) : (
            children
          );
        },
        img: ({ src, alt, title }) => {
          let resolvedSrc = src;
          if (baseUrl && src) {
            try {
              resolvedSrc = new URL(src, baseUrl).toString();
            } catch (error) {
              console.error(error);
            }
          }
          return (
            <img
              src={resolvedSrc}
              alt={alt}
              title={title}
              className="my-4 h-auto max-w-full rounded-xs"
            />
          );
        },
        table: ({ children }) => (
          <div className="my-2 w-full overflow-x-auto">
            <table className="w-full border-collapse text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-gray-100 dark:bg-gray-800">{children}</thead>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => (
          <tr className="border-b border-gray-200 dark:border-gray-700">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="border-b border-gray-300 px-3 py-2 text-left font-semibold dark:border-gray-600">
            {children}
          </th>
        ),
        td: ({ children }) => <td className="px-3 py-2 align-top">{children}</td>,
      }}
    >
      {processedText}
    </ReactMarkdown>
  );
});
