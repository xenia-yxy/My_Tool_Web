import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildOssObjectKey,
  buildOssObjectUrl,
  getAliyunOssConfig,
  isAliyunOssEnabled,
  normalizeOssObjectKey,
  shouldMigrateRuntimeUrl,
  shouldUseRuntimeStorage,
} from "../src/server/oss-storage";

test("isAliyunOssEnabled requires every server-side credential field", () => {
  assert.equal(isAliyunOssEnabled({}), false);
  assert.equal(
    isAliyunOssEnabled({
      ALIYUN_OSS_ACCESS_KEY_ID: "id",
      ALIYUN_OSS_ACCESS_KEY_SECRET: "secret",
      ALIYUN_OSS_BUCKET: "bucket",
      ALIYUN_OSS_ENDPOINT: "oss-cn-beijing.aliyuncs.com",
    }),
    true,
  );
});

test("getAliyunOssConfig normalizes endpoint and public base url", () => {
  assert.deepEqual(
    getAliyunOssConfig({
      ALIYUN_OSS_ACCESS_KEY_ID: "id",
      ALIYUN_OSS_ACCESS_KEY_SECRET: "secret",
      ALIYUN_OSS_BUCKET: "design-yshine",
      ALIYUN_OSS_ENDPOINT: "https://oss-cn-beijing.aliyuncs.com/",
      ALIYUN_OSS_PUBLIC_BASE_URL: "https://design-yshine.oss-cn-beijing.aliyuncs.com/",
      ALIYUN_OSS_PREFIX: "/xenia/images/",
    }),
    {
      accessKeyId: "id",
      accessKeySecret: "secret",
      bucket: "design-yshine",
      endpoint: "oss-cn-beijing.aliyuncs.com",
      publicBaseUrl: "https://design-yshine.oss-cn-beijing.aliyuncs.com",
      prefix: "xenia/images",
    },
  );
});

test("normalizeOssObjectKey keeps generated files under the configured prefix", () => {
  assert.equal(
    normalizeOssObjectKey("xenia/images", "2026-07-13-test.png"),
    "xenia/images/2026-07-13-test.png",
  );
  assert.equal(
    normalizeOssObjectKey("", "/nested/test.png"),
    "nested/test.png",
  );
});

test("builds separate OSS keys for generated and reference images", () => {
  assert.equal(
    buildOssObjectKey("xenia", "generated", "2026-07-20-image.png"),
    "xenia/generated/2026-07-20-image.png",
  );
  assert.equal(
    buildOssObjectKey("xenia", "references", "face.jpg"),
    "xenia/references/face.jpg",
  );
});

test("uses runtime storage only when OSS credentials are unavailable", () => {
  assert.equal(shouldUseRuntimeStorage({}), true);
  assert.equal(
    shouldUseRuntimeStorage({
      ALIYUN_OSS_ACCESS_KEY_ID: "id",
      ALIYUN_OSS_ACCESS_KEY_SECRET: "secret",
      ALIYUN_OSS_BUCKET: "design-yshine",
      ALIYUN_OSS_ENDPOINT: "oss-cn-beijing.aliyuncs.com",
    }),
    false,
  );
});

test("migrates only local runtime image URLs", () => {
  assert.equal(shouldMigrateRuntimeUrl("/api/uploads/ai-images/ref-2026-07-20-a.png"), true);
  assert.equal(
    shouldMigrateRuntimeUrl("https://design-yshine.oss-cn-beijing.aliyuncs.com/xenia/references/a.png"),
    false,
  );
});

test("buildOssObjectUrl supports bucket endpoint and custom public domain", () => {
  assert.equal(
    buildOssObjectUrl({
      bucket: "design-yshine",
      endpoint: "oss-cn-beijing.aliyuncs.com",
      objectKey: "xenia/images/a b.png",
    }),
    "https://design-yshine.oss-cn-beijing.aliyuncs.com/xenia/images/a%20b.png",
  );
  assert.equal(
    buildOssObjectUrl({
      bucket: "design-yshine",
      endpoint: "oss-cn-beijing.aliyuncs.com",
      publicBaseUrl: "https://design-yshine.cn-beijing.taihangcda.cn",
      objectKey: "xenia/images/a.png",
    }),
    "https://design-yshine.cn-beijing.taihangcda.cn/xenia/images/a.png",
  );
});
