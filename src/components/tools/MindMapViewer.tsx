import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { ChevronIcon } from "@/components/icons";
import type { MindMapResponse, Branch } from "@/interfaces";

interface MindMapViewerProps {
  data: MindMapResponse;
  className?: string;
  onNodeSelect?: (question: string) => void;
  isExpanded?: boolean;
  setIsExpanded?: (isExpanded: boolean) => void;
}

interface BranchNodeProps {
  branch: Branch;
  level: number;
  path: string[];
  expandTrigger: number;
  collapseTrigger: number;
  onNodeSelect?: (question: string) => void;
}

const getNodeColors = (level: number, isLeaf: boolean) => {
  const styles = [
    "",
    "bg-blue-100 border-blue-300 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200",
    "bg-purple-100 border-purple-300 text-purple-900 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-200",
    "bg-teal-100 border-teal-300 text-teal-900 dark:bg-teal-950 dark:border-teal-800 dark:text-teal-200",
    "bg-orange-100 border-orange-300 text-orange-900 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-200",
    "bg-green-100 border-green-300 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-200",
    "bg-yellow-100 border-yellow-300 text-yellow-900 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200",
    "bg-red-100 border-red-300 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-200",
  ];
  const colorClass = styles[Math.min(level, styles.length - 1)];
  return cn(colorClass, {
    "shadow-xs font-medium": !isLeaf,
    "opacity-90": isLeaf,
  });
};

const getLineColor = (level: number) => {
  const styles = [
    "bg-gray-300 dark:bg-gray-600",
    "bg-blue-300 dark:bg-blue-700/50",
    "bg-purple-300 dark:bg-purple-700/50",
    "bg-teal-300 dark:bg-teal-700/50",
    "bg-orange-300 dark:bg-orange-700/50",
    "bg-green-300 dark:bg-green-700/50",
    "bg-yellow-300 dark:bg-yellow-700/50",
    "bg-red-300 dark:bg-red-700/50",
  ];
  return styles[Math.min(level, styles.length - 1)];
};

const getChevronColors = (level: number) => {
  const styles = [
    "",
    "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
    "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400",
    "bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-400",
    "bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400",
    "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400",
    "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400",
    "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400",
  ];
  return styles[Math.min(level, styles.length - 1)];
};

const getHoverColors = (level: number) => {
  const styles = [
    "",
    "hover:border-blue-400 dark:hover:border-blue-500",
    "hover:border-purple-400 dark:hover:border-purple-500",
    "hover:border-teal-400 dark:hover:border-teal-500",
    "hover:border-orange-400 dark:hover:border-orange-500",
    "hover:border-green-400 dark:hover:border-green-500",
    "hover:border-yellow-400 dark:hover:border-yellow-500",
    "hover:border-red-400 dark:hover:border-red-500",
  ];
  return styles[Math.min(level, styles.length - 1)];
};

