import assert from "node:assert/strict";
import { test } from "node:test";
import {
  imageCleanupTargetIds,
  normalizeImageCleanupTargets,
} from "../src/server/image-cleanup";

test("normalizeImageCleanupTargets defaults to every cleanup target", () => {
  assert.deepEqual(normalizeImageCleanupTargets(undefined), imageCleanupTargetIds);
});

test("normalizeImageCleanupTargets keeps only supported unique targets", () => {
  assert.deepEqual(
    normalizeImageCleanupTargets([
      "generated-gallery",
      "unknown",
      "generated-gallery",
      "runtime-files",
    ]),
    ["generated-gallery", "runtime-files"],
  );
});
