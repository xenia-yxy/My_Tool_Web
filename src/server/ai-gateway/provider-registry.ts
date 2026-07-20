export type AiCapability =
  | "text"
  | "vision"
  | "image.generate"
  | "image.edit"
  | "audio.transcribe"
  | "audio.speech"
  | "embedding"
  | "video.generate"
  | "tools";

export type AiProvider =
  | "openai-compatible"
  | "openai"
  | "openrouter"
  | "anthropic"
  | "google"
  | "aizhzo"
  | "custom";

export type AiModelRuntimeConfig = {
  id: string;
  provider: AiProvider;
  model: string;
  enabled: boolean;
  capabilities: AiCapability[];
  baseUrl?: string;
  apiKey?: string;
  chatPath?: string;
  imageGenerationPath?: string;
  imageEditPath?: string;
};

type EnvSource = Record<string, string | undefined>;

type AiGatewayOptions = {
  models: AiModelRuntimeConfig[];
  fetch?: typeof fetch;
};

type GenerateTextInput = {
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  temperature?: number;
};

type GenerateVisionTextInput = {
  imageDataUrl: string;
  prompt: string;
  systemPrompt: string;
  temperature?: number;
};

type GenerateImageInput = {
  prompt: string;
  size: string;
  quality: string;
};

type EditImageInput = GenerateImageInput & {
  image: File | File[];
};

export async function fetchWithTimeout(
  fetchImpl: typeof fetch,
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs = 120_000,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetchImpl(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("模型请求超时，请重试");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function selectModelForCapability(
  models: AiModelRuntimeConfig[],
  capability: AiCapability,
) {
  const model = models.find(
    (item) => item.enabled && item.capabilities.includes(capability),
  );

  if (!model) {
    throw new Error(`没有可用的 ${capability} 模型配置`);
  }

  return model;
}

export function hasCapability(
  model: Pick<AiModelRuntimeConfig, "capabilities">,
  capability: AiCapability,
) {
  return model.capabilities.includes(capability);
}

export function buildDefaultAiRuntimeConfigs(
  env: EnvSource = process.env,
): AiModelRuntimeConfig[] {
  const sharedApiKey = env.AIZHZO_API_KEY;
  const textApiKey = env.AI_TEXT_API_KEY || env.AI_ANALYSIS_API_KEY || sharedApiKey;
  const imageApiKey =
    env.AI_IMAGE_API_KEY || readFirstCsvItem(env.AI_IMAGE_API_KEYS) || sharedApiKey;
  const sharedBaseUrl = env.AIZHZO_BASE_URL || "https://api.aizhzo.com";
  const textBaseUrl = trimTrailingSlash(env.AI_TEXT_BASE_URL || sharedBaseUrl);
  const imageBaseUrl = trimTrailingSlash(env.AI_IMAGE_BASE_URL || sharedBaseUrl);
  const configs: AiModelRuntimeConfig[] = [];

  if (textApiKey) {
    configs.push({
      id: "env-aizhzo-chat",
      provider: "aizhzo",
      baseUrl: textBaseUrl,
      apiKey: textApiKey,
      model: env.AI_TEXT_MODEL || env.AIZHZO_CHAT_MODEL || "gpt-4o-mini",
      capabilities: ["text", "vision", "tools"],
      enabled: true,
      chatPath: env.TEXT_API_PATH || "/v1/chat/completions",
    });
  }

  if (imageApiKey) {
    configs.push({
      id: "env-aizhzo-image",
      provider: "aizhzo",
      baseUrl: imageBaseUrl,
      apiKey: imageApiKey,
      model: env.AI_IMAGE_MODEL || env.AIZHZO_IMAGE_MODEL || "gpt-image-2",
      capabilities: ["image.generate", "image.edit"],
      enabled: true,
      imageGenerationPath:
        env.AIZHZO_IMAGE_GENERATION_PATH ||
        env.IMAGE_API_PATH ||
        "/v1/images/generations",
      imageEditPath:
        env.AIZHZO_IMAGE_EDIT_PATH || env.IMAGE_EDIT_API_PATH || "/v1/images/edits",
    });
  }

  return configs;
}

export function createAiGateway(options: AiGatewayOptions) {
  const fetchImpl = options.fetch || fetch;

  return {
    async generateText(input: GenerateTextInput) {
      const model = selectModelForCapability(options.models, "text");

      if (model.provider === "anthropic") {
        return generateAnthropicText(fetchImpl, model, input);
      }

      if (model.provider === "google") {
        return generateGoogleText(fetchImpl, model, input);
      }

      return generateOpenAiCompatibleText(fetchImpl, model, input);
    },

    async generateVisionText(input: GenerateVisionTextInput) {
      const model = selectModelForCapability(options.models, "vision");
      if (model.provider === "anthropic" || model.provider === "google") {
        throw new Error("当前视觉识别仅支持 OpenAI 兼容模型，请在模型配置中启用支持 vision 的兼容模型");
      }

      return generateOpenAiCompatibleVisionText(fetchImpl, model, input);
    },

    async generateImage(input: GenerateImageInput) {
      const model = selectModelForCapability(options.models, "image.generate");
      const response = await fetchWithTimeout(fetchImpl,
        buildOpenAiCompatibleEndpointForModel(
          model,
          model.imageGenerationPath || "/v1/images/generations",
        ),
        {
          method: "POST",
          headers: buildJsonHeaders(model),
          body: JSON.stringify({
            model: model.model,
            prompt: input.prompt,
            size: input.size,
            quality: input.quality,
          }),
        },
      );

      return readJsonResponse(response);
    },

    async editImage(input: EditImageInput) {
      const model = selectModelForCapability(options.models, "image.edit");
      const formData = new FormData();
      formData.set("model", model.model);
      formData.set("prompt", input.prompt);
      formData.set("size", input.size);
      formData.set("quality", input.quality);
      for (const image of Array.isArray(input.image) ? input.image : [input.image]) {
        formData.append("image", image);
      }

      const response = await fetchWithTimeout(fetchImpl,
        buildOpenAiCompatibleEndpointForModel(
          model,
          model.imageEditPath || "/v1/images/edits",
        ),
        {
          method: "POST",
          headers: buildMultipartHeaders(model),
          body: formData,
        },
      );

      return readJsonResponse(response);
    },
  };
}

async function generateOpenAiCompatibleText(
  fetchImpl: typeof fetch,
  model: AiModelRuntimeConfig,
  input: GenerateTextInput,
) {
  const response = await fetchWithTimeout(fetchImpl,
    buildOpenAiCompatibleEndpointForModel(
      model,
      model.chatPath || "/v1/chat/completions",
    ),
    {
      method: "POST",
      headers: buildJsonHeaders(model),
      body: JSON.stringify({
        model: model.model,
        messages: input.messages,
        ...(typeof input.temperature === "number"
          ? { temperature: input.temperature }
          : {}),
      }),
    },
  );
  const payload = (await readJsonResponse(response)) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("模型没有返回文本内容");
  }

  return content;
}

async function generateOpenAiCompatibleVisionText(
  fetchImpl: typeof fetch,
  model: AiModelRuntimeConfig,
  input: GenerateVisionTextInput,
) {
  const response = await fetchWithTimeout(fetchImpl,
    buildOpenAiCompatibleEndpointForModel(model, model.chatPath || "/v1/chat/completions"),
    {
      method: "POST",
      headers: buildJsonHeaders(model),
      body: JSON.stringify({
        model: model.model,
        messages: [
          { role: "system", content: input.systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: input.prompt },
              { type: "image_url", image_url: { url: input.imageDataUrl } },
            ],
          },
        ],
        ...(typeof input.temperature === "number"
          ? { temperature: input.temperature }
          : {}),
      }),
    },
  );
  const payload = (await readJsonResponse(response)) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("视觉模型没有返回识别结果");
  }

  return content;
}

