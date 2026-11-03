import { memo, useMemo, useState } from "react";
import { createLowlight, common } from "lowlight";
import { cn } from "@/lib/utils";
import type { RootContent } from "hast";
import { CopyIcon, CheckIcon } from "@/components/icons";
import { IconButton } from "./ui";

const lowlight = createLowlight(common);

const MAX_AUTO_HIGHLIGHT_LENGTH = 1500;
const MAX_HIGHLIGHT_LENGTH = 50000;
const MAX_CACHE_ENTRIES = 200;
const highlightCache = new Map<string, string | null>();

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function hastNodeToHtml(node: RootContent): string {
  if (node.type === "text") return escapeHtml(node.value);
  if (node.type === "element") {
    const childrenHtml = node.children.map(hastNodeToHtml).join("");
    const classNameProp = node.properties?.className;
    const classAttr = classNameProp
      ? ` class="${Array.isArray(classNameProp) ? classNameProp.join(" ") : classNameProp}"`
      : "";
    return `<${node.tagName}${classAttr}>${childrenHtml}</${node.tagName}>`;
  }
  return "";
}

function getHighlightedHtml(text: string, language: string): string | null {
  if (!text || text.length > MAX_HIGHLIGHT_LENGTH) return null;
  if (!language && text.length > MAX_AUTO_HIGHLIGHT_LENGTH) return null;

  const cacheKey = `${language}:${text}`;
  if (highlightCache.has(cacheKey)) {
    return highlightCache.get(cacheKey) ?? null;
  }

  let html: string | null = null;
  try {
    const highlighted =
      language && lowlight.registered(language)
        ? lowlight.highlight(language, text)
        : !language
          ? lowlight.highlightAuto(text)
          : null;

    if (highlighted) {
      html = highlighted.children.map(hastNodeToHtml).join("");
    }
  } catch (e) {
    console.warn("Failed to highlight code:", e);
  }

  if (highlightCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = highlightCache.keys().next().value;
    if (firstKey !== undefined) highlightCache.delete(firstKey);
  }
  highlightCache.set(cacheKey, html);

  return html;
}

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  inline?: boolean;
}

export const CodeBlock = memo(function CodeBlock({ children, className, inline }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const text = useMemo(() => (children ? String(children) : ""), [children]);
  const language = useMemo(() => {
    const match = /language-(\w+)/.exec(className || "");
    return match ? match[1] : "";
  }, [className]);

  const highlightedHtml = useMemo(() => {
    if (inline || !text) return null;
    return getHighlightedHtml(text, language);
  }, [inline, text, language]);

  if (inline) {
    return (
      <code className="rounded-xs bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200">
        {children}
      </code>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "relative group my-4 block bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xs overflow-hidden",
        className,
      )}
    >
      <div className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
        <IconButton
          icon={copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
          onClick={handleCopy}
          size="xs"
          variant="ghost"
        />
      </div>
      <div className="overflow-x-auto p-4">
        {highlightedHtml !== null ? (
          <code
            className="hljs block font-mono text-sm leading-normal font-medium whitespace-pre"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        ) : (
          <code className="block font-mono text-sm leading-normal font-medium whitespace-pre">
            {text}
          </code>
        )}
      </div>
    </div>
  );
});
