import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getAiProviderPreset,
  normalizeAiModelConfigInput,
  normalizeAiModelRouteInput,
  normalizeAiModelConfigUpdateInput,
  resolveAiModelSelectionForCapability,
  serializeAiModelRoute,
  resolveAiModelConfigTestCapability,
  serializeAiModelConfig,
  toRuntimeModelConfig,
} from "../src/server/ai-model-configs";

test("getAiProviderPreset gives an editable starting point for supported providers", () => {
  assert.deepEqual(getAiProviderPreset("openrouter"), {
    baseUrl: "https://openrouter.ai/api",
    model: "openai/gpt-4o-mini",
    capabilities: ["text", "vision"],
  });

  assert.deepEqual(getAiProviderPreset("aizhzo"), {
    baseUrl: "https://api.aizhzo.com",
    model: "gpt-image-2",
    capabilities: ["image.generate", "image.edit"],
  });
});

test("resolveAiModelConfigTestCapability favors a no-cost text connection check", () => {
  assert.equal(
    resolveAiModelConfigTestCapability(["vision", "image.generate"]),
    "vision",
  );
  assert.equal(
    resolveAiModelConfigTestCapability(["image.generate", "image.edit"]),
    "image.generate",
  );
  assert.equal(
    resolveAiModelConfigTestCapability(["image.edit"]),
    "image.edit",
  );
});

test("normalizeAiModelConfigUpdateInput keeps the stored key when no replacement is supplied", () => {
  assert.deepEqual(
    normalizeAiModelConfigUpdateInput(
      {
        provider: "openai-compatible",
        displayName: "我的图像模型",
        baseUrl: "https://api.example.com/",
        model: "image-model-v2",
        chatPath: "v1/chat/completions",
        imageGenerationPath: "/custom/images",
        imageEditPath: "",
        apiKey: "",
        capabilities: ["image.generate"],
        enabled: false,
      },
      { encryptedApiKey: "stored-ciphertext", apiKeyPreview: "sk-a...wxyz" },
    ),
    {
      provider: "openai-compatible",
      displayName: "我的图像模型",
      baseUrl: "https://api.example.com",
      model: "image-model-v2",
      chatPath: "/v1/chat/completions",
      imageGenerationPath: "/custom/images",
      imageEditPath: "",
      encryptedApiKey: "stored-ciphertext",
      apiKeyPreview: "sk-a...wxyz",
      capabilities: ["image.generate"],
      enabled: false,
    },
  );
});

test("normalizeAiModelConfigInput prepares a user-owned model config", () => {
  assert.deepEqual(
    normalizeAiModelConfigInput({
      provider: "openai-compatible",
      displayName: " 我的 OpenRouter ",
      baseUrl: " https://openrouter.ai/api/v1/ ",
      model: " openai/gpt-5.1 ",
      chatPath: " v1/chat/completions ",
      imageGenerationPath: " v1/images/generations ",
      imageEditPath: " /v1/images/edits ",
      apiKey: " sk-1234567890abcdef ",
      capabilities: ["text", "vision", "unknown", "text"],
    }),
    {
      provider: "openai-compatible",
      displayName: "我的 OpenRouter",
      baseUrl: "https://openrouter.ai/api/v1",
      model: "openai/gpt-5.1",
      chatPath: "/v1/chat/completions",
      imageGenerationPath: "/v1/images/generations",
      imageEditPath: "/v1/images/edits",
      apiKey: "sk-1234567890abcdef",
      apiKeyPreview: "sk-1...cdef",
      capabilities: ["text", "vision"],
      enabled: true,
    },
  );
});

test("normalizeAiModelConfigInput rejects missing key fields", () => {
  assert.throws(
    () =>
      normalizeAiModelConfigInput({
        provider: "openai-compatible",
        displayName: "",
        model: "gpt-4o-mini",
        apiKey: "secret",
        capabilities: ["text"],
      }),
    /模型名称不能为空/,
  );
  assert.throws(
    () =>
      normalizeAiModelConfigInput({
        provider: "openai-compatible",
        displayName: "OpenAI",
        model: "gpt-4o-mini",
        apiKey: "",
        capabilities: ["text"],
      }),
    /API Key 不能为空/,
  );
});

