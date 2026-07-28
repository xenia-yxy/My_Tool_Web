import {
  decryptApiKey,
  encryptApiKey,
  maskApiKey,
} from "@/server/ai-gateway/credential-crypto";
import { prisma } from "@/lib/prisma";
import type {
  AiCapability,
  AiModelRuntimeConfig,
  AiProvider,
} from "@/server/ai-gateway/provider-registry";
import {
  buildDefaultAiRuntimeConfigs,
  createAiGateway,
} from "@/server/ai-gateway/provider-registry";

const supportedProviders = new Set<AiProvider>([
  "openai-compatible",
  "openai",
  "openrouter",
  "anthropic",
  "google",
  "aizhzo",
  "custom",
]);

const supportedCapabilities = new Set<AiCapability>([
  "text",
  "vision",
  "image.generate",
  "image.edit",
  "audio.transcribe",
  "audio.speech",
  "embedding",
  "video.generate",
  "tools",
]);

export type AiModelConfigInput = {
  provider?: unknown;
  displayName?: unknown;
  baseUrl?: unknown;
  model?: unknown;
  apiKey?: unknown;
  capabilities?: unknown;
  enabled?: unknown;
};

type StoredApiKey = Pick<AiModelConfigRecord, "encryptedApiKey" | "apiKeyPreview">;

type AiProviderPreset = {
  baseUrl: string;
  model: string;
  capabilities: AiCapability[];
};

const providerPresets: Record<AiProvider, AiProviderPreset> = {
  "openai-compatible": {
    baseUrl: "https://api.openai.com",
    model: "gpt-4o-mini",
    capabilities: ["text", "vision"],
  },
  openai: {
    baseUrl: "https://api.openai.com",
    model: "gpt-4o-mini",
    capabilities: ["text", "vision"],
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api",
    model: "openai/gpt-4o-mini",
    capabilities: ["text", "vision"],
  },
  anthropic: {
    baseUrl: "https://api.anthropic.com",
    model: "claude-sonnet-4-5",
    capabilities: ["text"],
  },
  google: {
    baseUrl: "https://generativelanguage.googleapis.com",
    model: "gemini-2.5-pro",
    capabilities: ["text", "vision"],
  },
  aizhzo: {
    baseUrl: "https://api.aizhzo.com",
    model: "gpt-image-2",
    capabilities: ["image.generate", "image.edit"],
  },
  custom: {
    baseUrl: "",
    model: "",
    capabilities: ["text"],
  },
};

