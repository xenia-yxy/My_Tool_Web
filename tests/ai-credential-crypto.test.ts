import assert from "node:assert/strict";
import { test } from "node:test";
import {
  decryptApiKey,
  encryptApiKey,
  maskApiKey,
} from "../src/server/ai-gateway/credential-crypto";

test("encryptApiKey stores API keys in a decryptable non-plain format", () => {
  const encrypted = encryptApiKey("sk-test-secret", "local-encryption-secret");

  assert.notEqual(encrypted, "sk-test-secret");
  assert.match(encrypted, /^v1:/);
  assert.equal(decryptApiKey(encrypted, "local-encryption-secret"), "sk-test-secret");
});

test("decryptApiKey rejects a wrong secret", () => {
  const encrypted = encryptApiKey("sk-test-secret", "local-encryption-secret");

  assert.throws(
    () => decryptApiKey(encrypted, "wrong-secret"),
    /API Key 解密失败/,
  );
});

test("maskApiKey keeps only a safe preview", () => {
  assert.equal(maskApiKey("sk-1234567890abcdef"), "sk-1...cdef");
  assert.equal(maskApiKey("short"), "已配置");
});
