"use client";

import { Check, Copy, RotateCcw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

type ReleaseTone = "soft" | "sharp" | "calm";

const tones: Array<{ id: ReleaseTone; label: string; description: string }> = [
  { id: "soft", label: "轻吐槽", description: "把气撒出来，但不失分寸" },
  { id: "sharp", label: "火力全开", description: "对这件破事开火，不指向具体人" },
  { id: "calm", label: "冷静回击", description: "保留气场，也保留边界" },
];

function makeLines(context: string, tone: ReleaseTone) {
  const subject = context.trim() || "这件破事";

  if (tone === "soft") {
    return [
      `关于“${subject}”，我的耐心今天已经签退了。`,
      "我不是不说话，我是在给荒唐留最后一点体面。",
      "这件事先放这儿，等它配得上我的精力再处理。",
    ];
  }

  if (tone === "sharp") {
    return [
      `“${subject}”的离谱程度，已经值得单独立项研究。`,
      "我的时间很贵，不提供免费配合混乱的服务。",
      "气归气，今天不把自己交给这件烂事。",
    ];
  }

  return [
    `关于“${subject}”，我不接受，也不准备重复解释。`,
    "我会处理问题，但不接住不属于我的情绪。",
    "边界已经说清，接下来用行动回答。",
  ];
}

export function EmotionalReleaseTool() {
  const [context, setContext] = useState("");
  const [tone, setTone] = useState<ReleaseTone>("soft");
  const [submittedContext, setSubmittedContext] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const lines = useMemo(
    () => makeLines(submittedContext, tone),
    [submittedContext, tone],
  );

  async function copyLine(line: string, index: number) {
    try {
      await navigator.clipboard.writeText(line);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex(null), 1400);
    } catch {
      setCopiedIndex(null);
    }
  }

  function clearAll() {
    setContext("");
    setSubmittedContext("");
    setCopiedIndex(null);
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(330px,0.75fr)]">
      <form
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmittedContext(context);
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-950">今天哪里不爽</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              写事情，不写真实姓名、联系方式或可识别信息。
            </p>
          </div>
          <button
            aria-label="清空内容"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
            onClick={clearAll}
            type="button"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <textarea
          className="mt-5 min-h-40 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-4 text-base leading-7 text-slate-950 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
          maxLength={240}
          onChange={(event) => setContext(event.target.value)}
          placeholder="例如：反复改需求又不说清楚，最后还说为什么没有做好。"
          value={context}
        />
        <div className="mt-2 flex justify-end text-xs text-slate-400">{context.length}/240</div>

        <fieldset className="mt-5">
          <legend className="text-sm font-semibold text-slate-800">表达方式</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {tones.map((item) => (
              <button
                className={`rounded-lg border p-3 text-left transition ${
                  tone === item.id
                    ? "border-blue-300 bg-blue-50 text-blue-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
                key={item.id}
                onClick={() => setTone(item.id)}
                type="button"
              >
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="mt-1 block text-xs leading-5 opacity-75">{item.description}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <button
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
          type="submit"
        >
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          给我几句
        </button>
      </form>

      <section className="rounded-xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
        <p className="text-sm font-semibold text-white">解压文案</p>
        <p className="mt-1 text-sm leading-6 text-slate-400">不攻击具体个人，不发送也没关系。</p>
        <div className="mt-5 grid gap-3">
          {lines.map((line, index) => (
            <article className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-4" key={line}>
              <p className="min-w-0 flex-1 text-sm leading-6 text-slate-100">{line}</p>
              <button
                aria-label={`复制第 ${index + 1} 条文案`}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-300 transition hover:bg-white/10 hover:text-white"
                onClick={() => void copyLine(line, index)}
                type="button"
              >
                {copiedIndex === index ? <Check aria-hidden="true" className="h-4 w-4" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
              </button>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