function BranchNode({
  branch,
  level,
  path,
  expandTrigger,
  collapseTrigger,
  onNodeSelect,
}: BranchNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = branch.children && branch.children.length > 0;
  const isLeaf = !hasChildren;

  useEffect(() => {
    if (expandTrigger > 0 && hasChildren) setIsExpanded(true);
  }, [expandTrigger, hasChildren]);

  useEffect(() => {
    if (collapseTrigger > 0) setIsExpanded(false);
  }, [collapseTrigger]);

  const handleNodeClick = () => {
    if (hasChildren) {
      setIsExpanded((prev) => !prev);
    } else if (onNodeSelect) {
      const context = path.join(" > ");
      const question = `Explain in detail the concept of "${branch.label}" considering its context within the topic: ${context}.`;
      onNodeSelect(question);
    }
  };

  return (
    <div className="flex items-center py-1.5">
      {/* Connection line from parent */}
      <div className={cn("h-px w-8 flex-shrink-0", getLineColor(level - 1))} />

      <div className="flex items-center">
        {/* Node */}
        <div
          className={cn(
            "relative flex items-center gap-1.5 px-3 py-1.5 rounded-xs border text-sm whitespace-nowrap select-none transition-colors",
            getNodeColors(level, isLeaf),
            {
              ["cursor-pointer"]: hasChildren || onNodeSelect,
              [getHoverColors(level)]: hasChildren || onNodeSelect,
            },
          )}
          onClick={handleNodeClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleNodeClick();
            }
          }}
          tabIndex={0}
          role="button"
        >
          <span>{branch.label}</span>
          {hasChildren && (
            <span
              className={cn(
                "flex size-4 items-center justify-center rounded-xs",
                getChevronColors(level),
              )}
            >
              <ChevronIcon
                direction={isExpanded ? "left" : "right"}
                className="size-3 transition-transform duration-200"
              />
            </span>
          )}
        </div>

        {/* Connection line to children */}
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 24 }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className={cn("h-px flex-shrink-0", getLineColor(level))}
            />
          )}
        </AnimatePresence>

        {/* Children */}
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex flex-col justify-center overflow-hidden"
            >
              {branch.children.map((child, index) => (
                <div key={index} className="relative flex items-center">
                  {/* Vertical connector */}
                  {branch.children.length > 1 && (
                    <div
                      className={cn(
                        "absolute left-0 w-px",
                        getLineColor(level),
                        index === 0
                          ? "top-1/2 bottom-0"
                          : index === branch.children.length - 1
                            ? "top-0 bottom-1/2"
                            : "top-0 bottom-0",
                      )}
                    />
                  )}
                  <BranchNode
                    branch={child}
                    level={level + 1}
                    path={[...path, branch.label]}
                    expandTrigger={expandTrigger}
                    collapseTrigger={collapseTrigger}
                    onNodeSelect={onNodeSelect}
                  />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MainBranch({
  branch,
  path,
  expandTrigger,
  collapseTrigger,
  onNodeSelect,
}: {
  branch: Branch;
  path: string[];
  expandTrigger: number;
  collapseTrigger: number;
  onNodeSelect?: (question: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = branch.children && branch.children.length > 0;

  useEffect(() => {
    if (expandTrigger > 0 && hasChildren) setIsExpanded(true);
  }, [expandTrigger, hasChildren]);

  useEffect(() => {
    if (collapseTrigger > 0) setIsExpanded(false);
  }, [collapseTrigger]);

  function handleNodeClick() {
    if (hasChildren) {
      setIsExpanded((prev) => !prev);
    } else if (onNodeSelect) {
      const context = path.join(" > ");
      const question = `Explain in detail the concept of "${branch.label}" considering its context within the topic: ${context}.`;
      onNodeSelect(question);
    }
  }

  return (
    <div className="flex items-center py-2">
      <div className="flex items-center">
        {/* Main branch node */}
        <div
          className={cn(
            "relative flex items-center gap-1.5 px-4 py-2 rounded-xs border select-none transition-colors whitespace-nowrap",
            getNodeColors(1, !hasChildren),
            {
              "cursor-pointer": hasChildren || onNodeSelect,
              [getHoverColors(1)]: hasChildren || onNodeSelect,
            },
          )}
          onClick={handleNodeClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleNodeClick();
            }
          }}
          tabIndex={0}
          role="button"
        >
          <span>{branch.label}</span>
          {hasChildren && (
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-xs",
                getChevronColors(1),
              )}
            >
              <ChevronIcon
                direction={isExpanded ? "left" : "right"}
                className="size-3.5 transition-transform duration-200"
              />
            </span>
          )}
        </div>

        {/* Connection line to children */}
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 32 }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className={cn("h-px flex-shrink-0", getLineColor(1))}
            />
          )}
        </AnimatePresence>

        {/* Children */}
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex flex-col justify-center overflow-hidden"
            >
              {branch.children.map((child, index) => (
                <div key={index} className="relative flex items-center">
                  {/* Vertical connector */}
                  {branch.children.length > 1 && (
                    <div
                      className={cn(
                        "absolute left-0 w-px",
                        getLineColor(1),
                        index === 0
                          ? "top-1/2 bottom-0"
                          : index === branch.children.length - 1
                            ? "top-0 bottom-1/2"
                            : "top-0 bottom-0",
                      )}
                    />
                  )}
                  <BranchNode
                    branch={child}
                    level={2}
                    path={[...path, branch.label]}
                    expandTrigger={expandTrigger}
                    collapseTrigger={collapseTrigger}
                    onNodeSelect={onNodeSelect}
                  />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function MindMapViewer({
  data,
  className,
  onNodeSelect,
  isExpanded,
  setIsExpanded,
}: MindMapViewerProps) {
  const { central, branches } = data;
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [expandTrigger, setExpandTrigger] = useState(0);
  const [collapseTrigger, setCollapseTrigger] = useState(0);

  const handleExpandAll = () => setExpandTrigger((prev) => prev + 1);
  const handleCollapseAll = () => setCollapseTrigger((prev) => prev + 1);

  const handleNodeSelect = useCallback(
    (question: string) => {
      if (onNodeSelect) onNodeSelect(question);
      if (isExpanded && setIsExpanded) setIsExpanded(false);
    },
    [onNodeSelect, isExpanded, setIsExpanded],
  );

  useEffect(() => {
    if (containerRef.current && contentRef.current) {
      const container = containerRef.current.getBoundingClientRect();
      const content = contentRef.current.getBoundingClientRect();

      const x = (container.width - content.width) / 2;
      const y = (container.height - content.height) / 2;

      setTransform({ x: Math.max(40, x), y: Math.max(40, y), scale: 1 });
    }
  }, [data]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = e.deltaY > 0 ? 0.9 : 1.1;

      setTransform((prev) => {
        const newScale = Math.min(Math.max(prev.scale * delta, 0.25), 2);
        const scaleChange = newScale / prev.scale;

        const newX = mouseX - (mouseX - prev.x) * scaleChange;
        const newY = mouseY - (mouseY - prev.y) * scaleChange;

        return { x: newX, y: newY, scale: newScale };
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest("[role='button']") || target.closest("button")) return;

      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [transform.x, transform.y],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;

      setTransform((prev) => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    },
    [isDragging, dragStart],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    if ((e.target as HTMLElement).hasPointerCapture(e.pointerId)) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  }, []);

  const resetView = useCallback(() => {
    if (containerRef.current && contentRef.current) {
      const container = containerRef.current.getBoundingClientRect();
      const content = contentRef.current.getBoundingClientRect();

      const x = (container.width - content.width / transform.scale) / 2;
      const y = (container.height - content.height / transform.scale) / 2;

      setTransform({ x: Math.max(40, x), y: Math.max(40, y), scale: 1 });
    }
  }, [transform.scale]);

  if (!central || !branches || branches.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
        No mind map data available
      </div>
    );
  }

  return (
    <div className={cn("relative size-full", className)}>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleExpandAll}
            className="flex h-7 items-center justify-center rounded-xs border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-600 shadow-xs transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="flex h-7 items-center justify-center rounded-xs border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-600 shadow-xs transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Collapse All
          </button>
        </div>
        <div className="h-4 w-px bg-gray-200 dark:bg-gray-600" />
        <div className="flex h-7 items-center rounded-xs border border-gray-200 bg-white shadow-xs dark:border-gray-600 dark:bg-gray-800">
          <button
            type="button"
            onClick={() =>
              setTransform((prev) => ({
                ...prev,
                scale: Math.min(prev.scale * 1.2, 2),
              }))
            }
            className="flex h-full items-center justify-center rounded-l-xs px-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            +
          </button>
          <span className="flex h-full min-w-[48px] items-center justify-center border-x border-gray-200 px-2 text-center text-xs font-medium text-gray-600 dark:border-gray-600 dark:text-gray-300">
            {Math.round(transform.scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() =>
              setTransform((prev) => ({
                ...prev,
                scale: Math.max(prev.scale * 0.8, 0.25),
              }))
            }
            className="flex h-full items-center justify-center rounded-r-xs px-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            -
          </button>
        </div>
        <button
          type="button"
          onClick={resetView}
          className="flex h-7 items-center justify-center rounded-xs border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-600 shadow-xs transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Reset
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className={cn(
          "size-full overflow-hidden bg-gray-50/20 dark:bg-gray-900/20 rounded-xs touch-none",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15] dark:opacity-[0.07]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgb(150, 150, 150) 1px, transparent 1px),
              linear-gradient(to bottom, rgb(150, 150, 150) 1px, transparent 1px)
            `,
            backgroundSize: `${24 * transform.scale}px ${24 * transform.scale}px`,
            backgroundPosition: `${transform.x % (24 * transform.scale)}px ${transform.y % (24 * transform.scale)}px`,
          }}
        />

        {/* Content */}
        <motion.div
          ref={contentRef}
          className="absolute"
          animate={{
            x: transform.x,
            y: transform.y,
            scale: transform.scale,
          }}
          transition={isDragging ? { duration: 0 } : { duration: 0.1 }}
          style={{ transformOrigin: "0 0" }}
        >
          <div className="flex items-center">
            {/* Central topic */}
            <div className="rounded-xs border border-gray-300 bg-white px-5 py-3 font-semibold whitespace-nowrap text-gray-900 shadow-xs select-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
              {central}
            </div>

            {/* Branches */}
            <div className="relative ml-12 flex flex-col justify-center">
              {/* Horizontal line from central to the vertical line */}
              <div className="absolute top-1/2 -left-12 h-px w-12 -translate-y-1/2 bg-gray-300 dark:bg-gray-600" />

              {branches.map((branch, index) => (
                <div key={index} className="relative flex items-center py-2 pl-8">
                  {/* Vertical connector */}
                  {branches.length > 1 && (
                    <div
                      className={cn(
                        "absolute left-0 w-px bg-gray-300 dark:bg-gray-600",
                        index === 0
                          ? "top-1/2 bottom-0"
                          : index === branches.length - 1
                            ? "top-0 bottom-1/2"
                            : "top-0 bottom-0",
                      )}
                    />
                  )}
                  {/* Horizontal line from the vertical line to each branch */}
                  <div className="absolute left-0 h-px w-8 bg-gray-300 dark:bg-gray-600" />
                  <MainBranch
                    branch={branch}
                    path={[central]}
                    expandTrigger={expandTrigger}
                    collapseTrigger={collapseTrigger}
                    onNodeSelect={handleNodeSelect}
                  />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
