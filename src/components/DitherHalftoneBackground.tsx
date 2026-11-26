import { type RefObject, useEffect, useRef, useState } from "react";
import { useAccessibility, useTheme } from "@/hooks";
import { cn } from "@/lib/utils";

const BAYER_8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
] as const;

const LEVELS = 4;
const FIELD_SCALE_PX = 420;
const INV_SQRT2 = Math.SQRT1_2;
const TWO_PI = Math.PI * 2;
const IDLE_FRAME_MS = 55;
const ACTIVE_FRAME_MS = 33;

function buildRadii(cellPx: number): readonly [number, number, number, number] {
  return [
    Math.sqrt(1 / LEVELS) * cellPx * 0.31,
    Math.sqrt(2 / LEVELS) * cellPx * 0.31,
    Math.sqrt(3 / LEVELS) * cellPx * 0.31,
    Math.sqrt(4 / LEVELS) * cellPx * 0.31,
  ] as const;
}

// Escruta blue palette ramp tuned to stay whisper-subtle behind workspace UI.
const LIGHT_STYLES = [
  "rgba(133, 197, 255, 0.10)",
  "rgba(75, 171, 253, 0.14)",
  "rgba(39, 154, 253, 0.18)",
  "rgba(3, 136, 252, 0.22)",
] as const;

const DARK_STYLES = [
  "rgba(1, 69, 129, 0.22)",
  "rgba(2, 113, 211, 0.22)",
  "rgba(3, 136, 252, 0.24)",
  "rgba(75, 171, 253, 0.26)",
] as const;

const CRISP_LIGHT_STYLES = [
  "rgba(133, 197, 255, 0.18)",
  "rgba(75, 171, 253, 0.24)",
  "rgba(39, 154, 253, 0.31)",
  "rgba(3, 136, 252, 0.38)",
] as const;

const CRISP_DARK_STYLES = [
  "rgba(1, 69, 129, 0.28)",
  "rgba(2, 113, 211, 0.32)",
  "rgba(3, 136, 252, 0.36)",
  "rgba(75, 171, 253, 0.42)",
] as const;

export type DitherHalftoneVariant = "default" | "settings" | "tabs" | "welcome";

interface HalftoneVariantConfig {
  containerClassName: string;
  cellPx: number;
  lightStyles: readonly [string, string, string, string];
  darkStyles: readonly [string, string, string, string];
  baseHorizonNarrow: number;
  baseHorizonWide: number;
  sideSwellNarrow: number;
  sideSwellWide: number;
  anchorDepthNarrow: number;
  anchorDepthWide: number;
  topAnchorStrength: number;
  topFadeEnd: number;
  bottomFadeStart: number;
  clearCenterX: number;
  clearScaleXNarrow: number;
  clearScaleXWide: number;
  clearCenterY: number;
  clearScaleY: number;
  clearanceMin: number;
  fieldGain: number;
  pointerGain: number;
}

