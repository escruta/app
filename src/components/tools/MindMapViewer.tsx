import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "@/components/icons";
import type { MindMapResponse, Branch } from "@/interfaces";

interface MindMapViewerProps {
  data: MindMapResponse;
  className?: string;
}

interface BranchNodeProps {
  branch: Branch;
  level: number;
}

function BranchNode({ branch, level }: BranchNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = branch.children && branch.children.length > 0;
  const isLeaf = !hasChildren;

  return (
    <div className="flex items-center py-1">
      {/* Connection line from parent */}
      <div className="w-8 h-px bg-green-300 dark:bg-green-600 flex-shrink-0" />

      <div className="flex items-center">
        {/* Node */}
        <div
          className={cn(
            "relative flex items-center gap-1.5 px-3 py-1.5 rounded-xs border text-sm whitespace-nowrap select-none",
            isLeaf
              ? "bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-600 text-gray-700 dark:text-gray-200"
              : "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-gray-700 dark:text-gray-200",
            hasChildren && "cursor-pointer",
          )}
          onClick={() => hasChildren && setIsExpanded((prev) => !prev)}
          onKeyDown={(e) => {
            if (hasChildren && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              setIsExpanded((prev) => !prev);
            }
          }}
          tabIndex={hasChildren ? 0 : -1}
          role={hasChildren ? "button" : undefined}
        >
          <span>{branch.label}</span>
          {hasChildren && (
            <motion.span
              animate={{ rotate: isExpanded ? 0 : -90 }}
              transition={{ duration: 0.2 }}
              className="w-4 h-4 flex items-center justify-center rounded-full bg-green-200 dark:bg-green-700 text-green-700 dark:text-green-200"
            >
              <ChevronDownIcon className="w-3 h-3" />
            </motion.span>
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
              className="h-px bg-green-300 dark:bg-green-600 flex-shrink-0"
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
                  <BranchNode branch={child} level={level + 1} />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MainBranch({ branch }: { branch: Branch }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = branch.children && branch.children.length > 0;

  return (
    <div className="flex items-center py-2">
      <div className="flex items-center">
        {/* Main branch node */}
        <div
          className={cn(
            "relative flex items-center gap-1.5 px-4 py-2 rounded-xs border select-none",
            "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600",
            "text-gray-800 dark:text-gray-100 font-medium whitespace-nowrap",
            hasChildren && "cursor-pointer",
          )}
          onClick={() => hasChildren && setIsExpanded((prev) => !prev)}
          onKeyDown={(e) => {
            if (hasChildren && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              setIsExpanded((prev) => !prev);
            }
          }}
          tabIndex={hasChildren ? 0 : -1}
          role={hasChildren ? "button" : undefined}
        >
          <span>{branch.label}</span>
          {hasChildren && (
            <motion.span
              animate={{ rotate: isExpanded ? 0 : -90 }}
              transition={{ duration: 0.2 }}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-green-200 dark:bg-green-700 text-green-700 dark:text-green-200"
            >
              <ChevronDownIcon className="w-3.5 h-3.5" />
            </motion.span>
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
              className="h-px bg-green-300 dark:bg-green-600 flex-shrink-0"
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
                  <BranchNode branch={child} level={1} />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function MindMapViewer({ data, className }: MindMapViewerProps) {
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
    <div className={cn("relative w-full h-full min-h-[500px]", className)}>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xs">
          <button
            type="button"
            onClick={() =>
              setTransform((prev) => ({
                ...prev,
                scale: Math.min(prev.scale * 1.2, 2),
              }))
            }
            className="px-2.5 py-1 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-l-xs"
          >
            +
          </button>
          <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 min-w-[48px] text-center border-x border-gray-200 dark:border-gray-600">
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
            className="px-2.5 py-1 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-r-xs"
          >
            -
          </button>
        </div>
        <button
          type="button"
          onClick={resetView}
          className="px-2.5 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className={cn(
          "w-full h-full overflow-hidden bg-gray-50 dark:bg-gray-900 rounded-xs touch-none",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-20 dark:opacity-10 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgb(156 163 175) 1px, transparent 1px),
              linear-gradient(to bottom, rgb(156 163 175) 1px, transparent 1px)
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
            <div className="px-5 py-3 rounded-xs bg-blue-100 dark:bg-blue-800/50 border border-blue-300 dark:border-blue-600 text-gray-800 dark:text-gray-100 font-semibold whitespace-nowrap select-none">
              {central}
            </div>

            {/* Branches */}
            <div className="flex flex-col justify-center ml-12 relative">
              {/* Horizontal line from central to the vertical line */}
              <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-12 h-px bg-green-300 dark:bg-green-600" />

              {branches.map((branch, index) => (
                <div
                  key={index}
                  className="relative flex items-center pl-8 py-2"
                >
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
                  <div className="absolute left-0 w-8 h-px bg-green-300 dark:bg-green-600" />
                  <MainBranch branch={branch} />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
