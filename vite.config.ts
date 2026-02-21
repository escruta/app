import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
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
          ],
          "markdown-vendor": [
            "react-markdown",
            "remark-math",
            "remark-gfm",
            "rehype-katex",
          ],
          "highlight-vendor": ["lowlight"],
          "katex-vendor": ["katex"],
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
