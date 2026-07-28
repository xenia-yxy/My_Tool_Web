import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canAccessAdmin,
  canUseMemberTools,
  canUseActiveSession,
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

test("disabled or invalidated accounts cannot keep using an existing session", () => {
  assert.equal(
    canUseActiveSession({ disabledAt: null, authVersion: 3 }, 3),
    true,
  );
  assert.equal(
    canUseActiveSession({ disabledAt: new Date(), authVersion: 3 }, 3),
    false,
  );
  assert.equal(
    canUseActiveSession({ disabledAt: null, authVersion: 4 }, 3),
    false,
  );
});
