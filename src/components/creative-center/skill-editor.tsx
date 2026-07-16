"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { CreativeSkillInput, CreativeSkillInputType } from "@/lib/creative-skills";

export type EditableSkill = {
  id?: string;
  name: string;
  description: string;
  category: string;
  executorKey: string;
  promptTemplate: string;
  negativePrompt: string;
  agentInstructions: string;
  inputs: CreativeSkillInput[];
};

type SkillEditorProps = {
  initialValue?: EditableSkill;
  onCancel: () => void;
  onSave: (value: EditableSkill) => Promise<void>;
  saving: boolean;
};

const inputTypes: Array<{ value: CreativeSkillInputType; label: string }> = [
  { value: "text", label: "文本" },
  { value: "image", label: "单张图片" },
  { value: "images", label: "多张图片" },
  { value: "select", label: "单选" },
  { value: "multi-select", label: "多选" },
  { value: "number", label: "数值" },
  { value: "toggle", label: "开关" },
];

export function SkillEditor({ initialValue, onCancel, onSave, saving }: SkillEditorProps) {
  const [value, setValue] = useState<EditableSkill>(initialValue ?? emptySkill());
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await onSave({
        ...value,
        inputs: value.inputs.map((input) => ({
          ...input,
          key: input.key.trim(),
          label: input.label.trim(),
          options: input.options?.map((option) => option.trim()).filter(Boolean),
        })),
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "保存 Skill 失败");
    }
  }

  function updateInput(index: number, patch: Partial<CreativeSkillInput>) {
    setValue((current) => ({
      ...current,
      inputs: current.inputs.map((input, inputIndex) => inputIndex === index ? { ...input, ...patch } : input),
    }));
  }

  return (
    <form className="grid gap-5" onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="名称">
          <input className={inputClassName} onChange={(event) => setValue({ ...value, name: event.target.value })} required value={value.name} />
        </Field>
        <Field label="分类">
          <input className={inputClassName} onChange={(event) => setValue({ ...value, category: event.target.value })} value={value.category} />
        </Field>
      </div>
      <Field label="说明">
        <input className={inputClassName} onChange={(event) => setValue({ ...value, description: event.target.value })} value={value.description} />
      </Field>
      <Field label="执行能力">
        <select className={inputClassName} onChange={(event) => setValue({ ...value, executorKey: event.target.value })} value={value.executorKey}>
          <option value="menswear-generate">男装视觉生成</option>
          <option value="menswear-style-reference">男装风格参考</option>
          <option value="menswear-multi-outfit">一衣多搭</option>
          <option value="platform-cover-design">平台封面设计</option>
          <option value="ip-derivative-factory">IP 衍生工厂</option>
          <option value="menswear-model-generate">模特生成</option>
          <option value="menswear-material-extract">素材提取与入库</option>
          <option value="hotspot-research">热点查询与内容灵感</option>
        </select>
      </Field>
      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-slate-700">输入项</span>
          <Button className="gap-2" onClick={() => setValue({ ...value, inputs: [...value.inputs, emptyInput()] })} size="sm" type="button" variant="secondary">
            <Plus aria-hidden="true" className="h-4 w-4" /> 添加输入项
          </Button>
        </div>
        {value.inputs.map((input, index) => (
          <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_1fr_140px_auto_auto]" key={`${input.key}-${index}`}>
            <input aria-label={`输入项 ${index + 1} 变量名`} className={inputClassName} onChange={(event) => updateInput(index, { key: event.target.value })} placeholder="变量名" value={input.key} />
            <input aria-label={`输入项 ${index + 1} 标签`} className={inputClassName} onChange={(event) => updateInput(index, { label: event.target.value })} placeholder="显示名称" value={input.label} />
            <select aria-label={`输入项 ${index + 1} 类型`} className={inputClassName} onChange={(event) => updateInput(index, { type: event.target.value as CreativeSkillInputType })} value={input.type}>
              {inputTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
            <label className="flex h-10 items-center gap-2 text-sm text-slate-700"><input checked={input.required} onChange={(event) => updateInput(index, { required: event.target.checked })} type="checkbox" />必填</label>
            <button aria-label={`删除输入项 ${index + 1}`} className="grid h-10 w-10 place-items-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-700" onClick={() => setValue({ ...value, inputs: value.inputs.filter((_, inputIndex) => inputIndex !== index) })} title="删除输入项" type="button"><Trash2 aria-hidden="true" className="h-4 w-4" /></button>
            {input.type === "select" || input.type === "multi-select" ? (
              <input aria-label={`输入项 ${index + 1} 选项`} className={`${inputClassName} md:col-span-5`} onChange={(event) => updateInput(index, { options: event.target.value.split("，") })} placeholder="选项以中文逗号分隔" value={input.options?.join("，") ?? ""} />
            ) : null}
          </div>
        ))}
      </div>
      <Field label="提示词模板"><textarea className={`${inputClassName} min-h-40 leading-6`} onChange={(event) => setValue({ ...value, promptTemplate: event.target.value })} required value={value.promptTemplate} /></Field>
      <Field label="负面提示词"><textarea className={`${inputClassName} min-h-24 leading-6`} onChange={(event) => setValue({ ...value, negativePrompt: event.target.value })} value={value.negativePrompt} /></Field>
      <Field label="Agent 调用说明"><textarea className={`${inputClassName} min-h-24 leading-6`} onChange={(event) => setValue({ ...value, agentInstructions: event.target.value })} value={value.agentInstructions} /></Field>
      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <div className="flex justify-end gap-2"><Button onClick={onCancel} type="button" variant="secondary">取消</Button><Button disabled={saving} type="submit">{saving ? "保存中" : "保存 Skill"}</Button></div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-2"><span className="text-sm font-medium text-slate-700">{label}</span>{children}</label>;
}

function emptySkill(): EditableSkill {
  return { name: "", description: "", category: "自定义", executorKey: "menswear-generate", promptTemplate: "", negativePrompt: "", agentInstructions: "", inputs: [] };
}

function emptyInput(): CreativeSkillInput {
  return { key: "", label: "", type: "text", required: false };
}

const inputClassName = "h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