const VARIANT_CONFIGS: Record<DitherHalftoneVariant, HalftoneVariantConfig> = {
  default: {
    containerClassName: "inset-x-0 top-0 h-[36vh] min-h-48 max-h-80",
    cellPx: 9.5,
    lightStyles: LIGHT_STYLES,
    darkStyles: DARK_STYLES,
    baseHorizonNarrow: 0.38,
    baseHorizonWide: 0.44,
    sideSwellNarrow: 0.1,
    sideSwellWide: 0.18,
    anchorDepthNarrow: 0.16,
    anchorDepthWide: 0.22,
    topAnchorStrength: 0.08,
    topFadeEnd: 0,
    bottomFadeStart: 0.72,
    clearCenterX: 0.5,
    clearScaleXNarrow: 1.0,
    clearScaleXWide: 1.35,
    clearCenterY: 0.32,
    clearScaleY: 1.4,
    clearanceMin: 0.32,
    fieldGain: 0.58,
    pointerGain: 0.11,
  },
  settings: {
    containerClassName: "inset-0 h-full",
    cellPx: 9.5,
    lightStyles: CRISP_LIGHT_STYLES,
    darkStyles: CRISP_DARK_STYLES,
    baseHorizonNarrow: 0.48,
    baseHorizonWide: 0.56,
    sideSwellNarrow: 0.24,
    sideSwellWide: 0.36,
    anchorDepthNarrow: 0.16,
    anchorDepthWide: 0.22,
    topAnchorStrength: 0.14,
    topFadeEnd: 0,
    bottomFadeStart: 0.8,
    clearCenterX: 0.5,
    clearScaleXNarrow: 1.0,
    clearScaleXWide: 1.35,
    clearCenterY: 0.42,
    clearScaleY: 1.3,
    clearanceMin: 0.2,
    fieldGain: 0.78,
    pointerGain: 0.18,
  },
  tabs: {
    containerClassName: "inset-0 h-full",
    cellPx: 7.5,
    lightStyles: CRISP_LIGHT_STYLES,
    darkStyles: CRISP_DARK_STYLES,
    baseHorizonNarrow: 0.78,
    baseHorizonWide: 0.84,
    sideSwellNarrow: 0.14,
    sideSwellWide: 0.22,
    anchorDepthNarrow: 0.32,
    anchorDepthWide: 0.38,
    topAnchorStrength: 0.14,
    topFadeEnd: 0,
    bottomFadeStart: 0.84,
    clearCenterX: 0.18,
    clearScaleXNarrow: 1.1,
    clearScaleXWide: 1.4,
    clearCenterY: 0.5,
    clearScaleY: 1.35,
    clearanceMin: 0.24,
    fieldGain: 0.72,
    pointerGain: 0.16,
  },
  welcome: {
    containerClassName: "inset-0 h-full",
    cellPx: 9,
    lightStyles: CRISP_LIGHT_STYLES,
    darkStyles: CRISP_DARK_STYLES,
    baseHorizonNarrow: 0.52,
    baseHorizonWide: 0.62,
    sideSwellNarrow: 0.28,
    sideSwellWide: 0.4,
    anchorDepthNarrow: 0.2,
    anchorDepthWide: 0.26,
    topAnchorStrength: 0.18,
    topFadeEnd: 0,
    bottomFadeStart: 0.85,
    clearCenterX: 0.5,
    clearScaleXNarrow: 0.95,
    clearScaleXWide: 1.25,
    clearCenterY: 0.5,
    clearScaleY: 1.15,
    clearanceMin: 0.26,
    fieldGain: 0.82,
    pointerGain: 0.2,
  },
};

