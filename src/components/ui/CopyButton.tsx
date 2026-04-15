import { useState, useEffect } from "react";
import { IconButton } from "./IconButton";
import { CopyIcon, CheckIcon } from "@/components/icons";
import { motion, AnimatePresence } from "motion/react";

interface CopyButtonProps {
  textToCopy: string;
  tooltipText?: string;
  className?: string;
  disabled?: boolean;
}

export function CopyButton({
  textToCopy,
  tooltipText = "Copy",
  className,
  disabled,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
  };

  return (
    <IconButton
      icon={
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={copied ? "check" : "copy"}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="flex size-full items-center justify-center [&>svg]:size-full"
          >
            {copied ? <CheckIcon className="text-green-500" /> : <CopyIcon />}
          </motion.div>
        </AnimatePresence>
      }
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      disabled={disabled}
      className={className}
      aria-label={tooltipText}
    />
  );
}
