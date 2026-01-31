import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
  lines?: number;
};

export function Skeleton({ className = "", lines = 3 }: SkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <motion.div
          key={index}
          className={cn(
            "h-4 bg-gray-200 dark:bg-gray-700 rounded",
            index === lines - 1 && "w-3/4",
          )}
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
