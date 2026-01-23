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
        className="absolute inset-0 h-full w-full opacity-[0.05]"
        style={{
          background:
            "linear-gradient(180deg, #3b82f6 0%, #1e40af 50%, #1f2937 100%)",
        }}
      />
    </div>
  );
}
