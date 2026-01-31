import { cn } from "@/lib/utils";
import { motion, type Transition } from "motion/react";
import { useEffect, useId } from "react";

interface BaseProps {
  children: React.ReactNode;
  className?: string;
}

interface ControlledProps extends BaseProps {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

interface UncontrolledProps extends BaseProps {
  isExpanded?: undefined;
  setIsExpanded?: undefined;
}

const smoothTransition: Transition = {
  type: "tween",
  duration: 0.35,
  ease: [0.25, 0.1, 0.25, 1],
};

export function Card({
  children,
  className,
  isExpanded,
  setIsExpanded,
}: ControlledProps | UncontrolledProps) {
  const layoutId = useId();

  useEffect(() => {
    if (!isExpanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsExpanded?.(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isExpanded, setIsExpanded]);

  return (
    <>
      {/* Backdrop */}
      {isExpanded && (
        <motion.div
          className="fixed inset-0 z-40 bg-black/30 dark:bg-black/60 backdrop-blur-[1px] opacity-60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setIsExpanded?.(false)}
        />
      )}

      {/* Card */}
      <motion.div
        layoutId={layoutId}
        className={cn(
          "bg-gray-50 dark:bg-gray-800/80 p-4 rounded-xs border border-gray-200 dark:border-gray-600",
          className,
          isExpanded && [
            "fixed",
            "z-50",
            "inset-12",
            "max-h-[calc(100vh-6rem)]",
            "max-w-[calc(100vw-12rem)]",
            "m-auto",
            "overflow-auto",
            "shadow-2xl",
            "dark:shadow-black/50",
          ],
        )}
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={smoothTransition}
        style={{
          position: isExpanded ? "fixed" : "relative",
        }}
      >
        {children}
      </motion.div>
    </>
  );
}