async function generateAnthropicText(
  fetchImpl: typeof fetch,
  model: AiModelRuntimeConfig,
  input: GenerateTextInput,
) {
  const system = input.messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n");
  const messages = input.messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content,
    }));
  const response = await fetchWithTimeout(fetchImpl,
    buildOpenAiCompatibleEndpointForModel(model, "/v1/messages"),
    {
      method: "POST",
      headers: {
        ...buildProviderApiKeyHeader(model, "x-api-key"),
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model.model,
        max_tokens: 1024,
        ...(system ? { system } : {}),
        messages,
      }),
    },
  );
  const payload = (await readJsonResponse(response)) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const content = payload.content
    ?.map((item) => (item.type === "text" ? item.text : ""))
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!content) {
    throw new Error("模型没有返回文本内容");
  }

  return content;
}

async function generateGoogleText(
  fetchImpl: typeof fetch,
  model: AiModelRuntimeConfig,
  input: GenerateTextInput,
) {
  const contents = input.messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));
  const systemText = input.messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n");
  const response = await fetchWithTimeout(fetchImpl,
    buildOpenAiCompatibleEndpointForModel(
      model,
      `/v1beta/models/${encodeURIComponent(model.model)}:generateContent`,
    ),
    {
      method: "POST",
      headers: {
        ...buildProviderApiKeyHeader(model, "x-goog-api-key"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...(systemText
          ? { systemInstruction: { parts: [{ text: systemText }] } }
          : {}),
        contents,
      }),
    },
  );
  const payload = (await readJsonResponse(response)) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const content = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!content) {
    throw new Error("模型没有返回文本内容");
  }

  return content;
}

function buildOpenAiCompatibleEndpointForModel(
  model: AiModelRuntimeConfig,
  pathname: string,
) {
  return `${(model.baseUrl || "").replace(/\/+$/, "")}/${pathname.replace(/^\/+/, "")}`;
}

function buildJsonHeaders(model: AiModelRuntimeConfig) {
  if (!model.apiKey) {
    throw new Error(`模型 ${model.id} 缺少 API Key`);
  }

  return {
    Authorization: `Bearer ${model.apiKey}`,
    "Content-Type": "application/json",
  };
}

function buildProviderApiKeyHeader(model: AiModelRuntimeConfig, headerName: string) {
  if (!model.apiKey) {
    throw new Error(`模型 ${model.id} 缺少 API Key`);
  }

  return {
    [headerName]: model.apiKey,
  };
}

function buildMultipartHeaders(model: AiModelRuntimeConfig) {
  if (!model.apiKey) {
    throw new Error(`模型 ${model.id} 缺少 API Key`);
  }

  return {
    Authorization: `Bearer ${model.apiKey}`,
  };
}

async function readJsonResponse(response: Response) {
  const text = await response.text();
  let payload: unknown;

  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { error: text };
  }

  if (!response.ok) {
    const status = `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}`;
    throw new Error(`模型请求失败：${status} ${JSON.stringify(payload)}`);
  }

  return payload;
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function readFirstCsvItem(value: string | undefined) {
  return value
    ?.split(",")
    .map((item) => item.trim())
    .find(Boolean);
}
