import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  buildOwnedMenswearMaterialWhere,
  normalizeMenswearMaterialInput,
  normalizeMenswearModelProfileImages,
  normalizeMenswearModelProfileInput,
  normalizeMenswearProjectInput,
  normalizeMenswearProjectReference,
} from "../src/server/menswear-studio";

test("menswear studio migration creates private materials, model profiles, and references", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  const migration = readFileSync(
    "prisma/migrations/20260714140000_add_menswear_studio/migration.sql",
    "utf8",
  );

  assert.match(schema, /model MenswearMaterial/);
  assert.match(schema, /model MenswearModelProfile/);
  assert.match(schema, /model MenswearProjectReference/);
  assert.match(migration, /CREATE TABLE "MenswearMaterial"/);
  assert.match(migration, /FOREIGN KEY \("authorId"\)/);
});

test("normalizes a private material and deduplicates tags", () => {
  assert.deepEqual(
    normalizeMenswearMaterialInput({
      category: "top",
      imageUrl: " /api/uploads/ai-images/shirt.png ",
      name: "  浅黄色短袖衬衫  ",
      rightsStatus: "PUBLIC",
      tags: ["夏季", "衬衫", "夏季", ""],
    }),
    {
      analysis: {},
      category: "top",
      imageUrl: "/api/uploads/ai-images/shirt.png",
      maskUrl: null,
      name: "浅黄色短袖衬衫",
      previewUrl: null,
      promptNotes: null,
      rightsStatus: "PUBLIC",
      sourceType: "UPLOAD",
      sourceUrl: null,
      tags: ["夏季", "衬衫"],
    },
  );
});

test("builds material lookup constrained to the current user", () => {
  assert.deepEqual(buildOwnedMenswearMaterialWhere("user-1", "material-1"), {
    authorId: "user-1",
    id: "material-1",
  });
});

test("normalizes a consented model profile with bounded lock strengths", () => {
  assert.deepEqual(
    normalizeMenswearModelProfileInput({
      bodyLockStrength: 150,
      consentConfirmed: true,
      faceLockStrength: 95,
      hairLockStrength: -4,
      name: "  男模特 01 ",
      profile: { ageFeeling: "大学生", height: "178cm" },
    }),
    {
      bodyLockStrength: 100,
      consentConfirmed: true,
      faceLockStrength: 95,
      hairLockStrength: 0,
      name: "男模特 01",
      profile: { ageFeeling: "大学生", height: "178cm" },
      status: "READY",
    },
  );
});

test("normalizes ordered model profile image references", () => {
  assert.deepEqual(
    normalizeMenswearModelProfileImages([
      { materialId: "face-1", position: 3, role: "face" },
      { materialId: "body-1", role: "body" },
      { materialId: "face-1", position: 4, role: "face" },
    ]),
    [
      { materialId: "face-1", position: 0, role: "face" },
      { materialId: "body-1", position: 0, role: "body" },
    ],
  );
});

test("normalizes an ordered project reference with a role and lock policy", () => {
  assert.deepEqual(
    normalizeMenswearProjectReference({
      allowedChanges: ["光线", "光线"],
      fidelity: 140,
      materialId: "material-1",
      policy: "LOCKED",
      position: 9,
      role: "top",
    }),
    {
      allowedChanges: ["光线"],
      fidelity: 100,
      materialId: "material-1",
      policy: "LOCKED",
      position: 9,
      role: "top",
    },
  );
});

test("normalizes a strict menswear project with ordered references", () => {
  assert.deepEqual(
    normalizeMenswearProjectInput({
      description: "  校园通勤男装图  ",
      modelProfileId: " model-1 ",
      name: "  夏季衬衫项目  ",
      references: [
        { materialId: "shirt-1", policy: "LOCKED", position: 0, role: "top" },
      ],
      settings: { aspectRatio: "portrait", batchCount: 4 },
    }),
    {
      description: "校园通勤男装图",
      modelProfileId: "model-1",
      name: "夏季衬衫项目",
      references: [
        {
          allowedChanges: [],
          fidelity: 100,
          materialId: "shirt-1",
          policy: "LOCKED",
          position: 0,
          role: "top",
        },
      ],
      settings: { aspectRatio: "portrait", batchCount: 4 },
      status: "DRAFT",
    },
  );
});
