import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canAccessAdmin,
  canUseMemberTools,
} from "../src/server/auth-permissions";

test("admin access remains restricted to admin users", () => {
  assert.equal(canAccessAdmin("ADMIN"), true);
  assert.equal(canAccessAdmin("USER"), false);
  assert.equal(canAccessAdmin(undefined), false);
});

test("member tools are available to signed-in users and admins", () => {
  assert.equal(canUseMemberTools("ADMIN"), true);
  assert.equal(canUseMemberTools("USER"), true);
  assert.equal(canUseMemberTools(undefined), false);
});
