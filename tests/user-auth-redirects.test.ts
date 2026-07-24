import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildUserLoginHref,
  normalizeUserCallbackPath,
} from "../src/server/user-auth-redirects";

test("normalizeUserCallbackPath accepts local absolute paths", () => {
  assert.equal(normalizeUserCallbackPath("/account"), "/account");
  assert.equal(normalizeUserCallbackPath("/tools"), "/tools");
  assert.equal(
    normalizeUserCallbackPath("/knowledge/article-1"),
    "/knowledge/article-1",
  );
});

test("normalizeUserCallbackPath rejects unsafe or missing paths", () => {
  assert.equal(normalizeUserCallbackPath(undefined), "/account");
  assert.equal(normalizeUserCallbackPath(""), "/account");
  assert.equal(normalizeUserCallbackPath("https://example.com"), "/account");
  assert.equal(normalizeUserCallbackPath("//example.com"), "/account");
  assert.equal(normalizeUserCallbackPath(["/tools", "/account"]), "/tools");
});

test("buildUserLoginHref opens the homepage login prompt with callback URLs", () => {
  assert.equal(buildUserLoginHref("/account"), "/?login=1&callbackUrl=%2Faccount");
  assert.equal(buildUserLoginHref("/tools"), "/?login=1&callbackUrl=%2Ftools");
  assert.equal(
    buildUserLoginHref("/knowledge/article-1"),
    "/?login=1&callbackUrl=%2Fknowledge%2Farticle-1",
  );
});
