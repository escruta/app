import { cn } from "@/lib/utils";

interface GridBackgroundProps {
  scale: number;
  offset: { x: number; y: number };
  className?: string;
}

export function GridBackground({ scale, offset, className }: GridBackgroundProps) {
  // Base grid size is 40px
  const gridSize = 40 * scale;

  // Dot size scales slightly but stays subtle
  const dotSize = Math.max(0.5, 1 * scale);

  return (
    <div
      className={cn(
        "absolute inset-0 pointer-events-none z-0 overflow-hidden",
        "text-gray-200 dark:text-gray-800 transition-colors duration-300",
        className,
      )}
      style={{
        backgroundImage: `radial-gradient(circle, currentColor ${dotSize}px, transparent 0)`,
        backgroundSize: `${gridSize}px ${gridSize}px`,
        backgroundPosition: `${offset.x}px ${offset.y}px`,
      }}
    />
  );
}
