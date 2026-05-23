require("sucrase/register");

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  resolveReliablePhotoDimensions,
} = require("./photoDimensions.ts");

test("uses decoded image dimensions when picker metadata has a different orientation", () => {
  assert.deepEqual(
    resolveReliablePhotoDimensions(
      { width: 4032, height: 3024 },
      { width: 3024, height: 4032 },
    ),
    { width: 3024, height: 4032 },
  );
});
