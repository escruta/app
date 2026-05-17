import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface CanvasProps {
  children: React.ReactNode;
  className?: string;
  initialScale?: number;
  initialX?: number;
  initialY?: number;
}

export interface CanvasHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
}

export const Canvas = forwardRef<CanvasHandle, CanvasProps>(
  ({ children, className, initialScale = 1, initialX = 0, initialY = 0 }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const [transform, setTransform] = useState({ x: initialX, y: initialY, scale: initialScale });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    useImperativeHandle(ref, () => ({
      zoomIn: () => setTransform((prev) => ({ ...prev, scale: Math.min(prev.scale * 1.2, 3) })),
      zoomOut: () => setTransform((prev) => ({ ...prev, scale: Math.max(prev.scale / 1.2, 0.1) })),
      reset: () => {
        setTransform({ x: initialX, y: initialY, scale: initialScale });
      },
    }));

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.ctrlKey || e.metaKey) {
          const rect = container.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          const delta = e.deltaY > 0 ? 0.9 : 1.1;

          setTransform((prev) => {
            const newScale = Math.min(Math.max(prev.scale * delta, 0.1), 3);
            const scaleChange = newScale / prev.scale;

            const newX = mouseX - (mouseX - prev.x) * scaleChange;
            const newY = mouseY - (mouseY - prev.y) * scaleChange;

            return { x: newX, y: newY, scale: newScale };
          });
        } else {
          setTransform((prev) => ({
            ...prev,
            x: prev.x - e.deltaX,
            y: prev.y - e.deltaY,
          }));
        }
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
        if (
          target.closest("[role='button']") ||
          target.closest("button") ||
          target.closest("input") ||
          target.closest("textarea") ||
          target.closest(".no-drag")
        ) {
          return;
        }

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

    return (
      <div
        ref={containerRef}
        className={cn(
          "relative h-full w-full overflow-hidden touch-none",
          isDragging ? "cursor-grabbing" : "cursor-grab",
          className,
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Infinite Grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10 dark:opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgb(150, 150, 150) 1px, transparent 1px),
              linear-gradient(to bottom, rgb(150, 150, 150) 1px, transparent 1px)
            `,
            backgroundSize: `${20 * transform.scale}px ${20 * transform.scale}px`,
            backgroundPosition: `${transform.x % (20 * transform.scale)}px ${transform.y % (20 * transform.scale)}px`,
          }}
        />

        <motion.div
          ref={contentRef}
          className="absolute inset-0 z-10"
          animate={{
            x: transform.x,
            y: transform.y,
            scale: transform.scale,
          }}
          transition={isDragging ? { duration: 0 } : { duration: 0.1 }}
          style={{ transformOrigin: "0 0" }}
        >
          {children}
        </motion.div>
      </div>
    );
  },
);

Canvas.displayName = "Canvas";
