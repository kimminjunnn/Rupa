import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const source = readFileSync(
  new URL("../src/components/HomeGlassCard.tsx", import.meta.url),
  "utf8",
);

test("HomeGlassCard keeps only the exported logo image", () => {
  assert.match(source, /<Image[\s\S]*?styles\.logoImage[\s\S]*?\/>/);
  assert.doesNotMatch(source, /볼더링 시뮬레이터/);
  assert.doesNotMatch(source, /styles\.eyebrow/);
  assert.doesNotMatch(source, /logoEyebrowGroup/);
  assert.doesNotMatch(source, /styles\.title/);
  assert.doesNotMatch(source, /styles\.description/);
});

test("HomeGlassCard keeps the logo centered without card chrome", () => {
  assert.doesNotMatch(source, /BlurView/);
  assert.doesNotMatch(source, /styles\.shell/);
  assert.doesNotMatch(source, /styles\.blurLayer/);
  assert.match(source, /content:\s*{[\s\S]*?alignItems:\s*"center",[\s\S]*?justifyContent:\s*"center",/);
  assert.match(source, /logoImage:\s*{[\s\S]*?width:\s*190,[\s\S]*?height:\s*79,/);
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
