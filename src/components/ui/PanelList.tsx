import { motion, type HTMLMotionProps } from "motion/react";
import { listContainerVariants, listItemVariants } from "@/lib/motion";

type PanelListProps = HTMLMotionProps<"div">;

export function PanelList({ children, ...props }: PanelListProps) {
  return (
    <motion.div {...props} variants={listContainerVariants} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}

type PanelListItemProps = HTMLMotionProps<"div">;

export function PanelListItem({ children, ...props }: PanelListItemProps) {
  return (
    <motion.div variants={listItemVariants} exit="exit" {...props}>
      {children}
    </motion.div>
  );
}
