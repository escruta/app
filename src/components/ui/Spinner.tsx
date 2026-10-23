import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { LoadingIcon } from "@/components/icons";

type SpinnerProps = {
  size?: number;
  className?: string;
  "aria-label"?: string;
};

export function Spinner({
  size,
  className = "",
  "aria-label": ariaLabel = "Loading",
}: SpinnerProps) {
  const hasCustomSize = size !== undefined;

  return (
    <motion.div
      className={cn(
        "inline-flex max-h-full max-w-full shrink-0 items-center justify-center",
        { "size-6": !hasCustomSize },
        className,
      )}
      aria-label={ariaLabel}
      role="status"
      initial={{ rotate: 0 }}
      animate={{ rotate: 360 }}
      transition={{
        repeat: Infinity,
        duration: 2,
        ease: "linear",
      }}
      style={hasCustomSize ? { width: size, height: size } : undefined}
    >
      <LoadingIcon className="size-full" />
    </motion.div>
  );
}
