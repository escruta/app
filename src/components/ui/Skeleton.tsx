import { useMemo } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className = "", lines = 3 }: SkeletonProps) {
  const lineWidths = useMemo(() => {
    return Array.from({ length: lines }).map((_, i) => {
      if (i === lines - 1 && lines > 1) {
        return `${Math.floor(Math.random() * 55 + 25)}%`;
      }
      return "100%";
    });
  }, [lines]);

  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <motion.div
          key={index}
          className={cn("h-4 bg-gray-200 dark:bg-gray-700 rounded")}
          style={{ width: lineWidths[index] }}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.1,
          }}
        />
      ))}
    </div>
  );
}
