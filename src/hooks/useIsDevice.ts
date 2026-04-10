import { useEffect, useState } from "react";

const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  laptop: 1280,
};

function useMediaQuery(width: number) {
  const [targetReached, setTargetReached] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${width}px)`);

    const updateTarget = (e: MediaQueryListEvent | MediaQueryList) => {
      setTargetReached(e.matches);
    };

    updateTarget(media);

    media.addEventListener("change", updateTarget);
    return () => media.removeEventListener("change", updateTarget);
  }, [width]);

  return targetReached;
}

export const useIsMobile = () => useMediaQuery(BREAKPOINTS.mobile);
export const useIsTablet = () => useMediaQuery(BREAKPOINTS.tablet);
export const useIsLaptop = () => useMediaQuery(BREAKPOINTS.laptop);
