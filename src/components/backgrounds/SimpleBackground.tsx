import { cn } from "@/lib/utils";

interface SimpleBackgroundProps {
  className?: string;
}

export default function SimpleBackground({ className }: SimpleBackgroundProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-0 select-none pointer-events-none",
        className,
      )}
    >
      <div
        className="absolute inset-0 h-full w-full opacity-[0.03]"
        style={{
          background:
            "linear-gradient(180deg, #93c5fd 0%, #60a5fa 50%, #e2e8f0 100%)",
        }}
      />
    </div>
  );
}