export type AiModelConfigRecord = {
  id: string;
  provider: string;
  displayName: string;
  baseUrl: string | null;
  model: string;
  encryptedApiKey: string;
  apiKeyPreview: string;
  capabilities: string[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date | null;
};

export function getAiProviderPreset(value: unknown): AiProviderPreset {
  const preset = providerPresets[normalizeProvider(value)];

  return {
    baseUrl: preset.baseUrl,
    model: preset.model,
    capabilities: [...preset.capabilities],
  };
}

export function resolveAiModelConfigTestCapability(
  capabilities: readonly string[],
): AiCapability {
  const normalized = normalizeCapabilities(capabilities);

  if (normalized.includes("text")) return "text";
  if (normalized.includes("vision")) return "vision";
  if (normalized.includes("image.generate")) return "image.generate";
  if (normalized.includes("image.edit")) return "image.edit";

  throw new Error("该配置没有可测试的文本、视觉或图片能力");
}

export function normalizeAiModelConfigInput(input: AiModelConfigInput) {
  const apiKey = readTrimmedString(input.apiKey);

  if (!apiKey) {
    throw new Error("API Key 不能为空");
  }

  return {
    ...normalizeAiModelConfigFields(input),
    apiKey,
    apiKeyPreview: maskApiKey(apiKey),
  };
}

export function normalizeAiModelConfigUpdateInput(
  input: AiModelConfigInput,
  existingKey: StoredApiKey,
) {
  const apiKey = readTrimmedString(input.apiKey);

  return {
    ...normalizeAiModelConfigFields(input),
    encryptedApiKey: apiKey || existingKey.encryptedApiKey,
    apiKeyPreview: apiKey ? maskApiKey(apiKey) : existingKey.apiKeyPreview,
  };
}

export function serializeAiModelConfig(record: AiModelConfigRecord) {
  return {
    id: record.id,
    provider: record.provider,
    displayName: record.displayName,
    baseUrl: record.baseUrl,
    model: record.model,
    apiKeyPreview: record.apiKeyPreview,
    capabilities: record.capabilities,
    enabled: record.enabled,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    lastUsedAt: record.lastUsedAt?.toISOString() ?? null,
  };
}

export function toRuntimeModelConfig(
  record: AiModelConfigRecord,
  decrypt: (value: string) => string,
): AiModelRuntimeConfig {
  const provider = normalizeProvider(record.provider);

  return {
    id: record.id,
    provider,
    baseUrl: trimTrailingSlash(record.baseUrl || getDefaultProviderBaseUrl(provider)),
    model: record.model,
    apiKey: decrypt(record.encryptedApiKey),
    capabilities: normalizeCapabilities(record.capabilities),
    enabled: record.enabled,
  };
}

export async function listUserAiModelConfigs(userId: string) {
  const records = await prisma.aiProviderCredential.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return records.map(serializeAiModelConfig);
}

export async function createUserAiModelConfig(
  userId: string,
  input: AiModelConfigInput,
) {
  const normalized = normalizeAiModelConfigInput(input);
  const record = await prisma.aiProviderCredential.create({
    data: {
      userId,
      provider: normalized.provider,
      displayName: normalized.displayName,
      baseUrl: normalized.baseUrl || null,
      model: normalized.model,
      encryptedApiKey: encryptApiKey(
        normalized.apiKey,
        getAiCredentialEncryptionSecret(),
      ),
      apiKeyPreview: normalized.apiKeyPreview,
      capabilities: normalized.capabilities,
      enabled: normalized.enabled,
    },
  });

  return serializeAiModelConfig(record);
}

export async function deleteUserAiModelConfig(userId: string, id: string) {
  const record = await prisma.aiProviderCredential.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!record) {
    throw new Error("模型配置不存在");
  }

  await prisma.aiProviderCredential.delete({ where: { id } });

  return { ok: true };
}

export async function updateUserAiModelConfig(
  userId: string,
  id: string,
  input: AiModelConfigInput,
) {
  const record = await prisma.aiProviderCredential.findFirst({
    where: { id, userId },
  });

  if (!record) {
    throw new Error("模型配置不存在");
  }

  const normalized = normalizeAiModelConfigUpdateInput(input, record);
  const replacementApiKey = readTrimmedString(input.apiKey);
  const encryptedApiKey = replacementApiKey
    ? encryptApiKey(replacementApiKey, getAiCredentialEncryptionSecret())
    : normalized.encryptedApiKey;
  const updated = await prisma.aiProviderCredential.update({
    where: { id },
    data: {
      provider: normalized.provider,
      displayName: normalized.displayName,
      baseUrl: normalized.baseUrl || null,
      model: normalized.model,
      encryptedApiKey,
      apiKeyPreview: normalized.apiKeyPreview,
      capabilities: normalized.capabilities,
      enabled: normalized.enabled,
    },
  });

  return serializeAiModelConfig(updated);
}

