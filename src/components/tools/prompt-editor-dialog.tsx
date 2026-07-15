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

  async function save() {
    setIsSaving(true);
    try {
      await onSave(value.trim());
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
          className="min-h-[360px] resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          onChange={(event) => setValue(event.target.value)}
          value={value}
        />
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
