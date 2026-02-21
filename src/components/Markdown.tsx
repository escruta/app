import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "../lib/utils";
import { CodeBlock } from "./CodeBlock";

interface MarkdownProps {
  text: string;
  linkColorClass?: string;
}

export function Markdown({ text, linkColorClass }: MarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath, remarkGfm]}
      rehypePlugins={[rehypeKatex]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-[1.875rem] font-semibold my-4 leading-[1.2]">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-[1.5rem] font-semibold my-4 leading-[1.3]">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-[1.25rem] font-semibold my-4 leading-[1.4]">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-base font-semibold my-4 leading-[1.5]">
            {children}
          </h4>
        ),
        h5: ({ children }) => (
          <h5 className="text-base font-semibold my-4 leading-[1.5]">
            {children}
          </h5>
        ),
        h6: ({ children }) => (
          <h6 className="text-base font-semibold my-4 leading-[1.5]">
            {children}
          </h6>
        ),
        p: ({ children }) => <p className="my-2">{children}</p>,
        ul: ({ className, children }) => (
          <ul
            className={cn(
              "my-4 pl-6",
              className?.includes("contains-task-list")
                ? "list-none pl-0"
                : "list-disc",
              className,
            )}
          >
            {children}
          </ul>
        ),
        ol: ({ className, children }) => (
          <ol className={cn("list-decimal my-4 pl-6", className)}>
            {children}
          </ol>
        ),
        li: ({ className, children }) => (
          <li
            className={cn(
              "mb-2 leading-[1.5]",
              className?.includes("task-list-item") ? "flex items-start" : "",
              className,
            )}
          >
            {children}
          </li>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-200 dark:border-gray-700 pl-4 my-4 text-gray-600 dark:text-gray-400">
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
        hr: () => (
          <hr className="border-0 border-t border-gray-200 dark:border-gray-700 my-8" />
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-inherit">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-inherit">{children}</em>
        ),
        u: ({ children }) => (
          <u className="underline text-inherit">{children}</u>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "text-blue-500 dark:text-blue-400 underline cursor-pointer",
              linkColorClass,
            )}
          >
            {children}
          </a>
        ),
        table: ({ children }) => (
          <table className="w-full border-collapse my-2 text-sm">
            {children}
          </table>
        ),
        thead: ({ children }) => (
          <thead className="bg-gray-100 dark:bg-gray-800">{children}</thead>
        ),
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => (
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {children}
          </tr>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 text-left font-semibold border-b border-gray-300 dark:border-gray-600">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 align-top">{children}</td>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
