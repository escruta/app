import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { AgentStep } from "@/interfaces";
import { cn } from "@/lib/utils";
import { useAccessibility } from "@/hooks";
import { Spinner } from "@/components/ui";
import {
  BookOpenIcon,
  ChevronIcon,
  CloseIcon,
  FileTextIcon,
  MathIcon,
  SearchIcon,
  StarsIcon,
} from "@/components/icons";
import { Markdown } from "../Markdown";

interface AgentThinkingPanelProps {
  steps: AgentStep[];
  isMessageStreaming?: boolean;
  autoExpand?: boolean;
  fallbackDurationMs?: number;
}

function formatDuration(ms?: number | null): string | null {
  if (ms === undefined || ms === null || ms < 0) return null;
  if (ms < 1000) return "< 1s";
  return `${(ms / 1000).toFixed(1)}s`;
}

function cleanThoughtMarkdown(raw: string): string {
  return raw.replace(/\s*\[source_[a-fA-F0-9-]+\]/g, "").trim();
}

function StepBadgeIcon({ step }: { step: AgentStep }) {
  if (step.status === "running") {
    return <Spinner size={12} className="text-blue-600 dark:text-blue-400" />;
  }
  if (step.status === "error") {
    return <CloseIcon className="size-3 text-red-600 dark:text-red-400" />;
  }
  switch (step.type) {
    case "search":
      return <SearchIcon className="size-3 text-blue-600 dark:text-blue-400" />;
    case "read":
      return <FileTextIcon className="size-3 text-blue-600 dark:text-blue-400" />;
    case "context":
      return <BookOpenIcon className="size-3 text-blue-600 dark:text-blue-400" />;
    case "calculate":
      return <MathIcon className="size-3 text-blue-600 dark:text-blue-400" />;
    default:
      return <StarsIcon className="size-3 text-blue-600 dark:text-blue-400" />;
  }
}

function ThoughtItem({ step }: { step: AgentStep }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isRunning = step.status === "running";
  const cleanedText = useMemo(() => cleanThoughtMarkdown(step.detail ?? ""), [step.detail]);

  useEffect(() => {
    if (!isRunning || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [cleanedText, isRunning]);

  if (!cleanedText) return null;

  return (
    <div
      ref={scrollRef}
      className={cn(
        "select-none text-[13px] leading-relaxed text-gray-700 dark:text-gray-300",
        "[&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
        "[&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:mb-1",
        "[&_h1]:my-2 [&_h1]:text-sm [&_h2]:my-2 [&_h2]:text-sm [&_h3]:my-1.5 [&_h3]:text-[13px]",
        "[&_strong]:font-semibold [&_strong]:text-gray-900 dark:[&_strong]:text-gray-100",
        isRunning && "max-h-56 overflow-y-auto pr-1",
      )}
    >
      <Markdown text={cleanedText} showLinks={false} />
    </div>
  );
}

function ToolItem({ step }: { step: AgentStep }) {
  const isRunning = step.status === "running";
  const isError = step.status === "error";
  const actionLabel = isRunning
    ? step.title
    : step.type === "search"
      ? "Searched"
      : step.type === "read"
        ? "Read"
        : step.type === "context"
          ? "Checked overview"
          : step.type === "calculate"
            ? "Calculated"
            : step.title;

  const formattedResult = step.result?.replace(/^Found\s+/, "") ?? null;

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xs border px-3 py-2 transition-colors select-none",
        isError
          ? "border-red-200 bg-red-50/60 dark:border-red-900/50 dark:bg-red-950/25"
          : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950/70",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-xs",
          isError ? "bg-red-100 dark:bg-red-950/60" : "bg-blue-50 dark:bg-blue-950/60",
        )}
      >
        <StepBadgeIcon step={step} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="min-w-0 text-xs leading-snug">
            <span className="font-semibold text-gray-900 dark:text-gray-100">{actionLabel}</span>
            {step.detail && (
              <span className="ml-1.5 font-medium text-gray-700 dark:text-gray-300">
                {step.type === "search" ? `"${step.detail}"` : step.detail}
              </span>
            )}
          </div>
          {formattedResult && !isRunning && (
            <span
              className={cn(
                "shrink-0 text-[11px] font-medium tabular-nums",
                isError ? "text-red-700 dark:text-red-300" : "text-gray-600 dark:text-gray-400",
              )}
            >
              {formattedResult}
            </span>
          )}
        </div>

        {step.rationale && (
          <p className="mt-0.5 text-xs leading-snug text-gray-600 dark:text-gray-400">
            {step.rationale}
          </p>
        )}
      </div>
    </div>
  );
}

