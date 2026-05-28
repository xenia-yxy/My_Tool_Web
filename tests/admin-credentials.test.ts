import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildAdminCredentialWhere,
  normalizeAdminIdentifier,
} from "../src/server/admin-credentials";

test("normalizeAdminIdentifier trims and lowercases login names", () => {
  assert.equal(normalizeAdminIdentifier("  YangXinYu  "), "yangxinyu");
});

test("buildAdminCredentialWhere allows login by email or username", () => {
  assert.deepEqual(buildAdminCredentialWhere(" yangxinyu "), {
    OR: [{ email: "yangxinyu" }, { name: "yangxinyu" }],
  });
});
