"use client";

import Image from "next/image";
import { useState } from "react";
import { LoaderCircle, Minus, Send, Trash2, X } from "lucide-react";
import type { AgentSearchResult } from "@/server/agent-chat";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  sources?: AgentSearchResult[];
};

export function FloatingAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "我是 Xenia Tools 的个人库 Agent。可以帮你查资料、拆计划、整理下一步。",
    },
  ]);
  const [input, setInput] = useState("");
  const [useSearch, setUseSearch] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function submitMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();

    if (!message || isLoading) {
      return;
    }

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: message }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setIsLoading(true);

    const response = await fetch("/api/agent/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        useSearch,
        history: nextMessages
          .filter((item) => item.role === "user" || item.role === "assistant")
          .slice(-8)
          .map(({ role, content }) => ({ role, content })),
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      reply?: string;
      sources?: AgentSearchResult[];
      warning?: string | null;
      error?: string;
    };

    setIsLoading(false);

    if (!response.ok || !payload.reply) {
      setError(payload.error || "Agent 暂时没有响应。");
      return;
    }

    const reply = payload.reply;

    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        content: payload.warning
          ? `${reply}\n\n提示：${payload.warning}`
          : reply,
        sources: payload.sources || [],
      },
    ]);
  }

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {isOpen ? (
        <section className="mb-4 flex h-[min(620px,calc(100dvh-7rem))] w-[min(390px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
          <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-3">
              <Image
                alt="Xenia Agent"
                className="h-10 w-10 rounded-full border border-amber-100 object-cover"
                height={40}
                src="/agent/bingou.png"
                width={40}
              />
              <div>
                <h2 className="text-sm font-semibold text-slate-950">Bingou Agent</h2>
                <p className="text-xs text-slate-500">可联网查询 / 可拆计划</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                aria-label="清空对话"
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                onClick={() =>
                  setMessages([
                    {
                      role: "assistant",
                      content:
                        "我是 Xenia Tools 的个人库 Agent。可以帮你查资料、拆计划、整理下一步。",
                    },
                  ])
                }
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                aria-label="最小化"
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                aria-label="关闭"
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-4">
            {messages.map((message, index) => (
              <div
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[86%] rounded-2xl bg-blue-600 px-3 py-2 text-sm leading-6 text-white"
                    : "mr-auto max-w-[88%] rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-700"
                }
                key={`${message.role}-${index}`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.sources?.length ? (
                  <div className="mt-2 border-t border-slate-100 pt-2">
                    {message.sources.slice(0, 3).map((source) => (
                      <a
                        className="block truncate text-xs text-blue-700 hover:underline"
                        href={source.url}
                        key={source.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {source.title}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {isLoading ? (
              <div className="mr-auto inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                正在查和整理
              </div>
            ) : null}
            {error ? (
              <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            ) : null}
          </div>

          <form className="border-t border-slate-100 bg-white p-3" onSubmit={submitMessage}>
            <label className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span>联网查询</span>
              <input
                checked={useSearch}
                className="h-4 w-4"
                onChange={(event) => setUseSearch(event.target.checked)}
                type="checkbox"
              />
            </label>
            <div className="flex gap-2">
              <input
                className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                onChange={(event) => setInput(event.target.value)}
                placeholder="问我、查资料、拆计划..."
                value={input}
              />
              <button
                className="grid h-11 w-11 place-items-center rounded-xl bg-slate-950 text-white hover:bg-slate-800 disabled:opacity-60"
                disabled={isLoading}
                type="submit"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <button
        aria-label="打开智能对话 Agent"
        className="grid h-16 w-16 place-items-center overflow-hidden rounded-full border border-amber-100 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.22)] transition-transform hover:scale-105"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <Image
          alt="打开 Bingou Agent"
          className="h-full w-full object-cover"
          height={64}
          src="/agent/bingou.png"
          width={64}
        />
      </button>
    </div>
  );
}
