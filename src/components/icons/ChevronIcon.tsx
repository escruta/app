import { cn } from "@/lib/utils";

interface ChevronIconProps extends React.SVGProps<SVGSVGElement> {
  direction: "up" | "down" | "left" | "right";
}

export function ChevronIcon({
  className,
  direction,
  ...props
}: ChevronIconProps) {
  const rotations = {
    up: "rotate-180",
    down: "rotate-0",
    left: "rotate-90",
    right: "-rotate-90",
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn(rotations[direction], className)}
      {...props}
    >
      <path d="M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z" />
    </svg>
  );
}
