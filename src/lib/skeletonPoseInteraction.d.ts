export function shouldAllowSkeletonPinchScale(
  mode: "calibrating" | "simulating",
  allowPinchScaleInSimulation: boolean,
): boolean;

export function getSkeletonOverlayPointerEvents(
  allowEmptySpacePinchScale: boolean,
): "auto" | "box-none";

export function getQuadrantEndpointName(input: {
  width: number;
  height: number;
  x: number;
  y: number;
}): "leftHand" | "rightHand" | "leftFoot" | "rightFoot";

export function isCoreDragStart(input: {
  width: number;
  height: number;
  x: number;
  y: number;
  radius?: number;
}): boolean;
