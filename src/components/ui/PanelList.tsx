import { motion, type HTMLMotionProps } from "motion/react";
import { useAccessibility } from "@/hooks";
import { listContainerVariants, listItemVariants } from "@/lib/motion";

type PanelListProps = HTMLMotionProps<"div">;

export function PanelList({ children, ...props }: PanelListProps) {
  const { effectiveReducedMotion } = useAccessibility();

  if (effectiveReducedMotion) {
    return (
      <motion.div {...props} variants={undefined} initial={false} animate={false}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div {...props} variants={listContainerVariants} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}

type PanelListItemProps = HTMLMotionProps<"div">;

export function PanelListItem({ children, ...props }: PanelListItemProps) {
  const { effectiveReducedMotion } = useAccessibility();

  if (effectiveReducedMotion) {
    return (
      <motion.div {...props} variants={undefined} initial={false} animate={false}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div variants={listItemVariants} initial="hidden" animate="show" {...props}>
      {children}
    </motion.div>
  );
}
