import { lazy } from "react";
import { useFetch } from "@/hooks";
import {
  FileIcon,
  RestartIcon,
  SendIcon,
  ChatHistoryIcon,
  AddIcon,
} from "@/components/icons";
import {
  Alert,
  Card,
  Divider,
  TextField,
  IconButton,
  Tooltip,
  Button,
  Spinner,
  Chip,
  Skeleton,
} from "@/components/ui";
import { ChatHistory } from "@/components/ChatHistory";
import type { ConversationMessages } from "@/interfaces";
import {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn, getHttpErrorMessage } from "@/lib/utils";

const Markdown = lazy(() =>
  import("./Markdown").then((module) => ({ default: module.Markdown })),
);

const CodeBlock = lazy(() =>
  import("./CodeBlock").then((module) => ({ default: module.CodeBlock })),
);

type Sender = "user" | "ai";

interface Message {
  id: string;
  text: string;
  sender: Sender;
  citedSources?: CitedSource[];
  error?: true;
  selectedSourcesCount?: number;
}

interface CitedSource {
  id: string;
  title: string;
}

interface ChatResponse {
  content: string;
  conversationId: string | null;
  conversationTitle?: string;
  citedSources: CitedSource[];
}

interface ChatCardProps {
  notebookId: string;
  sourcesCount: number;
  selectedSourceIds?: string[];
  refreshTrigger?: number;
  onSourceSelect?: (sourceId: string) => void;
  externalQuestion?: string | null;
  onExternalQuestionHandled?: () => void;
}

function processMessage(message: Message, onRetry?: () => void): ReactNode {
  if (message.error) {
    return (
      <div className="flex flex-col gap-3">
        <Alert title="Error" message={message.text} variant="danger" />
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="ghost"
            size="sm"
            icon={<RestartIcon className="w-4 h-4" />}
          >
            Retry message
          </Button>
        )}
      </div>
    );
  }

  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match = codeBlockRegex.exec(message.text);

  while (match !== null) {
    if (match.index > lastIndex) {
      const beforeCode = message.text.slice(lastIndex, match.index);
      if (beforeCode.trim()) {
        parts.push({ type: "text", content: beforeCode });
      }
    }

    parts.push({
      type: "code",
      language: match[1] || "",
      content: match[2],
    });

    lastIndex = match.index + match[0].length;
    match = codeBlockRegex.exec(message.text);
  }

  if (lastIndex < message.text.length) {
    const remaining = message.text.slice(lastIndex);
    if (remaining.trim()) {
      parts.push({ type: "text", content: remaining });
    }
  }

  if (parts.length === 0) {
    parts.push({ type: "text", content: message.text });
  }

  return parts.map((part, index) => {
    if (part.type === "code") {
      return (
        <CodeBlock
          key={index}
          className={part.language ? `language-${part.language}` : ""}
        >
          {part.content}
        </CodeBlock>
      );
    }

    return (
      <div key={index}>{processTextContent(part.content, message.sender)}</div>
    );
  });
}

function processTextContent(text: string, sender: Sender) {
  const linkColorClass = {
    user: "text-blue-600 dark:text-blue-400 hover:underline",
    ai: "text-blue-600 dark:text-blue-400 hover:underline",
  }[sender];

  return <Markdown text={text} linkColorClass={linkColorClass} />;
}

