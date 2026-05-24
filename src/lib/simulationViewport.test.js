require("sucrase/register");

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  clampAdjustmentTranslations,
  clampTranslations,
  getBaseDimensions,
  resolveAdjustmentTranslations,
  resolvePhotoLayerFrame,
} = require("./simulationViewport.ts");

const photo = {
  uri: "file://wall.jpg",
  width: 3024,
  height: 4032,
  source: "library",
  updatedAt: 1,
};

test("adjustment photo frame always covers the visible viewport", () => {
  const viewport = { width: 393, height: 552 };
  const base = getBaseDimensions(photo, viewport.width, viewport.height);
  const frame = resolvePhotoLayerFrame(
    0,
    0,
    1,
    base.width,
    base.height,
    viewport.width,
    viewport.height,
  );

  assert.ok(frame.left <= 0, "left edge must not reveal the viewport");
  assert.ok(frame.top <= 0, "top edge must not reveal the viewport");
  assert.ok(
    frame.left + frame.width >= viewport.width,
    "right edge must cover the viewport",
  );
  assert.ok(
    frame.top + frame.height >= viewport.height,
    "bottom edge must cover the viewport",
  );
});

test("adjustment photo frame clamps vertical movement before black gaps appear", () => {
  const viewport = { width: 393, height: 552 };
  const base = getBaseDimensions(photo, viewport.width, viewport.height);
  const clamped = clampTranslations(
    0,
    10_000,
    1,
    base.width,
    base.height,
    viewport.width,
    viewport.height,
  );
  const frame = resolvePhotoLayerFrame(
    0,
    10_000,
    1,
    base.width,
    base.height,
    viewport.width,
    viewport.height,
  );

  assert.ok(clamped.y < 10_000);
  assert.equal(frame.top + frame.height, viewport.height);
});

test("adjustment translation blocks vertical dragging before zooming", () => {
  const viewport = { width: 393, height: 552 };
  const base = getBaseDimensions(photo, viewport.width, viewport.height);

  assert.deepEqual(
    resolveAdjustmentTranslations(
      20,
      120,
      1,
      base.width,
      base.height,
      viewport.width,
      viewport.height,
    ),
    { x: 0, y: 0 },
  );
});

test("adjustment translation allows dragging only within the zoomed viewport layer", () => {
  const viewport = { width: 393, height: 552 };
  const base = getBaseDimensions(photo, viewport.width, viewport.height);
  const resolved = resolveAdjustmentTranslations(
    10_000,
    10_000,
    2,
    base.width,
    base.height,
    viewport.width,
    viewport.height,
  );

  assert.equal(resolved.x, viewport.width / 2);
  assert.equal(resolved.y, viewport.height / 2);
});

test("adjustment translation keeps vertical photo edges outside the viewport", () => {
  const viewport = { width: 393, height: 552 };
  const base = getBaseDimensions(photo, viewport.width, viewport.height);
  const resolved = clampAdjustmentTranslations(
    0,
    10_000,
    1.5,
    base.width,
    base.height,
    viewport.width,
    viewport.height,
  );
  const normal = clampTranslations(
    0,
    10_000,
    1.5,
    base.width,
    base.height,
    viewport.width,
    viewport.height,
  );

  assert.ok(resolved.y < normal.y);
  assert.ok(resolved.y <= viewport.height * 0.14);
});
