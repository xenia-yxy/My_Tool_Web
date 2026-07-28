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

export type AiModelRouteTargetType = "AUTO" | "SYSTEM" | "CREDENTIAL";

export type AiModelRouteInput = {
  capability?: unknown;
  targetType?: unknown;
  credentialId?: unknown;
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

export type ActiveAiModelSelection = {
  capability: AiCapability;
  source: "user" | "system" | "missing";
  id: string | null;
  provider: string | null;
  displayName: string;
  model: string | null;
  baseUrlHost: string | null;
  enabled: boolean;
  routeTargetType: AiModelRouteTargetType;
  routeCredentialId: string | null;
  routeStatus: "ok" | "fallback" | "missing";
  routeMessage: string | null;
  candidates: ActiveAiModelRouteCandidate[];
};

export type ActiveAiModelRouteCandidate = {
  value: string;
  targetType: AiModelRouteTargetType;
  credentialId: string | null;
  label: string;
  source: "auto" | "system" | "user";
  provider: string | null;
  model: string | null;
  baseUrlHost: string | null;
};

type AiModelRouteRecord = {
  capability: string;
  targetType: string;
  credentialId: string | null;
};

type SelectableAiModelConfig = {
  id: string;
  provider: AiProvider;
  displayName: string;
  baseUrl: string | null;
  model: string;
  capabilities: AiCapability[];
  enabled: boolean;
  source: "user" | "system";
  runtime?: AiModelRuntimeConfig;
};

type ResolvedAiModelSelection = {
  capability: AiCapability;
  routeTargetType: AiModelRouteTargetType;
  routeCredentialId: string | null;
  routeStatus: "ok" | "fallback" | "missing";
  routeMessage: string | null;
  match: SelectableAiModelConfig | null;
};

const displayCapabilities: AiCapability[] = [
  "text",
  "vision",
  "image.generate",
  "image.edit",
  "audio.transcribe",
  "audio.speech",
  "embedding",
  "video.generate",
  "tools",
];

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

export async function listActiveAiModelSelectionsForUser(userId: string) {
  const [records, routes] = await Promise.all([
    prisma.aiProviderCredential.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.aiModelRoute.findMany({
      where: { userId },
    }),
  ]);
  const userConfigs = records.map((record) => toSelectableUserConfig(record));
  const systemConfigs = buildSelectableSystemConfigs();
  const routeMap = buildRouteMap(routes);

  return displayCapabilities.map((capability): ActiveAiModelSelection => {
    const resolved = resolveAiModelSelectionForCapability({
      capability,
      route: routeMap.get(capability),
      userConfigs,
      systemConfigs,
    });
    const candidates = buildRouteCandidatesForCapability(
      capability,
      userConfigs,
      systemConfigs,
    );
    const match = resolved.match;

    if (!match) {
      return {
        capability,
        source: "missing",
        id: null,
        provider: null,
        displayName: "未配置",
        model: null,
        baseUrlHost: null,
        enabled: false,
        routeTargetType: resolved.routeTargetType,
        routeCredentialId: resolved.routeCredentialId,
        routeStatus: "missing",
        routeMessage: resolved.routeMessage || "当前能力没有可用模型，请先添加或启用模型配置",
        candidates,
      };
    }

    return {
      capability,
      source: match.source,
      id: match.id,
      provider: match.provider,
      displayName: match.displayName,
      model: match.model,
      baseUrlHost: getSafeBaseUrlHost(match.baseUrl),
      enabled: match.enabled,
      routeTargetType: resolved.routeTargetType,
      routeCredentialId: resolved.routeCredentialId,
      routeStatus: resolved.routeStatus,
      routeMessage: resolved.routeMessage,
      candidates,
    };
  });
}

export async function updateAiModelRouteForUser(
  userId: string,
  input: AiModelRouteInput,
) {
  const normalized = normalizeAiModelRouteInput(input);

  if (normalized.targetType === "SYSTEM") {
    const hasSystemModel = buildSelectableSystemConfigs().some(
      (config) =>
        config.enabled && config.capabilities.includes(normalized.capability),
    );

    if (!hasSystemModel) {
      throw new Error("系统默认模型暂不支持这个能力");
    }
  }

  if (normalized.targetType === "CREDENTIAL") {
    const credential = await prisma.aiProviderCredential.findFirst({
      where: {
        id: normalized.credentialId || "",
        userId,
      },
    });

    if (!credential) {
      throw new Error("模型配置不存在");
    }

    if (!credential.enabled) {
      throw new Error("这个模型已停用，不能设为当前生效模型");
    }

    if (!normalizeCapabilities(credential.capabilities).includes(normalized.capability)) {
      throw new Error("这个模型不支持当前功能所需能力");
    }
  }

  const route = await prisma.aiModelRoute.upsert({
    where: {
      userId_capability: {
        userId,
        capability: normalized.capability,
      },
    },
    create: {
      userId,
      capability: normalized.capability,
      targetType: normalized.targetType,
      credentialId:
        normalized.targetType === "CREDENTIAL" ? normalized.credentialId : null,
    },
    update: {
      targetType: normalized.targetType,
      credentialId:
        normalized.targetType === "CREDENTIAL" ? normalized.credentialId : null,
    },
  });

  return serializeAiModelRoute(route);
}

export async function listAiModelRoutesForUser(userId: string) {
  const routes = await prisma.aiModelRoute.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return routes.map(serializeAiModelRoute);
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

  const [records, routes] = await Promise.all([
    prisma.aiProviderCredential.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.aiModelRoute.findMany({
      where: { userId },
    }),
  ]);
  const secret = getAiCredentialEncryptionSecret();
  const userConfigs = records.map((record) =>
    toSelectableUserConfig(record, (value) => decryptApiKey(value, secret)),
  );
  const systemConfigs = buildSelectableSystemConfigs(envConfigs);
  const routeMap = buildRouteMap(routes);
  const routedConfigs: AiModelRuntimeConfig[] = [];

  for (const capability of displayCapabilities) {
    const resolved = resolveAiModelSelectionForCapability({
      capability,
      route: routeMap.get(capability),
      userConfigs,
      systemConfigs,
    });

    if (resolved.match?.runtime) {
      routedConfigs.push({
        ...resolved.match.runtime,
        capabilities: [capability],
      });
    }
  }

  return routedConfigs;
}

export function normalizeAiModelRouteInput(input: AiModelRouteInput) {
  const capability = readTrimmedString(input.capability) as AiCapability;
  const targetType = readTrimmedString(input.targetType) as AiModelRouteTargetType;
  const credentialId = readTrimmedString(input.credentialId);

  if (!supportedCapabilities.has(capability)) {
    throw new Error("不支持的模型能力");
  }

  if (!["AUTO", "SYSTEM", "CREDENTIAL"].includes(targetType)) {
    throw new Error("不支持的模型路由类型");
  }

  if (targetType === "CREDENTIAL" && !credentialId) {
    throw new Error("请选择要使用的模型配置");
  }

  return {
    capability,
    targetType,
    credentialId: targetType === "CREDENTIAL" ? credentialId : null,
  };
}

export function serializeAiModelRoute(record: {
  id: string;
  capability: string;
  targetType: string;
  credentialId: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: record.id,
    capability: record.capability,
    targetType: normalizeRouteTargetType(record.targetType),
    credentialId: record.credentialId,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function resolveAiModelSelectionForCapability({
  capability,
  route,
  userConfigs,
  systemConfigs,
}: {
  capability: AiCapability;
  route?: AiModelRouteRecord;
  userConfigs: SelectableAiModelConfig[];
  systemConfigs: SelectableAiModelConfig[];
}): ResolvedAiModelSelection {
  const routeTargetType = normalizeRouteTargetType(route?.targetType);
  const routeCredentialId =
    routeTargetType === "CREDENTIAL" ? route?.credentialId || null : null;
  const autoMatch = pickFirstCapableModel(capability, [
    ...userConfigs,
    ...systemConfigs,
  ]);

  if (routeTargetType === "AUTO") {
    return {
      capability,
      routeTargetType,
      routeCredentialId: null,
      routeStatus: autoMatch ? "ok" : "missing",
      routeMessage: autoMatch ? null : "自动选择没有找到可用模型",
      match: autoMatch,
    };
  }

  if (routeTargetType === "SYSTEM") {
    const systemMatch = pickFirstCapableModel(capability, systemConfigs);

    if (systemMatch) {
      return {
        capability,
        routeTargetType,
        routeCredentialId: null,
        routeStatus: "ok",
        routeMessage: null,
        match: systemMatch,
      };
    }

    return {
      capability,
      routeTargetType,
      routeCredentialId: null,
      routeStatus: autoMatch ? "fallback" : "missing",
      routeMessage: autoMatch
        ? "系统默认模型当前不可用，已临时自动选择可用模型"
        : "系统默认模型当前不可用",
      match: autoMatch,
    };
  }

  const credentialMatch = userConfigs.find(
    (config) =>
      config.id === routeCredentialId &&
      config.enabled &&
      config.capabilities.includes(capability),
  );

  if (credentialMatch) {
    return {
      capability,
      routeTargetType,
      routeCredentialId,
      routeStatus: "ok",
      routeMessage: null,
      match: credentialMatch,
    };
  }

  return {
    capability,
    routeTargetType,
    routeCredentialId,
    routeStatus: autoMatch ? "fallback" : "missing",
    routeMessage: autoMatch
      ? "已选模型当前不可用或不支持该能力，已临时自动选择可用模型"
      : "已选模型当前不可用或不支持该能力",
    match: autoMatch,
  };
}

function buildRouteMap(records: AiModelRouteRecord[]) {
  const map = new Map<AiCapability, AiModelRouteRecord>();

  for (const record of records) {
    const capability = readTrimmedString(record.capability) as AiCapability;

    if (supportedCapabilities.has(capability)) {
      map.set(capability, record);
    }
  }

  return map;
}

function toSelectableUserConfig(
  record: AiModelConfigRecord,
  decrypt?: (value: string) => string,
): SelectableAiModelConfig {
  const runtime = decrypt ? toRuntimeModelConfig(record, decrypt) : undefined;
  const provider = normalizeProvider(record.provider);

  return {
    id: record.id,
    provider,
    displayName: record.displayName,
    baseUrl: record.baseUrl || getDefaultProviderBaseUrl(provider),
    model: record.model,
    capabilities: normalizeCapabilities(record.capabilities),
    enabled: record.enabled,
    source: "user",
    runtime,
  };
}

function buildSelectableSystemConfigs(
  runtimeConfigs = buildDefaultAiRuntimeConfigs(),
): SelectableAiModelConfig[] {
  return runtimeConfigs.map((config) => ({
    id: config.id,
    provider: config.provider,
    displayName: config.id.includes("image")
      ? "系统默认图片模型"
      : "系统默认文本模型",
    baseUrl: config.baseUrl || null,
    model: config.model,
    capabilities: normalizeCapabilities(config.capabilities),
    enabled: config.enabled,
    source: "system",
    runtime: config,
  }));
}

function pickFirstCapableModel(
  capability: AiCapability,
  configs: SelectableAiModelConfig[],
) {
  return (
    configs.find(
      (config) => config.enabled && config.capabilities.includes(capability),
    ) || null
  );
}

function buildRouteCandidatesForCapability(
  capability: AiCapability,
  userConfigs: SelectableAiModelConfig[],
  systemConfigs: SelectableAiModelConfig[],
): ActiveAiModelRouteCandidate[] {
  const candidates: ActiveAiModelRouteCandidate[] = [
    {
      value: buildRouteCandidateValue("AUTO"),
      targetType: "AUTO",
      credentialId: null,
      label: "自动选择（你的模型优先）",
      source: "auto",
      provider: null,
      model: null,
      baseUrlHost: null,
    },
  ];
  const systemMatch = pickFirstCapableModel(capability, systemConfigs);

  if (systemMatch) {
    candidates.push({
      value: buildRouteCandidateValue("SYSTEM"),
      targetType: "SYSTEM",
      credentialId: null,
      label: `系统默认：${systemMatch.displayName} / ${systemMatch.model}`,
      source: "system",
      provider: systemMatch.provider,
      model: systemMatch.model,
      baseUrlHost: getSafeBaseUrlHost(systemMatch.baseUrl),
    });
  }

  for (const config of userConfigs) {
    if (!config.enabled || !config.capabilities.includes(capability)) continue;

    candidates.push({
      value: buildRouteCandidateValue("CREDENTIAL", config.id),
      targetType: "CREDENTIAL",
      credentialId: config.id,
      label: `${config.displayName} / ${config.model}`,
      source: "user",
      provider: config.provider,
      model: config.model,
      baseUrlHost: getSafeBaseUrlHost(config.baseUrl),
    });
  }

  return candidates;
}

function normalizeRouteTargetType(value: unknown): AiModelRouteTargetType {
  return value === "SYSTEM" || value === "CREDENTIAL" ? value : "AUTO";
}

function buildRouteCandidateValue(
  targetType: AiModelRouteTargetType,
  credentialId?: string | null,
) {
  return targetType === "CREDENTIAL" ? `CREDENTIAL:${credentialId || ""}` : targetType;
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

function getSafeBaseUrlHost(value: string | null | undefined) {
  if (!value) return null;

  try {
    return new URL(value).host;
  } catch {
    return value.replace(/^https?:\/\//, "").split("/")[0] || null;
  }
}

const transparentPng = new Uint8Array([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
  0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137,
  0, 0, 0, 13, 73, 68, 65, 84, 8, 215, 99, 248, 207, 192, 240,
  31, 0, 5, 0, 1, 255, 137, 153, 61, 29, 0, 0, 0, 0, 73, 69,
  78, 68, 174, 66, 96, 130,
]);
