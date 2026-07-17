"use client";

import { Copy, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type PromptEditorDialogProps = {
  description?: string;
  onClose: () => void;
  onSave: (prompt: string) => void | Promise<void>;
  open: boolean;
  prompt: string;
  title?: string;
};

export function PromptEditorDialog({
  description = "完整内容会用于下一次生成或作为本次工作记录保存。",
  onClose,
  onSave,
  open,
  prompt,
  title = "完整提示词",
}: PromptEditorDialogProps) {
  if (!open) return null;

  return (
    <PromptEditorDialogContent
      description={description}
      key={prompt}
      onClose={onClose}
      onSave={onSave}
      prompt={prompt}
      title={title}
    />
  );
}

function PromptEditorDialogContent({
  description,
  onClose,
  onSave,
  prompt,
  title,
}: Omit<PromptEditorDialogProps, "open">) {
  const [value, setValue] = useState(prompt);
  const [isSaving, setIsSaving] = useState(false);
  const [controlPerson, setControlPerson] = useState(false);
  const [personScale, setPersonScale] = useState("balanced");
  const [bodyProportion, setBodyProportion] = useState("standard");
  const [customBodyProportion, setCustomBodyProportion] = useState("");

  async function save() {
    setIsSaving(true);
    try {
      await onSave(buildFinalPrompt({
        bodyProportion,
        controlPerson,
        customBodyProportion,
        personScale,
        prompt: value,
      }));
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(value);
  }

  return (
    <div aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" role="dialog">
      <div className="grid max-h-[88dvh] w-full max-w-3xl gap-4 overflow-hidden rounded-lg bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
          <Button aria-label="关闭" className="h-9 w-9 px-0" onClick={onClose} type="button" variant="secondary">
            <X aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
        <textarea
          aria-label={title}
          className="min-h-52 resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          onChange={(event) => setValue(event.target.value)}
          value={value}
        />
        <section className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <input checked={controlPerson} onChange={(event) => setControlPerson(event.target.checked)} type="checkbox" />
            人物画面控制
          </label>
          {controlPerson ? <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm text-slate-700">
              人物大小
              <select className={selectClass} onChange={(event) => setPersonScale(event.target.value)} value={personScale}>
                <option value="environment">环境感（35%-50%）</option>
                <option value="balanced">均衡（55%-70%）</option>
                <option value="dominant">人物突出（70%-80%）</option>
                <option value="close">近景（80%-90%）</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm text-slate-700">
              身材比例
              <select className={selectClass} onChange={(event) => setBodyProportion(event.target.value)} value={bodyProportion}>
                <option value="standard">标准写实</option>
                <option value="tall">修长男模</option>
                <option value="athletic">运动肩宽</option>
                <option value="street">街头宽松</option>
                <option value="custom">自定义说明</option>
              </select>
            </label>
            {bodyProportion === "custom" ? <label className="grid gap-1.5 text-sm text-slate-700 sm:col-span-2">
              自定义身材说明
              <input className={selectClass} onChange={(event) => setCustomBodyProportion(event.target.value)} placeholder="例如：修长比例、腿部完整、腰线略高、避免五五分" value={customBodyProportion} />
            </label> : null}
          </div> : <p className="text-xs leading-5 text-slate-500">纯商品、纯背景和封面图可不勾选；勾选后会将人物大小和身材比例写入本次完整提示词。</p>}
        </section>
        <div className="flex flex-wrap justify-end gap-2">
          <Button className="gap-2" onClick={() => void copy()} type="button" variant="secondary">
            <Copy aria-hidden="true" className="h-4 w-4" />
            复制
          </Button>
          <Button disabled={isSaving} onClick={onClose} type="button" variant="secondary">
            取消
          </Button>
          <Button disabled={isSaving} onClick={() => void save()} type="button">
            {isSaving ? "保存中" : "保存修改"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function buildFinalPrompt(input: {
  bodyProportion: string;
  controlPerson: boolean;
  customBodyProportion: string;
  personScale: string;
  prompt: string;
}) {
  const prompt = input.prompt.trim();
  if (!input.controlPerson) return prompt;

  const scaleRules: Record<string, string> = {
    balanced: "人物占画面约 55%-70%，完整展示穿搭与适量环境。",
    close: "人物占画面约 80%-90%，仅在近景需要时使用，避免脸部畸变和裁切手脚。",
    dominant: "人物占画面约 70%-80%，服装细节突出，手脚完整可见。",
    environment: "人物占画面约 35%-50%，保留更多环境、背景与空间关系。",
  };
  const scaleRule = scaleRules[input.personScale] || "人物占画面约 55%-70%，完整展示穿搭与适量环境。";
  const bodyRules: Record<string, string> = {
    athletic: "运动肩宽比例：肩背自然挺拔、胸腰比例协调、腿部完整，避免夸张健身身材。",
    standard: "标准写实比例：约 7.5-8 头身，肩腰胯、腿长和衣物垂感符合真实人体。",
    street: "街头宽松比例：身材自然修长，宽松衣裤保持廓形，腰线、裤长和鞋部完整，不做五五分。",
    tall: "修长男模比例：约 8-8.5 头身，肩宽腿长，腰线略高，腿部与鞋子完整可见，避免短腿和五五分构图。",
    custom: input.customBodyProportion.trim() || "自然修长比例，腿部完整，避免五五分和短腿。",
  };
  const bodyRule = bodyRules[input.bodyProportion] || "标准写实比例：约 7.5-8 头身，肩腰胯、腿长和衣物垂感符合真实人体。";

  return [prompt, "人物画面控制：", `人物大小：${scaleRule}`, `身材比例：${bodyRule}`].join("\n\n");
}

const selectClass = "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
