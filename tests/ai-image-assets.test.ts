import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  buildAiImageZipArchive,
  normalizeAiImageAssetCreateInput,
  normalizeAiImageAssetBulkDeleteInput,
  normalizeAiImageAssetZipDownloadInput,
  normalizeAiImageAssetUpdateInput,
} from "../src/server/ai-image-assets";

test("normalizeAiImageAssetCreateInput prepares a generated image asset", () => {
  assert.deepEqual(
    normalizeAiImageAssetCreateInput({
      mode: "custom",
      title: "  红色跑车海报  ",
      description: "  小红书封面  ",
      prompt: "  prompt  ",
      imageUrl: "/api/uploads/ai-images/a.png",
      downloadUrl: "/api/uploads/ai-images/a.png",
      fileName: "a.png",
      mimeType: "image/png",
    }),
    {
      mode: "custom",
      sourceTool: null,
      status: "SUCCEEDED",
      jobId: null,
      title: "红色跑车海报",
      description: "小红书封面",
      caption: null,
      tags: [],
      productKeywords: [],
      prompt: "prompt",
      imageUrl: "/api/uploads/ai-images/a.png",
      downloadUrl: "/api/uploads/ai-images/a.png",
      fileName: "a.png",
      mimeType: "image/png",
      errorMessage: null,
      referenceImages: [],
      referenceLabels: [],
    },
  );
});

test("AiImageAsset migrations include reference image persistence", () => {
  const migrationsDir = join(process.cwd(), "prisma", "migrations");
  const migrationSql = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(migrationsDir, entry.name, "migration.sql"))
    .map((filePath) => readFileSync(filePath, "utf8"))
    .join("\n");

  assert.match(migrationSql, /"referenceImages"/);
  assert.match(migrationSql, /"referenceLabels"/);
});

test("gallery exposes one-click deletion for selected and filtered generated images", () => {
  const gallery = readFileSync(
    "src/components/tools/ai-image-gallery-workbench.tsx",
    "utf8",
  );

  assert.match(gallery, /一键删除已选/);
  assert.match(gallery, /清空当前筛选/);
  assert.match(gallery, /deleteAssets\(assets\.map\(\(asset\) => asset\.id\)\)/);
});

test("normalizeAiImageAssetCreateInput rejects unsupported modes", () => {
  assert.throws(
    () =>
      normalizeAiImageAssetCreateInput({
        mode: "other",
        title: "标题",
        prompt: "prompt",
        imageUrl: "/image.png",
        downloadUrl: "/image.png",
        fileName: "image.png",
      }),
    /工具类型不正确/,
  );
});

test("normalizeAiImageAssetCreateInput accepts unified gallery tool modes", () => {
  for (const mode of ["menswear", "womenswear", "snack-grocery", "ip-prototype"]) {
    assert.equal(
      normalizeAiImageAssetCreateInput({
        mode,
        title: "标题",
        prompt: "prompt",
        imageUrl: "/image.png",
        downloadUrl: "/image.png",
        fileName: "image.png",
      }).mode,
      mode,
    );
  }
});

test("normalizeAiImageAssetUpdateInput trims editable title and note", () => {
  assert.deepEqual(
    normalizeAiImageAssetUpdateInput({
      title: "  新标题  ",
      note: "  可复用到封面  ",
    }),
    {
      title: "新标题",
      note: "可复用到封面",
    },
  );

  assert.deepEqual(
    normalizeAiImageAssetUpdateInput({
      title: "标题",
      note: "   ",
    }),
    {
      title: "标题",
      note: null,
    },
  );
});

test("normalizeAiImageAssetBulkDeleteInput keeps unique non-empty ids and limits batch size", () => {
  const ids = normalizeAiImageAssetBulkDeleteInput({
    ids: [" a ", "", "a", "b", ...Array.from({ length: 80 }, (_, index) => `id-${index}`)],
  });

  assert.equal(ids[0], "a");
  assert.equal(ids[1], "b");
  assert.equal(ids.length, 60);
  assert.throws(
    () => normalizeAiImageAssetBulkDeleteInput({ ids: [] }),
    /请选择要删除的图片/,
  );
});

test("normalizeAiImageAssetZipDownloadInput keeps unique ids for one archive", () => {
  assert.deepEqual(
    normalizeAiImageAssetZipDownloadInput({ ids: [" image-a ", "image-a", "image-b"] }),
    ["image-a", "image-b"],
  );
  assert.throws(
    () => normalizeAiImageAssetZipDownloadInput({ ids: [] }),
    /请选择要打包的图片/,
  );
});

test("buildAiImageZipArchive creates a readable ZIP with collision-safe file names", () => {
  const archive = buildAiImageZipArchive([
    { fileName: "cover.png", content: Buffer.from("first") },
    { fileName: "cover.png", content: Buffer.from("second") },
    { fileName: "cover-2.png", content: Buffer.from("third") },
  ]);

  assert.equal(archive.subarray(0, 4).toString("binary"), "PK\x03\x04");
  assert.match(archive.toString("utf8"), /cover\.png/);
  assert.match(archive.toString("utf8"), /cover-2\.png/);
  assert.match(archive.toString("utf8"), /cover-2-2\.png/);
  assert.equal(archive.includes(Buffer.from("PK\x05\x06", "binary")), true);
});
