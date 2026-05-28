import assert from "node:assert/strict";
import test from "node:test";

import { shouldShowSkeletonSizingHint } from "./skeletonSizingHint.js";

test("shows the skeleton sizing hint only while sizing the skeleton", () => {
  assert.equal(shouldShowSkeletonSizingHint("sizingSkeleton"), true);
  assert.equal(shouldShowSkeletonSizingHint("routeEditing"), false);
  assert.equal(shouldShowSkeletonSizingHint("simulating"), false);
});
