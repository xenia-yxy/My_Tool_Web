import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPassword, verifyPassword } from "../src/server/password";

test("hashPassword creates a verifiable password hash", async () => {
  const hash = await hashPassword("correct horse battery staple");

  assert.match(hash, /^scrypt\$/);
  assert.equal(await verifyPassword("correct horse battery staple", hash), true);
  assert.equal(await verifyPassword("wrong password", hash), false);
});

test("verifyPassword rejects malformed hashes", async () => {
  assert.equal(await verifyPassword("anything", "not-a-real-hash"), false);
});
