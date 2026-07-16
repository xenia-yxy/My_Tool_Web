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
import { buildDefaultAiRuntimeConfigs } from "@/server/ai-gateway/provider-registry";

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

export function normalizeAiModelConfigInput(input: AiModelConfigInput) {
  const provider = normalizeProvider(input.provider);
  const displayName = readTrimmedString(input.displayName);
  const baseUrl = trimTrailingSlash(readTrimmedString(input.baseUrl));
  const model = readTrimmedString(input.model);
  const apiKey = readTrimmedString(input.apiKey);
  const capabilities = normalizeCapabilities(input.capabilities);

  if (!displayName) {
    throw new Error("模型名称不能为空");
  }

  if (!model) {
    throw new Error("模型 ID 不能为空");
  }

  if (!apiKey) {
    throw new Error("API Key 不能为空");
  }

  if (capabilities.length === 0) {
    throw new Error("至少选择一个模型能力");
  }

  return {
    provider,
    displayName,
    baseUrl,
    model,
    apiKey,
    apiKeyPreview: maskApiKey(apiKey),
    capabilities,
    enabled: input.enabled === false ? false : true,
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
