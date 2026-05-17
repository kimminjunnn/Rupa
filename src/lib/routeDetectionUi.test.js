const assert = require("node:assert/strict");
const test = require("node:test");

const { shouldLockRouteDetectionNavigation } = require("./routeDetectionUi.js");

test("locks navigation while wall or route detection is running", () => {
  assert.equal(shouldLockRouteDetectionNavigation("analyzingHolds"), true);
  assert.equal(shouldLockRouteDetectionNavigation("selectingRoute"), true);
});

test("unlocks navigation after detection is no longer running", () => {
  assert.equal(shouldLockRouteDetectionNavigation("selectingStartHold"), false);
  assert.equal(shouldLockRouteDetectionNavigation("routeEditing"), false);
  assert.equal(shouldLockRouteDetectionNavigation("sizingSkeleton"), false);
  assert.equal(shouldLockRouteDetectionNavigation("simulating"), false);
});

test("keeps route detection loading copy compact without timing hints", () => {
  assert.equal("getRouteDetectionProgressHint" in require("./routeDetectionUi.js"), false);
});

test("does not expose route detection navigation lock copy", () => {
  assert.equal("getRouteDetectionNavigationLockReason" in require("./routeDetectionUi.js"), false);
});
