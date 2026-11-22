import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useShortcut, useAccessibility } from "@/hooks";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ChevronIcon, CloseIcon } from "@/components/icons";
import { IconButton } from "@/components/ui";
import type { MindMapResponse, Branch } from "@/interfaces";

interface MindMapViewerProps {
  data: MindMapResponse;
  className?: string;
}

interface SelectedNodeInfo {
  id: string;
  label: string;
  description?: string | null;
  level: number;
  path: string[];
  element: HTMLElement;
}

interface BranchNodeProps {
  branch: Branch;
  nodeId: string;
  level: number;
  path: string[];
  expandTrigger: number;
  collapseTrigger: number;
  selectedNodeId: string | null;
  onSelectNode: (node: SelectedNodeInfo) => void;
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

const getLevelDotColor = (level: number) => {
  const styles = [
    "bg-blue-500 dark:bg-blue-400",
    "bg-blue-500 dark:bg-blue-400",
    "bg-purple-500 dark:bg-purple-400",
    "bg-teal-500 dark:bg-teal-400",
    "bg-orange-500 dark:bg-orange-400",
    "bg-green-500 dark:bg-green-400",
    "bg-yellow-500 dark:bg-yellow-400",
    "bg-red-500 dark:bg-red-400",
  ];
  return styles[Math.min(level, styles.length - 1)];
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
    "bg-blue-100 border-blue-300 text-blue-600 dark:bg-blue-900/50 dark:border-blue-800 dark:text-blue-400",
    "bg-purple-100 border-purple-300 text-purple-600 dark:bg-purple-900/50 dark:border-purple-800 dark:text-purple-400",
    "bg-teal-100 border-teal-300 text-teal-600 dark:bg-teal-900/50 dark:border-teal-800 dark:text-teal-400",
    "bg-orange-100 border-orange-300 text-orange-600 dark:bg-orange-900/50 dark:border-orange-800 dark:text-orange-400",
    "bg-green-100 border-green-300 text-green-600 dark:bg-green-900/50 dark:border-green-800 dark:text-green-400",
    "bg-yellow-100 border-yellow-300 text-yellow-600 dark:bg-yellow-900/50 dark:border-yellow-800 dark:text-yellow-400",
    "bg-red-100 border-red-300 text-red-600 dark:bg-red-900/50 dark:border-red-800 dark:text-red-400",
  ];
  return cn("border", styles[Math.min(level, styles.length - 1)]);
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
  nodeId,
  level,
  path,
  expandTrigger,
  collapseTrigger,
  selectedNodeId,
  onSelectNode,
}: BranchNodeProps) {
  const { effectiveReducedMotion } = useAccessibility();
  const [isExpanded, setIsExpanded] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const hasChildren = branch.children && branch.children.length > 0;
  const isLeaf = !hasChildren;
  const isSelected = selectedNodeId === nodeId;

  useEffect(() => {
    if (expandTrigger > 0 && hasChildren) setIsExpanded(true);
  }, [expandTrigger, hasChildren]);

  useEffect(() => {
    if (collapseTrigger > 0) setIsExpanded(false);
  }, [collapseTrigger]);

  const handleNodeClick = () => {
    if (!nodeRef.current) return;
    onSelectNode({
      id: nodeId,
      label: branch.label,
      description: branch.description,
      level,
      path,
      element: nodeRef.current,
    });
  };

  const handleNodeKeyDown = useShortcut("dialog-activate", handleNodeClick);

  const handleChevronKeyDown = useShortcut(
    "dialog-activate",
    () => setIsExpanded((prev) => !prev),
    { stopPropagation: true },
  );

  return (
    <div className="flex items-center py-1.5">
      <div className={cn("h-px w-8 shrink-0", getLineColor(level - 1))} />

      <div className="flex items-center">
        <div className="z-10 flex items-center gap-1.5">
          <div
            ref={nodeRef}
            className={cn(
              "relative flex cursor-pointer items-center rounded-xs border px-3 py-1.5 text-sm whitespace-nowrap transition-colors duration-150 select-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/25 focus-visible:outline-none dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400/25",
              getNodeColors(level, isLeaf),
              getHoverColors(level),
              isSelected &&
                "border-blue-500 ring-2 ring-blue-500/30 dark:border-blue-400 dark:ring-blue-400/35",
            )}
            onClick={handleNodeClick}
            onKeyDown={handleNodeKeyDown}
            tabIndex={0}
            role="button"
            aria-pressed={isSelected}
          >
            <span>{branch.label}</span>
          </div>
          {hasChildren && (
            <div
              className={cn(
                "flex size-5 cursor-pointer items-center justify-center rounded-xs transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:focus-visible:ring-blue-400",
                getChevronColors(level),
                getHoverColors(level),
              )}
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded((prev) => !prev);
              }}
              onKeyDown={handleChevronKeyDown}
              tabIndex={0}
              role="button"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? `Collapse ${branch.label}` : `Expand ${branch.label}`}
            >
              <ChevronIcon
                aria-hidden="true"
                direction={isExpanded ? "left" : "right"}
                className="size-3.5 transition-transform duration-150"
              />
            </div>
          )}
        </div>

        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={effectiveReducedMotion ? false : { opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 24 }}
              exit={effectiveReducedMotion ? undefined : { opacity: 0, width: 0 }}
              transition={
                effectiveReducedMotion ? { duration: 0 } : { duration: 0.2, ease: "easeInOut" }
              }
              className={cn("h-px shrink-0", getLineColor(level))}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={effectiveReducedMotion ? false : { opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={effectiveReducedMotion ? undefined : { opacity: 0, width: 0 }}
              transition={
                effectiveReducedMotion ? { duration: 0 } : { duration: 0.2, ease: "easeInOut" }
              }
              className="flex flex-col justify-center overflow-hidden"
            >
              {branch.children.map((child, index) => (
                <div key={index} className="relative flex items-center">
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
                    nodeId={`${nodeId}.${index}`}
                    level={level + 1}
                    path={[...path, branch.label]}
                    expandTrigger={expandTrigger}
                    collapseTrigger={collapseTrigger}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={onSelectNode}
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
  nodeId,
  path,
  expandTrigger,
  collapseTrigger,
  selectedNodeId,
  onSelectNode,
}: {
  branch: Branch;
  nodeId: string;
  path: string[];
  expandTrigger: number;
  collapseTrigger: number;
  selectedNodeId: string | null;
  onSelectNode: (node: SelectedNodeInfo) => void;
}) {
  const { effectiveReducedMotion } = useAccessibility();
  const [isExpanded, setIsExpanded] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const hasChildren = branch.children && branch.children.length > 0;
  const isSelected = selectedNodeId === nodeId;

  useEffect(() => {
    if (expandTrigger > 0 && hasChildren) setIsExpanded(true);
  }, [expandTrigger, hasChildren]);

  useEffect(() => {
    if (collapseTrigger > 0) setIsExpanded(false);
  }, [collapseTrigger]);

  function handleNodeClick() {
    if (!nodeRef.current) return;
    onSelectNode({
      id: nodeId,
      label: branch.label,
      description: branch.description,
      level: 1,
      path,
      element: nodeRef.current,
    });
  }

  const handleNodeKeyDown = useShortcut("dialog-activate", handleNodeClick);

  const handleChevronKeyDown = useShortcut(
    "dialog-activate",
    () => setIsExpanded((prev) => !prev),
    { stopPropagation: true },
  );

  return (
    <div className="flex items-center py-2">
      <div className="flex items-center">
        <div className="z-10 flex items-center gap-1.5">
          <div
            ref={nodeRef}
            className={cn(
              "relative flex cursor-pointer items-center rounded-xs border px-4 py-2 whitespace-nowrap transition-colors duration-150 select-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/25 focus-visible:outline-none dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400/25",
              getNodeColors(1, !hasChildren),
              getHoverColors(1),
              isSelected &&
                "border-blue-500 ring-2 ring-blue-500/30 dark:border-blue-400 dark:ring-blue-400/35",
            )}
            onClick={handleNodeClick}
            onKeyDown={handleNodeKeyDown}
            tabIndex={0}
            role="button"
            aria-pressed={isSelected}
          >
            <span>{branch.label}</span>
          </div>
          {hasChildren && (
            <div
              className={cn(
                "flex size-6 cursor-pointer items-center justify-center rounded-xs transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:focus-visible:ring-blue-400",
                getChevronColors(1),
                getHoverColors(1),
              )}
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded((prev) => !prev);
              }}
              onKeyDown={handleChevronKeyDown}
              tabIndex={0}
              role="button"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? `Collapse ${branch.label}` : `Expand ${branch.label}`}
            >
              <ChevronIcon
                aria-hidden="true"
                direction={isExpanded ? "left" : "right"}
                className="size-4 transition-transform duration-150"
              />
            </div>
          )}
        </div>

        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={effectiveReducedMotion ? false : { opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 32 }}
              exit={effectiveReducedMotion ? undefined : { opacity: 0, width: 0 }}
              transition={
                effectiveReducedMotion ? { duration: 0 } : { duration: 0.2, ease: "easeInOut" }
              }
              className={cn("h-px shrink-0", getLineColor(1))}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={effectiveReducedMotion ? false : { opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={effectiveReducedMotion ? undefined : { opacity: 0, width: 0 }}
              transition={
                effectiveReducedMotion ? { duration: 0 } : { duration: 0.2, ease: "easeInOut" }
              }
              className="flex flex-col justify-center overflow-hidden"
            >
              {branch.children.map((child, index) => (
                <div key={index} className="relative flex items-center">
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
                    nodeId={`${nodeId}.${index}`}
                    level={2}
                    path={[...path, branch.label]}
                    expandTrigger={expandTrigger}
                    collapseTrigger={collapseTrigger}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={onSelectNode}
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

interface PopoverGeometry {
  left: number;
  top: number;
  width: number;
  arrowLeft: number;
  placement: "top" | "bottom";
}

export function MindMapViewer({ data, className }: MindMapViewerProps) {
  const { effectiveReducedMotion } = useAccessibility();
  const { central, description: centralDescription, branches } = data;
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const centralNodeRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);

  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<SelectedNodeInfo | null>(null);
  const [popoverGeo, setPopoverGeo] = useState<PopoverGeometry | null>(null);

  const [expandTrigger, setExpandTrigger] = useState(0);
  const [collapseTrigger, setCollapseTrigger] = useState(0);

  const handleExpandAll = () => setExpandTrigger((prev) => prev + 1);
  const handleCollapseAll = () => {
    setCollapseTrigger((prev) => prev + 1);
    if (selectedNode && selectedNode.level > 1) {
      setSelectedNode(null);
    }
  };

  const handleSelectNode = useCallback((node: SelectedNodeInfo) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node));
  }, []);

  const handleSelectCentral = useCallback(() => {
    if (!centralNodeRef.current) return;
    handleSelectNode({
      id: "central",
      label: central,
      description: centralDescription,
      level: 0,
      path: [],
      element: centralNodeRef.current,
    });
  }, [central, centralDescription, handleSelectNode]);

  const handleCentralKeyDown = useShortcut("dialog-activate", handleSelectCentral);

  useShortcut("dialog-close", () => setSelectedNode(null), {
    enabled: Boolean(selectedNode),
    preventDefault: false,
  });

  const updatePopoverPosition = useCallback(() => {
    if (!selectedNode || !containerRef.current) {
      setPopoverGeo(null);
      return;
    }

    if (!selectedNode.element.isConnected) {
      setSelectedNode(null);
      setPopoverGeo(null);
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const nodeRect = selectedNode.element.getBoundingClientRect();
    const measuredHeight = popoverRef.current?.offsetHeight ?? 124;

    const margin = 12;
    const gap = 10;
    const width = Math.min(312, Math.max(200, containerRect.width - margin * 2));

    const nodeCenterX = nodeRect.left - containerRect.left + nodeRect.width / 2;
    const nodeTop = nodeRect.top - containerRect.top;
    const nodeBottom = nodeRect.bottom - containerRect.top;

    const left = Math.max(
      margin,
      Math.min(nodeCenterX - width / 2, containerRect.width - width - margin),
    );
    const arrowLeft = Math.max(16, Math.min(nodeCenterX - left, width - 16));

    const spaceBelow = containerRect.height - nodeBottom - margin;
    const spaceAbove = nodeTop - margin;
    const placeBelow = spaceBelow >= measuredHeight + gap || spaceBelow >= spaceAbove;

    const top = placeBelow
      ? Math.max(margin, Math.min(nodeBottom + gap, containerRect.height - measuredHeight - margin))
      : Math.max(margin, nodeTop - measuredHeight - gap);

    setPopoverGeo({
      left,
      top,
      width,
      arrowLeft,
      placement: placeBelow ? "bottom" : "top",
    });
  }, [selectedNode]);

  useLayoutEffect(() => {
    updatePopoverPosition();
  }, [updatePopoverPosition, transform]);

  useEffect(() => {
    if (!selectedNode || !containerRef.current) return;
    const observer = new ResizeObserver(() => updatePopoverPosition());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [selectedNode, updatePopoverPosition]);

  useEffect(() => {
    setSelectedNode(null);
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

      pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
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
    const downPos = pointerDownPosRef.current;
    pointerDownPosRef.current = null;
    setIsDragging(false);

    if ((e.target as HTMLElement).hasPointerCapture(e.pointerId)) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }

    if (downPos && Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) < 4) {
      setSelectedNode(null);
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
        There&apos;s no mind map to show here yet.
      </div>
    );
  }

  const isCentralSelected = selectedNode?.id === "central";

  return (
    <div className={cn("relative size-full overflow-hidden", className)}>
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 select-none">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleExpandAll}
            className="flex h-7 cursor-pointer items-center justify-center rounded-xs border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 shadow-xs transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/25 focus-visible:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-600 dark:hover:bg-gray-800 dark:hover:text-white dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400/25"
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="flex h-7 cursor-pointer items-center justify-center rounded-xs border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 shadow-xs transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/25 focus-visible:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-600 dark:hover:bg-gray-800 dark:hover:text-white dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400/25"
          >
            Collapse all
          </button>
        </div>
        <div className="h-4 w-px bg-gray-200 dark:bg-gray-800" />
        <div className="flex h-7 items-center rounded-xs border border-gray-200 bg-white shadow-xs dark:border-gray-700 dark:bg-gray-900">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() =>
              setTransform((prev) => ({
                ...prev,
                scale: Math.min(prev.scale * 1.2, 2),
              }))
            }
            className="flex h-full cursor-pointer items-center justify-center rounded-l-xs px-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none focus-visible:ring-inset dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white dark:focus-visible:ring-blue-400"
          >
            +
          </button>
          <span className="flex h-full min-w-12 items-center justify-center border-x border-gray-200 px-2 text-center text-xs font-medium text-gray-600 tabular-nums dark:border-gray-700 dark:text-gray-300">
            {Math.round(transform.scale * 100)}%
          </span>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() =>
              setTransform((prev) => ({
                ...prev,
                scale: Math.max(prev.scale * 0.8, 0.25),
              }))
            }
            className="flex h-full cursor-pointer items-center justify-center rounded-r-xs px-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none focus-visible:ring-inset dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white dark:focus-visible:ring-blue-400"
          >
            -
          </button>
        </div>
        <button
          type="button"
          onClick={resetView}
          className="flex h-7 cursor-pointer items-center justify-center rounded-xs border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 shadow-xs transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/25 focus-visible:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-600 dark:hover:bg-gray-800 dark:hover:text-white dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400/25"
        >
          Reset
        </button>
      </div>

      <div
        ref={containerRef}
        className={cn(
          "size-full overflow-hidden bg-gray-50/20 dark:bg-gray-900/20 rounded-xs touch-none",
          { "cursor-grabbing": isDragging, "cursor-grab": !isDragging },
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-10 dark:opacity-3"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgb(150, 150, 150) 1px, transparent 1px),
              linear-gradient(to bottom, rgb(150, 150, 150) 1px, transparent 1px)
            `,
            backgroundSize: `${24 * transform.scale}px ${24 * transform.scale}px`,
            backgroundPosition: `${transform.x % (24 * transform.scale)}px ${transform.y % (24 * transform.scale)}px`,
          }}
        />

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
          onUpdate={selectedNode ? updatePopoverPosition : undefined}
        >
          <div className="flex items-center">
            <div
              ref={centralNodeRef}
              className={cn(
                "cursor-pointer rounded-xs border border-gray-300 bg-white px-5 py-3 font-semibold whitespace-nowrap text-gray-900 shadow-xs transition-colors duration-150 select-none hover:border-blue-400 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/25 focus-visible:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:border-blue-500 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400/25",
                isCentralSelected &&
                  "border-blue-500 ring-2 ring-blue-500/30 dark:border-blue-400 dark:ring-blue-400/35",
              )}
              onClick={handleSelectCentral}
              onKeyDown={handleCentralKeyDown}
              tabIndex={0}
              role="button"
              aria-pressed={isCentralSelected}
            >
              {central}
            </div>

            <div className="relative ml-12 flex flex-col justify-center">
              <div className="absolute top-1/2 -left-12 h-px w-12 -translate-y-1/2 bg-gray-300 dark:bg-gray-600" />

              {branches.map((branch, index) => (
                <div key={index} className="relative flex items-center py-2 pl-8">
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
                  <div className="absolute left-0 h-px w-8 bg-gray-300 dark:bg-gray-600" />
                  <MainBranch
                    branch={branch}
                    nodeId={`branch-${index}`}
                    path={[central]}
                    expandTrigger={expandTrigger}
                    collapseTrigger={collapseTrigger}
                    selectedNodeId={selectedNode?.id ?? null}
                    onSelectNode={handleSelectNode}
                  />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedNode && popoverGeo && (
          <motion.div
            ref={popoverRef}
            key={selectedNode.id}
            role="dialog"
            aria-label={selectedNode.label}
            initial={
              effectiveReducedMotion
                ? false
                : { opacity: 0, y: popoverGeo.placement === "bottom" ? -4 : 4 }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={
              effectiveReducedMotion
                ? undefined
                : { opacity: 0, y: popoverGeo.placement === "bottom" ? -4 : 4 }
            }
            transition={
              effectiveReducedMotion ? { duration: 0 } : { duration: 0.14, ease: EASE_OUT }
            }
            style={{
              left: popoverGeo.left,
              top: popoverGeo.top,
              width: popoverGeo.width,
            }}
            className="absolute z-20 rounded-xs border border-gray-200 bg-white shadow-lg ring-1 shadow-gray-950/10 ring-black/5 dark:border-gray-700 dark:bg-gray-900 dark:shadow-black/40 dark:ring-white/5"
          >
            <span
              aria-hidden="true"
              style={{ left: popoverGeo.arrowLeft }}
              className={cn(
                "pointer-events-none absolute size-2.5 -translate-x-1/2 rotate-45 border-gray-200 dark:border-gray-700",
                popoverGeo.placement === "bottom"
                  ? "-top-1.5 border-t border-l bg-white dark:bg-gray-900"
                  : "-bottom-1.5 border-r border-b bg-gray-50 dark:bg-gray-800",
              )}
            />

            <div className="relative flex items-start justify-between gap-2.5 px-3.5 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-xs",
                      getLevelDotColor(selectedNode.level),
                    )}
                  />
                  <span className="truncate text-[11px] font-medium text-gray-500 select-none dark:text-gray-400">
                    {selectedNode.path.length > 0 ? selectedNode.path.join(" / ") : "Central topic"}
                  </span>
                </div>
                <h4 className="mt-0.5 text-sm leading-snug font-semibold text-gray-900 select-text dark:text-gray-100">
                  {selectedNode.label}
                </h4>
              </div>
              <IconButton
                icon={<CloseIcon className="size-3.5" />}
                variant="ghost"
                size="xs"
                ariaLabel="Close explanation"
                onClick={() => setSelectedNode(null)}
                className="-mt-0.5 -mr-1 shrink-0"
              />
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-3.5 py-2.5 dark:border-gray-800 dark:bg-gray-800/70">
              <p className="text-xs leading-relaxed text-gray-700 select-text dark:text-gray-200">
                {selectedNode.description?.trim() || "No explanation available for this node."}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
