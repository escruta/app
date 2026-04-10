import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 640;
const TABLET_BREAKPOINT = 768;
const LAPTOP_BREAKPOINT = 1280;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT,
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = useState(
    typeof window !== "undefined" && window.innerWidth < TABLET_BREAKPOINT,
  );

  useEffect(() => {
    const handleResize = () => {
      setIsTablet(window.innerWidth < TABLET_BREAKPOINT);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isTablet;
}

export function useIsLaptop() {
  const [isLaptop, setIsLaptop] = useState(
    typeof window !== "undefined" && window.innerWidth < LAPTOP_BREAKPOINT,
  );

  useEffect(() => {
    const handleResize = () => {
      setIsLaptop(window.innerWidth < LAPTOP_BREAKPOINT);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isLaptop;
}
