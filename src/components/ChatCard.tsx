import {
  useFetch,
  useCookie,
  useChatStream,
  useRealtimeEvent,
  useShortcut,
  useAccessibility,
} from "@/hooks";
import { FileIcon, SendIcon } from "@/components/icons";
import { Divider, TextField, IconButton, Tooltip, Spinner } from "@/components/ui";
import type {
  AgentStep,
  ChatMode,
  ConversationMessages,
  ConversationStatus,
  Note,
  Source,
  Token,
} from "@/interfaces";
import { useEffect, useState, useRef, useMemo, useCallback, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AUTH_TOKEN_KEY, BACKEND_BASE_URL } from "@/config";
import { appFetch } from "@/lib/http";
import { getHttpErrorMessage } from "@/lib/utils";

import { ChatMessage, type Message } from "./chat/ChatMessage";
import { ExampleQuestions } from "./chat/ExampleQuestions";
import { ChatModeToggle } from "./chat/ChatModeToggle";
import {
  AI_CUSTOM_INSTRUCTIONS_COOKIE_KEY,
  AI_DEFAULT_CHAT_MODE_COOKIE_KEY,
  AI_RESPONSE_DETAIL_COOKIE_KEY,
  AI_SHOW_CITED_SOURCES_COOKIE_KEY,
  AI_SHOW_EXAMPLE_QUESTIONS_COOKIE_KEY,
  AI_SHOW_THINKING_COOKIE_KEY,
  AI_AUTO_EXPAND_THINKING_COOKIE_KEY,
  DEFAULT_AI_SETTINGS,
  type ResponseDetail,
} from "./settings/lib/ai";

type Sender = "user" | "ai";

interface ChatCardProps {
  notebookId: string;
  sources: Source[];
  selectedSourceIds?: string[];
  onSourceSelect?: (sourceId: string) => void;
  autoFocus?: boolean;
  initialConversationId?: string | null;
  initialConversationTitle?: string | null;
  onConversationCreated?: (conversationId: string) => void;
  onTitleChange?: (title: string) => void;
  onConversationCompleted?: () => void;
  onConversationSeen?: (conversationId: string) => void;
  onConversationStateChange?: (
    conversationId: string,
    state: { status: ConversationStatus; hasUnseenReply: boolean },
  ) => void;
  onNoteCreated?: (note: Note) => void;
}

function mapConversationMessages(
  conversationId: string | null,
  data: ConversationMessages,
): Message[] {
  return data.messages
    .filter((m) => m.type === "USER" || m.type === "ASSISTANT")
    .map((m, index) => ({
      id: m.id !== undefined ? `${conversationId}-${m.id}` : `${conversationId}-${index}`,
      messageId: m.id,
      parentId: m.parentId ?? null,
      siblingIds: m.siblingIds,
      text: m.content,
      sender: m.type === "USER" ? ("user" as Sender) : ("ai" as Sender),
      citedSources: m.citedSources?.length ? m.citedSources : undefined,
      selectedSourcesCount: m.selectedSourcesCount ?? undefined,
      thinkingSteps: m.thinkingSteps?.length ? m.thinkingSteps : undefined,
      thinkingDurationMs: m.thinkingDurationMs ?? undefined,
    }));
}

