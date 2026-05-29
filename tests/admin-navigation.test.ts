import assert from "node:assert/strict";
import { test } from "node:test";
import { isAdminNavItemActive } from "../src/components/admin/admin-nav-items";

test("isAdminNavItemActive only highlights dashboard on the exact admin root", () => {
  assert.equal(isAdminNavItemActive("/admin", "/admin"), true);
  assert.equal(isAdminNavItemActive("/admin/content", "/admin"), false);
});

test("isAdminNavItemActive highlights nested admin module routes", () => {
  assert.equal(isAdminNavItemActive("/admin/content", "/admin/content"), true);
  assert.equal(isAdminNavItemActive("/admin/content/new", "/admin/content"), true);
  assert.equal(isAdminNavItemActive("/admin/content/abc123", "/admin/content"), true);
  assert.equal(isAdminNavItemActive("/admin/orders", "/admin/content"), false);
});
