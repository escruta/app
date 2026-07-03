import { useMediaQuery } from "./useIsDevice";

export const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  laptop: 1024,
};

type Breakpoint = "compact" | "standard" | "extensive";

export function useBreakpoint(): Breakpoint {
  const isCompact = useMediaQuery(BREAKPOINTS.tablet);
  const isStandard = useMediaQuery(BREAKPOINTS.laptop);
  if (isCompact) return "compact" as const;
  if (isStandard) return "standard" as const;
  return "extensive" as const;
}
