import type { Point2D } from "../types/geometry";

type SimulationClearCompleteParams = {
  leftHand: Point2D;
  rightHand: Point2D;
  threshold: number;
  topHoldCenter: Point2D | null;
};

export function isSimulationClearComplete(
  params: SimulationClearCompleteParams,
): boolean;
