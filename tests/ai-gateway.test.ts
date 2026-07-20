import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildOpenAiCompatibleEndpoint,
  buildOpenAiCompatibleHeaders,
  buildOpenAiCompatibleImageBody,
  buildOpenAiCompatibleMessagesBody,
} from "../src/server/ai-gateway/openai-compatible";
import {
  buildDefaultAiRuntimeConfigs,
  createAiGateway,
  fetchWithTimeout,
  selectModelForCapability,
  type AiModelRuntimeConfig,
} from "../src/server/ai-gateway/provider-registry";

test("fetchWithTimeout aborts a stalled model request", async () => {
  const stalledFetch: typeof fetch = async (_input, init) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
  });

  await assert.rejects(
    () => fetchWithTimeout(stalledFetch, "https://api.example.com", {}, 5),
    /模型请求超时，请重试/,
  );
});

test("selectModelForCapability picks an enabled model that supports the task", () => {
  const models: AiModelRuntimeConfig[] = [
    {
      id: "text-only",
      provider: "anthropic",
      model: "claude-sonnet-4-5",
      enabled: true,
      capabilities: ["text", "vision"],
    },
    {
      id: "image-model",
      provider: "openai-compatible",
      model: "gpt-image-2",
      enabled: true,
      capabilities: ["image.generate", "image.edit"],
    },
  ];

  assert.equal(selectModelForCapability(models, "image.generate").id, "image-model");
  assert.equal(selectModelForCapability(models, "text").id, "text-only");
});

test("selectModelForCapability ignores disabled models and explains missing capability", () => {
  assert.throws(
    () =>
      selectModelForCapability(
        [
          {
            id: "disabled-image",
            provider: "openai-compatible",
            model: "gpt-image-2",
            enabled: false,
            capabilities: ["image.generate"],
          },
        ],
        "image.generate",
      ),
    /没有可用的 image\.generate 模型配置/,
  );
});

test("OpenAI-compatible helpers build provider-neutral requests", () => {
  assert.equal(
    buildOpenAiCompatibleEndpoint("https://api.example.com/", "/v1/chat/completions"),
    "https://api.example.com/v1/chat/completions",
  );
  assert.deepEqual(buildOpenAiCompatibleHeaders("secret"), {
    Authorization: "Bearer secret",
    "Content-Type": "application/json",
  });
  assert.deepEqual(
    buildOpenAiCompatibleMessagesBody({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "你好" }],
      temperature: 0.2,
    }),
    {
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "你好" }],
      temperature: 0.2,
    },
  );
  assert.deepEqual(
    buildOpenAiCompatibleImageBody({
      model: "gpt-image-2",
      prompt: "生成一张封面",
      size: "1024x1024",
      quality: "low",
    }),
    {
      model: "gpt-image-2",
      prompt: "生成一张封面",
      size: "1024x1024",
      quality: "low",
    },
  );
});

test("buildDefaultAiRuntimeConfigs keeps existing AIZHZO env compatible", () => {
  const configs = buildDefaultAiRuntimeConfigs({
    AIZHZO_API_KEY: "secret",
    AIZHZO_BASE_URL: "https://api.aizhzo.com/",
    AIZHZO_CHAT_MODEL: "gpt-4o-mini",
    AIZHZO_IMAGE_MODEL: "gpt-image-2",
  });

  assert.deepEqual(
    configs.map((config) => ({
      id: config.id,
      provider: config.provider,
      baseUrl: config.baseUrl,
      model: config.model,
      capabilities: config.capabilities,
      enabled: config.enabled,
    })),
    [
      {
        id: "env-aizhzo-chat",
        provider: "aizhzo",
        baseUrl: "https://api.aizhzo.com",
        model: "gpt-4o-mini",
        capabilities: ["text", "vision", "tools"],
        enabled: true,
      },
      {
        id: "env-aizhzo-image",
        provider: "aizhzo",
        baseUrl: "https://api.aizhzo.com",
        model: "gpt-image-2",
        capabilities: ["image.generate", "image.edit"],
        enabled: true,
      },
    ],
  );
});

