export function shouldLockRouteDetectionNavigation(flowStep) {
  return flowStep === "analyzingHolds" || flowStep === "selectingRoute";
}
