import { useState, useRef, useCallback } from "react";
import { useCookie } from "./useCookie";
import { AUTH_TOKEN_KEY, BACKEND_BASE_URL } from "@/config";
import { appFetch } from "@/lib/http";
import type { AgentStep, ChatMode, Token } from "@/interfaces";
import type { CitedSource } from "@/components/chat/ChatMessage";

export interface ChatStreamData {
  userInput?: string;
  conversationId?: string | null;
  selectedSourceIds: string[];
  mode: ChatMode;
  responseDetail?: string;
  customInstructions?: string;
}

export interface ChatStreamDonePayload {
  durationMs?: number;
  userMessageId?: number;
  assistantMessageId?: number;
  userSiblingIds?: number[];
  assistantSiblingIds?: number[];
}

export interface ChatStreamUserMessagePayload {
  id: number;
  siblingIds?: number[];
}

export interface ChatStreamRequestOptions {
  endpoint?: string;
  method?: "POST" | "PUT" | "PATCH";
}

export interface ChatStreamCallbacks {
  onConversation?: (conversationId: string) => void;
  onUserMessage?: (payload: ChatStreamUserMessagePayload) => void;
  onStep?: (step: AgentStep) => void;
  onThought?: (stepId: string, delta: string) => void;
  onToken?: (chunk: string) => void;
  onTitle?: (title: string) => void;
  onSources?: (sources: CitedSource[]) => void;
  onDone?: (payload?: ChatStreamDonePayload) => void;
  onError?: (status: number, message: string) => void;
}

export function useChatStream(endpoint: string, callbacks: ChatStreamCallbacks) {
  const { value: token } = useCookie<Token>(AUTH_TOKEN_KEY);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const stream = useCallback(
    async (data: ChatStreamData, options?: ChatStreamRequestOptions) => {
      const targetEndpoint = options?.endpoint ?? endpoint;
      const method = options?.method ?? "POST";
      const url = new URL(targetEndpoint, BACKEND_BASE_URL);
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
            } catch {}
            break;
          case "userMessage":
            try {
              const parsed = JSON.parse(payload) as { id?: number; siblingIds?: number[] };
              if (typeof parsed.id === "number") {
                cb.onUserMessage?.({
                  id: parsed.id,
                  siblingIds: Array.isArray(parsed.siblingIds) ? parsed.siblingIds : undefined,
                });
              }
            } catch {}
            break;
          case "step":
            try {
              const step = JSON.parse(payload) as AgentStep;
              if (step?.id) cb.onStep?.(step);
            } catch {}
            break;
          case "thought":
            try {
              const parsed = JSON.parse(payload) as { stepId?: string; delta?: string };
              if (parsed.stepId && typeof parsed.delta === "string") {
                cb.onThought?.(parsed.stepId, parsed.delta);
              }
            } catch {}
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
            } catch {}
            break;
          case "done": {
            let result: ChatStreamDonePayload | undefined;
            if (payload) {
              try {
                const parsed = JSON.parse(payload) as ChatStreamDonePayload;
                result = {
                  durationMs: typeof parsed.durationMs === "number" ? parsed.durationMs : undefined,
                  userMessageId:
                    typeof parsed.userMessageId === "number" ? parsed.userMessageId : undefined,
                  assistantMessageId:
                    typeof parsed.assistantMessageId === "number"
                      ? parsed.assistantMessageId
                      : undefined,
                  userSiblingIds: Array.isArray(parsed.userSiblingIds)
                    ? parsed.userSiblingIds
                    : undefined,
                  assistantSiblingIds: Array.isArray(parsed.assistantSiblingIds)
                    ? parsed.assistantSiblingIds
                    : undefined,
                };
              } catch {}
            }
            cb.onDone?.(result);
            break;
          }
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
            dataLines.push(line.slice(5));
          }
        }
        dispatch();
      };

      try {
        const response = await appFetch(url.toString(), {
          method,
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
          } catch {}
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
