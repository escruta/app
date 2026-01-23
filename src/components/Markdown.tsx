import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "../lib/utils";
import { CodeBlock } from "@/components";

interface MarkdownProps {
  text: string;
  linkColorClass?: string;
}

export function Markdown({ text, linkColorClass }: MarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        h1: ({ children }) => (
          <h1 className="font-sans font-extrabold text-xl mt-4 mb-1 leading-tight">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="font-sans font-extrabold text-lg mt-3 mb-1 leading-tight">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="font-sans font-extrabold text-base mt-3 mb-0.5 leading-tight">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="font-sans font-extrabold text-base mt-2 mb-0.5 leading-tight">
            {children}
          </h4>
        ),
        h5: ({ children }) => (
          <h5 className="font-sans font-extrabold text-base mt-2 mb-0.5 leading-tight">
            {children}
          </h5>
        ),
        h6: ({ children }) => (
          <h6 className="font-sans font-extrabold text-base mt-2 mb-0.5 leading-tight">
            {children}
          </h6>
        ),
        p: ({ children }) => (
          <p className="my-1 text-base leading-relaxed">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-5 my-1 space-y-0.5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-5 my-1 space-y-0.5">{children}</ol>
        ),
        li: ({ children }) => <li className="mb-0.5">{children}</li>,
        code: ({ className, children }) => {
          const match = /language-(\w+)/.exec(className || "");
          const inline = !match;
          return (
            <CodeBlock
              inline={inline}
              className={cn("whitespace-pre-wrap break-words", className)}
            >
              {String(children).replace(/\n$/, "")}
            </CodeBlock>
          );
        },
        pre: ({ children }) => (
          <pre className="m-0 p-0 bg-transparent border-none whitespace-pre overflow-visible">
            {children}
          </pre>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        u: ({ children }) => <u className="underline">{children}</u>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("underline", linkColorClass)}
          >
            {children}
          </a>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