interface HalftoneGrid {
  width: number;
  height: number;
  count: number;
  x: Float32Array;
  y: Float32Array;
  uvX: Float32Array;
  topUv: Float32Array;
  px: Float32Array;
  py: Float32Array;
  bayer: Float32Array;
  baseReach: Float32Array;
  clearance: Float32Array;
  topAnchor: Float32Array;
  edgeFade: Float32Array;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function buildHalftoneGrid(
  width: number,
  height: number,
  config: HalftoneVariantConfig,
): HalftoneGrid {
  const isWide = smoothstep(520, 1100, width);
  const baseHorizon = mix(config.baseHorizonNarrow, config.baseHorizonWide, isWide);
  const sideSwellMax = mix(config.sideSwellNarrow, config.sideSwellWide, isWide);
  const anchorDepth = mix(config.anchorDepthNarrow, config.anchorDepthWide, isWide);
  const clearScaleX = mix(config.clearScaleXNarrow, config.clearScaleXWide, isWide);

  const cellPx = config.cellPx;
  const k = INV_SQRT2 / cellPx;
  const minCol = Math.floor(-height * k) - 1;
  const maxCol = Math.ceil(width * k) + 1;
  const minRow = -1;
  const maxRow = Math.ceil((width + height) * k) + 1;

  const xs: number[] = [];
  const ys: number[] = [];
  const uvXs: number[] = [];
  const topUvs: number[] = [];
  const pxs: number[] = [];
  const pys: number[] = [];
  const bayers: number[] = [];
  const baseReaches: number[] = [];
  const clearances: number[] = [];
  const topAnchors: number[] = [];
  const edgeFades: number[] = [];

  for (let row = minRow; row <= maxRow; row++) {
    const cy = row + 0.5;
    const bayerRow = BAYER_8[row & 7];

    for (let col = minCol; col <= maxCol; col++) {
      const cx = col + 0.5;
      const x = (cx + cy) * cellPx * INV_SQRT2;
      const y = (cy - cx) * cellPx * INV_SQRT2;

      if (x < -cellPx || x > width + cellPx || y < -cellPx || y > height + cellPx) {
        continue;
      }

      const uvX = x / width;
      const topUv = Math.max(0, y / height);
      if (topUv >= 0.98) continue;

      const edgeDist = Math.abs(uvX - 0.5) * 2;
      const sideSwell = Math.pow(edgeDist, 1.75) * sideSwellMax;
      const baseReach = baseHorizon + sideSwell;

      const dxClear = (uvX - config.clearCenterX) * clearScaleX;
      const dyClear = (topUv - config.clearCenterY) * config.clearScaleY;
      const clearDist = Math.hypot(dxClear, dyClear);
      const clearance = mix(config.clearanceMin, 1.0, smoothstep(0.24, 0.78, clearDist));

      const topAnchor =
        anchorDepth > 0 && config.topAnchorStrength > 0
          ? (1 - smoothstep(0, anchorDepth, topUv)) * config.topAnchorStrength
          : 0;
      const topFade = config.topFadeEnd > 0 ? smoothstep(0, config.topFadeEnd, topUv) : 1;
      const bottomFade = 1 - smoothstep(config.bottomFadeStart, 0.96, topUv);
      const edgeFade = topFade * bottomFade;

      xs.push(x);
      ys.push(y);
      uvXs.push(uvX);
      topUvs.push(topUv);
      pxs.push((x - width * 0.5) / FIELD_SCALE_PX);
      pys.push(y / FIELD_SCALE_PX);
      bayers.push((bayerRow[col & 7] + 0.5) / 64);
      baseReaches.push(baseReach);
      clearances.push(clearance);
      topAnchors.push(topAnchor);
      edgeFades.push(edgeFade);
    }
  }

  return {
    width,
    height,
    count: xs.length,
    x: Float32Array.from(xs),
    y: Float32Array.from(ys),
    uvX: Float32Array.from(uvXs),
    topUv: Float32Array.from(topUvs),
    px: Float32Array.from(pxs),
    py: Float32Array.from(pys),
    bayer: Float32Array.from(bayers),
    baseReach: Float32Array.from(baseReaches),
    clearance: Float32Array.from(clearances),
    topAnchor: Float32Array.from(topAnchors),
    edgeFade: Float32Array.from(edgeFades),
  };
}

interface DitherHalftoneBackgroundProps {
  className?: string;
  interactionTargetRef?: RefObject<HTMLElement | null>;
  variant?: DitherHalftoneVariant;
}

export function DitherHalftoneBackground({
  className,
  interactionTargetRef,
  variant = "default",
}: DitherHalftoneBackgroundProps) {
  const config = VARIANT_CONFIGS[variant];
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { effectiveTheme } = useTheme();
  const { effectiveReducedMotion } = useAccessibility();
  const [isReady, setIsReady] = useState(false);

  const isDark = effectiveTheme === "dark";
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;

  const elapsedPausedRef = useRef(3.2);
  const redrawRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let grid: HalftoneGrid | null = null;
    let isVisible = true;
    let rafId = 0;
    let startTime = performance.now();
    let lastDrawTime = 0;

    const radii = buildRadii(config.cellPx);
    const buckets: [number[], number[], number[], number[]] = [[], [], [], []];

    const pointer = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      active: 0,
      targetActive: 0,
    };

    const resize = () => {
      const width = root.clientWidth;
      const height = root.clientHeight;
      if (!width || !height) {
        grid = null;
        return;
      }

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nextW = Math.max(1, Math.floor(width * dpr));
      const nextH = Math.max(1, Math.floor(height * dpr));
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW;
        canvas.height = nextH;
      }

