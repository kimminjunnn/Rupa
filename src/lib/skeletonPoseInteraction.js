export function shouldAllowSkeletonPinchScale(
  mode,
  allowPinchScaleInSimulation,
) {
  return mode === "calibrating" || allowPinchScaleInSimulation;
}

export function getSkeletonOverlayPointerEvents(allowEmptySpacePinchScale) {
  return allowEmptySpacePinchScale ? "auto" : "box-none";
}

export function getQuadrantEndpointName({ width, height, x, y }) {
  const isLeft = x < width / 2;
  const isTop = y < height / 2;

  if (isTop) {
    return isLeft ? "leftHand" : "rightHand";
  }

  return isLeft ? "leftFoot" : "rightFoot";
}

export function isCoreDragStart({ width, height, x, y, radius = 52 }) {
  const centerX = width / 2;
  const centerY = height / 2;
  const dx = x - centerX;
  const dy = y - centerY;

  return dx * dx + dy * dy <= radius * radius;
}
