import { useState, useEffect } from "react";
import { IconButton, type IconButtonVariant } from "./IconButton";
import { CopyIcon, CheckIcon } from "@/components/icons";
import { useAccessibility } from "@/hooks";
import { writeClipboardText } from "@/lib/clipboard";
import { motion, AnimatePresence } from "motion/react";

interface CopyButtonProps {
  textToCopy: string;
  tooltipText?: string;
  className?: string;
  disabled?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: IconButtonVariant;
}

export function CopyButton({
  textToCopy,
  tooltipText = "Copy",
  className,
  disabled,
  size = "sm",
  variant = "ghost",
}: CopyButtonProps) {
  const { effectiveReducedMotion } = useAccessibility();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  const handleCopy = () => {
    void writeClipboardText(textToCopy).catch((error) => {
      console.warn("Clipboard write failed:", error);
    });
    setCopied(true);
  };

  return (
    <IconButton
      icon={
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={copied ? "check" : "copy"}
            initial={effectiveReducedMotion ? false : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={effectiveReducedMotion ? undefined : { opacity: 0, scale: 0.8 }}
            transition={effectiveReducedMotion ? { duration: 0 } : { duration: 0.15 }}
            className="flex size-full items-center justify-center [&>svg]:size-full"
          >
            {copied ? <CheckIcon className="text-green-600 dark:text-green-400" /> : <CopyIcon />}
          </motion.div>
        </AnimatePresence>
      }
      variant={variant}
      size={size}
      onClick={handleCopy}
      disabled={disabled}
      className={className}
      ariaLabel={copied ? "Copied" : tooltipText}
    />
  );
}