export function ChatCard({
  notebookId,
  sourcesCount,
  selectedSourceIds = [],
  refreshTrigger,
  onSourceSelect,
  externalQuestion,
  onExternalQuestionHandled,
}: ChatCardProps) {
  const [summaryGenerateError, setSummaryGenerateError] =
    useState<FetchError | null>(null);

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
    data: notebookSummary,
    loading: isSummaryLoading,
    refetch: refetchSummary,
  } = useFetch<string>(
    `notebooks/${notebookId}/summary`,
    summaryOptions,
    false,
  );

  const regenerateSummaryOptions = useMemo(
    () => ({
      method: "POST" as const,
      onSuccess: () => {
        setSummaryGenerateError(null);
        refetchSummary(true);
      },
      onError: (error: FetchError) => {
        console.error("Error generating summary:", error.message);
        useFetch.clearCache(`notebooks/${notebookId}/summary`);
        refetchSummary(true);
        setSummaryGenerateError(error);
      },
    }),
    [refetchSummary, notebookId],
  );

  const { loading: isSummaryRegenerating, refetch: regenerateSummary } =
    useFetch<string>(
      `notebooks/${notebookId}/summary`,
      regenerateSummaryOptions,
      false,
    );

  useEffect(() => {
    refetchSummary();
    refetchExampleQuestions();
  }, [refreshTrigger]);

  const [isAutoRegenerating, setIsAutoRegenerating] = useState(false);
  const [skipExampleQuestionsFetch, setSkipExampleQuestionsFetch] =
    useState(false);

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
    sourcesCount > 0 && !skipExampleQuestionsFetch,
  );

  const prevSourcesCountRef = useRef<number>(sourcesCount);

  useEffect(() => {
    const prevCount = prevSourcesCountRef.current;
    const currentCount = sourcesCount;

    if (currentCount > 0 && prevCount !== currentCount) {
      setIsAutoRegenerating(true);
      setSkipExampleQuestionsFetch(true);
      setSummaryGenerateError(null);

      const timer = setTimeout(async () => {
        try {
          await regenerateSummary(true);
          setSkipExampleQuestionsFetch(false);
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

    prevSourcesCountRef.current = currentCount;
  }, [sourcesCount, notebookId, regenerateSummary, refetchExampleQuestions]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState<string | null>(
    null,
  );
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [conversationToLoadId, setConversationToLoadId] = useState<
    string | null
  >(null);
  const [pendingConversationTitle, setPendingConversationTitle] = useState<
    string | null
  >(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pendingMessageRef = useRef<string | null>(null);

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

  const loadConversation = useCallback(
    (selectedConversationId: string, title: string) => {
      setConversationToLoadId(selectedConversationId);
      setPendingConversationTitle(title);
    },
    [],
  );

  useEffect(() => {
    if (externalQuestion) {
      setInput(externalQuestion);
      onExternalQuestionHandled?.();
    }
  }, [externalQuestion, onExternalQuestionHandled]);

  const handleSourceClick = (sourceId: string) => {
    if (
      !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
        sourceId,
      )
    ) {
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
            firstMessage.length > 50
              ? firstMessage.slice(0, 50) + "..."
              : firstMessage;
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

  const { loading: isChatLoading, refetch: fetchChatResponseRaw } =
    useFetch<ChatResponse>(`notebooks/${notebookId}/chat`, chatOptions, false);

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
        const messageElements =
          container.getElementsByClassName("message-item");
        if (messageElements.length > 0) {
          const lastMessage = messageElements[
            messageElements.length - 1
          ] as HTMLElement;
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
    <Card className="flex flex-col h-full overflow-hidden px-0">
      <div className="flex flex-row justify-between items-center mb-2 px-4 shrink-0">
        <h2 className="flex items-baseline gap-1.5 min-w-0 flex-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 shrink-0">
            Chat /{" "}
          </span>
          <span className="truncate text-lg font-semibold select-text">
            {conversationTitle || "New conversation"}
          </span>
        </h2>
        {sourcesCount > 0 ? (
          <Tooltip text="Chat history" position="bottom">
            <IconButton
              icon={<ChatHistoryIcon />}
              ariaLabel="Chat history"
              onClick={() => setIsHistoryOpen(true)}
              variant="ghost"
              size="sm"
            />
          </Tooltip>
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
          className="flex-1 overflow-y-auto py-4 px-4 md:px-6 space-y-4 min-h-0 scroll-smooth scroll-pt-4"
        >
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={cn("message-item scroll-mt-4 flex flex-col mb-4", {
                  "justify-end items-end": message.sender === "user",
                  "justify-start items-start": message.sender === "ai",
                })}
              >
                <div
                  className={cn(
                    "w-full flex flex-col gap-4 select-text transition-all duration-200",
                    {
                      "max-w-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-2.5 rounded-xs self-end ml-12 shadow-xs":
                        message.sender === "user",
                      "max-w-3xl self-start mr-12 py-2":
                        message.sender === "ai" && !message.error,
                      "max-w-2xl bg-red-50/10 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 px-5 py-4 rounded-xs self-start mr-12":
                        message.error,
                    },
                  )}
                >
                  <div
                    className={cn("text-base font-medium leading-relaxed", {
                      "text-blue-800 dark:text-blue-100":
                        message.sender === "user",
                      "text-gray-950 dark:text-gray-50":
                        message.sender === "ai",
                    })}
                  >
                    {processMessage(
                      message,
                      message.error
                        ? () => handleRetryFromError(index)
                        : undefined,
                    )}
                  </div>

                  {message.sender === "ai" &&
                    message.citedSources &&
                    message.citedSources.length > 0 && (
                      <div className="pt-4 border-t border-gray-200/65 dark:border-gray-800/65">
                        <div className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold mb-3 select-none">
                          Cited sources
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {message.citedSources.map((source, idx) => (
                            <Chip
                              key={source.id}
                              onClick={() => handleSourceClick(source.id)}
                              title={source.title}
                              size="sm"
                              className="max-w-full"
                            >
                              <span className="truncate max-w-[180px]">
                                {source.title || `Source ${idx + 1}`}
                              </span>
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
                {message.sender === "user" &&
                  message.selectedSourcesCount !== undefined &&
                  message.selectedSourcesCount > 0 && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 mr-1">
                      {message.selectedSourcesCount} source
                      {message.selectedSourcesCount !== 1 ? "s" : ""} selected
                    </div>
                  )}
              </motion.div>
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
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-col flex-grow min-h-0 px-4 max-h-full overflow-y-auto"
        >
          {sourcesCount > 0 ? (
            <div className="w-full py-8 px-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-semibold">
                  Summary of the notebook
                </h3>
                {notebookSummary &&
                  !isSummaryLoading &&
                  !isAutoRegenerating && (
                    <Tooltip
                      text={
                        isSummaryRegenerating
                          ? "Regenerating summary"
                          : "Regenerate summary"
                      }
                      position="bottom"
                    >
                      <IconButton
                        icon={
                          isSummaryRegenerating ? <Spinner /> : <RestartIcon />
                        }
                        variant="ghost"
                        size="sm"
                        onClick={regenerateSummary}
                        disabled={isSummaryRegenerating}
                      />
                    </Tooltip>
                  )}
                {isAutoRegenerating && (
                  <Tooltip text="Auto-regenerating..." position="bottom">
                    <div className="flex items-center justify-center w-8 h-8">
                      <Spinner />
                    </div>
                  </Tooltip>
                )}
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={
                    isSummaryLoading ||
                    isSummaryRegenerating ||
                    isAutoRegenerating
                      ? "loading"
                      : summaryGenerateError
                        ? "error"
                        : notebookSummary?.trim()
                          ? "summary"
                          : "empty"
                  }
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeInOut" }}
                  className="max-w-none mt-1 mb-1"
                >
                  {isSummaryLoading ||
                  isSummaryRegenerating ||
                  isAutoRegenerating ? (
                    <Skeleton lines={4} className="w-full" />
                  ) : summaryGenerateError ? (
                    <div className="flex flex-col gap-3">
                      <Alert
                        title="Error"
                        message={getHttpErrorMessage(
                          summaryGenerateError.status,
                        )}
                        variant="danger"
                      />
                      <Button
                        onClick={regenerateSummary}
                        disabled={isSummaryRegenerating}
                        variant="ghost"
                        size="sm"
                        icon={<RestartIcon className="w-4 h-4" />}
                      >
                        Regenerate summary
                      </Button>
                    </div>
                  ) : notebookSummary?.trim() ? (
                    <div className="select-text">
                      {processTextContent(notebookSummary, "ai")}
                    </div>
                  ) : (
                    <Button
                      onClick={regenerateSummary}
                      disabled={isSummaryRegenerating}
                    >
                      Generate summary
                    </Button>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Example questions */}
              {messages.length === 0 && !isChatLoading && (
                <div className="mt-6">
                  {exampleQuestionsError && !skipExampleQuestionsFetch ? (
                    <div className="flex flex-col gap-3">
                      <Alert
                        title="Error"
                        message={getHttpErrorMessage(
                          exampleQuestionsError.status,
                        )}
                        variant="danger"
                      />
                      <Button
                        onClick={() => refetchExampleQuestions(true)}
                        disabled={isExampleQuestionsLoading}
                        variant="ghost"
                        size="sm"
                        icon={<RestartIcon className="w-4 h-4" />}
                      >
                        Regenerate example questions
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-foreground">
                          Example questions
                        </h4>
                        {isAutoRegenerating || skipExampleQuestionsFetch ? (
                          <Tooltip
                            text="Waiting for summary..."
                            position="bottom"
                          >
                            <div className="flex items-center justify-center w-8 h-8">
                              <Spinner />
                            </div>
                          </Tooltip>
                        ) : (
                          <Tooltip
                            text={
                              isExampleQuestionsLoading
                                ? "Refreshing questions"
                                : "Refresh questions"
                            }
                            position="bottom"
                          >
                            <IconButton
                              icon={
                                isExampleQuestionsLoading ? (
                                  <Spinner />
                                ) : (
                                  <RestartIcon />
                                )
                              }
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                refetchExampleQuestions(true);
                              }}
                              disabled={isExampleQuestionsLoading}
                            />
                          </Tooltip>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div
                            key={
                              isExampleQuestionsLoading ||
                              isAutoRegenerating ||
                              skipExampleQuestionsFetch
                                ? "loading"
                                : "questions"
                            }
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15, ease: "easeInOut" }}
                            className="flex flex-col gap-2"
                          >
                            {isExampleQuestionsLoading ||
                            isAutoRegenerating ||
                            skipExampleQuestionsFetch ? (
                              <>
                                <Skeleton variant="rectangle" height={34} />
                                <Skeleton variant="rectangle" height={34} />
                                <Skeleton variant="rectangle" height={34} />
                              </>
                            ) : exampleQuestions?.questions &&
                              exampleQuestions.questions.length > 0 ? (
                              exampleQuestions.questions.map(
                                (question, index) => (
                                  <Chip
                                    key={index}
                                    onClick={() => {
                                      setInput(question);
                                    }}
                                    multiline
                                    className="w-full justify-start text-left"
                                  >
                                    {question}
                                  </Chip>
                                ),
                              )
                            ) : null}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12 px-4 h-full">
              <div className="size-20 bg-blue-50 dark:bg-blue-950/30 rounded-xs flex items-center justify-center mb-5 shadow-sm border border-blue-300 dark:border-blue-700">
                <div className="size-10 text-blue-500 dark:text-blue-400">
                  <FileIcon />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                This notebook is empty
              </h3>
              <p className="text-base text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
                Add sources to start chatting with your documents. You can
                upload PDFs, paste text, or add web links.
              </p>
            </div>
          )}
        </motion.div>
      )}
      <Divider className="mt-0" />
      <div className="shrink-0 px-4">
        {/* Chat input */}
        <div className="flex items-center gap-2 pt-1">
          {messages.length > 0 ? (
            <Tooltip text="New conversation" position="top">
              <IconButton
                icon={<AddIcon />}
                ariaLabel="New conversation"
                onClick={() => {
                  setMessages([]);
                  setInput("");
                  setConversationId(null);
                }}
                disabled={
                  messages.length === 0 || isChatLoading || isAutoRegenerating
                }
                variant="ghost"
              />
            </Tooltip>
          ) : null}
          <TextField
            id="chat-input"
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setInput(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !isChatLoading &&
                input.trim()
              ) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              selectedSourceIds.length > 0
                ? `Ask a question (${selectedSourceIds.length} source${selectedSourceIds.length !== 1 ? "s" : ""} selected)...`
                : "Select sources to start chatting..."
            }
            className="flex-grow"
            disabled={isChatLoading || selectedSourceIds.length === 0}
            autoFocus
            maxRows={5}
            multiline
          />
          <IconButton
            icon={<SendIcon />}
            onClick={handleSendMessage}
            disabled={
              isChatLoading || !input.trim() || selectedSourceIds.length === 0
            }
            aria-label="Send message"
          />
        </div>
      </div>
    </Card>
  );
}
