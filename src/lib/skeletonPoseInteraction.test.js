const assert = require("node:assert/strict");
const test = require("node:test");

const {
  getQuadrantEndpointName,
  getSkeletonOverlayPointerEvents,
  getTutorialDirectJointMarkerStyle,
  isQuadrantEndpointAllowed,
  isCoreDragStart,
  shouldAllowSkeletonPinchScale,
} = require("./skeletonPoseInteraction.js");

test("allows skeleton pinch scale in simulation only when explicitly enabled", () => {
  assert.equal(shouldAllowSkeletonPinchScale("calibrating", false), true);
  assert.equal(shouldAllowSkeletonPinchScale("simulating", false), false);
  assert.equal(shouldAllowSkeletonPinchScale("simulating", true), true);
});

test("uses a touchable overlay when empty-space pinch scaling is enabled", () => {
  assert.equal(getSkeletonOverlayPointerEvents(false), "box-none");
  assert.equal(getSkeletonOverlayPointerEvents(true), "auto");
});

test("selects limb endpoints from screen quadrants", () => {
  const viewport = { width: 400, height: 800 };

  assert.equal(getQuadrantEndpointName({ ...viewport, x: 10, y: 10 }), "leftHand");
  assert.equal(
    getQuadrantEndpointName({ ...viewport, x: 390, y: 10 }),
    "rightHand",
  );
  assert.equal(
    getQuadrantEndpointName({ ...viewport, x: 10, y: 790 }),
    "leftFoot",
  );
  assert.equal(
    getQuadrantEndpointName({ ...viewport, x: 390, y: 790 }),
    "rightFoot",
  );
});

test("allows only the requested tutorial endpoint when a quadrant is constrained", () => {
  assert.equal(
    isQuadrantEndpointAllowed({
      allowedEndpointName: "leftHand",
      endpointName: "leftHand",
    }),
    true,
  );
  assert.equal(
    isQuadrantEndpointAllowed({
      allowedEndpointName: "leftHand",
      endpointName: "rightHand",
    }),
    false,
  );
  assert.equal(
    isQuadrantEndpointAllowed({
      allowedEndpointName: null,
      endpointName: "rightFoot",
    }),
    true,
  );
});

test("uses right and bottom quadrants on center lines", () => {
  const viewport = { width: 400, height: 800 };

  assert.equal(
    getQuadrantEndpointName({ ...viewport, x: 200, y: 399 }),
    "rightHand",
  );
  assert.equal(
    getQuadrantEndpointName({ ...viewport, x: 199, y: 400 }),
    "leftFoot",
  );
  assert.equal(
    getQuadrantEndpointName({ ...viewport, x: 200, y: 400 }),
    "rightFoot",
  );
});

test("detects core drag starts inside the center circle", () => {
  const viewport = { width: 400, height: 800 };

  assert.equal(isCoreDragStart({ ...viewport, x: 200, y: 400 }), true);
  assert.equal(isCoreDragStart({ ...viewport, x: 235, y: 435 }), true);
});

test("includes the core drag circle boundary", () => {
  const viewport = { width: 400, height: 800 };

  assert.equal(isCoreDragStart({ ...viewport, x: 252, y: 400 }), true);
  assert.equal(isCoreDragStart({ ...viewport, x: 200, y: 452 }), true);
});

test("rejects core drag starts outside the center circle", () => {
  const viewport = { width: 400, height: 800 };

  assert.equal(isCoreDragStart({ ...viewport, x: 253, y: 400 }), false);
  assert.equal(isCoreDragStart({ ...viewport, x: 200, y: 453 }), false);
});

test("supports a custom core drag radius", () => {
  const viewport = { width: 400, height: 800 };

  assert.equal(
    isCoreDragStart({ ...viewport, x: 230, y: 400, radius: 30 }),
    true,
  );
  assert.equal(
    isCoreDragStart({ ...viewport, x: 231, y: 400, radius: 30 }),
    false,
  );
});

test("renders direct joint tutorial markers as small thin rings", () => {
  const markerStyle = getTutorialDirectJointMarkerStyle({
    jointActiveRadius: 10.5,
  });

  assert.deepEqual(markerStyle, {
    fill: "transparent",
    radius: 11.5,
    stroke: "rgba(254,214,96,0.78)",
    strokeWidth: 1.75,
  });
  assert.ok(markerStyle.radius < 10.5 + 3);
  assert.ok(markerStyle.strokeWidth < 3);
});
