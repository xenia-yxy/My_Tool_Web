"use client";

import { useState } from "react";
import { Send, X } from "lucide-react";
import {
  assistantPrompts,
  fallbackAssistantAnswer,
  getAssistantAnswer,
} from "@/components/assistant/assistant-content";

type ChatMessage = {
  role: "assistant" | "visitor";
  content: string;
};

const initialMessages: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "你好，我是 AI Practice Assistant。你可以问我这个网站在做什么、有哪些工具、SOP 服务适合谁，或者如何开始做 AI 工作流。",
  },
];

export function AiPracticeAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const askQuestion = (question: string) => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) return;

    setMessages((currentMessages) => [
      ...currentMessages,
      { role: "visitor", content: trimmedQuestion },
      { role: "assistant", content: getAssistantAnswer(trimmedQuestion) },
    ]);
    setInput("");
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex max-w-[calc(100vw-2.5rem)] flex-col items-end gap-3">
      {isOpen ? (
        <section
          aria-label="AI Practice Assistant"
          className="w-[calc(100vw-2.5rem)] max-w-[390px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.16)]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                AI Practice Assistant
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                了解这个网站，也问一些 AI 实践问题。
              </p>
            </div>
            <button
              aria-label="关闭 AI Practice Assistant"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[320px] space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message, index) => (
              <div
                className={`flex ${
                  message.role === "visitor" ? "justify-end" : "justify-start"
                }`}
                key={`${message.role}-${index}-${message.content.slice(0, 12)}`}
              >
                <p
                  className={`max-w-[86%] rounded-lg px-3 py-2 text-sm leading-6 ${
                    message.role === "visitor"
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {message.content}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 px-4 py-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {assistantPrompts.slice(0, 4).map((prompt) => (
                <button
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  key={prompt.question}
                  onClick={() => askQuestion(prompt.question)}
                  type="button"
                >
                  {prompt.label}
                </button>
              ))}
            </div>

            <form
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
              onSubmit={(event) => {
                event.preventDefault();
                askQuestion(input || fallbackAssistantAnswer);
              }}
            >
              <input
                aria-label="向 AI Practice Assistant 提问"
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                onChange={(event) => setInput(event.target.value)}
                placeholder="问问 AI Practice..."
                value={input}
              />
              <button
                aria-label="发送问题"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white transition-colors hover:bg-blue-700 disabled:bg-slate-300"
                disabled={!input.trim()}
                type="submit"
              >
                <Send aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </section>
      ) : null}

      <button
        aria-expanded={isOpen}
        aria-label="打开 AI Practice Assistant"
        className="group flex h-12 items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 pr-4 text-sm font-semibold text-slate-950 shadow-[0_18px_50px_rgba(15,23,42,0.16)] transition-transform hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        type="button"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-[11px] font-semibold text-white transition-colors group-hover:bg-blue-700">
          AP
        </span>
        <span>问问 Practice</span>
      </button>
    </div>
  );
}
