import { useState, useRef, useCallback } from "react";
import { useCookie } from "./useCookie";
import { AUTH_TOKEN_KEY, BACKEND_BASE_URL } from "@/config";
import type { Token } from "@/interfaces";
import type { CitedSource } from "@/components/chat/ChatMessage";

export interface ChatStreamData {
  userInput: string;
  conversationId: string | null;
  selectedSourceIds: string[];
}

export interface ChatStreamCallbacks {
  onConversation?: (conversationId: string) => void;
  onToken?: (chunk: string) => void;
  onTitle?: (title: string) => void;
  onSources?: (sources: CitedSource[]) => void;
  onDone?: () => void;
  onError?: (status: number, message: string) => void;
}

export function useChatStream(endpoint: string, callbacks: ChatStreamCallbacks) {
  const [token] = useCookie<Token>(AUTH_TOKEN_KEY);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const stream = useCallback(
    async (data: ChatStreamData) => {
      const url = new URL(endpoint, BACKEND_BASE_URL);
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsStreaming(true);

      let currentEvent = "message";
      let dataLines: string[] = [];

      const dispatch = () => {
        const payload = dataLines.join("\n");
        dataLines = [];
        const event = currentEvent;
        currentEvent = "message";

        const cb = callbacksRef.current;
        switch (event) {
          case "conversation":
            try {
              const parsed = JSON.parse(payload);
              if (parsed.conversationId) cb.onConversation?.(parsed.conversationId);
            } catch {
              /* ignore malformed frame */
            }
            break;
          case "token":
            cb.onToken?.(payload);
            break;
          case "title":
            cb.onTitle?.(payload);
            break;
          case "sources":
            try {
              cb.onSources?.(JSON.parse(payload) as CitedSource[]);
            } catch {
              /* ignore malformed frame */
            }
            break;
          case "done":
            cb.onDone?.();
            break;
          case "error":
            cb.onError?.(0, payload);
            break;
          default:
            break;
        }
      };

      const processFrame = (frame: string) => {
        if (!frame) return;
        for (const line of frame.split("\n")) {
          if (line.startsWith("event:")) {
            currentEvent = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).replace(/^ /, ""));
          }
        }
        dispatch();
      };

      try {
        const response = await fetch(url.toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token?.token ? `Bearer ${token.token}` : "",
          },
          body: JSON.stringify(data),
          signal: controller.signal,
        });

        if (!response.ok) {
          const text = await response.text();
          let message = text;
          try {
            const errorJson = JSON.parse(text);
            message = errorJson.message || errorJson.detail || text;
          } catch {
            /* keep raw text */
          }
          callbacksRef.current.onError?.(response.status, message || response.statusText);
          return;
        }

        if (!response.body) {
          callbacksRef.current.onError?.(0, "No response body");
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";
          frames.forEach(processFrame);
        }

        buffer += decoder.decode();
        if (buffer.trim()) processFrame(buffer);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Streaming error";
        callbacksRef.current.onError?.(0, message);
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [endpoint, token?.token],
  );

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return { stream, isStreaming, abort };
}
