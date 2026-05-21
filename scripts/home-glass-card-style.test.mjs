import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const source = readFileSync(
  new URL("../src/components/HomeGlassCard.tsx", import.meta.url),
  "utf8",
);

test("HomeGlassCard keeps only the logo and simulator label in a compact hero card", () => {
  assert.match(source, /minHeight:\s*150,/);
  assert.match(source, /logoEyebrowGroup:\s*{[\s\S]*?gap:\s*4,/);
  assert.match(source, /<View style={styles\.logoEyebrowGroup}>[\s\S]*?styles\.logoImage[\s\S]*?styles\.eyebrow[\s\S]*?<\/View>/);
  assert.doesNotMatch(source, /styles\.title/);
  assert.doesNotMatch(source, /styles\.description/);
});

test("HomeGlassCard keeps the remaining brand mark centered in a full-width card", () => {
  assert.match(source, /shell:\s*{[\s\S]*?alignSelf:\s*"stretch",/);
  assert.doesNotMatch(source, /alignSelf:\s*"center"/);
  assert.match(source, /logoImage:\s*{[\s\S]*?width:\s*190,[\s\S]*?height:\s*79,/);
  assert.match(source, /eyebrow:\s*{[\s\S]*?fontSize:\s*12,[\s\S]*?letterSpacing:\s*2\.8,/);
});

test("HomeGlassCard removes the transparent decorative overlay layers", () => {
  assert.doesNotMatch(source, /styles\.softFill/);
  assert.doesNotMatch(source, /styles\.topShine/);
  assert.doesNotMatch(source, /styles\.innerGlow/);
  assert.doesNotMatch(source, /styles\.borderOverlay/);
  assert.doesNotMatch(source, /softFill:/);
  assert.doesNotMatch(source, /topShine:/);
  assert.doesNotMatch(source, /innerGlow:/);
  assert.doesNotMatch(source, /borderOverlay:/);
});
