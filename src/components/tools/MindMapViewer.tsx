import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { ChevronIcon } from "@/components/icons";
import type { MindMapResponse, Branch } from "@/interfaces";

interface MindMapViewerProps {
  data: MindMapResponse;
  className?: string;
  onNodeSelect?: (question: string) => void;
}

interface BranchNodeProps {
  branch: Branch;
  level: number;
  path: string[];
  onNodeSelect?: (question: string) => void;
}

function BranchNode({ branch, level, path, onNodeSelect }: BranchNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = branch.children && branch.children.length > 0;
  const isLeaf = !hasChildren;

  const handleNodeClick = () => {
    if (hasChildren) {
      setIsExpanded((prev) => !prev);
    } else if (onNodeSelect) {
      const context = path.join(" > ");
      const question = `Tell me more about "${branch.label}" in the context of "${context}"`;
      onNodeSelect(question);
    }
  };

  return (
    <div className="flex items-center py-1">
      {/* Connection line from parent */}
      <div className="h-px w-8 flex-shrink-0 bg-green-300 dark:bg-green-600" />

      <div className="flex items-center">
        {/* Node */}
        <div
          className={cn(
            "relative flex items-center gap-1.5 px-3 py-1.5 rounded-xs border text-sm whitespace-nowrap select-none",
            isLeaf
              ? "bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-600 text-gray-700 dark:text-gray-200"
              : "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-gray-700 dark:text-gray-200",
            (hasChildren || onNodeSelect) && "cursor-pointer",
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
            <span className="flex size-4 items-center justify-center rounded-full bg-green-200 text-green-700 dark:bg-green-700 dark:text-green-200">
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
              className="h-px flex-shrink-0 bg-green-300 dark:bg-green-600"
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
                        "absolute left-0 w-px bg-green-300 dark:bg-green-600",
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
  onNodeSelect,
}: {
  branch: Branch;
  path: string[];
  onNodeSelect?: (question: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = branch.children && branch.children.length > 0;

  function handleNodeClick() {
    if (hasChildren) {
      setIsExpanded((prev) => !prev);
    } else if (onNodeSelect) {
      const context = path.join(" > ");
      const question = `Tell me more about "${branch.label}" in the context of "${context}"`;
      onNodeSelect(question);
    }
  }

  return (
    <div className="flex items-center py-2">
      <div className="flex items-center">
        {/* Main branch node */}
        <div
          className={cn(
            "relative flex items-center gap-1.5 px-4 py-2 rounded-xs border select-none",
            "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600",
            "text-gray-800 dark:text-gray-100 font-medium whitespace-nowrap",
            (hasChildren || onNodeSelect) && "cursor-pointer",
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
            <span className="flex size-5 items-center justify-center rounded-full bg-green-200 text-green-700 dark:bg-green-700 dark:text-green-200">
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
              className="h-px flex-shrink-0 bg-green-300 dark:bg-green-600"
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
                        "absolute left-0 w-px bg-green-300 dark:bg-green-600",
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
                    level={1}
                    path={[...path, branch.label]}
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

export function MindMapViewer({ data, className, onNodeSelect }: MindMapViewerProps) {
  const { central, branches } = data;
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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
    <div className={cn("relative w-full h-full", className)}>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <div className="flex items-center rounded-xs border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800">
          <button
            type="button"
            onClick={() =>
              setTransform((prev) => ({
                ...prev,
                scale: Math.min(prev.scale * 1.2, 2),
              }))
            }
            className="rounded-l-xs px-2.5 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            +
          </button>
          <span className="min-w-[48px] border-x border-gray-200 px-2 py-1 text-center text-xs text-gray-500 dark:border-gray-600 dark:text-gray-400">
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
            className="rounded-r-xs px-2.5 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            -
          </button>
        </div>
        <button
          type="button"
          onClick={resetView}
          className="rounded-xs border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Reset
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className={cn(
          "w-full h-full overflow-hidden bg-gray-50/60 dark:bg-gray-900/60 rounded-xs touch-none",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20 dark:opacity-10"
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
            <div className="rounded-xs border border-blue-300 bg-blue-100/80 px-5 py-3 font-semibold whitespace-nowrap text-gray-800 select-none dark:border-blue-600 dark:bg-blue-800/50 dark:text-gray-100">
              {central}
            </div>

            {/* Branches */}
            <div className="relative ml-12 flex flex-col justify-center">
              {/* Horizontal line from central to the vertical line */}
              <div className="absolute top-1/2 -left-12 h-px w-12 -translate-y-1/2 bg-green-300 dark:bg-green-600" />

              {branches.map((branch, index) => (
                <div key={index} className="relative flex items-center py-2 pl-8">
                  {/* Vertical connector */}
                  {branches.length > 1 && (
                    <div
                      className={cn(
                        "absolute left-0 w-px bg-green-300 dark:bg-green-600",
                        index === 0
                          ? "top-1/2 bottom-0"
                          : index === branches.length - 1
                            ? "top-0 bottom-1/2"
                            : "top-0 bottom-0",
                      )}
                    />
                  )}
                  {/* Horizontal line from the vertical line to each branch */}
                  <div className="absolute left-0 h-px w-8 bg-green-300 dark:bg-green-600" />
                  <MainBranch branch={branch} path={[central]} onNodeSelect={onNodeSelect} />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
