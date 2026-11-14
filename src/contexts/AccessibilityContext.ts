import { createContext } from "react";

export enum MotionOptions {
  System = "System",
  Full = "Full",
  Reduced = "Reduced",
}

interface AccessibilityContextType {
  motionPreference: MotionOptions;
  effectiveReducedMotion: boolean;
  setMotion: (motion: MotionOptions) => void;
  MotionOptions: typeof MotionOptions;
  reduceTransparency: boolean;
  setReduceTransparency: (reduce: boolean) => void;
  enhancedFocus: boolean;
  setEnhancedFocus: (enhanced: boolean) => void;
}

export const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);
