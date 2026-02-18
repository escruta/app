import { useFetch } from "@/hooks";
import type { Conversation, ConversationsPage } from "@/interfaces";
import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Modal,
  Skeleton,
  Button,
  IconButton,
  Tooltip,
  TextField,
  Spinner,
  Divider,
} from "@/components/ui";
import { DeleteIcon, AddIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { UseFetchOptions } from "@/hooks/useFetch";

interface ChatHistoryProps {
  notebookId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  currentConversationId: string | null;
}

const CONVERSATIONS_PER_PAGE = 10;

export function ChatHistory({
  notebookId,
  isOpen,
  onClose,
  onSelectConversation,
  onNewConversation,
  currentConversationId,
}: ChatHistoryProps) {
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
      setOffset(0);
      setConversations([]);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setDebouncedSearch("");
      setOffset(0);
      setConversations([]);
    }
  }, [isOpen]);

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

  const { loading } = useFetch<ConversationsPage>(
    `notebooks/${notebookId}/conversations`,
    fetchOptions,
    isOpen,
  );

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setOffset((prev) => prev + CONVERSATIONS_PER_PAGE);
    }
  }, [loading, hasMore]);

  // Store latest values in refs for the observer callback
  const loadMoreCallbackRef = useRef(loadMore);
  loadMoreCallbackRef.current = loadMore;

  const setLoadMoreRef = useCallback((node: HTMLDivElement | null) => {
    loadMoreRef.current = node;

    if (!node) return;

    // Find the scrollable parent container
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

  const [conversationToDeleteId, setConversationToDeleteId] = useState<
    string | null
  >(null);

  const deleteOptions = useMemo(
    () => ({
      method: "DELETE" as const,
      onSuccess: () => {
        setConversationToDeleteId(null);
        setConversations((prev) =>
          prev.filter((c) => c.id !== conversationToDeleteId),
        );
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

  const handleSelect = useCallback(
    (conversationId: string) => {
      onSelectConversation(conversationId);
      onClose();
    },
    [onSelectConversation, onClose],
  );

  const handleNewConversation = useCallback(() => {
    onNewConversation();
    onClose();
  }, [onNewConversation, onClose]);

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chat history (${total} conversation${total !== 1 ? "s" : ""})`}
      width="xl"
      contentClassname="flex flex-col h-[28rem]"
      actions={
        <Button onClick={handleNewConversation} icon={<AddIcon />}>
          New conversation
        </Button>
      }
    >
      <div className="relative shrink-0">
        <TextField
          id="search-conversations"
          search
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            total > 0 ? `Search conversations...` : "No conversations yet"
          }
          onClear={() => setSearchQuery("")}
          autoFocus
        />
      </div>

      <Divider className="my-4" />

      <div className="flex flex-col flex-1 min-h-0 space-y-2">
        {isInitialLoading ? (
          <>
            <Skeleton variant="rectangle" height={56} />
            <Skeleton variant="rectangle" height={56} />
            <Skeleton variant="rectangle" height={56} />
          </>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {debouncedSearch
              ? "No conversations match your search"
              : "No conversations yet"}
          </div>
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
                    "flex items-center justify-between p-3 rounded-xs border cursor-pointer transition-colors",
                    {
                      "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 hover:bg-blue-100/65 dark:hover:bg-blue-900/65":
                        conversation.id === currentConversationId,
                      "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100/65 dark:hover:bg-gray-800":
                        conversation.id !== currentConversationId,
                    },
                  )}
                  onClick={() => handleSelect(conversation.id)}
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {conversation.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(conversation.updatedAt)}
                    </p>
                  </div>
                  <Tooltip text="Delete conversation" position="left">
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
                    >
                      <IconButton
                        icon={<DeleteIcon />}
                        variant="ghost"
                        size="sm"
                        disabled={
                          isDeleting &&
                          conversationToDeleteId === conversation.id
                        }
                        ariaLabel="Delete conversation"
                      />
                    </div>
                  </Tooltip>
                </motion.div>
              ))}
            </AnimatePresence>
            <div
              ref={setLoadMoreRef}
              className={cn("h-4", !hasMore && "hidden")}
            />
            {isLoadingMore && (
              <div className="flex justify-center py-2">
                <Spinner />
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
