const assert = require("node:assert/strict");
const test = require("node:test");

const {
  isSimulationClearComplete,
} = require("./simulationClearState.js");

test("completes only when both hands are near the top hold in viewport coordinates", () => {
  const topHoldCenter = { x: 120, y: 80 };
  const threshold = 24;

  assert.equal(
    isSimulationClearComplete({
      leftHand: { x: 112, y: 88 },
      rightHand: { x: 135, y: 70 },
      topHoldCenter,
      threshold,
    }),
    true,
  );

  assert.equal(
    isSimulationClearComplete({
      leftHand: { x: 112, y: 88 },
      rightHand: { x: 160, y: 80 },
      topHoldCenter,
      threshold,
    }),
    false,
  );
});

test("does not complete without a selected top hold center", () => {
  assert.equal(
    isSimulationClearComplete({
      leftHand: { x: 120, y: 80 },
      rightHand: { x: 122, y: 82 },
      topHoldCenter: null,
      threshold: 24,
    }),
    false,
  );
});
