import { useEffect, useState } from "react";

export default function useVisualViewportHeight() {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateHeight = () => {
      setHeight(viewport.height);
    };

    updateHeight();
    viewport.addEventListener("resize", updateHeight);
    return () => viewport.removeEventListener("resize", updateHeight);
  }, []);

  return height;
}
