import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertAdminAccountChangeIsSafe,
  normalizeManagedUserCreateInput,
  normalizeManagedUserUpdateInput,
} from "../src/server/user-management";

test("normalizeManagedUserCreateInput creates a standard user account by default", () => {
  assert.deepEqual(
    normalizeManagedUserCreateInput({
      username: "  Studio.User ",
      email: " USER@example.com ",
      password: "secure-pass-2026",
    }),
    {
      username: "studio.user",
      email: "user@example.com",
      password: "secure-pass-2026",
      role: "USER",
    },
  );
});

test("normalizeManagedUserUpdateInput rejects weak passwords and invalid roles", () => {
  assert.throws(
    () => normalizeManagedUserUpdateInput({ password: "short" }),
    /至少 8 位/,
  );
  assert.throws(
    () => normalizeManagedUserUpdateInput({ role: "OWNER" }),
    /角色无效/,
  );
});

test("assertAdminAccountChangeIsSafe preserves at least one enabled administrator", () => {
  assert.throws(
    () => assertAdminAccountChangeIsSafe({ currentRole: "ADMIN", enabledAdminCount: 1, nextDisabled: true, nextRole: "ADMIN" }),
    /至少保留一个启用的管理员/,
  );
  assert.throws(
    () => assertAdminAccountChangeIsSafe({ currentRole: "ADMIN", enabledAdminCount: 1, nextDisabled: false, nextRole: "USER" }),
    /至少保留一个启用的管理员/,
  );
  assert.doesNotThrow(
    () => assertAdminAccountChangeIsSafe({ currentRole: "ADMIN", enabledAdminCount: 2, nextDisabled: true, nextRole: "ADMIN" }),
  );
});
