import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("production compose provides a local postgres database for app services", () => {
  const compose = readFileSync("docker-compose.prod.yml", "utf8");

  assert.match(compose, /my-web-postgres:/);
  assert.match(compose, /postgres:16-alpine/);
  assert.match(compose, /my-web-postgres-data:/);
  assert.match(compose, /DATABASE_URL:\s*postgresql:\/\/my_web:\$\{POSTGRES_PASSWORD\}@my-web-postgres:5432\/my_web\?schema=public/);
  assert.match(compose, /depends_on:[\s\S]*my-web-postgres/);
});