test("buildDefaultAiRuntimeConfigs accepts text and image env aliases", () => {
  const configs = buildDefaultAiRuntimeConfigs({
    AIZHZO_BASE_URL: "https://api.aizhzo.com",
    AI_TEXT_API_KEY: "text-secret",
    AI_TEXT_BASE_URL: "https://api.aizhzo.com/",
    AI_TEXT_MODEL: "gpt-5.5",
    TEXT_API_PATH: "/v1/chat/completions",
    AI_IMAGE_API_KEY: "image-secret",
    AI_IMAGE_BASE_URL: "https://api.aizhzo.com/",
    AI_IMAGE_MODEL: "gpt-image-2",
    IMAGE_API_PATH: "/v1/images/generations",
    IMAGE_EDIT_API_PATH: "/v1/images/edits",
  });

  assert.deepEqual(
    configs.map((config) => ({
      id: config.id,
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      model: config.model,
      capabilities: config.capabilities,
      chatPath: config.chatPath,
      imageGenerationPath: config.imageGenerationPath,
      imageEditPath: config.imageEditPath,
    })),
    [
      {
        id: "env-aizhzo-chat",
        baseUrl: "https://api.aizhzo.com",
        apiKey: "text-secret",
        model: "gpt-5.5",
        capabilities: ["text", "vision", "tools"],
        chatPath: "/v1/chat/completions",
        imageGenerationPath: undefined,
        imageEditPath: undefined,
      },
      {
        id: "env-aizhzo-image",
        baseUrl: "https://api.aizhzo.com",
        apiKey: "image-secret",
        model: "gpt-image-2",
        capabilities: ["image.generate", "image.edit"],
        chatPath: undefined,
        imageGenerationPath: "/v1/images/generations",
        imageEditPath: "/v1/images/edits",
      },
    ],
  );
});

test("createAiGateway sends chat and image calls through the selected model", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const gateway = createAiGateway({
    models: [
      {
        id: "chat",
        provider: "openai-compatible",
        baseUrl: "https://api.example.com",
        apiKey: "chat-key",
        model: "chat-model",
        capabilities: ["text"],
        enabled: true,
      },
      {
        id: "image",
        provider: "openai-compatible",
        baseUrl: "https://api.example.com",
        apiKey: "image-key",
        model: "image-model",
        capabilities: ["image.generate"],
        enabled: true,
      },
    ],
    fetch: async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });
      return Response.json(
        calls.length === 1
          ? { choices: [{ message: { content: "回复内容" } }] }
          : { data: [{ b64_json: "abc123" }] },
      );
    },
  });

  assert.equal(
    await gateway.generateText({
      messages: [{ role: "user", content: "你好" }],
      temperature: 0.1,
    }),
    "回复内容",
  );
  assert.deepEqual(
    await gateway.generateImage({
      prompt: "生成图",
      size: "1024x1024",
      quality: "low",
    }),
    { data: [{ b64_json: "abc123" }] },
  );

  assert.equal(calls[0].url, "https://api.example.com/v1/chat/completions");
  assert.equal(calls[1].url, "https://api.example.com/v1/images/generations");
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), {
    model: "chat-model",
    messages: [{ role: "user", content: "你好" }],
    temperature: 0.1,
  });
  assert.deepEqual(JSON.parse(String(calls[1].init.body)), {
    model: "image-model",
    prompt: "生成图",
    size: "1024x1024",
    quality: "low",
  });
});

test("createAiGateway sends image edit calls as multipart without JSON content type", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const gateway = createAiGateway({
    models: [
      {
        id: "image-edit",
        provider: "openai-compatible",
        baseUrl: "https://api.example.com",
        apiKey: "image-key",
        model: "image-model",
        capabilities: ["image.edit"],
        enabled: true,
      },
    ],
    fetch: async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });
      return Response.json({ data: [{ url: "https://example.com/image.png" }] });
    },
  });

  const payload = await gateway.editImage({
    prompt: "按参考图生成",
    size: "1024x1024",
    quality: "low",
    image: new File(["abc"], "a.png", { type: "image/png" }),
  });

  assert.deepEqual(payload, {
    data: [{ url: "https://example.com/image.png" }],
  });
  assert.equal(calls[0].url, "https://api.example.com/v1/images/edits");
  assert.equal((calls[0].init.headers as Record<string, string>).Authorization, "Bearer image-key");
  assert.equal(
    "Content-Type" in (calls[0].init.headers as Record<string, string>),
    false,
  );
  assert.equal(calls[0].init.body instanceof FormData, true);
});

