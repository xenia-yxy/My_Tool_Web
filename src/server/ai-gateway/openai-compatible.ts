export type OpenAiCompatibleMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenAiCompatibleChatInput = {
  model: string;
  messages: OpenAiCompatibleMessage[];
  temperature?: number;
};

export type OpenAiCompatibleImageInput = {
  model: string;
  prompt: string;
  size: string;
  quality: string;
};

export function buildOpenAiCompatibleEndpoint(baseUrl: string, pathname: string) {
  return `${baseUrl.replace(/\/+$/, "")}/${pathname.replace(/^\/+/, "")}`;
}

export function buildOpenAiCompatibleHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

export function buildOpenAiCompatibleMessagesBody(input: OpenAiCompatibleChatInput) {
  return {
    model: input.model,
    messages: input.messages,
    ...(typeof input.temperature === "number"
      ? { temperature: input.temperature }
      : {}),
  };
}

export function buildOpenAiCompatibleImageBody(input: OpenAiCompatibleImageInput) {
  return {
    model: input.model,
    prompt: input.prompt,
    size: input.size,
    quality: input.quality,
  };
}
