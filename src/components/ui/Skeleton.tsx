import { useMemo } from "react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface SkeletonBaseProps {
  className?: string;
  animate?: boolean;
}

type SkeletonLineHeight = "sm" | "md" | "lg";
type SkeletonLastLineWidth = "full" | "random" | "short";

interface SkeletonTextProps extends SkeletonBaseProps {
  variant?: "text";
  lines?: number;
  lineHeight?: SkeletonLineHeight;
  lastLineWidth?: SkeletonLastLineWidth;
}

interface SkeletonShapeProps extends SkeletonBaseProps {
  variant: "circle" | "rectangle";
  size?: number;
  width?: number | string;
  height?: number | string;
}

type SkeletonProps = SkeletonTextProps | SkeletonShapeProps;

interface ShimmerProps {
  className?: string;
  animate?: boolean;
  delay?: number;
  style?: CSSProperties;
}

function Shimmer({ className, animate = true, delay = 0, style }: ShimmerProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gray-200/80 dark:bg-gray-800/80",
        "rounded-xs isolate",
        animate && "animate-pulse",
        className,
      )}
      style={{
        ...style,
        animationDelay: animate ? `${delay}s` : "0s",
      }}
    >
      {animate && (
        <div
          className="animate-shimmer absolute inset-0 z-10"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
            animationDelay: `${delay}s`,
          }}
        />
      )}
    </div>
  );
}

function TextSkeleton({
  lines = 3,
  lineHeight = "md",
  lastLineWidth = "random",
  className = "",
  animate = true,
}: SkeletonTextProps) {
  const lineWidths = useMemo(() => {
    return Array.from({ length: lines }).map((_, i) => {
      if (i === lines - 1 && lines > 1) {
        if (lastLineWidth === "full") return "100%";
        if (lastLineWidth === "short") return "60%";
        return `${Math.floor(Math.random() * 40 + 40)}%`;
      }
      return "100%";
    });
  }, [lines, lastLineWidth]);

  const heightStyles: Record<SkeletonLineHeight, string> = {
    sm: "h-3",
    md: "h-4",
    lg: "h-5",
  };

  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Shimmer
          key={index}
          className={cn(heightStyles[lineHeight])}
          animate={animate}
          delay={index * 0.1}
          style={{ width: lineWidths[index] }}
        />
      ))}
    </div>
  );
}

function CircleSkeleton({
  size = 48,
  className = "",
  animate = true,
}: SkeletonShapeProps & { size: number }) {
  return (
    <Shimmer
      className={cn("rounded-full", className)}
      animate={animate}
      style={{ width: size, height: size }}
    />
  );
}

function RectangleSkeleton({
  width = "100%",
  height = 80,
  className = "",
  animate = true,
}: SkeletonShapeProps) {
  return (
    <Shimmer className={cn("rounded-xs", className)} animate={animate} style={{ width, height }} />
  );
}

export function Skeleton(props: SkeletonProps) {
  const { variant = "text", className = "", animate = true } = props;

  if (variant === "circle") {
    const { size = 48 } = props as SkeletonShapeProps;
    return <CircleSkeleton variant="circle" size={size} className={className} animate={animate} />;
  }

  if (variant === "rectangle") {
    const { width = "100%", height = 80 } = props as SkeletonShapeProps;
    return (
      <RectangleSkeleton
        variant="rectangle"
        width={width}
        height={height}
        className={className}
        animate={animate}
      />
    );
  }

  const { lines = 3, lineHeight = "md", lastLineWidth = "random" } = props as SkeletonTextProps;

  return (
    <TextSkeleton
      variant="text"
      lines={lines}
      lineHeight={lineHeight}
      lastLineWidth={lastLineWidth}
      className={className}
      animate={animate}
    />
  );
}

interface CardSkeletonProps {
  viewMode?: "grid" | "list";
}

export function CardSkeleton({ viewMode = "grid" }: CardSkeletonProps) {
  const baseClasses = cn(
    "rounded-xs border bg-white dark:bg-gray-900",
    "border-gray-200 dark:border-gray-700",
  );

  if (viewMode === "grid") {
    return (
      <div className={cn(baseClasses, "h-40 w-full p-4 flex flex-col justify-between")}>
        <div className="flex items-start justify-between">
          <Shimmer style={{ width: 32, height: 32 }} />
          <Shimmer style={{ width: 20, height: 20 }} delay={0.05} />
        </div>
        <div>
          <Shimmer className="mb-1.5 h-4" style={{ width: "80%" }} delay={0.1} />
          <Shimmer className="mb-1.5 h-4" style={{ width: "50%" }} delay={0.15} />
          <Shimmer className="h-3" style={{ width: "35%" }} delay={0.2} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(baseClasses, "h-20 w-full p-4 flex flex-row items-center justify-between")}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Shimmer style={{ width: 32, height: 32 }} />
        <div className="min-w-0 flex-1">
          <Shimmer className="mb-1.5 h-4" style={{ width: "60%" }} delay={0.1} />
          <Shimmer className="h-3" style={{ width: "35%" }} delay={0.15} />
        </div>
      </div>
      <Shimmer style={{ width: 20, height: 20 }} delay={0.2} />
    </div>
  );
}