test("createAiGateway can send multiple image edit references", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const gateway = createAiGateway({
    models: [
      {
        id: "image-edit",
        provider: "openai-compatible",
        baseUrl: "https://api.example.com",
        apiKey: "image-key",
        model: "image-model",
        capabilities: ["image.edit"],
        enabled: true,
      },
    ],
    fetch: async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });
      return Response.json({ data: [{ url: "https://example.com/image.png" }] });
    },
  });

  await gateway.editImage({
    prompt: "按草稿和风格参考生成",
    size: "1024x1024",
    quality: "low",
    image: [
      new File(["draft"], "draft.png", { type: "image/png" }),
      new File(["style"], "style.png", { type: "image/png" }),
    ],
  });

  const formData = calls[0].init.body as FormData;

  assert.equal(calls[0].init.body instanceof FormData, true);
  assert.equal(formData.getAll("image").length, 2);
});

test("createAiGateway sends every product image to the vision model", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const gateway = createAiGateway({
    models: [{
      id: "vision",
      provider: "openai-compatible",
      baseUrl: "https://api.example.com",
      apiKey: "vision-key",
      model: "vision-model",
      capabilities: ["vision"],
      enabled: true,
    }],
    fetch: async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });
      return Response.json({ choices: [{ message: { content: "{}" } }] });
    },
  });

  await gateway.generateVisionText({
    imageDataUrls: ["data:image/png;base64,first", "data:image/png;base64,second"],
    prompt: "分析商品",
    systemPrompt: "只返回 JSON",
  });

  const body = JSON.parse(String(calls[0].init.body));
  const content = body.messages[1].content;
  assert.equal(content.filter((item: { type: string }) => item.type === "image_url").length, 2);
});

test("createAiGateway keeps the upstream HTTP status when an image request fails", async () => {
  const gateway = createAiGateway({
    models: [
      {
        id: "image",
        provider: "openai-compatible",
        baseUrl: "https://api.example.com",
        apiKey: "image-key",
        model: "image-model",
        capabilities: ["image.generate"],
        enabled: true,
      },
    ],
    fetch: async () => new Response("", { status: 502, statusText: "Bad Gateway" }),
  });

  await assert.rejects(
    gateway.generateImage({ prompt: "生成图", size: "1024x1024", quality: "low" }),
    /HTTP 502 Bad Gateway/,
  );
});

test("createAiGateway sends Anthropic text calls with provider-native auth", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const gateway = createAiGateway({
    models: [
      {
        id: "claude",
        provider: "anthropic",
        baseUrl: "https://api.anthropic.com",
        apiKey: "anthropic-key",
        model: "claude-sonnet-4-5",
        capabilities: ["text"],
        enabled: true,
      },
    ],
    fetch: async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });
      return Response.json({ content: [{ type: "text", text: "Claude 回复" }] });
    },
  });

  const reply = await gateway.generateText({
    messages: [
      { role: "system", content: "你是助手" },
      { role: "user", content: "你好" },
    ],
  });

  assert.equal(reply, "Claude 回复");
  assert.equal(calls[0].url, "https://api.anthropic.com/v1/messages");
  assert.equal((calls[0].init.headers as Record<string, string>)["x-api-key"], "anthropic-key");
  assert.equal(
    (calls[0].init.headers as Record<string, string>)["anthropic-version"],
    "2023-06-01",
  );
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), {
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    system: "你是助手",
    messages: [{ role: "user", content: "你好" }],
  });
});

test("createAiGateway sends Gemini text calls with provider-native auth", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const gateway = createAiGateway({
    models: [
      {
        id: "gemini",
        provider: "google",
        baseUrl: "https://generativelanguage.googleapis.com",
        apiKey: "google-key",
        model: "gemini-2.5-pro",
        capabilities: ["text"],
        enabled: true,
      },
    ],
    fetch: async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });
      return Response.json({
        candidates: [
          { content: { parts: [{ text: "Gemini 回复" }] } },
        ],
      });
    },
  });

  const reply = await gateway.generateText({
    messages: [{ role: "user", content: "你好" }],
  });

  assert.equal(reply, "Gemini 回复");
  assert.equal(
    calls[0].url,
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent",
  );
  assert.equal((calls[0].init.headers as Record<string, string>)["x-goog-api-key"], "google-key");
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), {
    contents: [{ role: "user", parts: [{ text: "你好" }] }],
  });
});
