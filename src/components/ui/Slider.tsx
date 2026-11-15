import { useCallback, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface SliderMark {
  value: number;
  label: string;
}

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  description?: string;
  valueLabel?: string;
  marks?: SliderMark[];
  showBounds?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

const MAX_RENDERED_TICKS = 100;

function snapAndClamp(raw: number, min: number, max: number, step: number): number {
  const stepped = Math.round((raw - min) / step) * step + min;
  return Math.min(max, Math.max(min, stepped));
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  description,
  valueLabel,
  marks,
  showBounds = true,
  disabled = false,
  ariaLabel,
  className,
}: SliderProps) {
  const labelId = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const safeStep = step > 0 ? step : 1;
  const clampedValue = Math.min(max, Math.max(min, value));
  const range = Math.max(1, max - min);
  const percentage = ((clampedValue - min) / range) * 100;

  const markValues = useMemo(() => new Set((marks ?? []).map((m) => m.value)), [marks]);

  const tickPositions = useMemo(() => {
    if (max <= min) return [min];
    const totalSteps = Math.floor((max - min) / safeStep);
    const stride = totalSteps > MAX_RENDERED_TICKS ? Math.ceil(totalSteps / MAX_RENDERED_TICKS) : 1;
    const effectiveStep = safeStep * stride;

    const positions: number[] = [];
    for (let current = min; current < max; current = Number((current + effectiveStep).toFixed(6))) {
      positions.push(current);
    }
    if (positions[positions.length - 1] !== max) {
      positions.push(max);
    }
    return positions;
  }, [min, max, safeStep]);

  const updateFromClientX = useCallback(
    (clientX: number) => {
      if (disabled || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const next = snapAndClamp(min + ratio * (max - min), min, max, safeStep);
      if (next !== value) {
        onChange(next);
      }
    },
    [disabled, min, max, safeStep, value, onChange],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault();
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || disabled) return;
    updateFromClientX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    let next: number | null = null;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        next = snapAndClamp(clampedValue + safeStep, min, max, safeStep);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        next = snapAndClamp(clampedValue - safeStep, min, max, safeStep);
        break;
      case "PageUp":
        next = snapAndClamp(clampedValue + safeStep * 5, min, max, safeStep);
        break;
      case "PageDown":
        next = snapAndClamp(clampedValue - safeStep * 5, min, max, safeStep);
        break;
      case "Home":
        next = min;
        break;
      case "End":
        next = max;
        break;
      default:
        return;
    }

    e.preventDefault();
    if (next !== value) {
      onChange(next);
    }
  };

  return (
    <div className={cn("flex w-full flex-col gap-2 select-none", className)}>
      {(label || valueLabel) && (
        <div className="flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            {label && (
              <p id={labelId} className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {label}
              </p>
            )}
            {description && (
              <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
          {valueLabel && (
            <span className="shrink-0 rounded-xs border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 tabular-nums dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
              {valueLabel}
            </span>
          )}
        </div>
      )}

      <div className="px-2 pt-1">
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={cn(
            "group relative flex h-6 w-full touch-none items-center",
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          )}
        >
          <div className="relative h-1.5 w-full overflow-hidden rounded-xs bg-gray-200 dark:bg-gray-800">
            <div
              className="absolute inset-y-0 left-0 bg-blue-500 dark:bg-blue-600"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            {tickPositions.map((pos) => {
              const posPct = ((pos - min) / range) * 100;
              const isEndpoint = pos === min || pos === max;
              const isActive = pos <= clampedValue;
              const isMarked = markValues.has(pos);

              return (
                <span
                  key={pos}
                  style={{ left: `${posPct}%` }}
                  className={cn(
                    "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-colors duration-150",
                    isEndpoint ? "h-3.5 w-0.5 rounded-xs" : "h-2.5 w-px",
                    isActive
                      ? "bg-blue-500 dark:bg-blue-400"
                      : isEndpoint || isMarked
                        ? "bg-gray-400 dark:bg-gray-500"
                        : "bg-gray-300 dark:bg-gray-600",
                  )}
                />
              );
            })}
          </div>

          <div
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={ariaLabel ?? (!label ? "Value" : undefined)}
            aria-labelledby={label ? labelId : undefined}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={clampedValue}
            aria-valuetext={valueLabel ?? String(clampedValue)}
            aria-disabled={disabled || undefined}
            onKeyDown={handleKeyDown}
            style={{ left: `${percentage}%` }}
            className={cn(
              "z-10 absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-xs border-2 border-blue-600 bg-white shadow-xs transition-shadow duration-150 dark:border-blue-400 dark:bg-gray-950",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-gray-900",
              !disabled &&
                "group-hover:ring-2 group-hover:ring-blue-300 dark:group-hover:ring-blue-500/40",
              isDragging && "ring-2 ring-blue-400 dark:ring-blue-400/60",
            )}
          />
        </div>

        {marks && marks.length > 0 ? (
          <div className="relative mt-0.5 h-5 w-full">
            {marks.map((mark) => {
              const markPct = ((Math.min(max, Math.max(min, mark.value)) - min) / range) * 100;
              const isSelected = mark.value === clampedValue;
              return (
                <button
                  key={mark.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(mark.value)}
                  style={{ left: `${markPct}%` }}
                  className={cn(
                    "absolute top-0 -translate-x-1/2 cursor-pointer rounded-xs px-1 py-0.5 text-[11px] font-medium tabular-nums transition-colors",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500",
                    isSelected
                      ? "font-semibold text-blue-600 dark:text-blue-400"
                      : "text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300",
                    disabled && "pointer-events-none",
                  )}
                >
                  {mark.label}
                </button>
              );
            })}
          </div>
        ) : showBounds ? (
          <div className="mt-0.5 flex items-center justify-between text-[11px] font-medium text-gray-400 tabular-nums dark:text-gray-500">
            <span>{min}</span>
            <span>{max}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
