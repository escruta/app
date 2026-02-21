import { useState } from "react";
import {
  NodeViewContent,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react";
import { cn } from "@/lib/utils";
import { Dropdown, IconButton } from "./ui";
import { CopyIcon, CheckIcon } from "@/components/icons";

interface Language {
  value: string;
  label: string;
}

const languages: Language[] = [
  { value: "plaintext", label: "Plain Text" },
  { value: "arduino", label: "Arduino" },
  { value: "bash", label: "Bash" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "css", label: "CSS" },
  { value: "diff", label: "Diff" },
  { value: "go", label: "Go" },
  { value: "graphql", label: "GraphQL" },
  { value: "ini", label: "INI" },
  { value: "java", label: "Java" },
  { value: "javascript", label: "JavaScript" },
  { value: "json", label: "JSON" },
  { value: "kotlin", label: "Kotlin" },
  { value: "less", label: "LESS" },
  { value: "lua", label: "Lua" },
  { value: "makefile", label: "Makefile" },
  { value: "markdown", label: "Markdown" },
  { value: "objectivec", label: "Objective-C" },
  { value: "perl", label: "Perl" },
  { value: "php", label: "PHP" },
  { value: "php-template", label: "PHP Template" },
  { value: "python", label: "Python" },
  { value: "python-repl", label: "Python REPL" },
  { value: "r", label: "R" },
  { value: "ruby", label: "Ruby" },
  { value: "rust", label: "Rust" },
  { value: "scss", label: "SCSS" },
  { value: "shell", label: "Shell" },
  { value: "sql", label: "SQL" },
  { value: "swift", label: "Swift" },
  { value: "typescript", label: "TypeScript" },
  { value: "vbnet", label: "VB.NET" },
  { value: "wasm", label: "WebAssembly" },
  { value: "xml", label: "XML/HTML" },
  { value: "yaml", label: "YAML" },
];

export function EditorCodeBlock({ node, updateAttributes }: NodeViewProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(node.textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentLanguageLabel =
    languages.find((l) => l.value === (node.attrs.language || "plaintext"))
      ?.label || "Plain Text";

  return (
    <NodeViewWrapper
      className={cn("relative group my-4", isDropdownOpen && "z-50")}
    >
      <div
        className={cn(
          "absolute right-2 top-2 transition-opacity z-10 flex gap-2 items-center",
          isDropdownOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
        contentEditable={false}
      >
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
        <Dropdown
          size="sm"
          options={languages.map((l) => l.label)}
          selectedOption={currentLanguageLabel}
          onSelect={(label) => {
            const value =
              languages.find((l) => l.label === label)?.value || "plaintext";
            updateAttributes({ language: value });
          }}
          onOpenChange={setIsDropdownOpen}
        />
      </div>
      <pre
        className={cn(
          "block bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xs p-4 overflow-x-auto font-mono text-sm font-medium leading-[1.5] whitespace-pre",
        )}
      >
        <NodeViewContent
          as={"code" as "div"}
          className={
            node.attrs.language ? `language-${node.attrs.language}` : ""
          }
        />
      </pre>
    </NodeViewWrapper>
  );
}
