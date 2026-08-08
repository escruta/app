import { useFetch, useCookie, useChatStream, useChatGreeting, useRealtimeEvent } from "@/hooks";
import { FileIcon, SendIcon, ChatNewIcon } from "@/components/icons";
import { Divider, TextField, IconButton, Tooltip, Spinner } from "@/components/ui";
import type { ConversationMessages, Source } from "@/interfaces";
import { useEffect, useState, useRef, useMemo, useCallback, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getHttpErrorMessage } from "@/lib/utils";

import { ChatMessage, type Message } from "./chat/ChatMessage";
import { ExampleQuestions } from "./chat/ExampleQuestions";

type Sender = "user" | "ai";

interface ChatCardProps {
  notebookId: string;
  sources: Source[];
  selectedSourceIds?: string[];
  onSourceSelect?: (sourceId: string) => void;
  externalQuestion?: string | null;
  onExternalQuestionHandled?: () => void;
  autoFocus?: boolean;
  initialConversationId?: string | null;
  initialConversationTitle?: string | null;
  onConversationCreated?: (conversationId: string) => void;
  onTitleChange?: (title: string) => void;
  onConversationCompleted?: () => void;
  onNewChat?: () => void;
}

export function ChatCard({
  notebookId,
  sources,
  selectedSourceIds = [],
  onSourceSelect,
  externalQuestion,
  onExternalQuestionHandled,
  autoFocus = true,
  initialConversationId,
  initialConversationTitle,
  onConversationCreated,
  onTitleChange,
  onConversationCompleted,
  onNewChat,
}: ChatCardProps) {
  const sourcesCount = sources.length;
  const readySourcesCount = sources.filter((s) => s.status === "READY").length;

  const { greeting, subtitle } = useChatGreeting();

  const [cachedExampleQuestions, setCachedExampleQuestions] = useCookie<{
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
      refetchExampleQuestions(true);
    },
    [notebookId, refetchExampleQuestions, setCachedExampleQuestions],
  );

  useRealtimeEvent("summary.updated", handleSummaryUpdated);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState<string | null>(null);
  const [conversationToLoadId, setConversationToLoadId] = useState<string | null>(null);
  const [pendingConversationTitle, setPendingConversationTitle] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pendingMessageRef = useRef<string | null>(null);
  const inputObserverRef = useRef<ResizeObserver | null>(null);
  const [inputHeight, setInputHeight] = useState(0);
  const [extraBottomSpacer, setExtraBottomSpacer] = useState(0);
  const [pendingAlign, setPendingAlign] = useState(false);
  const scrollTargetRef = useRef<number | null>(null);
  const extraBottomSpacerRef = useRef(0);

  useEffect(() => {
    extraBottomSpacerRef.current = extraBottomSpacer;
  }, [extraBottomSpacer]);

  const inputContainerRef = useCallback((el: HTMLDivElement | null) => {
    if (inputObserverRef.current) {
      inputObserverRef.current.disconnect();
      inputObserverRef.current = null;
    }
    if (!el) return;

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
        const loadedMessages: Message[] = data.messages
          .filter((m) => m.type === "USER" || m.type === "ASSISTANT")
          .map((m, index) => ({
            id: `${conversationToLoadId}-${index}`,
            text: m.content,
            sender: m.type === "USER" ? ("user" as Sender) : ("ai" as Sender),
            citedSources: m.citedSources?.length ? m.citedSources : undefined,
            selectedSourcesCount: m.selectedSourcesCount ?? undefined,
          }));

        setExtraBottomSpacer(0);
        setPendingAlign(false);
        scrollTargetRef.current = null;

        setMessages(loadedMessages);
        setConversationId(conversationToLoadId);
        setConversationTitle(pendingConversationTitle);
        setConversationToLoadId(null);
        setPendingConversationTitle(null);
      },
      onError: (error: FetchError) => {
        console.error("Error loading conversation:", error.message);
        setConversationToLoadId(null);
        setPendingConversationTitle(null);
      },
    }),
    [conversationToLoadId, pendingConversationTitle],
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

  useEffect(() => {
    if (externalQuestion) {
      setInput(externalQuestion);
      onExternalQuestionHandled?.();
    }
  }, [externalQuestion, onExternalQuestionHandled]);

  const handleSourceClick = (sourceId: string) => {
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(sourceId)) {
      console.warn("Invalid source ID format:", sourceId);
      return;
    }
    onSourceSelect?.(sourceId);
  };

  const streamingMessageIdRef = useRef<string | null>(null);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);

  const { stream: streamChat, isStreaming: isChatLoading } = useChatStream(
    `notebooks/${notebookId}/chat/stream`,
    {
      onConversation: (id) => {
        if (!conversationId) {
          setConversationId(id);
        }
        onConversationCreated?.(id);
      },
      onToken: (chunk) => {
        const id = streamingMessageIdRef.current;
        if (!id) return;
        setIsWaitingForResponse(false);
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, text: m.text + chunk } : m)));
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
      onDone: () => {
        pendingMessageRef.current = null;
        streamingMessageIdRef.current = null;
        setIsWaitingForResponse(false);
        onConversationCompleted?.();
      },
      onError: (status, message) => {
        console.error("Error streaming chat:", status, message);
        const id = streamingMessageIdRef.current;
        if (id) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === id ? { ...m, text: getHttpErrorMessage(status) || message, error: true } : m,
            ),
          );
        }
        streamingMessageIdRef.current = null;
        setIsWaitingForResponse(false);
      },
    },
  );

  const handleStreamChat = useCallback(
    async (overrideConversationId: string | null = conversationId) => {
      const aiMessageId = (Date.now() + 1).toString();
      streamingMessageIdRef.current = aiMessageId;
      const aiMessage: Message = { id: aiMessageId, text: "", sender: "ai" };
      setMessages((prev) => [...prev, aiMessage]);
      setIsWaitingForResponse(true);

      await streamChat({
        userInput: pendingMessageRef.current || "",
        conversationId: overrideConversationId,
        selectedSourceIds,
      });
    },
    [conversationId, selectedSourceIds, streamChat],
  );

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: "user",
      selectedSourcesCount: selectedSourceIds.length,
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");
    pendingMessageRef.current = userText;
    setPendingAlign(true);

    await handleStreamChat();
  };

  const handleRetryFromError = useCallback(
    (messageIndex: number) => {
      if (!pendingMessageRef.current) return;

      setMessages((prevMessages) => prevMessages.slice(0, messageIndex));
      setPendingAlign(true);
      handleStreamChat();
    },
    [handleStreamChat],
  );

  const computeAlignMetrics = useCallback((currentSpacer: number) => {
    const container = scrollContainerRef.current;
    if (!container) return null;

    const userMessageElements = container.querySelectorAll<HTMLElement>('[data-sender="user"]');
    const lastUserMessageElement = userMessageElements[userMessageElements.length - 1];
    if (!lastUserMessageElement) return null;

    const paddingTop = parseFloat(getComputedStyle(container).scrollPaddingTop) || 0;
    const target = Math.max(0, lastUserMessageElement.offsetTop - container.offsetTop - paddingTop);

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
      container.scrollTo({ top: scrollTargetRef.current, behavior: "smooth" });
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
    if (isChatLoading) {
      streamStartedRef.current = true;
      return;
    }
    if (!streamStartedRef.current) return;
    streamStartedRef.current = false;
    settleSpacer();
  }, [isChatLoading, settleSpacer]);

  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setInput("");
    setConversationId(null);
    setConversationTitle(null);
    setExtraBottomSpacer(0);
    setPendingAlign(false);
    scrollTargetRef.current = null;
  }, []);

  const inputField = (
    <div
      ref={inputContainerRef}
      className="pointer-events-auto relative mx-auto my-6 flex w-[calc(100%-2rem)] max-w-3xl flex-col rounded-xs border border-gray-300 bg-white shadow-sm transition-all focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-400"
    >
      <TextField
        id="chat-input"
        value={input}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
        onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
          if (e.key === "Enter" && !e.shiftKey && !isChatLoading && input.trim()) {
            e.preventDefault();
            handleSendMessage();
          }
        }}
        placeholder={
          sourcesCount === 0
            ? "Add sources to start chatting..."
            : selectedSourceIds.length > 0
              ? `Ask a question (${selectedSourceIds.length} source${selectedSourceIds.length !== 1 ? "s" : ""} selected)...`
              : "Select sources to start chatting..."
        }
        className="w-full rounded-t-xs border-0 bg-transparent py-3 pr-12 pl-4 shadow-none hover:border-transparent hover:ring-0 hover:ring-offset-0 focus:border-transparent focus:ring-0 focus:ring-offset-0 dark:hover:ring-offset-0 dark:focus:ring-0 dark:focus:ring-offset-0"
        disabled={isChatLoading || selectedSourceIds.length === 0}
        autoFocus={autoFocus}
        maxRows={5}
        multiline
      />
      <div className="absolute right-2 bottom-2">
        <Tooltip text="Send your question" position="top">
          <IconButton
            icon={<SendIcon />}
            onClick={handleSendMessage}
            disabled={isChatLoading || !input.trim() || selectedSourceIds.length === 0}
            aria-label="Send your question"
            size="sm"
            variant="primary"
          />
        </Tooltip>
      </div>
    </div>
  );

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="flex h-15 items-center px-4 pt-4 pb-3">
        <h2 className="flex min-w-0 items-baseline justify-center gap-1.5">
          <span className="shrink-0 text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
            Chat /{" "}
          </span>
          <span className="truncate text-lg font-semibold select-text">
            {conversationTitle || "New conversation"}
          </span>
        </h2>
        {sourcesCount > 0 ? (
          <div className="flex flex-1 items-center justify-end gap-1">
            <Tooltip text="New conversation" position="top">
              <IconButton
                icon={<ChatNewIcon />}
                ariaLabel="New conversation"
                onClick={() => (onNewChat ? onNewChat() : handleNewConversation())}
                disabled={(messages.length === 0 && !onNewChat) || isChatLoading}
                variant="ghost"
                size="sm"
              />
            </Tooltip>
          </div>
        ) : (
          <div className="flex flex-1" />
        )}
      </div>
      <Divider className="my-0" />
      <AnimatePresence mode="wait">
        {messages.length > 0 ? (
          <motion.div
            key="chat-messages"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            ref={scrollContainerRef}
            className="min-h-0 flex-1 scroll-pt-4 space-y-4 overflow-y-auto scroll-smooth px-4 py-4 *:mx-auto *:max-w-3xl md:px-6"
          >
            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  index={index}
                  onRetryFromError={handleRetryFromError}
                  onSourceClick={handleSourceClick}
                />
              ))}
            </AnimatePresence>
            {(isWaitingForResponse || isLoadingConversation) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="flex justify-start"
              >
                <Spinner />
              </motion.div>
            )}
            <div style={{ height: inputHeight + extraBottomSpacer + 20 }} className="shrink-0" />
          </motion.div>
        ) : (
          <motion.div
            key="chat-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex min-h-0 grow flex-col justify-center overflow-y-auto px-4"
          >
            {sourcesCount > 0 && (
              <div className="mx-auto w-[calc(100%-2rem)] max-w-3xl px-4 text-center">
                <h3 className="text-foreground mb-1 text-xl font-semibold">{greeting}</h3>
                <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {subtitle}
                </p>
              </div>
            )}
            {sourcesCount === 0 && (
              <div className="flex flex-col items-center px-4 pb-2 text-center">
                <div className="mb-5 flex size-20 items-center justify-center rounded-xs border border-blue-300 bg-blue-50 shadow-sm dark:border-blue-700 dark:bg-blue-950/30">
                  <div className="size-10 text-blue-500 dark:text-blue-400">
                    <FileIcon />
                  </div>
                </div>
                <h3 className="text-foreground mb-2 text-lg font-semibold">No sources here yet</h3>
                <p className="max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  Add sources to start chatting with your documents. You can upload PDFs, paste
                  text, or add web links.
                </p>
              </div>
            )}
            {inputField}
            {!isChatLoading && sourcesCount > 0 && (
              <div className="pointer-events-auto relative z-10 mx-auto -mt-3 mb-6 w-[calc(100%-2rem)] max-w-3xl">
                <ExampleQuestions
                  exampleQuestionsError={exampleQuestionsError}
                  skipExampleQuestionsFetch={false}
                  isExampleQuestionsLoading={isExampleQuestionsLoading}
                  isAutoRegenerating={false}
                  readySourcesCount={readySourcesCount}
                  exampleQuestions={exampleQuestions}
                  refetchExampleQuestions={refetchExampleQuestions}
                  onQuestionSelect={(q) => setInput(q)}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {messages.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 shrink-0">
          <div className="absolute inset-0 mx-4 bg-linear-to-t from-white from-50% to-transparent dark:from-gray-950/90 dark:from-50% dark:to-transparent" />
          {inputField}
        </div>
      )}
    </div>
  );
}
