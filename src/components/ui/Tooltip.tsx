import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useLayoutEffect, useEffect, isValidElement } from "react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

interface TooltipProps {
  children: React.ReactNode;
  text: string;
  position?: "top" | "bottom" | "left" | "right";
  disabled?: boolean;
  className?: string;
  showArrow?: boolean;
  delay?: number;
}

export function Tooltip({
  children,
  text,
  position = "top",
  disabled = false,
  className = "",
  showArrow = true,
  delay = 300,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [arrowOffset, setArrowOffset] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
    }

    showTimeoutRef.current = setTimeout(() => {
      const isChildDisabled =
        isValidElement<{ disabled?: boolean }>(children) && children.props.disabled;
      if (!isChildDisabled && !disabled) {
        setIsVisible(true);
      }
      showTimeoutRef.current = null;
    }, delay);
  };

  const hideTooltip = () => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      hideTimeoutRef.current = null;
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    if (isVisible && triggerRef.current) {
      const updatePosition = () => {
        if (!triggerRef.current) return;

        const rect = triggerRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const tooltipWidth = tooltipRef.current?.offsetWidth || Math.min(text.length * 8 + 24, 250);
        const tooltipHeight = tooltipRef.current?.offsetHeight || 40;

        const triggerCenter = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };

        const offsetValue = showArrow ? 12 : 8;
        let x = triggerCenter.x;
        let y = triggerCenter.y;

        switch (position) {
          case "top":
            y = rect.top - offsetValue;
            break;
          case "bottom":
            y = rect.bottom + offsetValue;
            break;
          case "left":
            x = rect.left - offsetValue;
            break;
          case "right":
            x = rect.right + offsetValue;
            break;
        }

        let finalX = x;
        let finalY = y;

        if (position === "top" || position === "bottom") {
          const halfWidth = tooltipWidth / 2;
          if (x - halfWidth < 8) {
            finalX = halfWidth + 8;
          } else if (x + halfWidth > viewportWidth - 8) {
            finalX = viewportWidth - halfWidth - 8;
          }

          const maxOffset = halfWidth - 12;
          const rawOffset = triggerCenter.x - finalX;
          const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, rawOffset));
          setArrowOffset({ x: clampedOffset, y: 0 });
        } else {
          const halfHeight = tooltipHeight / 2;
          if (y - halfHeight < 8) {
            finalY = halfHeight + 8;
          } else if (y + halfHeight > viewportHeight - 8) {
            finalY = viewportHeight - halfHeight - 8;
          }

          const maxOffset = halfHeight - 12;
          const rawOffset = triggerCenter.y - finalY;
          const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, rawOffset));
          setArrowOffset({ x: 0, y: clampedOffset });
        }

        setCoords({ x: finalX, y: finalY });
      };

      updatePosition();
      const rafId = requestAnimationFrame(updatePosition);

      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isVisible, position, text, showArrow]);

  if (disabled) {
    return <>{children}</>;
  }

  const getAnimationProps = () => {
    const distance = 4;
    switch (position) {
      case "top":
        return {
          initial: { opacity: 0, x: "-50%", y: `calc(-100% + ${distance}px)`, scale: 0.95 },
          animate: { opacity: 1, x: "-50%", y: "-100%", scale: 1 },
          exit: { opacity: 0, x: "-50%", y: `calc(-100% + ${distance}px)`, scale: 0.95 },
        };
      case "bottom":
        return {
          initial: { opacity: 0, x: "-50%", y: `calc(0% - ${distance}px)`, scale: 0.95 },
          animate: { opacity: 1, x: "-50%", y: "0%", scale: 1 },
          exit: { opacity: 0, x: "-50%", y: `calc(0% - ${distance}px)`, scale: 0.95 },
        };
      case "left":
        return {
          initial: { opacity: 0, x: `calc(-100% + ${distance}px)`, y: "-50%", scale: 0.95 },
          animate: { opacity: 1, x: "-100%", y: "-50%", scale: 1 },
          exit: { opacity: 0, x: `calc(-100% + ${distance}px)`, y: "-50%", scale: 0.95 },
        };
      case "right":
        return {
          initial: { opacity: 0, x: `calc(0% - ${distance}px)`, y: "-50%", scale: 0.95 },
          animate: { opacity: 1, x: "0%", y: "-50%", scale: 1 },
          exit: { opacity: 0, x: `calc(0% - ${distance}px)`, y: "-50%", scale: 0.95 },
        };
      default:
        return {};
    }
  };

  const animationProps = getAnimationProps();

  return (
    <>
      <div
        ref={triggerRef}
        className={cn("relative inline-block", className)}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
      >
        {children}
      </div>

      {createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              ref={tooltipRef}
              key="tooltip"
              initial={animationProps.initial}
              animate={animationProps.animate}
              exit={animationProps.exit}
              transition={{ duration: 0.15, ease: "easeOut" }}
              onMouseEnter={showTooltip}
              onMouseLeave={hideTooltip}
              style={{
                position: "fixed",
                left: coords.x,
                top: coords.y,
                zIndex: 99999,
                filter:
                  "drop-shadow(0 10px 15px rgba(0, 0, 0, 0.1)) drop-shadow(0 4px 6px rgba(0, 0, 0, 0.05))",
              }}
              className={cn(
                "pointer-events-auto rounded-xs px-3 py-1.5 text-center text-sm font-medium whitespace-nowrap select-text",
                "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100",
                "backdrop-blur-md",
                "border border-gray-200 dark:border-gray-800",
                "ring-1 ring-black/5 dark:ring-white/5",
              )}
            >
              {text}
              {showArrow && (
                <div
                  style={{
                    left:
                      position === "top" || position === "bottom"
                        ? `calc(50% + ${arrowOffset.x}px)`
                        : undefined,
                    top:
                      position === "left" || position === "right"
                        ? `calc(50% + ${arrowOffset.y}px)`
                        : undefined,
                  }}
                  className={cn(
                    "absolute size-2.5 bg-inherit border-inherit",
                    "border-b border-r mb-[-1px]",
                    {
                      "-bottom-[5.5px] -translate-x-1/2 rotate-45 border-t-0 border-l-0":
                        position === "top",
                      "-top-[5.5px] -translate-x-1/2 rotate-[225deg] border-t-0 border-l-0":
                        position === "bottom",
                      "-right-[5.5px] -translate-y-1/2 rotate-[-45deg] border-t-0 border-l-0":
                        position === "left",
                      "-left-[5.5px] -translate-y-1/2 rotate-[135deg] border-t-0 border-l-0":
                        position === "right",
                    },
                    (position === "top" || position === "bottom") && !arrowOffset.x && "left-1/2",
                    (position === "left" || position === "right") && !arrowOffset.y && "top-1/2",
                  )}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
