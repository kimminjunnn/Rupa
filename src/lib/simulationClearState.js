function getDistanceSquared(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return dx * dx + dy * dy;
}

export function isSimulationClearComplete({
  leftHand,
  rightHand,
  threshold,
  topHoldCenter,
}) {
  if (!topHoldCenter || threshold <= 0) {
    return false;
  }

  const thresholdSquared = threshold * threshold;

  return (
    getDistanceSquared(leftHand, topHoldCenter) <= thresholdSquared &&
    getDistanceSquared(rightHand, topHoldCenter) <= thresholdSquared
  );
}
