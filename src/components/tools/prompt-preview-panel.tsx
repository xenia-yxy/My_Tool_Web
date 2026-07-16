"use client";

import { Copy, ImagePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PromptPreviewPanelProps = {
  prompt: string;
  meta?: Array<{ label: string; value: string | number }>;
  galleryHref?: string;
};

export function PromptPreviewPanel({
  galleryHref = "/tools/image-gallery",
  meta = [],
  prompt,
}: PromptPreviewPanelProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <Card className="h-fit lg:sticky lg:top-5">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">实时完整提示词</CardTitle>
          <Button
            className="h-9 gap-2 bg-blue-600 px-3 !text-white hover:bg-blue-700 [&_*]:!text-white"
            onClick={() => router.push(galleryHref)}
            type="button"
          >
            <ImagePlus className="h-4 w-4 text-white" />
            <span className="text-white">图片画廊</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 pt-4">
        {meta.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {meta.map((item) => (
              <div className="rounded-lg bg-slate-50 px-3 py-2" key={item.label}>
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}
        <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-950 p-4 text-xs leading-6 text-slate-100">
          {prompt}
        </pre>
        <Button className="h-10 gap-2" onClick={() => void copyPrompt()} type="button" variant="secondary">
          <Copy className="h-4 w-4" />
          {copied ? "已复制" : "复制提示词"}
        </Button>
      </CardContent>
    </Card>
  );
}

type PromptConfirmDialogProps = {
  isOpen: boolean;
  isSubmitting?: boolean;
  prompt: string;
  title?: string;
  onCancel: () => void;
  onChange: (prompt: string) => void;
  onConfirm: () => void;
};

export function PromptConfirmDialog({
  isOpen,
  isSubmitting,
  onCancel,
  onChange,
  onConfirm,
  prompt,
  title = "确认生图提示词",
}: PromptConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
      <div className="grid max-h-[88dvh] w-full max-w-3xl gap-4 overflow-hidden rounded-2xl bg-white p-5 shadow-2xl">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            这里是即将提交给模型的完整提示词，可以最后修改一次。
          </p>
        </div>
        <textarea
          className="min-h-[360px] resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          onChange={(event) => onChange(event.target.value)}
          value={prompt}
        />
        <div className="flex flex-wrap justify-end gap-2">
          <Button disabled={isSubmitting} onClick={onCancel} type="button" variant="secondary">
            取消
          </Button>
          <Button disabled={isSubmitting || !prompt.trim()} onClick={onConfirm} type="button">
            {isSubmitting ? "提交中" : "确认生图"}
          </Button>
        </div>
      </div>
    </div>
  );
}
