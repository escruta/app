import { useState } from "react";
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { CopyButton, Dropdown, Tooltip } from "./ui";

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

  const currentLanguageLabel =
    languages.find((l) => l.value === (node.attrs.language || "plaintext"))?.label || "Plain Text";

  return (
    <NodeViewWrapper className={cn("group relative my-4", { "z-50": isDropdownOpen })}>
      <div
        className={cn(
          "absolute top-2 right-2 z-10 flex items-center gap-1.5 transition-opacity duration-150",
          isDropdownOpen
            ? "opacity-100"
            : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100",
        )}
        contentEditable={false}
      >
        <Tooltip text="Copy code" position="top">
          <CopyButton textToCopy={node.textContent} tooltipText="Copy code" size="xs" />
        </Tooltip>
        <Dropdown
          align="right"
          size="sm"
          ariaLabel="Code language"
          options={languages.map((l) => l.label)}
          selectedOption={currentLanguageLabel}
          onSelect={(label) => {
            const value = languages.find((l) => l.label === label)?.value || "plaintext";
            updateAttributes({ language: value });
          }}
          onOpenChange={setIsDropdownOpen}
        />
      </div>
      <pre
        className={cn(
          "block overflow-x-auto rounded-xs border border-gray-200 bg-gray-50 p-4 font-mono text-sm leading-normal font-medium whitespace-pre text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100",
        )}
      >
        <NodeViewContent
          as={"code" as "div"}
          className={cn({ [`language-${node.attrs.language}`]: Boolean(node.attrs.language) })}
        />
      </pre>
    </NodeViewWrapper>
  );
}
