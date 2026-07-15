import { buildAiRuntimeConfigsForUser } from "@/server/ai-model-configs";
import { createAiGateway } from "@/server/ai-gateway/provider-registry";

export type AgentChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AgentSearchResult = {
  title: string;
  url: string;
  content: string;
};

export type AgentChatInput = {
  message?: unknown;
  history?: unknown;
  useSearch?: unknown;
};

const maxMessageLength = 2000;
const maxHistoryItems = 8;

export function normalizeAgentChatInput(input: AgentChatInput) {
  const message = typeof input.message === "string" ? input.message.trim() : "";

  if (!message) {
    throw new Error("请输入要问的内容。");
  }

  if (message.length > maxMessageLength) {
    throw new Error(`单次问题不能超过 ${maxMessageLength} 个字。`);
  }

  const rawHistory = Array.isArray(input.history) ? input.history : [];
  const history = rawHistory
    .filter(isAgentChatMessage)
    .slice(-maxHistoryItems)
    .map((item) => ({
      role: item.role,
      content: item.content.slice(0, maxMessageLength),
    }));

  return {
    message,
    history,
    useSearch: input.useSearch === true,
  };
}

export async function searchWebForAgent(query: string) {
  if (process.env.TAVILY_API_KEY) {
    return searchTavily(query);
  }

  if (process.env.SERPAPI_API_KEY) {
    return searchSerpApi(query);
  }

  return {
    results: [] as AgentSearchResult[],
    warning: "未配置 TAVILY_API_KEY 或 SERPAPI_API_KEY，暂时不能联网搜索。",
  };
}

export async function createAgentReply(input: {
  userId?: string;
  message: string;
  history: AgentChatMessage[];
  searchResults: AgentSearchResult[];
  searchWarning?: string;
}) {
  const models = await buildAiRuntimeConfigsForUser(input.userId);

  if (models.length === 0) {
    return buildFallbackReply(input);
  }

  const searchContext =
    input.searchResults.length > 0
      ? input.searchResults
          .map(
            (result, index) =>
              `[${index + 1}] ${result.title}\n${result.url}\n${result.content}`,
          )
          .join("\n\n")
      : input.searchWarning || "本次没有联网搜索结果。";

  try {
    return await createAiGateway({ models }).generateText({
      messages: [
        {
          role: "system",
          content:
            "你是 Xenia Tools 里的个人库 Agent。回答要直接、可执行、偏中文。涉及计划时，优先拆成任务、优先级、时间和下一步。使用搜索资料时要简短注明来源链接。",
        },
        ...input.history,
        {
          role: "user",
          content: `用户问题：${input.message}\n\n联网资料：\n${searchContext}`,
        },
      ],
      temperature: 0.4,
    });
  } catch {
    return buildFallbackReply({
      ...input,
      searchWarning: "模型接口请求失败。",
    });
  }
}

function isAgentChatMessage(value: unknown): value is AgentChatMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    (item.role === "user" || item.role === "assistant") &&
    typeof item.content === "string"
  );
}

async function searchTavily(query: string) {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      max_results: 5,
      search_depth: "basic",
      include_answer: false,
    }),
  });

  if (!response.ok) {
    return {
      results: [] as AgentSearchResult[],
      warning: `联网搜索失败：HTTP ${response.status}`,
    };
  }

  const payload = (await response.json()) as {
    results?: Array<{ title?: string; url?: string; content?: string }>;
  };

  return {
    results:
      payload.results?.slice(0, 5).map((item) => ({
        title: item.title || "Untitled",
        url: item.url || "",
        content: item.content || "",
      })) || [],
  };
}

async function searchSerpApi(query: string) {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", process.env.SERPAPI_API_KEY || "");
  url.searchParams.set("engine", "google");
  url.searchParams.set("num", "5");

  const response = await fetch(url);

  if (!response.ok) {
    return {
      results: [] as AgentSearchResult[],
      warning: `联网搜索失败：HTTP ${response.status}`,
    };
  }

  const payload = (await response.json()) as {
    organic_results?: Array<{ title?: string; link?: string; snippet?: string }>;
  };

  return {
    results:
      payload.organic_results?.slice(0, 5).map((item) => ({
        title: item.title || "Untitled",
        url: item.link || "",
        content: item.snippet || "",
      })) || [],
  };
}

function buildFallbackReply(input: {
  message: string;
  searchResults: AgentSearchResult[];
  searchWarning?: string;
}) {
  const lines = [
    "我先给你一个可执行版本：",
    "",
    `你问的是：${input.message}`,
  ];

  if (input.searchWarning) {
    lines.push("", input.searchWarning);
  }

  if (input.searchResults.length > 0) {
    lines.push("", "我查到的参考：");
    input.searchResults.slice(0, 3).forEach((result, index) => {
      lines.push(`${index + 1}. ${result.title} ${result.url}`);
    });
  }

  lines.push("", "下一步可以把这个问题拆成：目标、当前卡点、今天能做的一步。");

  return lines.join("\n");
}
