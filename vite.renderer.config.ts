import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

const vendorGroups: Record<string, string[]> = {
  "react-vendor": ["react", "react-dom", "react-router"],
  "tiptap-vendor": [
    "@tiptap/react",
    "@tiptap/starter-kit",
    "@tiptap/extension-underline",
    "@tiptap/extension-placeholder",
    "@tiptap/extension-code-block-lowlight",
    "@tiptap/extension-heading",
    "@tiptap/extension-link",
    "@tiptap/markdown",
    "@tiptap/extension-task-list",
    "@tiptap/extension-task-item",
    "@tiptap/extension-code",
    "@tiptap/extension-mathematics",
    "@tiptap/suggestion",
  ],
  "markdown-vendor": ["react-markdown", "remark-math", "remark-gfm", "rehype-katex"],
  "highlight-vendor": ["lowlight"],
  "katex-vendor": ["katex"],
};

function packageName(id: string) {
  return id.match(/node_modules[\\/](@[^\\/]+[\\/][^\\/]+|[^\\/]+)/)?.[1];
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        codeSplitting: {
          groups: Object.entries(vendorGroups).map(([name, packages]) => ({
            name,
            test: (id: string) => packages.includes(packageName(id) ?? ""),
          })),
        },
      },
    },
  },
  server: {
    cors: {
      origin: "*",
    },
  },
});
