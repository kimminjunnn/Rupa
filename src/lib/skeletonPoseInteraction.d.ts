export function shouldAllowSkeletonPinchScale(
  mode: "calibrating" | "simulating",
  allowPinchScaleInSimulation: boolean,
  simulationInputMode?: "quadrants" | "handles",
): boolean;

export function getSkeletonOverlayPointerEvents(
  allowEmptySpacePinchScale: boolean,
): "auto" | "box-none";

export function shouldHandleQuadrantDrag(input: {
  mode: "calibrating" | "simulating";
  simulationInputMode: "quadrants" | "handles";
  touchCount: number;
}): boolean;

export function getVisibleQuadrantHintEndpoints(input: {
  activeEndpointNames: Array<"leftHand" | "rightHand" | "leftFoot" | "rightFoot">;
  previewEndpointName: "leftHand" | "rightHand" | "leftFoot" | "rightFoot" | null;
}): Array<"leftHand" | "rightHand" | "leftFoot" | "rightFoot">;

export function isSkeletonPointActive(input: {
  activeControlId: string | null | undefined;
  activeQuadrantEndpointNames: Array<
    "leftHand" | "rightHand" | "leftFoot" | "rightFoot"
  >;
  pointName: string;
}): boolean;

export function getTwoHandDynoCoreDelta(input: {
  armMaxReach: number;
  leftRoot: { x: number; y: number };
  leftStart: { x: number; y: number };
  leftTarget: { x: number; y: number };
  rightRoot: { x: number; y: number };
  rightStart: { x: number; y: number };
  rightTarget: { x: number; y: number };
}): { x: 0; y: number } | null;

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
