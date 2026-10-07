import type { Transition, Variants } from "motion/react";

export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const panelSwitchTransition: Transition = {
  duration: 0.18,
  ease: EASE_OUT,
};

export const listContainerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.02,
    },
  },
};

export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.15, ease: EASE_OUT },
  },
};
