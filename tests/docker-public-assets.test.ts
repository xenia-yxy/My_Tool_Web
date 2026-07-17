import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("production image includes public assets used by the floating agent", () => {
  const dockerfile = readFileSync("Dockerfile", "utf8");

  assert.match(dockerfile, /COPY --from=builder \/app\/public \.\/public/);
});