export function AgentThinkingPanel({
  steps,
  isMessageStreaming = false,
  autoExpand = true,
  fallbackDurationMs,
}: AgentThinkingPanelProps) {
  const { effectiveReducedMotion } = useAccessibility();

  const visibleSteps = useMemo(
    () =>
      steps.filter(
        (s) =>
          s.type !== "text" &&
          s.type !== "synthesize" &&
          s.type !== "analyze" &&
          (s.type !== "thought" || (typeof s.detail === "string" && s.detail.trim().length > 0)),
      ),
    [steps],
  );

  const isGroupRunning = useMemo(
    () => isMessageStreaming && visibleSteps.some((s) => s.status === "running"),
    [isMessageStreaming, visibleSteps],
  );

  const [isExpanded, setIsExpanded] = useState<boolean>(Boolean(isMessageStreaming && autoExpand));
  const userToggledRef = useRef(false);
  const [liveElapsedMs, setLiveElapsedMs] = useState<number>(0);
  const startTimeRef = useRef<number | null>(isGroupRunning ? Date.now() : null);

  useEffect(() => {
    if (!userToggledRef.current) {
      setIsExpanded(Boolean(isMessageStreaming && autoExpand));
    }
  }, [isMessageStreaming, autoExpand]);

  useEffect(() => {
    if (isGroupRunning) {
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now();
      }
      const interval = window.setInterval(() => {
        if (startTimeRef.current !== null) {
          setLiveElapsedMs(Date.now() - startTimeRef.current);
        }
      }, 150);
      return () => window.clearInterval(interval);
    }

    startTimeRef.current = null;
  }, [isGroupRunning]);

  const runningStep = useMemo(() => {
    for (let i = visibleSteps.length - 1; i >= 0; i--) {
      if (visibleSteps[i].status === "running") {
        return visibleSteps[i];
      }
    }
    return null;
  }, [visibleSteps]);

  const toolStepsCount = useMemo(
    () => visibleSteps.filter((s) => s.type !== "thought").length,
    [visibleSteps],
  );
  const hasThought = useMemo(
    () => visibleSteps.some((s) => s.type === "thought" && s.detail?.trim()),
    [visibleSteps],
  );

  const groupDurationMs = useMemo(() => {
    const sum = visibleSteps.reduce((acc, s) => acc + (s.durationMs ?? 0), 0);
    if (sum > 0) return sum;
    return fallbackDurationMs;
  }, [visibleSteps, fallbackDurationMs]);

  const headerLabel = useMemo(() => {
    if (isGroupRunning && runningStep) {
      const liveText = formatDuration(liveElapsedMs);
      if (runningStep.type === "thought") {
        return liveText ? `Thinking · ${liveText}` : "Thinking...";
      }
      if (runningStep.type === "search" && runningStep.detail) {
        return `Searching "${runningStep.detail}"`;
      }
      if (runningStep.type === "read" && runningStep.detail) {
        return `Reading ${runningStep.detail}`;
      }
      if (runningStep.type === "calculate" && runningStep.detail) {
        return `Calculating ${runningStep.detail}`;
      }
      return runningStep.title;
    }

    const durationText = formatDuration(groupDurationMs);
    if (hasThought && toolStepsCount > 0) {
      const actionText = `${toolStepsCount} step${toolStepsCount === 1 ? "" : "s"}`;
      return durationText
        ? `Thought for ${durationText} · ${actionText}`
        : `Thought · ${actionText}`;
    }
    if (hasThought) {
      return durationText ? `Thought for ${durationText}` : "Thought";
    }
    const actionText = `${toolStepsCount} step${toolStepsCount === 1 ? "" : "s"}`;
    return durationText ? `${actionText} · ${durationText}` : actionText;
  }, [isGroupRunning, runningStep, liveElapsedMs, groupDurationMs, hasThought, toolStepsCount]);

  if (visibleSteps.length === 0) {
    return null;
  }

  return (
    <div className="my-0.5 w-full select-none">
      <button
        type="button"
        onClick={() => {
          userToggledRef.current = true;
          setIsExpanded((prev) => !prev);
        }}
        aria-expanded={isExpanded}
        className={cn(
          "group inline-flex max-w-full cursor-pointer items-center gap-2 rounded-xs border px-2.5 py-1 text-left text-xs transition-colors duration-150 select-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/25 focus-visible:outline-none dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400/25",
          isGroupRunning
            ? "border-blue-200 bg-blue-50/70 text-gray-900 hover:border-blue-300 hover:bg-blue-100/70 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-gray-100 dark:hover:border-blue-800/70 dark:hover:bg-blue-950/50"
            : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-300 dark:hover:border-gray-700 dark:hover:bg-gray-800/80 dark:hover:text-gray-100",
        )}
      >
        {isGroupRunning ? (
          <Spinner size={12} className="shrink-0 text-blue-600 dark:text-blue-400" />
        ) : (
          <StarsIcon className="size-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
        )}
        <span className="truncate font-semibold">{headerLabel}</span>
        <ChevronIcon
          direction={isExpanded ? "up" : "down"}
          className="size-3.5 shrink-0 text-gray-500 transition-transform duration-150 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200"
        />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={effectiveReducedMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={effectiveReducedMotion ? undefined : { opacity: 0, height: 0 }}
            transition={
              effectiveReducedMotion ? { duration: 0 } : { duration: 0.16, ease: "easeOut" }
            }
            className="overflow-hidden select-none"
          >
            <div className="mt-2 space-y-2.5 rounded-xs border border-gray-200 bg-gray-50/75 p-3.5 dark:border-gray-800 dark:bg-gray-900/45">
              {visibleSteps.map((step) =>
                step.type === "thought" ? (
                  <ThoughtItem key={step.id} step={step} />
                ) : (
                  <ToolItem key={step.id} step={step} />
                ),
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
