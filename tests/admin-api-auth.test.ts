import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getAdminApiCorsHeaders,
  isAuthorizedAdminApiRequest,
} from "../src/server/admin-api-auth";

test("admin API authorizes only matching bearer tokens", () => {
  const request = new Request("https://example.com/api/admin/health", {
    headers: {
      authorization: "Bearer server-token",
    },
  });

  assert.equal(isAuthorizedAdminApiRequest(request, "server-token"), true);
  assert.equal(isAuthorizedAdminApiRequest(request, "other-token"), false);
  assert.equal(isAuthorizedAdminApiRequest(request, ""), false);
});

test("admin API rejects missing and malformed authorization headers", () => {
  assert.equal(
    isAuthorizedAdminApiRequest(
      new Request("https://example.com/api/admin/health"),
      "server-token",
    ),
    false,
  );
  assert.equal(
    isAuthorizedAdminApiRequest(
      new Request("https://example.com/api/admin/health", {
        headers: { authorization: "Basic server-token" },
      }),
      "server-token",
    ),
    false,
  );
});

test("admin API CORS allows configured local admin origins only", () => {
  const allowed = getAdminApiCorsHeaders(
    "http://localhost:3002",
    "http://localhost:3002,https://admin.example.com",
  );
  const blocked = getAdminApiCorsHeaders(
    "https://public.example.com",
    "http://localhost:3002,https://admin.example.com",
  );

  assert.equal(allowed["Access-Control-Allow-Origin"], "http://localhost:3002");
  assert.equal(allowed["Access-Control-Allow-Headers"], "Authorization, Content-Type");
  assert.equal(blocked["Access-Control-Allow-Origin"], undefined);
});
