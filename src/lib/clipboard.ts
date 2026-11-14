import {
  readText as tauriReadText,
  writeText as tauriWriteText,
} from "@tauri-apps/plugin-clipboard-manager";
import { isDesktop } from "@/lib/desktop";

// WebKitGTK/WKWebView block or prompt on navigator.clipboard.readText(), so the
// desktop app uses the native Tauri clipboard plugin while web keeps the DOM API.
export async function readClipboardText(): Promise<string> {
  if (isDesktop) {
    return await tauriReadText();
  }
  return await navigator.clipboard.readText();
}

export async function writeClipboardText(text: string): Promise<void> {
  if (isDesktop) {
    await tauriWriteText(text);
    return;
  }
  await navigator.clipboard.writeText(text);
}