test("serializeAiModelConfig never exposes encrypted API keys", () => {
  assert.deepEqual(
    serializeAiModelConfig({
      id: "model_1",
      provider: "openai-compatible",
      displayName: "OpenAI",
      baseUrl: "https://api.openai.com",
      model: "gpt-4o-mini",
      chatPath: null,
      imageGenerationPath: null,
      imageEditPath: null,
      encryptedApiKey: "v1:secret",
      apiKeyPreview: "sk-1...cdef",
      capabilities: ["text"],
      enabled: true,
      createdAt: new Date("2026-07-10T00:00:00.000Z"),
      updatedAt: new Date("2026-07-10T01:00:00.000Z"),
      lastUsedAt: null,
    }),
    {
      id: "model_1",
      provider: "openai-compatible",
      displayName: "OpenAI",
      baseUrl: "https://api.openai.com",
      model: "gpt-4o-mini",
      chatPath: null,
      imageGenerationPath: null,
      imageEditPath: null,
      apiKeyPreview: "sk-1...cdef",
      capabilities: ["text"],
      enabled: true,
      createdAt: "2026-07-10T00:00:00.000Z",
      updatedAt: "2026-07-10T01:00:00.000Z",
      lastUsedAt: null,
    },
  );
});

test("normalizeAiModelRouteInput validates explicit route selections", () => {
  assert.deepEqual(
    normalizeAiModelRouteInput({
      capability: "image.generate",
      targetType: "CREDENTIAL",
      credentialId: "model_image",
    }),
    {
      capability: "image.generate",
      targetType: "CREDENTIAL",
      credentialId: "model_image",
    },
  );

  assert.deepEqual(
    normalizeAiModelRouteInput({
      capability: "text",
      targetType: "AUTO",
      credentialId: "ignored",
    }),
    {
      capability: "text",
      targetType: "AUTO",
      credentialId: null,
    },
  );

  assert.throws(
    () =>
      normalizeAiModelRouteInput({
        capability: "image.edit",
        targetType: "CREDENTIAL",
      }),
    /请选择要使用的模型配置/,
  );
});

test("explicit credential route wins over automatic model order", () => {
  const newerModel = selectableModel("newer", "新模型", ["image.generate"]);
  const chosenModel = selectableModel("chosen", "指定模型", ["image.generate"]);
  const resolved = resolveAiModelSelectionForCapability({
    capability: "image.generate",
    route: {
      capability: "image.generate",
      targetType: "CREDENTIAL",
      credentialId: "chosen",
    },
    userConfigs: [newerModel, chosenModel],
    systemConfigs: [],
  });

  assert.equal(resolved.routeStatus, "ok");
  assert.equal(resolved.match?.id, "chosen");
});

test("system route ignores user configs when system supports the capability", () => {
  const userModel = selectableModel("user-text", "用户文本", ["text"]);
  const systemModel = selectableModel("system-text", "系统文本", ["text"], "system");
  const resolved = resolveAiModelSelectionForCapability({
    capability: "text",
    route: {
      capability: "text",
      targetType: "SYSTEM",
      credentialId: null,
    },
    userConfigs: [userModel],
    systemConfigs: [systemModel],
  });

  assert.equal(resolved.routeStatus, "ok");
  assert.equal(resolved.match?.id, "system-text");
  assert.equal(resolved.match?.source, "system");
});

test("auto route keeps user-first fallback behavior", () => {
  const userModel = selectableModel("user-vision", "用户识图", ["vision"]);
  const systemModel = selectableModel("system-vision", "系统识图", ["vision"], "system");
  const resolved = resolveAiModelSelectionForCapability({
    capability: "vision",
    route: {
      capability: "vision",
      targetType: "AUTO",
      credentialId: null,
    },
    userConfigs: [userModel],
    systemConfigs: [systemModel],
  });

  assert.equal(resolved.routeStatus, "ok");
  assert.equal(resolved.match?.id, "user-vision");
});

test("invalid explicit credential degrades to auto instead of crashing later", () => {
  const fallbackModel = selectableModel("fallback", "兜底模型", ["image.edit"]);
  const resolved = resolveAiModelSelectionForCapability({
    capability: "image.edit",
    route: {
      capability: "image.edit",
      targetType: "CREDENTIAL",
      credentialId: "disabled",
    },
    userConfigs: [
      selectableModel("disabled", "停用模型", ["image.edit"], "user", false),
      fallbackModel,
    ],
    systemConfigs: [],
  });

  assert.equal(resolved.routeStatus, "fallback");
  assert.equal(resolved.match?.id, "fallback");
});

