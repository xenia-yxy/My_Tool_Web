import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getAiProviderPreset,
  normalizeAiModelConfigInput,
  normalizeAiModelConfigUpdateInput,
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
      apiKey: " sk-1234567890abcdef ",
      capabilities: ["text", "vision", "unknown", "text"],
    }),
    {
      provider: "openai-compatible",
      displayName: "我的 OpenRouter",
      baseUrl: "https://openrouter.ai/api/v1",
      model: "openai/gpt-5.1",
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
      apiKeyPreview: "sk-1...cdef",
      capabilities: ["text"],
      enabled: true,
      createdAt: "2026-07-10T00:00:00.000Z",
      updatedAt: "2026-07-10T01:00:00.000Z",
      lastUsedAt: null,
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
