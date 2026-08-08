import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { BACKEND_BASE_URL } from "@/config";

export type RealtimeEventHandler = (data: any) => void;

interface RealtimeContextValue {
  subscribe: (eventName: string, handler: RealtimeEventHandler) => () => void;
  connected: boolean;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  subscribe: () => () => {},
  connected: false,
});

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef<Map<string, Set<RealtimeEventHandler>>>(new Map());
  const reconnectTimerRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const retryRef = useRef(0);

  const subscribe = useCallback((eventName: string, handler: RealtimeEventHandler) => {
    const set = listenersRef.current.get(eventName) ?? new Set<RealtimeEventHandler>();
    set.add(handler);
    listenersRef.current.set(eventName, set);
    return () => {
      set.delete(handler);
      if (set.size === 0) {
        listenersRef.current.delete(eventName);
      }
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setConnected(false);
      return;
    }

    let active = true;

    const connect = async () => {
      if (!active) return;
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(new URL("/api/notifications/stream", BACKEND_BASE_URL), {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "text/event-stream",
          },
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`SSE connection failed with status ${response.status}`);
        }

        setConnected(true);
        retryRef.current = 0;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let currentEvent = "message";
        let dataLines: string[] = [];

        const dispatch = () => {
          const payload = dataLines.join("\n");
          dataLines = [];
          const eventName = currentEvent;
          currentEvent = "message";
          const handlers = listenersRef.current.get(eventName);
          if (!handlers || handlers.size === 0) return;
          let data: unknown = payload;
          try {
            data = JSON.parse(payload);
          } catch {
            /* keep raw string */
          }
          handlers.forEach((handler) => handler(data));
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";
          for (const frame of frames) {
            for (const line of frame.split("\n")) {
              if (line.startsWith("event:")) {
                currentEvent = line.slice(6).trim();
              } else if (line.startsWith("data:")) {
                dataLines.push(line.slice(5));
              }
            }
            dispatch();
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      } finally {
        setConnected(false);
        abortRef.current = null;
        if (active) {
          const delay = Math.min(1000 * 2 ** retryRef.current, 15000);
          retryRef.current += 1;
          reconnectTimerRef.current = window.setTimeout(connect, delay);
        }
      }
    };

    connect();

    return () => {
      active = false;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      abortRef.current?.abort();
    };
  }, [token]);

  return (
    <RealtimeContext.Provider value={{ subscribe, connected }}>{children}</RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}

export function useRealtimeEvent(eventName: string, handler: RealtimeEventHandler) {
  const { subscribe } = useRealtime();
  useEffect(() => {
    return subscribe(eventName, handler);
  }, [eventName, handler, subscribe]);
}
