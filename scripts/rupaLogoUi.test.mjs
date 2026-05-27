import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  simulationInput: "src/components/SimulationInputStage.tsx",
  simulationDrawer: "src/components/SimulationMenuDrawer.tsx",
  settings: "app/(tabs)/settings.tsx",
};

test("simulation and settings headers render the Rupa logo asset", async () => {
  const [simulationInput, simulationDrawer, settings] = await Promise.all(
    Object.values(files).map((file) => readFile(file, "utf8")),
  );

  assert.match(simulationInput, /require\("\.\.\/\.\.\/assets\/rupa-logo\.png"\)/);
  assert.match(simulationInput, /style=\{styles\.headerLogo\}/);
  assert.doesNotMatch(simulationInput, /<Text style=\{styles\.heroTitle\}>새 시뮬레이션<\/Text>/);

  assert.match(simulationDrawer, /require\("\.\.\/\.\.\/assets\/rupa-logo\.png"\)/);
  assert.match(simulationDrawer, /style=\{styles\.drawerLogo\}/);
  assert.doesNotMatch(simulationDrawer, /시뮬레이션 메뉴/);

  assert.match(settings, /require\("\.\.\/\.\.\/assets\/rupa-logo\.png"\)/);
  assert.match(settings, /style=\{styles\.settingsLogo\}/);
  assert.match(settings, /style=\{styles\.settingsHeader\}/);
});