function deriveNoteTitle(messages: Message[], messageIndex: number, content: string): string {
  const prevUserMessage = messages
    .slice(0, messageIndex)
    .reverse()
    .find((m) => m.sender === "user" && m.text.trim().length > 0);

  const rawSource =
    prevUserMessage?.text ??
    content
      .split("\n")
      .map((line) =>
        line
          .replace(/^#{1,6}\s+/, "")
          .replace(/[*_`~>-]/g, "")
          .trim(),
      )
      .find((line) => line.length > 0) ??
    "";

  const cleaned = rawSource.replace(/\s+/g, " ").trim();
  if (!cleaned) return "Note from chat";
  if (cleaned.length <= 60) return cleaned;
  const lastSpace = cleaned.lastIndexOf(" ", 60);
  const cutoff = lastSpace > 20 ? lastSpace : 60;
  return `${cleaned.slice(0, cutoff).trim()}...`;
}

export function ChatCard({
  notebookId,
  sources,
  selectedSourceIds = [],
  onSourceSelect,
  autoFocus = true,
  initialConversationId,
  initialConversationTitle,
  onConversationCreated,
  onTitleChange,
  onConversationCompleted,
  onConversationSeen,
  onConversationStateChange,
  onNoteCreated,
}: ChatCardProps) {
  const { effectiveReducedMotion } = useAccessibility();
  const { value: token } = useCookie<Token>(AUTH_TOKEN_KEY);
  const { value: defaultChatMode } = useCookie<ChatMode>(
    AI_DEFAULT_CHAT_MODE_COOKIE_KEY,
    DEFAULT_AI_SETTINGS.defaultChatMode,
  );
  const { value: responseDetail } = useCookie<ResponseDetail>(
    AI_RESPONSE_DETAIL_COOKIE_KEY,
    DEFAULT_AI_SETTINGS.responseDetail,
  );
  const { value: customInstructions } = useCookie<string>(
    AI_CUSTOM_INSTRUCTIONS_COOKIE_KEY,
    DEFAULT_AI_SETTINGS.customInstructions,
  );
  const { value: showExampleQuestions } = useCookie<boolean>(
    AI_SHOW_EXAMPLE_QUESTIONS_COOKIE_KEY,
    DEFAULT_AI_SETTINGS.showExampleQuestions,
  );
  const { value: showCitedSources } = useCookie<boolean>(
    AI_SHOW_CITED_SOURCES_COOKIE_KEY,
    DEFAULT_AI_SETTINGS.showCitedSources,
  );
  const { value: showThinking } = useCookie<boolean>(
    AI_SHOW_THINKING_COOKIE_KEY,
    DEFAULT_AI_SETTINGS.showThinking,
  );
  const { value: autoExpandThinking } = useCookie<boolean>(
    AI_AUTO_EXPAND_THINKING_COOKIE_KEY,
    DEFAULT_AI_SETTINGS.autoExpandThinking,
  );

  const sourcesCount = sources.length;
  const readySourcesCount = sources.filter((s) => s.status === "READY").length;

  const { value: cachedExampleQuestions, setValue: setCachedExampleQuestions } = useCookie<{
    questions: string[];
    count: number;
  }>(`notebookExampleQuestions-${notebookId}`);

  const exampleQuestionsOptions = useMemo(
    () => ({
      method: "GET" as const,
      onSuccess: (data: { questions: string[] }) => {
        setCachedExampleQuestions({ questions: data.questions, count: readySourcesCount });
      },
      onError: (error: FetchError) => {
        console.error("Error fetching example questions:", error.message);
      },
    }),
    [notebookId, readySourcesCount, setCachedExampleQuestions],
  );

  const {
    data: fetchedExampleQuestions,
    loading: isExampleQuestionsLoading,
    error: exampleQuestionsError,
    refetch: refetchExampleQuestions,
  } = useFetch<{
    questions: string[];
  }>(
    `notebooks/${notebookId}/example-questions`,
    exampleQuestionsOptions,
    showExampleQuestions &&
      readySourcesCount > 0 &&
      (!cachedExampleQuestions || cachedExampleQuestions.count !== readySourcesCount),
  );

  const exampleQuestions =
    cachedExampleQuestions?.count === readySourcesCount
      ? cachedExampleQuestions
      : fetchedExampleQuestions;

  const handleSummaryUpdated = useCallback(
    (event: { notebookId?: string }) => {
      if (event?.notebookId !== notebookId) return;
      setCachedExampleQuestions(undefined);
      useFetch.clearCache(`notebooks/${notebookId}/example-questions`);
      if (showExampleQuestions) {
        refetchExampleQuestions(true);
      }
    },
    [notebookId, refetchExampleQuestions, setCachedExampleQuestions, showExampleQuestions],
  );

  useRealtimeEvent("summary.updated", handleSummaryUpdated);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [mode, setMode] = useState<ChatMode>(defaultChatMode ?? "NORMAL");
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId ?? null,
  );
  const [conversationTitle, setConversationTitle] = useState<string | null>(
    initialConversationTitle ?? null,
  );
  const [conversationToLoadId, setConversationToLoadId] = useState<string | null>(null);
  const [pendingConversationTitle, setPendingConversationTitle] = useState<string | null>(null);
  const [isBackendGenerating, setIsBackendGenerating] = useState<boolean>(false);
  const [isSwitchingVersion, setIsSwitchingVersion] = useState<boolean>(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const autoFocusRef = useRef(autoFocus);
  autoFocusRef.current = autoFocus;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pendingMessageRef = useRef<string | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);
  const inputObserverRef = useRef<ResizeObserver | null>(null);
  const [inputHeight, setInputHeight] = useState(0);
  const [extraBottomSpacer, setExtraBottomSpacer] = useState(0);
  const [pendingAlign, setPendingAlign] = useState(false);
  const scrollTargetRef = useRef<number | null>(null);
  const extraBottomSpacerRef = useRef(0);
  const savedScrollTopRef = useRef<number | null>(null);
  const anchorMessageIdRef = useRef<string | null>(null);

  const [conversationToMarkSeenId, setConversationToMarkSeenId] = useState<string | null>(null);

  const markAsSeenOptions = useMemo(
    () => ({
      method: "PATCH" as const,
      onSuccess: () => {
        if (conversationToMarkSeenId) {
          onConversationSeen?.(conversationToMarkSeenId);
        }
        setConversationToMarkSeenId(null);
      },
      onError: () => {
        setConversationToMarkSeenId(null);
      },
    }),
    [conversationToMarkSeenId, onConversationSeen],
  );

  useFetch<void>(
    `notebooks/${notebookId}/conversations/${conversationToMarkSeenId}/seen`,
    markAsSeenOptions,
    conversationToMarkSeenId !== null,
  );

  const markConversationSeen = useCallback(
    (id: string) => {
      onConversationSeen?.(id);
      setConversationToMarkSeenId(id);
    },
    [onConversationSeen],
  );

  useEffect(() => {
    extraBottomSpacerRef.current = extraBottomSpacer;
  }, [extraBottomSpacer]);

  const focusInput = useCallback(() => {
    const textarea = chatInputRef.current;
    if (!textarea || textarea.disabled) return;

    textarea.focus({ preventScroll: true });
    const end = textarea.value.length;
    textarea.setSelectionRange(end, end);
  }, []);

  const focusInputAfterRender = useCallback(() => {
    requestAnimationFrame(focusInput);
  }, [focusInput]);

  const inputContainerRef = useCallback((el: HTMLDivElement | null) => {
    if (inputObserverRef.current) {
      inputObserverRef.current.disconnect();
      inputObserverRef.current = null;
    }
    if (!el) {
      chatInputRef.current = null;
      return;
    }

    chatInputRef.current = el.querySelector<HTMLTextAreaElement>("#chat-input");
    setInputHeight(el.offsetHeight);
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setInputHeight((entry.target as HTMLElement).offsetHeight);
      }
    });
    observer.observe(el);
    inputObserverRef.current = observer;
  }, []);

  const loadConversationOptions = useMemo(
    () => ({
      method: "GET" as const,
      skipCache: true,
      onSuccess: (data: ConversationMessages) => {
        const loadedMessages = mapConversationMessages(conversationToLoadId, data);

        setExtraBottomSpacer(0);
        setPendingAlign(false);
        savedScrollTopRef.current = null;
        anchorMessageIdRef.current = null;
        setEditingMessageId(null);
        scrollTargetRef.current = null;

        setMessages(loadedMessages);
        setConversationId(conversationToLoadId);
        if (pendingConversationTitle) {
          setConversationTitle(pendingConversationTitle);
        }
        setMode(data.mode ?? defaultChatMode ?? "NORMAL");
        setIsBackendGenerating(data.status === "GENERATING");
        if (conversationToLoadId) {
          onConversationStateChange?.(conversationToLoadId, {
            status: data.status ?? "IDLE",
            hasUnseenReply: autoFocusRef.current ? false : Boolean(data.hasUnseenReply),
          });
        }
        if (data.hasUnseenReply && autoFocusRef.current && conversationToLoadId) {
          markConversationSeen(conversationToLoadId);
        }
        setConversationToLoadId(null);
        setPendingConversationTitle(null);
      },
      onError: (error: FetchError) => {
        console.error("Error loading conversation:", error.message);
        setConversationToLoadId(null);
        setPendingConversationTitle(null);
      },
    }),
    [
      conversationToLoadId,
      pendingConversationTitle,
      markConversationSeen,
      onConversationStateChange,
    ],
  );

  const { loading: isLoadingConversation } = useFetch<ConversationMessages>(
    `notebooks/${notebookId}/conversations/${conversationToLoadId}`,
    loadConversationOptions,
    conversationToLoadId !== null,
  );

  const loadConversation = useCallback((selectedConversationId: string, title: string) => {
    setConversationToLoadId(selectedConversationId);
    setPendingConversationTitle(title);
  }, []);

  const mountedRef = useRef(false);
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    if (initialConversationId) {
      loadConversation(initialConversationId, initialConversationTitle ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSourceClick = (sourceId: string) => {
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(sourceId)) {
      console.warn("Invalid source ID format:", sourceId);
      return;
    }
    onSourceSelect?.(sourceId);
  };

  const streamingMessageIdRef = useRef<string | null>(null);
  const streamingUserMessageIdRef = useRef<string | null>(null);

  const {
    stream: streamChat,
    isStreaming: isChatLoading,
    abort: abortChatStream,
  } = useChatStream(`notebooks/${notebookId}/chat/stream`, {
    onConversation: (id) => {
      if (!conversationId) {
        setConversationId(id);
      }
      onConversationCreated?.(id);
    },
    onUserMessage: ({ id: userMessageId, siblingIds }) => {
      const userClientId = streamingUserMessageIdRef.current;
      if (!userClientId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === userClientId
            ? { ...m, messageId: userMessageId, siblingIds: siblingIds ?? m.siblingIds }
            : m,
        ),
      );
    },
    onStep: (step) => {
      const id = streamingMessageIdRef.current;
      if (!id) return;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== id) return m;
          const existing = (m.thinkingSteps ?? []).map((s) =>
            s.type === "text" && s.status === "running" && step.status === "running"
              ? { ...s, status: "done" as const }
              : s,
          );
          const idx = existing.findIndex((s) => s.id === step.id);
          let nextSteps: AgentStep[];
          if (idx >= 0) {
            const prevStep = existing[idx];
            const mergedDetail =
              step.type === "thought" && !step.detail && prevStep.detail
                ? prevStep.detail
                : step.detail;
            nextSteps = existing.map((s, i) => (i === idx ? { ...step, detail: mergedDetail } : s));
          } else {
            nextSteps = [...existing, step];
          }
          return { ...m, thinkingSteps: nextSteps };
        }),
      );
    },
    onThought: (stepId, delta) => {
      const id = streamingMessageIdRef.current;
      if (!id) return;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== id) return m;
          const existing = (m.thinkingSteps ?? []).map((s) =>
            s.type === "text" && s.status === "running" ? { ...s, status: "done" as const } : s,
          );
          const idx = existing.findIndex((s) => s.id === stepId);
          if (idx >= 0) {
            const nextSteps = existing.map((s, i) =>
              i === idx
                ? { ...s, detail: `${s.detail ?? ""}${delta}`, status: "running" as const }
                : s,
            );
            return { ...m, thinkingSteps: nextSteps };
          }
          const newStep: AgentStep = {
            id: stepId,
            type: "thought",
            title: "Thought",
            detail: delta,
            status: "running",
          };
          return { ...m, thinkingSteps: [...existing, newStep] };
        }),
      );
    },
    onToken: (chunk) => {
      const id = streamingMessageIdRef.current;
      if (!id) return;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== id) return m;
          const existing = (m.thinkingSteps ?? []).map((s) =>
            s.type === "thought" && s.status === "running" ? { ...s, status: "done" as const } : s,
          );
          const last = existing[existing.length - 1];
          let nextSteps: AgentStep[];
          if (last && last.type === "text") {
            nextSteps = [
              ...existing.slice(0, -1),
              { ...last, detail: `${last.detail ?? ""}${chunk}`, status: "running" as const },
            ];
          } else {
            nextSteps = [
              ...existing,
              {
                id: `text-${existing.length + 1}`,
                type: "text",
                title: "",
                detail: chunk,
                status: "running",
              },
            ];
          }
          return { ...m, text: m.text + chunk, thinkingSteps: nextSteps };
        }),
      );
    },
    onSources: (sources) => {
      const id = streamingMessageIdRef.current;
      if (!id) return;
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, citedSources: sources } : m)));
    },
    onTitle: (title) => {
      if (!conversationTitle) {
        setConversationTitle(title);
      }
      onTitleChange?.(title);
    },
    onDone: (result) => {
      const id = streamingMessageIdRef.current;
      const userClientId = streamingUserMessageIdRef.current;
      if (id || userClientId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === userClientId) {
              return {
                ...m,
                messageId: result?.userMessageId ?? m.messageId,
                siblingIds: result?.userSiblingIds ?? m.siblingIds,
              };
            }
            if (m.id === id) {
              return {
                ...m,
                messageId: result?.assistantMessageId ?? m.messageId,
                siblingIds: result?.assistantSiblingIds ?? m.siblingIds,
                isStreaming: false,
                thinkingDurationMs: result?.durationMs ?? m.thinkingDurationMs,
                thinkingSteps: m.thinkingSteps?.map((s) =>
                  s.status === "running" ? { ...s, status: "done" } : s,
                ),
              };
            }
            return m;
          }),
        );
      }
      pendingMessageRef.current = null;
      streamingMessageIdRef.current = null;
      streamingUserMessageIdRef.current = null;
      setIsBackendGenerating(false);
      onConversationCompleted?.();
    },
    onError: (status, message) => {
      console.error("Error streaming chat:", status, message);
      const id = streamingMessageIdRef.current;
      if (id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id
              ? {
                  ...m,
                  text: getHttpErrorMessage(status) || message,
                  error: true,
                  isStreaming: false,
                }
              : m,
          ),
        );
      }
      streamingMessageIdRef.current = null;
      streamingUserMessageIdRef.current = null;
      setIsBackendGenerating(false);
    },
  });

  const isBusy = isChatLoading || isBackendGenerating;

  const handleConversationUpdated = useCallback(
    (event: {
      notebookId?: string;
      conversationId?: string;
      title?: string;
      status?: string;
      hasUnseenReply?: boolean;
    }) => {
      if (event?.notebookId !== notebookId) return;
      if (!conversationId || event.conversationId !== conversationId) return;

      if (event.title && event.title !== conversationTitle) {
        setConversationTitle(event.title);
        onTitleChange?.(event.title);
      }

      if (event.status === "GENERATING") {
        setIsBackendGenerating(true);
        return;
      }

      if (event.status === "IDLE") {
        setIsBackendGenerating(false);
        if (!isChatLoading) {
          loadConversation(conversationId, event.title ?? conversationTitle ?? "");
        } else if (event.hasUnseenReply && autoFocusRef.current) {
          markConversationSeen(conversationId);
        }
      } else if (event.status === "FAILED") {
        setIsBackendGenerating(false);
      }
    },
    [
      notebookId,
      conversationId,
      conversationTitle,
      isChatLoading,
      loadConversation,
      markConversationSeen,
      onTitleChange,
    ],
  );

  useRealtimeEvent("conversation.updated", handleConversationUpdated);

  useEffect(() => {
    if (autoFocus && conversationId && !isBusy && !isLoadingConversation) {
      markConversationSeen(conversationId);
    }
  }, [autoFocus, conversationId, isBusy, isLoadingConversation, markConversationSeen]);

  useEffect(() => {
    if (!autoFocus || isBusy || isLoadingConversation) return;

    const frame = requestAnimationFrame(focusInput);
    return () => cancelAnimationFrame(frame);
  }, [autoFocus, isBusy, isLoadingConversation, conversationId, focusInput]);

  const handleCardClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;

      const target = event.target as HTMLElement;
      if (
        target.closest(
          "button, a, input, textarea, select, [contenteditable='true'], [role='button'], [role='textbox']",
        )
      ) {
        return;
      }
      if (!window.getSelection()?.isCollapsed) return;

      focusInput();
    },
    [focusInput],
  );

  const handleStreamChat = useCallback(
    async (overrideConversationId: string | null = conversationId) => {
      const aiMessageId = (Date.now() + 1).toString();
      streamingMessageIdRef.current = aiMessageId;
      const aiMessage: Message = {
        id: aiMessageId,
        text: "",
        sender: "ai",
        isStreaming: true,
        thinkingSteps: [],
      };
      setMessages((prev) => [...prev, aiMessage]);

      await streamChat({
        userInput: pendingMessageRef.current || "",
        conversationId: overrideConversationId,
        selectedSourceIds,
        mode,
        responseDetail: responseDetail !== "balanced" ? responseDetail : undefined,
        customInstructions: customInstructions?.trim() ? customInstructions.trim() : undefined,
      });
    },
    [conversationId, selectedSourceIds, streamChat, mode, responseDetail, customInstructions],
  );

  const handleStopStream = useCallback(() => {
    abortChatStream();
    const id = streamingMessageIdRef.current;
    if (id) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                isStreaming: false,
                thinkingSteps: m.thinkingSteps?.map((s) =>
                  s.status === "running" ? { ...s, status: "done" } : s,
                ),
              }
            : m,
        ),
      );
    }
    streamingMessageIdRef.current = null;
    streamingUserMessageIdRef.current = null;
    setIsBackendGenerating(false);
  }, [abortChatStream]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: "user",
      selectedSourcesCount: selectedSourceIds.length,
    };

    setEditingMessageId(null);
    savedScrollTopRef.current = scrollContainerRef.current?.scrollTop ?? null;
    anchorMessageIdRef.current = userMessage.id;
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");
    pendingMessageRef.current = userText;
    streamingUserMessageIdRef.current = userMessage.id;
    setPendingAlign(true);

    await handleStreamChat();
  };

  const handleInputKeyDown = useShortcut(
    "chat-send",
    () => {
      void handleSendMessage();
    },
    {
      enabled: !isBusy && input.trim().length > 0,
    },
  );

  const handleStartEdit = useCallback(
    (messageIndex: number) => {
      if (isBusy) return;
      const target = messages[messageIndex];
      if (!target || target.sender !== "user") return;
      setEditingMessageId(target.id);
    },
    [isBusy, messages],
  );

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
  }, []);

  const handleSubmitEdit = useCallback(
    async (messageIndex: number, newText: string) => {
      const trimmed = newText.trim();
      if (isBusy || !trimmed) return;
      const targetUserMessage = messages[messageIndex];
      if (!targetUserMessage || targetUserMessage.sender !== "user") return;

      setEditingMessageId(null);

      const effectiveSelectedCount =
        selectedSourceIds.length > 0
          ? selectedSourceIds.length
          : targetUserMessage.selectedSourcesCount;
      const updatedUserMessage: Message = {
        ...targetUserMessage,
        siblingIds: undefined,
        text: trimmed,
        selectedSourcesCount: effectiveSelectedCount,
      };

      const aiClientId = (Date.now() + 1).toString();
      streamingUserMessageIdRef.current = targetUserMessage.id;
      streamingMessageIdRef.current = aiClientId;
      pendingMessageRef.current = trimmed;

      savedScrollTopRef.current = scrollContainerRef.current?.scrollTop ?? null;
      anchorMessageIdRef.current = targetUserMessage.id;
      setMessages((prev) => [
        ...prev.slice(0, messageIndex),
        updatedUserMessage,
        {
          id: aiClientId,
          text: "",
          sender: "ai",
          isStreaming: true,
          thinkingSteps: [],
        },
      ]);
      setPendingAlign(true);

      const preferences = {
        responseDetail: responseDetail !== "balanced" ? responseDetail : undefined,
        customInstructions: customInstructions?.trim() ? customInstructions.trim() : undefined,
      };

      if (conversationId && targetUserMessage.messageId !== undefined) {
        await streamChat(
          {
            userInput: trimmed,
            selectedSourceIds,
            mode,
            ...preferences,
          },
          {
            endpoint: `notebooks/${notebookId}/conversations/${conversationId}/messages/${targetUserMessage.messageId}/stream`,
            method: "PUT",
          },
        );
      } else {
        await streamChat({
          userInput: trimmed,
          conversationId,
          selectedSourceIds,
          mode,
          ...preferences,
        });
      }
    },
    [
      isBusy,
      messages,
      selectedSourceIds,
      responseDetail,
      customInstructions,
      conversationId,
      notebookId,
      mode,
      streamChat,
    ],
  );

  const regenerateAt = useCallback(
    async (aiIndex: number) => {
      if (isBusy) return;
      const targetAiMessage = messages[aiIndex];
      if (!targetAiMessage || targetAiMessage.sender !== "ai") return;

      let userIndex = -1;
      for (let i = aiIndex - 1; i >= 0; i--) {
        if (messages[i].sender === "user") {
          userIndex = i;
          break;
        }
      }
      if (userIndex < 0) return;

      const userMessage = messages[userIndex];
      setEditingMessageId(null);

      const effectiveSelectedCount =
        selectedSourceIds.length > 0 ? selectedSourceIds.length : userMessage.selectedSourcesCount;
      const updatedUserMessage: Message = {
        ...userMessage,
        selectedSourcesCount: effectiveSelectedCount,
      };

      const aiClientId = (Date.now() + 1).toString();
      streamingUserMessageIdRef.current = userMessage.id;
      streamingMessageIdRef.current = aiClientId;
      pendingMessageRef.current = userMessage.text;

      savedScrollTopRef.current = scrollContainerRef.current?.scrollTop ?? null;
      anchorMessageIdRef.current = userMessage.id;
      setMessages((prev) => [
        ...prev.slice(0, userIndex),
        updatedUserMessage,
        {
          id: aiClientId,
          text: "",
          sender: "ai",
          isStreaming: true,
          thinkingSteps: [],
        },
      ]);
      setPendingAlign(true);

      const preferences = {
        responseDetail: responseDetail !== "balanced" ? responseDetail : undefined,
        customInstructions: customInstructions?.trim() ? customInstructions.trim() : undefined,
      };

      const targetBackendMessageId = targetAiMessage.messageId ?? userMessage.messageId;
      if (conversationId && targetBackendMessageId !== undefined) {
        await streamChat(
          {
            selectedSourceIds,
            mode,
            ...preferences,
          },
          {
            endpoint: `notebooks/${notebookId}/conversations/${conversationId}/messages/${targetBackendMessageId}/regenerate/stream`,
            method: "POST",
          },
        );
      } else {
        await streamChat({
          userInput: userMessage.text,
          conversationId,
          selectedSourceIds,
          mode,
          ...preferences,
        });
      }
    },
    [
      isBusy,
      messages,
      selectedSourceIds,
      responseDetail,
      customInstructions,
      conversationId,
      notebookId,
      mode,
      streamChat,
    ],
  );

  const handleRetryFromError = useCallback(
    (messageIndex: number) => {
      void regenerateAt(messageIndex);
    },
    [regenerateAt],
  );

  const handleSelectVersion = useCallback(
    async (targetMessageId: number) => {
      if (!conversationId || isBusy || isSwitchingVersion) return;
      setIsSwitchingVersion(true);
      setEditingMessageId(null);
      try {
        const response = await appFetch(
          new URL(
            `notebooks/${notebookId}/conversations/${conversationId}/messages/${targetMessageId}/select`,
            BACKEND_BASE_URL,
          ).toString(),
          {
            method: "PATCH",
            headers: {
              Authorization: token?.token ? `Bearer ${token.token}` : "",
            },
          },
        );
        if (!response.ok) {
          throw new Error(`Failed to switch message version (${response.status})`);
        }
        const data = (await response.json()) as ConversationMessages;
        const nextMessages = mapConversationMessages(conversationId, data);
        const switchedIndex = nextMessages.findIndex((m) => m.messageId === targetMessageId);
        let anchorClientId: string | null = null;
        if (switchedIndex >= 0) {
          if (nextMessages[switchedIndex].sender === "user") {
            anchorClientId = nextMessages[switchedIndex].id;
          } else {
            for (let i = switchedIndex - 1; i >= 0; i--) {
              if (nextMessages[i].sender === "user") {
                anchorClientId = nextMessages[i].id;
                break;
              }
            }
          }
        }
        savedScrollTopRef.current = scrollContainerRef.current?.scrollTop ?? null;
        anchorMessageIdRef.current = anchorClientId;
        setMessages(nextMessages);
        setPendingAlign(true);
      } catch (error) {
        console.error("Error switching message version:", error);
      } finally {
        setIsSwitchingVersion(false);
      }
    },
    [conversationId, isBusy, isSwitchingVersion, notebookId, token?.token],
  );

  const handleSaveAsNote = useCallback(
    async (content: string, messageIndex: number): Promise<boolean> => {
      const title = deriveNoteTitle(messages, messageIndex, content);
      try {
        const response = await appFetch(new URL("/notes", BACKEND_BASE_URL).toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token?.token ? `Bearer ${token.token}` : "",
          },
          body: JSON.stringify({
            notebookId,
            title,
            content,
          }),
        });
        if (!response.ok) {
          throw new Error(`Failed to save note (${response.status})`);
        }
        const createdNote = (await response.json()) as Note;
        useFetch.clearCache(`/notes?notebookId=${notebookId}`);
        onNoteCreated?.(createdNote);
        return true;
      } catch (error) {
        console.error("Error saving message as note:", error);
        return false;
      }
    },
    [messages, notebookId, onNoteCreated, token?.token],
  );

  const lastUserMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === "user") return messages[i].id;
    }
    return null;
  }, [messages]);

  const lastUserMessageIdRef = useRef<string | null>(null);
  lastUserMessageIdRef.current = lastUserMessageId;

  const computeAlignMetrics = useCallback((currentSpacer: number) => {
    const container = scrollContainerRef.current;
    if (!container) return null;

    const anchorId = anchorMessageIdRef.current;
    let anchorElement: HTMLElement | null = anchorId
      ? container.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(anchorId)}"]`)
      : null;

    if (!anchorElement && lastUserMessageIdRef.current) {
      anchorElement = container.querySelector<HTMLElement>(
        `[data-message-id="${CSS.escape(lastUserMessageIdRef.current)}"]`,
      );
    }

    if (!anchorElement) {
      const userMessageElements = container.querySelectorAll<HTMLElement>('[data-sender="user"]');
      anchorElement = userMessageElements[userMessageElements.length - 1] ?? null;
    }
    if (!anchorElement) return null;

    const paddingTop = parseFloat(getComputedStyle(container).scrollPaddingTop) || 0;
    const target = Math.max(0, anchorElement.offsetTop - container.offsetTop - paddingTop);

    const contentHeight = container.scrollHeight - currentSpacer;
    const needed = Math.max(0, target - (contentHeight - container.clientHeight));

    return { target, needed };
  }, []);

  useLayoutEffect(() => {
    if (!pendingAlign) return;

    const metrics = computeAlignMetrics(extraBottomSpacer);
    if (!metrics) {
      setPendingAlign(false);
      return;
    }

    scrollTargetRef.current = metrics.target;

    if (metrics.needed !== extraBottomSpacer) {
      setExtraBottomSpacer(metrics.needed);
      return;
    }

    const container = scrollContainerRef.current;
    if (container && scrollTargetRef.current !== null) {
      if (savedScrollTopRef.current !== null) {
        container.scrollTo({ top: savedScrollTopRef.current, behavior: "instant" });
        savedScrollTopRef.current = null;
      }
      if (Math.abs(container.scrollTop - scrollTargetRef.current) > 1) {
        container.scrollTo({ top: scrollTargetRef.current, behavior: "smooth" });
      }
    }
    setPendingAlign(false);
  }, [pendingAlign, extraBottomSpacer, computeAlignMetrics]);

  const settleSpacer = useCallback(() => {
    const metrics = computeAlignMetrics(extraBottomSpacerRef.current);
    if (!metrics) return;
    if (metrics.needed !== extraBottomSpacerRef.current) {
      setExtraBottomSpacer(metrics.needed);
    }
  }, [computeAlignMetrics]);

  const streamStartedRef = useRef(false);
  useEffect(() => {
    if (isBusy) {
      streamStartedRef.current = true;
      return;
    }
    if (!streamStartedRef.current) return;
    streamStartedRef.current = false;
    settleSpacer();
  }, [isBusy, settleSpacer]);

  const inputField = (
    <div
      ref={inputContainerRef}
      className="pointer-events-auto relative mx-auto my-6 flex w-[calc(100%-2rem)] max-w-2xl flex-col"
    >
      {showExampleQuestions && !isBusy && sourcesCount > 0 && messages.length === 0 && (
        <ExampleQuestions
          exampleQuestionsError={exampleQuestionsError}
          skipExampleQuestionsFetch={false}
          isExampleQuestionsLoading={isExampleQuestionsLoading}
          isAutoRegenerating={false}
          readySourcesCount={readySourcesCount}
          exampleQuestions={exampleQuestions}
          refetchExampleQuestions={refetchExampleQuestions}
          onQuestionSelect={(q) => {
            setInput(q);
            focusInputAfterRender();
          }}
        />
      )}
      <div className="flex items-end gap-2">
        <div className="flex min-h-11 min-w-0 flex-1 items-center rounded-xs border border-gray-300 bg-white px-3.5 py-2.25 shadow-xs transition-[border-color,box-shadow,background-color] duration-150 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-400/20 dark:hover:border-gray-600">
          <TextField
            id="chat-input"
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={
              sourcesCount === 0
                ? "Add sources to start chatting..."
                : selectedSourceIds.length > 0
                  ? `Ask a question (${selectedSourceIds.length} source${selectedSourceIds.length !== 1 ? "s" : ""} selected)...`
                  : "Select sources to start chatting..."
            }
            className="min-h-0! min-w-0 flex-1 rounded-xs border-0 bg-transparent p-0 text-base leading-6 shadow-none transition-none focus:border-transparent focus:ring-0 dark:bg-transparent dark:focus:ring-0"
            disabled={isBusy || selectedSourceIds.length === 0}
            autoFocus={autoFocus}
            minRows={1}
            maxRows={8}
            multiline
          />
        </div>
        {isChatLoading ? (
          <Tooltip text="Stop generating" position="top" className="flex shrink-0">
            <IconButton
              icon={
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-4.5">
                  <rect x="6" y="6" width="12" height="12" rx="1.5" />
                </svg>
              }
              onClick={handleStopStream}
              ariaLabel="Stop generating"
              size="md"
              className="size-11"
              variant="secondary"
            />
          </Tooltip>
        ) : (
          <Tooltip text="Send your question" position="top" className="flex shrink-0">
            <IconButton
              icon={<SendIcon className="size-4.5" />}
              onClick={handleSendMessage}
              disabled={isBusy || !input.trim() || selectedSourceIds.length === 0}
              ariaLabel="Send your question"
              size="md"
              className="size-11"
              variant="primary"
            />
          </Tooltip>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative flex h-full flex-col overflow-hidden" onClick={handleCardClick}>
      <div className="flex h-15 items-center gap-2 px-4 pt-4 pb-3">
        <h2 className="flex min-w-0 flex-1 items-baseline gap-1.5">
          <span className="shrink-0 text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
            Chat /{" "}
          </span>
          <span className="truncate text-lg font-semibold select-text">
            {conversationTitle || "New conversation"}
          </span>
        </h2>
        <ChatModeToggle
          value={mode}
          onChange={(newMode) => {
            setMode(newMode);
            focusInputAfterRender();
          }}
          disabled={isBusy}
        />
      </div>
      <Divider className="my-0" />
      <div className="relative min-h-0 flex-1">
        {messages.length > 0 ? (
          <div
            ref={scrollContainerRef}
            className="absolute inset-0 scroll-pt-4 scrollbar-gutter-stable overflow-y-auto scroll-smooth px-4 py-4 md:px-6"
          >
            <div className="space-y-4 *:mx-auto *:max-w-3xl">
              <AnimatePresence initial={false} onExitComplete={settleSpacer}>
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    index={index}
                    showCitedSources={showCitedSources}
                    showThinking={showThinking}
                    autoExpandThinking={autoExpandThinking}
                    isEditing={!isBusy && !isSwitchingVersion && editingMessageId === message.id}
                    canEdit={!isBusy && !isSwitchingVersion}
                    canRegenerate={!isBusy && !isSwitchingVersion}
                    canSwitchVersion={!isBusy && !isSwitchingVersion}
                    onStartEdit={handleStartEdit}
                    onCancelEdit={handleCancelEdit}
                    onSubmitEdit={handleSubmitEdit}
                    onRegenerate={regenerateAt}
                    onSelectVersion={(targetId) => void handleSelectVersion(targetId)}
                    onRetryFromError={handleRetryFromError}
                    onSourceClick={handleSourceClick}
                    onSaveAsNote={handleSaveAsNote}
                  />
                ))}
              </AnimatePresence>
              {(isLoadingConversation || (isBackendGenerating && !isChatLoading)) && (
                <motion.div
                  initial={effectiveReducedMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={effectiveReducedMotion ? undefined : { opacity: 0, scale: 0.9 }}
                  transition={effectiveReducedMotion ? { duration: 0 } : { duration: 0.2 }}
                  className="flex justify-start"
                >
                  <Spinner />
                </motion.div>
              )}
            </div>
            <div style={{ height: inputHeight + extraBottomSpacer + 20 }} className="shrink-0" />
          </div>
        ) : (
          <div
            className="absolute inset-0 flex overflow-y-auto px-4 pt-6 md:px-6"
            style={{ paddingBottom: inputHeight + 24 }}
          >
            <div className="m-auto w-full max-w-xl">
              {sourcesCount === 0 && (
                <div className="flex flex-col items-center px-4 pb-2 text-center">
                  <div className="mb-5 flex size-20 items-center justify-center rounded-xs border border-blue-300 bg-blue-50 shadow-sm dark:border-blue-700 dark:bg-blue-950/30">
                    <div className="size-10 text-blue-500 dark:text-blue-400">
                      <FileIcon />
                    </div>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    No sources here yet
                  </h3>
                  <p className="max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                    Add sources to start chatting with your documents. You can upload PDFs, paste
                    text, or add web links.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 shrink-0">
        <div className="absolute inset-0 mx-4 bg-linear-to-t from-white from-50% to-transparent dark:from-gray-950/90 dark:from-50% dark:to-transparent" />
        {inputField}
      </div>
    </div>
  );
}
