import { createHmac } from "node:crypto";

type EnvSource = Record<string, string | undefined>;

export type AliyunOssConfig = {
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  endpoint: string;
  publicBaseUrl?: string;
  prefix: string;
};

type BuildOssUrlInput = {
  bucket: string;
  endpoint: string;
  publicBaseUrl?: string;
  objectKey: string;
};

const requiredEnvKeys = [
  "ALIYUN_OSS_ACCESS_KEY_ID",
  "ALIYUN_OSS_ACCESS_KEY_SECRET",
  "ALIYUN_OSS_BUCKET",
  "ALIYUN_OSS_ENDPOINT",
] as const;

export function isAliyunOssEnabled(env: EnvSource = process.env) {
  return requiredEnvKeys.every((key) => Boolean(env[key]?.trim()));
}

export function getAliyunOssConfig(env: EnvSource = process.env): AliyunOssConfig {
  const missing = requiredEnvKeys.filter((key) => !env[key]?.trim());

  if (missing.length > 0) {
    throw new Error(`缺少 OSS 环境变量：${missing.join(", ")}`);
  }

  return {
    accessKeyId: env.ALIYUN_OSS_ACCESS_KEY_ID!.trim(),
    accessKeySecret: env.ALIYUN_OSS_ACCESS_KEY_SECRET!.trim(),
    bucket: env.ALIYUN_OSS_BUCKET!.trim(),
    endpoint: normalizeEndpoint(env.ALIYUN_OSS_ENDPOINT!.trim()),
    publicBaseUrl: normalizeOptionalBaseUrl(env.ALIYUN_OSS_PUBLIC_BASE_URL),
    prefix: normalizePathPrefix(env.ALIYUN_OSS_PREFIX || "xenia/ai-images"),
  };
}

export function normalizeOssObjectKey(prefix: string, fileName: string) {
  const normalizedPrefix = normalizePathPrefix(prefix);
  const normalizedFileName = fileName.replace(/^\/+/, "").replace(/\\/g, "/");

  return [normalizedPrefix, normalizedFileName].filter(Boolean).join("/");
}

export function buildOssObjectUrl(input: BuildOssUrlInput) {
  const baseUrl =
    input.publicBaseUrl?.replace(/\/+$/, "") ||
    `https://${input.bucket}.${normalizeEndpoint(input.endpoint)}`;

  return `${baseUrl}/${encodeObjectKey(input.objectKey)}`;
}

export async function uploadBufferToAliyunOss(input: {
  buffer: Buffer;
  fileName: string;
  contentType: string;
  config?: AliyunOssConfig;
}) {
  const config = input.config ?? getAliyunOssConfig();
  const objectKey = normalizeOssObjectKey(config.prefix, input.fileName);
  const date = new Date().toUTCString();
  const resource = `/${config.bucket}/${objectKey}`;
  const signature = signOssRequest({
    accessKeySecret: config.accessKeySecret,
    method: "PUT",
    contentType: input.contentType,
    date,
    resource,
  });
  const uploadUrl = `https://${config.bucket}.${config.endpoint}/${encodeObjectKey(objectKey)}`;
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `OSS ${config.accessKeyId}:${signature}`,
      "Content-Type": input.contentType,
      Date: date,
    },
    body: new Uint8Array(input.buffer),
  });

  if (!response.ok) {
    throw new Error(`OSS 上传失败：${response.status} ${await response.text()}`);
  }

  return {
    objectKey,
    imageUrl: buildOssObjectUrl({
      bucket: config.bucket,
      endpoint: config.endpoint,
      publicBaseUrl: config.publicBaseUrl,
      objectKey,
    }),
  };
}

export async function deleteAliyunOssObjectByUrl(
  imageUrl: string,
  config: AliyunOssConfig = getAliyunOssConfig(),
) {
  const objectKey = extractObjectKeyFromUrl(imageUrl, config);

  if (!objectKey) {
    return false;
  }

  const date = new Date().toUTCString();
  const resource = `/${config.bucket}/${objectKey}`;
  const signature = signOssRequest({
    accessKeySecret: config.accessKeySecret,
    method: "DELETE",
    contentType: "",
    date,
    resource,
  });
  const deleteUrl = `https://${config.bucket}.${config.endpoint}/${encodeObjectKey(objectKey)}`;
  const response = await fetch(deleteUrl, {
    method: "DELETE",
    headers: {
      Authorization: `OSS ${config.accessKeyId}:${signature}`,
      Date: date,
    },
  });

  return response.ok || response.status === 404;
}

function signOssRequest(input: {
  accessKeySecret: string;
  method: "PUT" | "DELETE";
  contentType: string;
  date: string;
  resource: string;
}) {
  const canonicalString = [
    input.method,
    "",
    input.contentType,
    input.date,
    input.resource,
  ].join("\n");

  return createHmac("sha1", input.accessKeySecret)
    .update(canonicalString)
    .digest("base64");
}

function extractObjectKeyFromUrl(imageUrl: string, config: AliyunOssConfig) {
  let parsed: URL;

  try {
    parsed = new URL(imageUrl);
  } catch {
    return null;
  }

  const expectedHosts = new Set([
    `${config.bucket}.${config.endpoint}`,
    config.publicBaseUrl ? new URL(config.publicBaseUrl).host : "",
  ]);

  if (!expectedHosts.has(parsed.host)) {
    return null;
  }

  return decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
}

function normalizeEndpoint(value: string) {
  return value
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
}

function normalizeOptionalBaseUrl(value: string | undefined) {
  const normalized = value?.trim().replace(/\/+$/, "");

  return normalized || undefined;
}

function normalizePathPrefix(value: string) {
  return value.trim().replace(/^\/+|\/+$/g, "");
}

function encodeObjectKey(objectKey: string) {
  return objectKey
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}
