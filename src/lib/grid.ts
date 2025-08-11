// src/lib/grid.ts
export const GRID_STEP_DEG = 0.0002; // ↔ mesmo do backend
export function quantize(n: number, step = GRID_STEP_DEG) {
  return Math.round(n / step) * step;
}
