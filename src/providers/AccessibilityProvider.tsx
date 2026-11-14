import { type ReactNode, useEffect, useMemo, useState } from "react";
import { MotionConfig } from "motion/react";
import { AccessibilityContext, MotionOptions } from "@/contexts";
import { useCookie } from "@/hooks";

const MOTION_COOKIE_KEY = "motionPreference";
const REDUCE_TRANSPARENCY_COOKIE_KEY = "reduceTransparency";
const ENHANCED_FOCUS_COOKIE_KEY = "enhancedFocus";

const getSystemReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

const determineEffectiveReducedMotion = (
  preference: MotionOptions,
  systemPrefersReduced: boolean,
): boolean => {
  if (preference === MotionOptions.Reduced) return true;
  if (preference === MotionOptions.Full) return false;
  return systemPrefersReduced;
};

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const { value: storedMotion, setValue: setMotionPreference } = useCookie<MotionOptions>(
    MOTION_COOKIE_KEY,
    MotionOptions.System,
  );
  const { value: storedReduceTransparency, setValue: setStoredReduceTransparency } =
    useCookie<boolean>(REDUCE_TRANSPARENCY_COOKIE_KEY, false);
  const { value: storedEnhancedFocus, setValue: setStoredEnhancedFocus } = useCookie<boolean>(
    ENHANCED_FOCUS_COOKIE_KEY,
    false,
  );

  const motionPreference = storedMotion || MotionOptions.System;
  const reduceTransparency = Boolean(storedReduceTransparency);
  const enhancedFocus = Boolean(storedEnhancedFocus);

  const [systemPrefersReduced, setSystemPrefersReduced] = useState<boolean>(getSystemReducedMotion);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setSystemPrefersReduced(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setSystemPrefersReduced(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const effectiveReducedMotion = determineEffectiveReducedMotion(
    motionPreference,
    systemPrefersReduced,
  );

  useEffect(() => {
    document.documentElement.dataset.motion = effectiveReducedMotion ? "reduced" : "full";
  }, [effectiveReducedMotion]);

  useEffect(() => {
    document.documentElement.dataset.reduceTransparency = reduceTransparency ? "true" : "false";
  }, [reduceTransparency]);

  useEffect(() => {
    document.documentElement.dataset.enhancedFocus = enhancedFocus ? "true" : "false";
  }, [enhancedFocus]);

  const motionConfigReduced =
    motionPreference === MotionOptions.System
      ? "user"
      : motionPreference === MotionOptions.Reduced
        ? "always"
        : "never";

  const contextValue = useMemo(
    () => ({
      motionPreference,
      effectiveReducedMotion,
      setMotion: (next: MotionOptions) => setMotionPreference(next),
      MotionOptions,
      reduceTransparency,
      setReduceTransparency: (next: boolean) => setStoredReduceTransparency(next),
      enhancedFocus,
      setEnhancedFocus: (next: boolean) => setStoredEnhancedFocus(next),
    }),
    [
      motionPreference,
      effectiveReducedMotion,
      setMotionPreference,
      reduceTransparency,
      setStoredReduceTransparency,
      enhancedFocus,
      setStoredEnhancedFocus,
    ],
  );

  return (
    <AccessibilityContext.Provider value={contextValue}>
      <MotionConfig
        reducedMotion={motionConfigReduced}
        transition={effectiveReducedMotion ? { duration: 0 } : undefined}
      >
        {children}
      </MotionConfig>
    </AccessibilityContext.Provider>
  );
}
