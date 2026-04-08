import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export function GaussianBlurGradientBackground({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-0 overflow-hidden bg-white dark:bg-gray-950 opacity-60",
        className,
      )}
      {...props}
    >
      {/* Outer Blue Auras */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          y: [0, -30, 0],
          x: [0, 20, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-[30%] -left-[10%] h-[70%] w-[70%] rounded-full bg-blue-500/20 blur-[140px] dark:bg-blue-600/20"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          y: [0, -40, 0],
          x: [0, -30, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute -right-[5%] -bottom-[40%] h-[80%] w-[60%] rounded-full bg-blue-300/20 blur-[140px] dark:bg-blue-500/20"
      />

      {/* Inner White Cores for the glowing wave effect */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          y: [0, -20, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-[40%] -left-[5%] h-[50%] w-[50%] rounded-full bg-blue-50/50 blur-[120px] dark:bg-blue-900/40"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          y: [0, -25, 0],
          x: [0, 15, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute -right-[10%] -bottom-[30%] h-[60%] w-[50%] rounded-full bg-blue-100/50 blur-[120px] dark:bg-blue-800/40"
      />
    </div>
  );
}