test("serializeAiModelRoute never exposes credential secrets", () => {
  assert.deepEqual(
    serializeAiModelRoute({
      id: "route_1",
      capability: "text",
      targetType: "CREDENTIAL",
      credentialId: "model_1",
      createdAt: new Date("2026-07-28T00:00:00.000Z"),
      updatedAt: new Date("2026-07-28T01:00:00.000Z"),
    }),
    {
      id: "route_1",
      capability: "text",
      targetType: "CREDENTIAL",
      credentialId: "model_1",
      createdAt: "2026-07-28T00:00:00.000Z",
      updatedAt: "2026-07-28T01:00:00.000Z",
    },
  );
});

test("toRuntimeModelConfig decrypts stored keys only on the server", () => {
  assert.deepEqual(
    toRuntimeModelConfig(
      {
        id: "model_1",
        provider: "openai-compatible",
        displayName: "OpenAI",
        baseUrl: "https://api.openai.com/",
        model: "gpt-4o-mini",
        encryptedApiKey: "plain-for-test",
        apiKeyPreview: "sk-1...cdef",
        capabilities: ["text"],
        enabled: true,
        createdAt: new Date("2026-07-10T00:00:00.000Z"),
        updatedAt: new Date("2026-07-10T01:00:00.000Z"),
        lastUsedAt: null,
      },
      (value) => `decrypted:${value}`,
    ),
    {
      id: "model_1",
      provider: "openai-compatible",
      baseUrl: "https://api.openai.com",
      model: "gpt-4o-mini",
      apiKey: "decrypted:plain-for-test",
      capabilities: ["text"],
      enabled: true,
    },
  );
});

test("toRuntimeModelConfig applies provider default base URLs", () => {
  const baseRecord = {
    id: "model_1",
    displayName: "Model",
    encryptedApiKey: "secret",
    apiKeyPreview: "已配置",
    capabilities: ["text"],
    enabled: true,
    createdAt: new Date("2026-07-10T00:00:00.000Z"),
    updatedAt: new Date("2026-07-10T01:00:00.000Z"),
    lastUsedAt: null,
  };

  assert.equal(
    toRuntimeModelConfig(
      {
        ...baseRecord,
        provider: "anthropic",
        baseUrl: null,
        model: "claude-sonnet-4-5",
      },
      (value) => value,
    ).baseUrl,
    "https://api.anthropic.com",
  );
  assert.equal(
    toRuntimeModelConfig(
      {
        ...baseRecord,
        provider: "google",
        baseUrl: null,
        model: "gemini-2.5-pro",
      },
      (value) => value,
    ).baseUrl,
    "https://generativelanguage.googleapis.com",
  );
});

test("toRuntimeModelConfig applies user-configured endpoint paths", () => {
  assert.deepEqual(
    toRuntimeModelConfig(
      {
        id: "model_custom",
        provider: "openai-compatible",
        displayName: "Custom",
        baseUrl: "https://api.vendor.com/",
        model: "vendor-image",
        chatPath: "v1/chat/completions",
        imageGenerationPath: "/custom/images/generations",
        imageEditPath: "custom/images/edits",
        encryptedApiKey: "plain-for-test",
        apiKeyPreview: "sk-1...cdef",
        capabilities: ["text", "image.generate", "image.edit"],
        enabled: true,
        createdAt: new Date("2026-07-10T00:00:00.000Z"),
        updatedAt: new Date("2026-07-10T01:00:00.000Z"),
        lastUsedAt: null,
      },
      (value) => `decrypted:${value}`,
    ),
    {
      id: "model_custom",
      provider: "openai-compatible",
      baseUrl: "https://api.vendor.com",
      model: "vendor-image",
      apiKey: "decrypted:plain-for-test",
      capabilities: ["text", "image.generate", "image.edit"],
      enabled: true,
      chatPath: "/v1/chat/completions",
      imageGenerationPath: "/custom/images/generations",
      imageEditPath: "/custom/images/edits",
    },
  );
});

function selectableModel(
  id: string,
  displayName: string,
  capabilities: Array<"text" | "vision" | "image.generate" | "image.edit">,
  source: "user" | "system" = "user",
  enabled = true,
) {
  return {
    id,
    provider: "custom" as const,
    displayName,
    baseUrl: "https://api.example.com",
    model: id,
    capabilities,
    enabled,
    source,
    runtime: {
      id,
      provider: "custom" as const,
      baseUrl: "https://api.example.com",
      model: id,
      apiKey: "secret",
      capabilities,
      enabled,
    },
  };
}
