import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("production compose provides a local postgres database for app services", () => {
  const compose = readFileSync("docker-compose.prod.yml", "utf8");

  assert.match(compose, /my-web-postgres:/);
  assert.match(compose, /postgres:16-alpine/);
  assert.match(compose, /my-web-postgres-data:/);
  assert.doesNotMatch(compose, /db\.prisma\.io/);
  assert.match(compose, /my-web-postgres:[\s\S]*env_file:[\s\S]*- \.env\.production/);
  assert.match(compose, /depends_on:[\s\S]*my-web-postgres/);
});
