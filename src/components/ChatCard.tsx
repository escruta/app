import { useFetch } from "@/hooks";
import {
  FileIcon,
  SendIcon,
  ChatHistoryIcon,
  DotsVerticalIcon,
  ChatNewIcon,
} from "@/components/icons";
import {
  Card,
  Divider,
  TextField,
  IconButton,
  Tooltip,
  Spinner,
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
} from "@/components/ui";
import { ChatHistory } from "@/components/ChatHistory";
import type { ConversationMessages, Source } from "@/interfaces";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getHttpErrorMessage } from "@/lib/utils";

import { ChatMessage, type Message, type CitedSource } from "./chat/ChatMessage";
import { NotebookSummary } from "./chat/NotebookSummary";
import { ExampleQuestions } from "./chat/ExampleQuestions";

type Sender = "user" | "ai";

interface ChatResponse {
  content: string;
  conversationId: string | null;
  conversationTitle?: string;
  citedSources: CitedSource[];
}

interface ChatCardProps {
  notebookId: string;
  sources: Source[];
  selectedSourceIds?: string[];
  onSourceSelect?: (sourceId: string) => void;
  externalQuestion?: string | null;
  onExternalQuestionHandled?: () => void;
}

export function ChatCard({
  notebookId,
  sources,
  selectedSourceIds = [],
  onSourceSelect,
  externalQuestion,
  onExternalQuestionHandled,
}: ChatCardProps) {
  const sourcesCount = sources.length;
  const readySourcesCount = sources.filter((s) => s.status === "READY").length;

  const [summaryGenerateError, setSummaryGenerateError] = useState<FetchError | null>(null);

  const summaryOptions = useMemo(
    () => ({
      method: "GET" as const,
      onError: (error: FetchError) => {
        console.error("Error fetching summary:", error.message);
      },
    }),
    [],
  );

  const {
    data: notebookSummaryData,
    loading: isSummaryLoading,
    refetch: refetchSummary,
  } = useFetch<{ summary: string }>(`notebooks/${notebookId}/summary`, summaryOptions);

  const notebookSummary = notebookSummaryData?.summary;

  const regenerateSummaryOptions = useMemo(
    () => ({
      method: "POST" as const,
      onSuccess: () => {
        setSummaryGenerateError(null);
        refetchSummary(true);
        useFetch.clearCache(`notebooks/${notebookId}/example-questions`);
        setSkipExampleQuestionsFetch(false);
      },
      onError: (error: FetchError) => {
        console.error("Error generating summary:", error.message);
        useFetch.clearCache(`notebooks/${notebookId}/summary`);
        refetchSummary(true);
        setSummaryGenerateError(error);
        setSkipExampleQuestionsFetch(false);
      },
    }),
    [refetchSummary, notebookId],
  );

  const { loading: isSummaryRegenerating, refetch: regenerateSummary } = useFetch<{
    summary: string;
  }>(`notebooks/${notebookId}/summary`, regenerateSummaryOptions, false);

  const [isAutoRegenerating, setIsAutoRegenerating] = useState(false);
  const [skipExampleQuestionsFetch, setSkipExampleQuestionsFetch] = useState(false);

  const exampleQuestionsOptions = useMemo(
    () => ({
      method: "GET" as const,
      onError: (error: FetchError) => {
        console.error("Error fetching example questions:", error.message);
      },
    }),
    [],
  );

  const {
    data: exampleQuestions,
    loading: isExampleQuestionsLoading,
    error: exampleQuestionsError,
    refetch: refetchExampleQuestions,
  } = useFetch<{
    questions: string[];
  }>(
    `notebooks/${notebookId}/example-questions`,
    exampleQuestionsOptions,
    readySourcesCount > 0 && !skipExampleQuestionsFetch,
  );

  const prevReadySourcesCountRef = useRef<number>(readySourcesCount);

  useEffect(() => {
    const prevCount = prevReadySourcesCountRef.current;
    const currentCount = readySourcesCount;

    if (currentCount > 0 && prevCount !== currentCount) {
      setIsAutoRegenerating(true);
      setSkipExampleQuestionsFetch(true);
      setSummaryGenerateError(null);

      const timer = setTimeout(async () => {
        try {
          await regenerateSummary(true);
        } catch (error) {
          console.error("Error during auto-regeneration:", error);
        } finally {
          setIsAutoRegenerating(false);
        }
      }, 1000);

      return () => {
        clearTimeout(timer);
        setIsAutoRegenerating(false);
      };
    }

    prevReadySourcesCountRef.current = currentCount;
  }, [readySourcesCount, notebookId, regenerateSummary, refetchExampleQuestions]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [conversationToLoadId, setConversationToLoadId] = useState<string | null>(null);
  const [pendingConversationTitle, setPendingConversationTitle] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pendingMessageRef = useRef<string | null>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const [inputHeight, setInputHeight] = useState(0);

  useEffect(() => {
    if (!inputContainerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setInputHeight((entry.target as HTMLElement).offsetHeight);
      }
    });

    observer.observe(inputContainerRef.current);
    return () => observer.disconnect();
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
          }));

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

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    const newMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: "user",
      selectedSourcesCount: selectedSourceIds.length,
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInput("");
    pendingMessageRef.current = userText;

    await fetchChatResponse(true);
  };

  const chatDataRef = useRef({
    userInput: "",
    conversationId: null as string | null,
    selectedSourceIds: [] as string[],
  });

  const chatOptions = useMemo(
    () => ({
      method: "POST" as const,
      get data() {
        return chatDataRef.current;
      },
      onSuccess: (response: ChatResponse) => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: response.content,
          sender: "ai",
          citedSources: response.citedSources,
        };
        setMessages((prevMessages) => [...prevMessages, aiResponse]);
        if (!conversationId && response.conversationId) {
          const firstMessage = pendingMessageRef.current || "";
          const defaultTitle =
            firstMessage.length > 50 ? firstMessage.slice(0, 50) + "..." : firstMessage;
          setConversationTitle(response.conversationTitle || defaultTitle);
        }
        setConversationId(response.conversationId);
        pendingMessageRef.current = null;
      },
      onError: (error: FetchError) => {
        console.error("Error sending message:", error.status, error.message);
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: getHttpErrorMessage(error.status),
          sender: "ai",
          error: true,
        };
        setMessages((prevMessages) => [...prevMessages, errorResponse]);
      },
    }),
    [],
  );

  const { loading: isChatLoading, refetch: fetchChatResponseRaw } = useFetch<ChatResponse>(
    `notebooks/${notebookId}/chat`,
    chatOptions,
    false,
  );

  const fetchChatResponse = useCallback(
    async (forcedUpdate = false) => {
      chatDataRef.current = {
        userInput: pendingMessageRef.current || "",
        conversationId,
        selectedSourceIds,
      };
      return fetchChatResponseRaw(forcedUpdate);
    },
    [conversationId, fetchChatResponseRaw, selectedSourceIds],
  );

  const handleRetryFromError = useCallback(
    (messageIndex: number) => {
      setMessages((prevMessages) => {
        const newMessages = prevMessages.slice(0, messageIndex);
        return newMessages;
      });

      if (pendingMessageRef.current) {
        const retryMessage: Message = {
          id: Date.now().toString(),
          text: pendingMessageRef.current,
          sender: "user",
          selectedSourcesCount: selectedSourceIds.length,
        };
        setMessages((prev) => [...prev, retryMessage]);
        fetchChatResponse(true);
      }
    },
    [fetchChatResponse],
  );

  useEffect(() => {
    if (scrollContainerRef.current && messages.length > 0) {
      const timer = setTimeout(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const messageElements = container.getElementsByClassName("message-item");
        if (messageElements.length > 0) {
          const lastMessage = messageElements[messageElements.length - 1] as HTMLElement;
          lastMessage.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length, isChatLoading]);

  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setInput("");
    setConversationId(null);
    setConversationTitle(null);
  }, []);

  return (
    <Card className="flex h-full flex-col overflow-hidden px-0 pb-0">
      <div className="mb-2 flex shrink-0 flex-row items-center justify-between px-4">
        <h2 className="flex min-w-0 flex-1 items-baseline gap-1.5">
          <span className="shrink-0 text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
            Chat /{" "}
          </span>
          <span className="truncate text-lg font-semibold select-text">
            {conversationTitle || "New conversation"}
          </span>
        </h2>
        {sourcesCount > 0 ? (
          <div className="flex items-center gap-1">
            <Tooltip text="New conversation" position="top">
              <IconButton
                icon={<ChatNewIcon />}
                ariaLabel="New conversation"
                onClick={handleNewConversation}
                disabled={messages.length === 0 || isChatLoading || isAutoRegenerating}
                variant="ghost"
                size="sm"
              />
            </Tooltip>
            <Menu>
              <Tooltip text="More options" position="top">
                <MenuTrigger>
                  <IconButton
                    icon={<DotsVerticalIcon />}
                    ariaLabel="More options"
                    variant="ghost"
                    size="sm"
                  />
                </MenuTrigger>
              </Tooltip>
              <MenuContent align="right">
                <MenuItem
                  label="Chat history"
                  icon={<ChatHistoryIcon />}
                  onClick={() => setIsHistoryOpen(true)}
                  disabled={isChatLoading || isAutoRegenerating}
                />
              </MenuContent>
            </Menu>
          </div>
        ) : null}
      </div>
      <ChatHistory
        notebookId={notebookId}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectConversation={(id, title) => {
          loadConversation(id, title);
          setIsHistoryOpen(false);
        }}
        onNewConversation={() => {
          handleNewConversation();
          setIsHistoryOpen(false);
        }}
        currentConversationId={conversationId}
      />
      <Divider className="mb-0" />
      {messages.length > 0 ? (
        <div
          ref={scrollContainerRef}
          className="min-h-0 flex-1 scroll-pt-4 space-y-4 overflow-y-auto scroll-smooth px-4 py-4 md:px-6"
        >
          <AnimatePresence>
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
          {(isChatLoading || isLoadingConversation) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex justify-start"
            >
              <Spinner />
            </motion.div>
          )}
          <div style={{ height: inputHeight }} className="shrink-0" />
        </div>
      ) : (
        <div className="flex max-h-full min-h-0 flex-grow flex-col overflow-y-auto px-4">
          {sourcesCount > 0 ? (
            <div className="w-full">
              <NotebookSummary
                notebookSummary={notebookSummary}
                isSummaryLoading={isSummaryLoading}
                isAutoRegenerating={isAutoRegenerating}
                isSummaryRegenerating={isSummaryRegenerating}
                summaryGenerateError={summaryGenerateError}
                readySourcesCount={readySourcesCount}
                regenerateSummary={() => regenerateSummary()}
              />
              {messages.length === 0 && !isChatLoading && (
                <ExampleQuestions
                  exampleQuestionsError={exampleQuestionsError}
                  skipExampleQuestionsFetch={skipExampleQuestionsFetch}
                  isExampleQuestionsLoading={isExampleQuestionsLoading}
                  isAutoRegenerating={isAutoRegenerating}
                  readySourcesCount={readySourcesCount}
                  exampleQuestions={exampleQuestions}
                  refetchExampleQuestions={refetchExampleQuestions}
                  onQuestionSelect={(q) => setInput(q)}
                />
              )}
            </div>
          ) : (
            <div className="flex size-full flex-col items-center justify-start pt-24 text-center">
              <div className="mb-5 flex size-20 items-center justify-center rounded-xs border border-blue-300 bg-blue-50 shadow-sm dark:border-blue-700 dark:bg-blue-950/30">
                <div className="size-10 text-blue-500 dark:text-blue-400">
                  <FileIcon />
                </div>
              </div>
              <h3 className="text-foreground mb-2 text-lg font-semibold">This notebook is empty</h3>
              <p className="max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                Add sources to start chatting with your documents. You can upload PDFs, paste text,
                or add web links.
              </p>
            </div>
          )}
          <div style={{ height: inputHeight }} className="shrink-0" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 shrink-0">
        <div className="absolute inset-0 mx-4 bg-linear-to-t from-white from-80% to-transparent dark:from-gray-900/80 dark:to-transparent" />
        <div
          ref={inputContainerRef}
          className="pointer-events-auto relative m-4 mt-6 flex flex-col rounded-xs border border-gray-300 bg-white shadow-sm transition-all focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-400"
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
            autoFocus
            maxRows={5}
            multiline
          />
          <div className="absolute right-2 bottom-2">
            <Tooltip text="Send message" position="top">
              <IconButton
                icon={<SendIcon />}
                onClick={handleSendMessage}
                disabled={isChatLoading || !input.trim() || selectedSourceIds.length === 0}
                aria-label="Send message"
                size="sm"
                variant="primary"
              />
            </Tooltip>
          </div>
        </div>
      </div>
    </Card>
  );
}