export async function testUserAiModelConfig(userId: string, id: string) {
  const record = await prisma.aiProviderCredential.findFirst({
    where: { id, userId, enabled: true },
  });

  if (!record) {
    throw new Error("模型配置不存在或尚未启用");
  }

  const runtimeConfig = toRuntimeModelConfig(
    record,
    (value) => decryptApiKey(value, getAiCredentialEncryptionSecret()),
  );
  const capability = resolveAiModelConfigTestCapability(runtimeConfig.capabilities);
  const gateway = createAiGateway({ models: [runtimeConfig] });

  if (capability === "text" || capability === "vision") {
    await gateway.generateText({
      messages: [{ role: "user", content: "Reply with OK only." }],
      temperature: 0,
    });
  } else if (capability === "image.generate") {
    await gateway.generateImage({
      prompt: "A single plain white square. No text.",
      size: "1024x1024",
      quality: "low",
    });
  } else {
    await gateway.editImage({
      prompt: "Keep this image unchanged.",
      size: "1024x1024",
      quality: "low",
      image: new File([transparentPng], "connection-test.png", { type: "image/png" }),
    });
  }

  await prisma.aiProviderCredential.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  });

  return { capability };
}

export async function buildAiRuntimeConfigsForUser(userId?: string) {
  const envConfigs = buildDefaultAiRuntimeConfigs();

  if (!userId) {
    return envConfigs;
  }

  const records = await prisma.aiProviderCredential.findMany({
    where: { userId, enabled: true },
    orderBy: { createdAt: "desc" },
  });
  const secret = getAiCredentialEncryptionSecret();
  const userConfigs = records.map((record) =>
    toRuntimeModelConfig(record, (value) => decryptApiKey(value, secret)),
  );

  return [...userConfigs, ...envConfigs];
}

function getAiCredentialEncryptionSecret(env: Record<string, string | undefined> = process.env) {
  const secret =
    env.AI_CREDENTIAL_ENCRYPTION_KEY || env.AUTH_SECRET || env.NEXTAUTH_SECRET || "";

  if (!secret) {
    throw new Error("缺少 AI_CREDENTIAL_ENCRYPTION_KEY 环境变量");
  }

  return secret;
}

function normalizeProvider(value: unknown): AiProvider {
  const provider = readTrimmedString(value) as AiProvider;

  if (!supportedProviders.has(provider)) {
    throw new Error("不支持的模型供应商");
  }

  return provider;
}

function normalizeCapabilities(value: unknown): AiCapability[] {
  const rawItems = Array.isArray(value) ? value : [];
  const items: AiCapability[] = [];

  rawItems.forEach((item) => {
    const capability = readTrimmedString(item) as AiCapability;

    if (supportedCapabilities.has(capability) && !items.includes(capability)) {
      items.push(capability);
    }
  });

  return items;
}

function normalizeAiModelConfigFields(input: AiModelConfigInput) {
  const provider = normalizeProvider(input.provider);
  const displayName = readTrimmedString(input.displayName);
  const baseUrl = trimTrailingSlash(readTrimmedString(input.baseUrl));
  const model = readTrimmedString(input.model);
  const capabilities = normalizeCapabilities(input.capabilities);

  if (!displayName) {
    throw new Error("模型名称不能为空");
  }

  if (!model) {
    throw new Error("模型 ID 不能为空");
  }

  if (capabilities.length === 0) {
    throw new Error("至少选择一个模型能力");
  }

  return {
    provider,
    displayName,
    baseUrl,
    model,
    capabilities,
    enabled: input.enabled === false ? false : true,
  };
}

function readTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function getDefaultProviderBaseUrl(provider: AiProvider) {
  if (provider === "openai" || provider === "openai-compatible") {
    return "https://api.openai.com";
  }

  if (provider === "openrouter") {
    return "https://openrouter.ai/api";
  }

  if (provider === "anthropic") {
    return "https://api.anthropic.com";
  }

  if (provider === "google") {
    return "https://generativelanguage.googleapis.com";
  }

  if (provider === "aizhzo") {
    return "https://api.aizhzo.com";
  }

  return "";
}

const transparentPng = new Uint8Array([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
  0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137,
  0, 0, 0, 13, 73, 68, 65, 84, 8, 215, 99, 248, 207, 192, 240,
  31, 0, 5, 0, 1, 255, 137, 153, 61, 29, 0, 0, 0, 0, 73, 69,
  78, 68, 174, 66, 96, 130,
]);
