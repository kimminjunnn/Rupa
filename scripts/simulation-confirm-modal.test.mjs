import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const simulationCanvasSource = readFileSync(
  new URL("../src/components/SimulationCanvasStage.tsx", import.meta.url),
  "utf8",
);

const settingsSource = readFileSync(
  new URL("../app/(tabs)/settings.tsx", import.meta.url),
  "utf8",
);

test("simulation clear confirmation uses exit copy and primary action tone", () => {
  assert.match(simulationCanvasSource, /title="시뮬레이션을 종료할까요\?"/);
  assert.match(simulationCanvasSource, /confirmTone="primary"/);
  assert.doesNotMatch(simulationCanvasSource, /title="사진을 삭제할까요\?"/);
});

test("settings save confirmation uses the primary action tone", () => {
  assert.match(settingsSource, /confirmLabel="저장"/);
  assert.match(settingsSource, /confirmTone="primary"/);
});
