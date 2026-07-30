import assert from "node:assert/strict";
import { test } from "node:test";
import {
  aiInterfaceOptions,
  aiProviderPresets,
  findAiProviderPreset,
} from "../src/lib/ai-provider-presets";

const supportedProviders = new Set(aiInterfaceOptions.map(([value]) => value));

test("vendor presets only save provider values understood by the gateway", () => {
  for (const preset of aiProviderPresets) {
    assert.equal(
      supportedProviders.has(preset.provider),
      true,
      `${preset.id} uses unsupported provider ${preset.provider}`,
    );
  }
});

test("domestic OpenAI-compatible presets include editable endpoints", () => {
  assert.deepEqual(pickPreset("deepseek"), {
    provider: "openai-compatible",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-v4-pro",
    chatPath: "/chat/completions",
    capabilities: ["text", "tools"],
  });

  assert.deepEqual(pickPreset("dashscope-qwen"), {
    provider: "openai-compatible",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
    chatPath: "/chat/completions",
    capabilities: ["text", "vision", "tools"],
  });
});

test("native and image presets keep capability boundaries explicit", () => {
  assert.deepEqual(pickPreset("anthropic"), {
    provider: "anthropic",
    baseUrl: "https://api.anthropic.com",
    model: "claude-sonnet-4-5",
    chatPath: "/v1/messages",
    capabilities: ["text"],
  });

  assert.deepEqual(pickPreset("aizhzo-image"), {
    provider: "aizhzo",
    baseUrl: "https://api.aizhzo.com",
    model: "gpt-image-2",
    chatPath: "/v1/chat/completions",
    capabilities: ["image.generate", "image.edit"],
  });
});

test("Gemini OpenAI-compatible preset is available for vision routing", () => {
  assert.deepEqual(pickPreset("gemini-openai"), {
    provider: "openai-compatible",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-3.6-flash",
    chatPath: "/chat/completions",
    capabilities: ["text", "vision"],
  });
});

function pickPreset(id: string) {
  const preset = findAiProviderPreset(id);

  assert.ok(preset, `missing preset ${id}`);

  return {
    provider: preset.provider,
    baseUrl: preset.baseUrl,
    model: preset.model,
    chatPath: preset.chatPath,
    capabilities: [...preset.capabilities],
  };
}
