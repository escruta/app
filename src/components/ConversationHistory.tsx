import { useFetch } from "@/hooks";
import type { Conversation, ConversationsPage } from "@/interfaces";
import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Skeleton, IconButton, TextField, Spinner, Divider, Button } from "@/components/ui";
import { DeleteIcon, ChatNewIcon, ChatIcon, SearchIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { UseFetchOptions } from "@/hooks/useFetch";

interface ConversationHistoryProps {
  notebookId: string;
  currentConversationId?: string | null;
  refreshTrigger?: number;
  onSelectConversation: (conversationId: string, title: string) => void;
  onNewConversation: () => void;
}

const CONVERSATIONS_PER_PAGE = 10;

export function ConversationHistory({
  notebookId,
  currentConversationId,
  refreshTrigger,
  onSelectConversation,
  onNewConversation,
}: ConversationHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setOffset(0);
    setConversations([]);
  }, [debouncedSearch]);

  useEffect(() => {
    if (refreshTrigger === undefined) return;
    setSearchQuery("");
    setDebouncedSearch("");
    setOffset(0);
    setConversations([]);
    refetchRef.current();
  }, [refreshTrigger]);

  const fetchOptions = useMemo<UseFetchOptions<ConversationsPage>>(
    () => ({
      method: "GET" as const,
      skipCache: true,
      params: {
        limit: CONVERSATIONS_PER_PAGE.toString(),
        offset: offset.toString(),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      },
      onSuccess: (data: ConversationsPage) => {
        if (offset === 0) {
          setConversations(data.conversations);
        } else {
          setConversations((prev) => [...prev, ...data.conversations]);
        }
        setHasMore(data.hasMore);
        setTotal(data.total);
      },
    }),
    [debouncedSearch, offset],
  );

  const { loading, refetch } = useFetch<ConversationsPage>(
    `notebooks/${notebookId}/conversations`,
    fetchOptions,
  );

  const refetchRef = useRef<() => void>(() => {});
  refetchRef.current = () => refetch(true);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setOffset((prev) => prev + CONVERSATIONS_PER_PAGE);
    }
  }, [loading, hasMore]);

  const loadMoreCallbackRef = useRef(loadMore);
  loadMoreCallbackRef.current = loadMore;

  const setLoadMoreRef = useCallback((node: HTMLDivElement | null) => {
    loadMoreRef.current = node;

    if (!node) return;

    let element = node.parentElement;
    while (element) {
      const style = window.getComputedStyle(element);
      if (style.overflowY === "auto" || style.overflowY === "scroll") {
        scrollContainerRef.current = element;
        break;
      }
      element = element.parentElement;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreCallbackRef.current();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px 100px 0px",
        root: scrollContainerRef.current,
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  const [conversationToDeleteId, setConversationToDeleteId] = useState<string | null>(null);

  const deleteOptions = useMemo(
    () => ({
      method: "DELETE" as const,
      onSuccess: () => {
        setConversationToDeleteId(null);
        setConversations((prev) => prev.filter((c) => c.id !== conversationToDeleteId));
        setTotal((prev) => prev - 1);
      },
      onError: (error: FetchError) => {
        console.error("Error deleting conversation:", error.message);
        setConversationToDeleteId(null);
      },
    }),
    [conversationToDeleteId],
  );

  const { loading: isDeleting } = useFetch<void>(
    `notebooks/${notebookId}/conversations/${conversationToDeleteId}`,
    deleteOptions,
    conversationToDeleteId !== null,
  );

  const handleDelete = useCallback((conversationId: string) => {
    setConversationToDeleteId(conversationId);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "long" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const isInitialLoading = loading && conversations.length === 0;
  const isLoadingMore = loading && conversations.length > 0;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="z-10 shrink-0">
        <div className="flex h-15 items-center px-4 pt-4 pb-3">
          <h2 className="font-sans text-lg font-semibold">Conversations</h2>
          <div className="flex flex-1 items-center justify-end gap-2">
            <Button
              icon={<ChatNewIcon className="size-3.5" />}
              variant="primary"
              size="sm"
              onClick={onNewConversation}
            >
              New conversation
            </Button>
          </div>
        </div>
        <Divider className="my-0" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 px-4 pt-3">
          <TextField
            id="search-conversations"
            search
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={total > 0 ? "Search your conversations..." : "No conversations yet"}
            onClear={() => setSearchQuery("")}
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col space-y-2 overflow-y-auto px-4 py-3">
          {isInitialLoading ? (
            <>
              <Skeleton variant="rectangle" height={48} />
              <Skeleton variant="rectangle" height={48} />
              <Skeleton variant="rectangle" height={48} />
            </>
          ) : conversations.length === 0 ? (
            debouncedSearch ? (
              <div className="flex size-full flex-col items-center justify-start pt-12 text-center">
                <div className="mb-5 flex size-20 items-center justify-center rounded-xs border border-blue-300 bg-blue-50 shadow-sm dark:border-blue-700 dark:bg-blue-950/30">
                  <div className="size-10 text-blue-500 dark:text-blue-400">
                    <SearchIcon />
                  </div>
                </div>
                <h3 className="text-foreground mb-2 text-lg font-semibold">No results</h3>
                <p className="max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  No conversations match that, try another search.
                </p>
              </div>
            ) : (
              <div className="flex size-full flex-col items-center justify-start pt-12 text-center">
                <div className="mb-5 flex size-20 items-center justify-center rounded-xs border border-blue-300 bg-blue-50 shadow-sm dark:border-blue-700 dark:bg-blue-950/30">
                  <div className="size-10 text-blue-500 dark:text-blue-400">
                    <ChatIcon />
                  </div>
                </div>
                <h3 className="text-foreground mb-2 text-lg font-semibold">No conversations yet</h3>
                <p className="max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  Start a new conversation to chat with your documents.
                </p>
              </div>
            )
          ) : (
            <>
              <AnimatePresence>
                {conversations.map((conversation) => (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      "group flex items-center justify-between rounded-xs border p-2.5 transition-colors cursor-pointer",
                      {
                        "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700":
                          conversation.id === currentConversationId,
                        "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100/65 dark:hover:bg-gray-800":
                          conversation.id !== currentConversationId,
                      },
                    )}
                    onClick={() => onSelectConversation(conversation.id, conversation.title)}
                  >
                    <div className="mr-2 min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {conversation.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(conversation.updatedAt)}
                      </p>
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(conversation.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          handleDelete(conversation.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <IconButton
                        icon={<DeleteIcon />}
                        variant="ghost"
                        size="sm"
                        disabled={isDeleting && conversationToDeleteId === conversation.id}
                        ariaLabel="Delete conversation"
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={setLoadMoreRef} className={cn("h-4", !hasMore && "hidden")} />
              {isLoadingMore && (
                <div className="flex justify-center py-2">
                  <Spinner />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
