import { useEffect, useRef, useState } from "react";
import { createLowlight, common } from "lowlight";
import { cn } from "@/lib/utils";
import type { RootContent } from "hast";
import { CopyIcon, CheckIcon } from "@/components/icons";
import { IconButton } from "./ui";

const lowlight = createLowlight(common);

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  inline?: boolean;
}

export function CodeBlock({ children, className, inline }: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (codeRef.current && !inline && children) {
      const text = String(children);
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "";

      let highlighted = null;
      try {
        if (language && lowlight.registered(language)) {
          highlighted = lowlight.highlight(language, text);
        } else {
          highlighted = lowlight.highlightAuto(text);
        }
      } catch (e) {
        console.warn("Failed to highlight code:", e);
      }

      if (highlighted) {
        const toHtml = (node: RootContent): string => {
          if (node.type === "text") return escapeHtml(node.value);
          if (node.type === "element") {
            const childrenHtml = node.children.map(toHtml).join("");
            const classNameProp = node.properties?.className;
            const classAttr = classNameProp
              ? ` class="${Array.isArray(classNameProp) ? classNameProp.join(" ") : classNameProp}"`
              : "";
            return `<${node.tagName}${classAttr}>${childrenHtml}</${node.tagName}>`;
          }
          return "";
        };

        const escapeHtml = (unsafe: string) => {
          return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        };

        const html = highlighted.children.map(toHtml).join("");
        codeRef.current.innerHTML = html;
        codeRef.current.classList.add("hljs");
      } else {
        codeRef.current.textContent = text;
      }
    }
  }, [children, className, inline]);

  if (inline) {
    return (
      <code className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded-xs text-sm font-mono">
        {children}
      </code>
    );
  }

  const handleCopy = () => {
    const text = String(children);
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
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <IconButton
          icon={
            copied ? (
              <CheckIcon className="size-4" />
            ) : (
              <CopyIcon className="size-4" />
            )
          }
          onClick={handleCopy}
          size="xs"
          variant="ghost"
        />
      </div>
      <div className="overflow-x-auto p-4">
        <code
          ref={codeRef}
          className="block font-mono text-sm font-medium leading-[1.5] whitespace-pre"
        >
          {children}
        </code>
      </div>
    </div>
  );
}
