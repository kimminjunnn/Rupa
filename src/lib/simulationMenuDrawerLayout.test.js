const assert = require("node:assert/strict");
const test = require("node:test");

const {
  getSimulationMenuDrawerPadding,
} = require("./simulationMenuDrawerLayout.js");

test("keeps drawer below the notch when first modal render has no top inset", () => {
  assert.equal(getSimulationMenuDrawerPadding({ bottom: 0, top: 0 }).paddingTop, 76);
});

test("uses measured top inset when safe-area context is ready", () => {
  assert.equal(
    getSimulationMenuDrawerPadding({ bottom: 34, top: 59 }).paddingTop,
    77,
  );
});

test("keeps drawer content above the home indicator when bottom inset is missing", () => {
  assert.equal(
    getSimulationMenuDrawerPadding({ bottom: 0, top: 0 }).paddingBottom,
    52,
  );
});
