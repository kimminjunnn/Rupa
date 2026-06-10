export function shouldAllowSkeletonPinchScale(
  mode,
  allowPinchScaleInSimulation,
  simulationInputMode = "handles",
) {
  if (mode === "calibrating") {
    return true;
  }

  return allowPinchScaleInSimulation && simulationInputMode !== "quadrants";
}

export function getSkeletonOverlayPointerEvents(allowEmptySpacePinchScale) {
  return allowEmptySpacePinchScale ? "auto" : "box-none";
}

export function shouldHandleQuadrantDrag({
  mode,
  simulationInputMode,
  touchCount,
}) {
  return (
    mode === "simulating" &&
    simulationInputMode === "quadrants" &&
    touchCount > 0
  );
}

export function getVisibleQuadrantHintEndpoints({
  activeEndpointNames,
  previewEndpointName,
}) {
  const endpointNames = [];

  activeEndpointNames.forEach((endpointName) => {
    if (!endpointNames.includes(endpointName)) {
      endpointNames.push(endpointName);
    }
  });

  if (
    previewEndpointName !== null &&
    !endpointNames.includes(previewEndpointName)
  ) {
    endpointNames.push(previewEndpointName);
  }

  return endpointNames;
}

export function isSkeletonPointActive({
  activeControlId,
  activeQuadrantEndpointNames,
  pointName,
}) {
  return (
    pointName === activeControlId ||
    activeQuadrantEndpointNames.includes(pointName)
  );
}

function pointDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function getTwoHandDynoCoreDelta({
  armMaxReach,
  leftRoot,
  leftStart,
  leftTarget,
  rightRoot,
  rightStart,
  rightTarget,
}) {
  const averageDragY =
    (leftTarget.y - leftStart.y + rightTarget.y - rightStart.y) / 2;

  if (averageDragY >= 0) {
    return null;
  }

  const leftOverflow = Math.max(
    0,
    pointDistance(leftRoot, leftTarget) - armMaxReach,
  );
  const rightOverflow = Math.max(
    0,
    pointDistance(rightRoot, rightTarget) - armMaxReach,
  );
  const averageOverflow = (leftOverflow + rightOverflow) / 2;

  if (averageOverflow <= 0) {
    return null;
  }

  return { x: 0, y: -averageOverflow };
}

export function getTutorialDirectJointMarkerStyle({ jointActiveRadius }) {
  return {
    fill: "transparent",
    radius: jointActiveRadius + 1,
    stroke: "rgba(254,214,96,0.78)",
    strokeWidth: 1.75,
  };
}

export function getQuadrantEndpointName({ width, height, x, y }) {
  const isLeft = x < width / 2;
  const isTop = y < height / 2;

  if (isTop) {
    return isLeft ? "leftHand" : "rightHand";
  }

  return isLeft ? "leftFoot" : "rightFoot";
}

export function isQuadrantEndpointAllowed({
  allowedEndpointName,
  endpointName,
}) {
  return allowedEndpointName === null || endpointName === allowedEndpointName;
}

export function isCoreDragStart({ width, height, x, y, radius = 52 }) {
  const centerX = width / 2;
  const centerY = height / 2;
  const dx = x - centerX;
  const dy = y - centerY;

  return dx * dx + dy * dy <= radius * radius;
}
