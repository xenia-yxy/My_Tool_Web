import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildFailedLoginUpdate,
  getClientIpFromHeaders,
  isSafeAuthRedirect,
  validateAdminPasswordPolicy,
} from "../src/server/admin-login-security";
import nextConfig from "../next.config";

test("validateAdminPasswordPolicy requires enterprise baseline strength", () => {
  assert.equal(validateAdminPasswordPolicy("Short1!").ok, false);
  assert.equal(validateAdminPasswordPolicy("longbutnoclass").ok, false);
  assert.equal(validateAdminPasswordPolicy("StrongPassword1!").ok, true);
  assert.equal(validateAdminPasswordPolicy("Another-Admin-2026").ok, true);
});

test("buildFailedLoginUpdate locks after the maximum failed attempts", () => {
  const now = new Date("2026-07-08T10:00:00.000Z");

  assert.deepEqual(buildFailedLoginUpdate(3, now), {
    failedLoginCount: 4,
    lockedUntil: null,
  });

  assert.deepEqual(buildFailedLoginUpdate(4, now), {
    failedLoginCount: 5,
    lockedUntil: new Date("2026-07-08T10:15:00.000Z"),
  });
});

test("getClientIpFromHeaders prefers forwarded client IP", () => {
  const headers = new Headers({
    "x-forwarded-for": "203.0.113.10, 10.0.0.1",
    "x-real-ip": "198.51.100.2",
  });

  assert.equal(getClientIpFromHeaders(headers), "203.0.113.10");
  assert.equal(getClientIpFromHeaders(new Headers({ "x-real-ip": "198.51.100.2" })), "198.51.100.2");
  assert.equal(getClientIpFromHeaders(new Headers()), null);
});

test("isSafeAuthRedirect allows relative and same-origin redirects only", () => {
  assert.equal(isSafeAuthRedirect("/admin", "https://example.com"), true);
  assert.equal(
    isSafeAuthRedirect("https://example.com/admin", "https://example.com"),
    true,
  );
  assert.equal(
    isSafeAuthRedirect("https://evil.example/admin", "https://example.com"),
    false,
  );
  assert.equal(isSafeAuthRedirect("javascript:alert(1)", "https://example.com"), false);
});

test("sensitive login and model routes are protected by no-store security headers", async () => {
  const headers = await nextConfig.headers?.();
  const accountModels = headers?.find(
    (item) => item.source === "/api/ai-model-configs/:path*",
  );
  const accountPages = headers?.find((item) => item.source === "/account/:path*");
  const globalHeaders = headers?.find((item) => item.source === "/:path*");

  assert.ok(accountModels);
  assert.ok(accountPages);
  assert.equal(
    accountModels.headers.some(
      (header) => header.key === "Cache-Control" && header.value === "no-store",
    ),
    true,
  );
  assert.equal(
    accountPages.headers.some(
      (header) => header.key === "Cache-Control" && header.value === "no-store",
    ),
    true,
  );
  assert.equal(
    globalHeaders?.headers.some(
      (header) => header.key === "X-Frame-Options" && header.value === "DENY",
    ),
    true,
  );
});