      grid = buildHalftoneGrid(width, height, config);
    };

    const renderFrame = (timeSec: number) => {
      if (!grid) return;

      const {
        width,
        height,
        count,
        x,
        y,
        uvX,
        topUv,
        px,
        py,
        bayer,
        baseReach,
        clearance,
        topAnchor,
        edgeFade,
      } = grid;

      if (!effectiveReducedMotion) {
        pointer.x += (pointer.targetX - pointer.x) * 0.14;
        pointer.y += (pointer.targetY - pointer.y) * 0.14;
        pointer.active += (pointer.targetActive - pointer.active) * 0.12;
      } else {
        pointer.active = 0;
      }

      buckets[0].length = 0;
      buckets[1].length = 0;
      buckets[2].length = 0;
      buckets[3].length = 0;

      const hasPointer = pointer.active > 0.004;
      const pointerX = pointer.x;
      const pointerY = pointer.y;
      const pointerStrength = pointer.active * config.pointerGain;

      const tHorizon1 = timeSec * 0.24;
      const tHorizon2 = timeSec * 0.16;
      const tDriftX = timeSec * 0.042;
      const tDriftY = timeSec * 0.02;
      const tPhase = timeSec * 0.075;
      const tWarp = timeSec * 0.055;
      const tContour = timeSec * 0.28;

      for (let i = 0; i < count; i++) {
        const cellTopUv = topUv[i];
        const reach = baseReach[i];
        const fade = edgeFade[i];
        if (fade <= 0.002) continue;

        let mouseGlow = 0;
        if (hasPointer) {
          const mdx = (x[i] - pointerX) / FIELD_SCALE_PX;
          const mdy = (y[i] - pointerY) / FIELD_SCALE_PX;
          const dist2 = mdx * mdx + mdy * mdy;
          if (dist2 < 0.45) {
            mouseGlow = Math.exp(-dist2 * 10.5) * pointerStrength;
          }
        }

        // Fast vertical reject for cells below the maximum possible wave reach
        if (cellTopUv > reach + 0.34 && mouseGlow <= 0.004) {
          continue;
        }

        const cellPx = px[i];
        const cellPy = py[i];
        const cellUvX = uvX[i];

        // Lightweight domain-warped organic field matching smooth topographic noise
        const qx = cellPx * 1.35 + tDriftX;
        const qy = cellPy * 1.35 - tDriftY;
        const w1 = Math.sin(qx * 2.1 + qy * 1.3) * Math.cos(qx * 0.9 - qy * 2.4 + tPhase);
        const w2 = Math.sin(cellPx * 2.8 - cellPy * 1.7 - tWarp + w1 * 0.85) * 0.5;
        const w3 = Math.cos(cellPx * 1.6 + cellPy * 3.5 + tDriftX) * 0.28;
        const n1 = (w1 + w2 + w3) * 0.58;
        const n2 = Math.sin(cellPx * 3.5 - cellPy * 2.6 - tPhase) * 0.65;

        const horizon =
          reach +
          0.045 * Math.sin(cellUvX * 4.2 + tHorizon1) +
          0.028 * Math.cos(cellUvX * 7.6 - tHorizon2) +
          n1 * 0.11;

        const verticalMask = 1 - smoothstep(0, horizon + 0.16, cellTopUv);

        let field = 0;
        if (verticalMask > 0.001 || topAnchor[i] > 0.001) {
          const contour = 0.5 + 0.5 * Math.sin(n1 * 4.6 + n2 * 1.35 - cellTopUv * 4.6 + tContour);
          field =
            (verticalMask * (0.32 + 0.68 * contour) + topAnchor[i]) *
            clearance[i] *
            config.fieldGain;
        }

        field = (field + mouseGlow) * fade;
        if (field <= 0.004) continue;

        const intensity = field > 1 ? 1 : field;
        const scaled = intensity * LEVELS;
        const floored = Math.floor(scaled);
        const quantized = floored + (scaled - floored >= bayer[i] ? 1 : 0);
        const level = quantized > LEVELS ? LEVELS : quantized;

        if (level <= 0) continue;
        buckets[level - 1].push(x[i], y[i]);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const styles = isDarkRef.current ? config.darkStyles : config.lightStyles;

      for (let levelIndex = 0; levelIndex < LEVELS; levelIndex++) {
        const points = buckets[levelIndex];
        if (!points.length) continue;

        const radius = radii[levelIndex];
        ctx.fillStyle = styles[levelIndex];
        ctx.beginPath();
        for (let j = 0; j < points.length; j += 2) {
          const pxPos = points[j];
          const pyPos = points[j + 1];
          ctx.moveTo(pxPos + radius, pyPos);
          ctx.arc(pxPos, pyPos, radius, 0, TWO_PI);
        }
        ctx.fill();
      }
    };

    const tick = (now: number) => {
      rafId = 0;
      if (!isVisible || document.hidden || effectiveReducedMotion) return;

      const isPointerEasing =
        Math.abs(pointer.targetX - pointer.x) > 0.5 ||
        Math.abs(pointer.targetY - pointer.y) > 0.5 ||
        Math.abs(pointer.targetActive - pointer.active) > 0.005;
      const interval = isPointerEasing ? ACTIVE_FRAME_MS : IDLE_FRAME_MS;

      if (now - lastDrawTime >= interval) {
        lastDrawTime = now;
        const timeSec = (now - startTime) * 0.001 + elapsedPausedRef.current;
        renderFrame(timeSec);
      }

      rafId = requestAnimationFrame(tick);
    };

    const getCurrentTimeSec = () =>
      rafId
        ? (performance.now() - startTime) * 0.001 + elapsedPausedRef.current
        : elapsedPausedRef.current;

    const startLoop = () => {
      if (effectiveReducedMotion) {
        renderFrame(elapsedPausedRef.current);
        return;
      }
      if (!rafId && isVisible && !document.hidden) {
        startTime = performance.now();
        lastDrawTime = 0;
        rafId = requestAnimationFrame(tick);
      }
    };

    const stopLoop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
        elapsedPausedRef.current += (performance.now() - startTime) * 0.001;
      }
    };

    redrawRef.current = () => {
      renderFrame(getCurrentTimeSec());
    };

    const targetEl = interactionTargetRef?.current ?? root.parentElement ?? root;

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const rect = root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      if (localY < -60 || localY > rect.height + 60) {
        pointer.targetActive = 0;
        return;
      }
      pointer.targetX = localX;
      pointer.targetY = localY;
      pointer.targetActive = 1;
    };

    const handlePointerLeave = () => {
      pointer.targetActive = 0;
    };

    if (!effectiveReducedMotion) {
      targetEl.addEventListener("pointermove", handlePointerMove, { passive: true });
      targetEl.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    }

    const resizeObserver = new ResizeObserver(() => {
      resize();
      renderFrame(getCurrentTimeSec());
    });
    resizeObserver.observe(root);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
        if (isVisible) startLoop();
        else stopLoop();
      },
      { root: interactionTargetRef?.current ?? null, threshold: 0.01 },
    );
    intersectionObserver.observe(root);

    const handleVisibilityChange = () => {
      if (document.hidden) stopLoop();
      else startLoop();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    resize();
    renderFrame(elapsedPausedRef.current);
    setIsReady(true);
    startLoop();

    return () => {
      stopLoop();
      redrawRef.current = null;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (!effectiveReducedMotion) {
        targetEl.removeEventListener("pointermove", handlePointerMove);
        targetEl.removeEventListener("pointerleave", handlePointerLeave);
      }
    };
  }, [effectiveReducedMotion, interactionTargetRef, config]);

  useEffect(() => {
    redrawRef.current?.();
  }, [isDark]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute z-0 overflow-hidden select-none",
        config.containerClassName,
        !effectiveReducedMotion && "transition-opacity duration-700 ease-out",
        isReady ? "opacity-100" : "opacity-0",
        className,
      )}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
