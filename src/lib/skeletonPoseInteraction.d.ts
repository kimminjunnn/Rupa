export function shouldAllowSkeletonPinchScale(
  mode: "calibrating" | "simulating",
  allowPinchScaleInSimulation: boolean,
): boolean;

export function getSkeletonOverlayPointerEvents(
  allowEmptySpacePinchScale: boolean,
): "auto" | "box-none";

export function getTutorialDirectJointMarkerStyle(input: {
  jointActiveRadius: number;
}): {
  fill: "transparent";
  radius: number;
  stroke: "rgba(254,214,96,0.78)";
  strokeWidth: 1.75;
};

export function getQuadrantEndpointName(input: {
  width: number;
  height: number;
  x: number;
  y: number;
}): "leftHand" | "rightHand" | "leftFoot" | "rightFoot";

export function isQuadrantEndpointAllowed(input: {
  allowedEndpointName: "leftHand" | "rightHand" | "leftFoot" | "rightFoot" | null;
  endpointName: "leftHand" | "rightHand" | "leftFoot" | "rightFoot";
}): boolean;

export function isCoreDragStart(input: {
  width: number;
  height: number;
  x: number;
  y: number;
  radius?: number;
}): boolean;
