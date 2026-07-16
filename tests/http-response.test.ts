import assert from "node:assert/strict";
import { test } from "node:test";
import { readJsonResponse } from "../src/lib/http-response";

test("readJsonResponse returns an empty object for empty response bodies", async () => {
  const payload = await readJsonResponse(new Response("", { status: 401 }));

  assert.deepEqual(payload, {});
});

test("readJsonResponse returns an empty object for non-json response bodies", async () => {
  const payload = await readJsonResponse(
    new Response("<html>error</html>", { status: 500 }),
  );

  assert.deepEqual(payload, {});
});

test("readJsonResponse parses json response bodies", async () => {
  const payload = await readJsonResponse(
    new Response(JSON.stringify({ error: "UNAUTHORIZED" }), { status: 401 }),
  );

  assert.deepEqual(payload, { error: "UNAUTHORIZED" });
});
