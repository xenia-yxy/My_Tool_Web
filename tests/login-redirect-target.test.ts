import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveLoginRedirectTarget } from "../src/lib/login-redirect-target";

test("resolveLoginRedirectTarget prefers safe relative callback over absolute provider result", () => {
  assert.equal(
    resolveLoginRedirectTarget({
      callbackUrl: "/account",
      resultUrl: "http://localhost:3000/account",
    }),
    "/account",
  );
});

test("resolveLoginRedirectTarget rejects unsafe relative callbacks", () => {
  assert.equal(
    resolveLoginRedirectTarget({
      callbackUrl: "//example.com/account",
      resultUrl: "http://localhost:3001/account",
    }),
    "http://localhost:3001/account",
  );
});

test("resolveLoginRedirectTarget falls back to default when no safe target exists", () => {
  assert.equal(
    resolveLoginRedirectTarget({
      callbackUrl: "",
      resultUrl: "",
      defaultUrl: "/account",
    }),
    "/account",
  );
});
