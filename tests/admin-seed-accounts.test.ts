import assert from "node:assert/strict";
import { test } from "node:test";
import {
  readAdminSeedAccounts,
  readUserSeedAccounts,
} from "../src/server/admin-seed-accounts";

test("readAdminSeedAccounts keeps legacy single admin env", () => {
  assert.deepEqual(
    readAdminSeedAccounts({
      ADMIN_EMAIL: " owner@example.com ",
      ADMIN_USERNAME: " Owner ",
      ADMIN_PASSWORD: "Owner-Admin-2026",
    }),
    [
      {
        email: "owner@example.com",
        username: "owner",
        password: "Owner-Admin-2026",
        role: "ADMIN",
      },
    ],
  );
});

test("readAdminSeedAccounts reads three numbered admin accounts", () => {
  assert.deepEqual(
    readAdminSeedAccounts({
      ADMIN_1_EMAIL: "owner@example.com",
      ADMIN_1_USERNAME: "owner",
      ADMIN_1_PASSWORD: "Owner-Admin-2026",
      ADMIN_2_EMAIL: "editor@example.com",
      ADMIN_2_USERNAME: "editor",
      ADMIN_2_PASSWORD: "Editor-Admin-2026",
      ADMIN_3_EMAIL: "operator@example.com",
      ADMIN_3_USERNAME: "operator",
      ADMIN_3_PASSWORD: "Operator-Admin-2026",
    }),
    [
      { email: "owner@example.com", username: "owner", password: "Owner-Admin-2026", role: "ADMIN" },
      { email: "editor@example.com", username: "editor", password: "Editor-Admin-2026", role: "ADMIN" },
      { email: "operator@example.com", username: "operator", password: "Operator-Admin-2026", role: "ADMIN" },
    ],
  );
});

test("readUserSeedAccounts reads three user accounts", () => {
  assert.deepEqual(
    readUserSeedAccounts({
      USER_1_EMAIL: "user1@example.com",
      USER_1_USERNAME: "user1",
      USER_1_PASSWORD: "User-One-2026",
      USER_2_EMAIL: "user2@example.com",
      USER_2_USERNAME: "user2",
      USER_2_PASSWORD: "User-Two-2026",
      USER_3_EMAIL: "user3@example.com",
      USER_3_USERNAME: "user3",
      USER_3_PASSWORD: "User-Three-2026",
    }),
    [
      { email: "user1@example.com", username: "user1", password: "User-One-2026", role: "USER" },
      { email: "user2@example.com", username: "user2", password: "User-Two-2026", role: "USER" },
      { email: "user3@example.com", username: "user3", password: "User-Three-2026", role: "USER" },
    ],
  );
});

test("readAdminSeedAccounts rejects incomplete admin accounts", () => {
  assert.throws(
    () =>
      readAdminSeedAccounts({
        ADMIN_1_EMAIL: "owner@example.com",
        ADMIN_1_USERNAME: "owner",
      }),
    /ADMIN_1_EMAIL, ADMIN_1_USERNAME and ADMIN_1_PASSWORD/,
  );
});
