"use client";

import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ImageReferenceUploader } from "@/components/tools/image-reference-uploader";
import { PromptEditorDialog } from "@/components/tools/prompt-editor-dialog";
import { PromptPreviewPanel } from "@/components/tools/prompt-preview-panel";
import { useWorkbenchSession } from "@/components/tools/workbench-session-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildPlatformCoverDesignPrompt,
  getPlatformCoverAspectRatio,
  getPlatformCoverLabel,
  type PlatformCoverPlatform,
  type PlatformCoverTextMode,
} from "@/lib/platform-cover-design";

type GenerationPayload = {
  error?: string;
  job?: { id?: string };
  results?: Array<{ imageUrl?: string; asset?: { id?: string } }>;
};

const platforms: Array<[PlatformCoverPlatform, string]> = [
  ["xiaohongshu", "小红书"],
  ["douyin", "抖音图文"],
  ["shipinhao", "视频号"],
  ["wechat", "公众号"],
  ["xianyu", "闲鱼"],
];

const coverGoals = ["种草封面", "知识干货", "对比避坑", "清单合集", "商品首图", "个人 IP 封面", "自定义"];
const visualStyles = ["清透生活感", "强对比信息流", "杂志留白", "电商干净主图", "高级简约", "自定义"];

export function PlatformCoverDesignWorkbench() {
  const [platform, setPlatform] = useState<PlatformCoverPlatform>("xiaohongshu");
  const [coverGoal, setCoverGoal] = useState(coverGoals[0]);
  const [customGoal, setCustomGoal] = useState("");
  const [visualStyle, setVisualStyle] = useState(visualStyles[0]);
  const [customStyle, setCustomStyle] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [textMode, setTextMode] = useState<PlatformCoverTextMode>("no_text");
  const [quality, setQuality] = useState("medium");
  const [batchCount, setBatchCount] = useState(1);
  const [coverImages, setCoverImages] = useState<File[]>([]);
  const [styleReferences, setStyleReferences] = useState<File[]>([]);
  const [promptDraft, setPromptDraft] = useState("");
  const [isPromptOpen, setPromptOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const restoredSessionId = useRef<string | null>(null);
  const { create, session } = useWorkbenchSession("platform-cover-design");

  const promptGoal = coverGoal === "自定义" ? customGoal : coverGoal;
  const promptStyle = visualStyle === "自定义" ? customStyle : visualStyle;
  const aspectRatio = getPlatformCoverAspectRatio(platform);
  const prompt = useMemo(
    () =>
      buildPlatformCoverDesignPrompt({
        coverGoal: promptGoal,
        editInstructions,
        hasStyleReferences: styleReferences.length > 0,
        platform,
        subtitle,
        textMode,
        title,
        visualStyle: promptStyle,
      }),
    [editInstructions, platform, promptGoal, promptStyle, styleReferences.length, subtitle, textMode, title],
  );
  const canSubmit = coverImages.length === 1 && !isGenerating;

  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(() => {
      const output = session.outputSnapshot;
      const imageUrls = Array.isArray(output.imageUrls)
        ? output.imageUrls.filter((item): item is string => typeof item === "string")
        : typeof output.imageUrl === "string"
          ? [output.imageUrl]
          : [];
      setResultImages(imageUrls);

      if (session.status === "RUNNING") {
        setIsGenerating(true);
        setNotice("生成任务仍在进行中，已恢复任务状态。");
      } else if (session.status === "SUCCEEDED") {
        setIsGenerating(false);
        setNotice(typeof output.summary === "string" ? output.summary : "平台封面已生成。");
      } else if (session.status === "FAILED") {
        setIsGenerating(false);
        setError(session.errorMessage || "上一次生成失败，请调整提示词后重试。");
      }

      if (restoredSessionId.current === session.id) return;
      restoredSessionId.current = session.id;
      const input = session.inputSnapshot;
      if (isPlatform(input.platform)) setPlatform(input.platform);
      if (typeof input.coverGoal === "string") setCoverGoal(input.coverGoal);
      if (typeof input.customGoal === "string") setCustomGoal(input.customGoal);
      if (typeof input.visualStyle === "string") setVisualStyle(input.visualStyle);
      if (typeof input.customStyle === "string") setCustomStyle(input.customStyle);
      if (typeof input.title === "string") setTitle(input.title);
      if (typeof input.subtitle === "string") setSubtitle(input.subtitle);
      if (typeof input.editInstructions === "string") setEditInstructions(input.editInstructions);
      if (input.textMode === "no_text" || input.textMode === "with_text") setTextMode(input.textMode);
      if (typeof input.quality === "string") setQuality(input.quality);
      if (typeof input.batchCount === "number") setBatchCount(input.batchCount);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [session]);

  function openPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (coverImages.length !== 1) {
      setError("请先上传 1 张封面原图");
      return;
    }
    setError(null);
    setPromptDraft(prompt);
    setPromptOpen(true);
  }

  async function generate(finalPrompt: string) {
    if (!finalPrompt.trim()) {
      setError("完整提示词不能为空");
      return;
    }

    setPromptOpen(false);
    setIsGenerating(true);
    setError(null);
    setNotice(null);
    let activeSessionId: string | null = null;

    try {
      const activeSession = await create({
        title: `${getPlatformCoverLabel(platform)}${promptGoal || "封面设计"}`,
        status: "RUNNING",
        prompt: finalPrompt,
        inputSnapshot: {
          platform,
          coverGoal,
          customGoal,
          visualStyle,
          customStyle,
          title,
          subtitle,
          editInstructions,
          textMode,
          quality,
          batchCount,
          coverImageCount: coverImages.length,
          styleReferenceCount: styleReferences.length,
        },
        outputSnapshot: {},
        imageAssetIds: [],
        externalJobId: null,
        errorMessage: null,
      });
      activeSessionId = activeSession.id;

      const response = await submitGeneration(activeSession.id, finalPrompt);
      const payload = (await response.json().catch(() => ({}))) as GenerationPayload;
      if (!response.ok) throw new Error(payload.error || "平台封面生成失败");

      const imageUrls = payload.results?.flatMap((item) => (item.imageUrl ? [item.imageUrl] : [])) || [];
      const summary = `已生成 ${imageUrls.length || batchCount} 张平台封面，结果已保存到统一图片画廊。`;
      setResultImages(imageUrls);
      setNotice(summary);
      await patchSession(activeSession.id, {
        status: "SUCCEEDED",
        externalJobId: payload.job?.id || null,
        imageAssetIds: payload.results?.flatMap((item) => (item.asset?.id ? [item.asset.id] : [])) || [],
        outputSnapshot: {
          imageUrl: imageUrls[0] || "",
          imageUrls,
          jobId: payload.job?.id || "",
          summary,
        },
        errorMessage: null,
      });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "平台封面生成失败";
      setError(message);
      if (activeSessionId) await patchSession(activeSessionId, { status: "FAILED", errorMessage: message });
    } finally {
      setIsGenerating(false);
    }
  }

  function submitGeneration(workbenchSessionId: string, finalPrompt: string) {
    const formData = new FormData();
    formData.set("mode", "custom");
    formData.set("sourceTool", "platform-cover-design");
    formData.set("description", `${getPlatformCoverLabel(platform)}封面设计`);
    formData.set("purpose", `${getPlatformCoverLabel(platform)}${promptGoal || "封面设计"}`);
    formData.set("style", promptStyle);
    formData.set("caption", [title, subtitle, promptGoal].filter(Boolean).join("｜"));
    formData.set("tags", `#封面设计 #${getPlatformCoverLabel(platform)} #AI生图`);
    formData.set("productKeywords", [getPlatformCoverLabel(platform), promptGoal, title].filter(Boolean).join(" "));
    formData.set("aspectRatio", aspectRatio);
    formData.set("quality", quality);
    formData.set("batchCount", String(batchCount));
    formData.set("finalPrompt", finalPrompt);
    formData.set("workbenchSessionId", workbenchSessionId);
    coverImages.forEach((file) => formData.append("image", file));
    styleReferences.forEach((file) => formData.append("image", file));

    return fetch("/api/tools/image-generation", { method: "POST", body: formData });
  }

  async function patchSession(sessionId: string, patch: Record<string, unknown>) {
    await fetch(`/api/tools/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">封面原图必传</Badge>
              <Badge variant="secondary">参考图可选</Badge>
            </div>
            <CardTitle>生成配置</CardTitle>
            <CardDescription>上传封面原图，可选上传风格参考图，确认完整提示词后生成平台封面设计。</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5" onSubmit={openPrompt}>
              <div className="grid gap-3 lg:grid-cols-2">
                <ImageReferenceUploader
                  emptyText="上传封面原图"
                  files={coverImages}
                  helper="必传 1 张，作为主体和构图基础"
                  label="封面原图"
                  maxFiles={1}
                  onChange={setCoverImages}
                />
                <ImageReferenceUploader
                  emptyText="上传风格参考图"
                  files={styleReferences}
                  helper="选传，最多 6 张，只参考版式和风格"
                  label="风格参考图"
                  maxFiles={6}
                  onChange={setStyleReferences}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <SelectField label="平台" onChange={(value) => setPlatform(value as PlatformCoverPlatform)} options={platforms} value={platform} />
                <PresetSelect label="封面目标" onChange={setCoverGoal} options={coverGoals} value={coverGoal} />
                <PresetSelect label="视觉风格" onChange={setVisualStyle} options={visualStyles} value={visualStyle} />
              </div>

              {coverGoal === "自定义" ? (
                <Field label="自定义封面目标">
                  <input className={inputClass} onChange={(event) => setCustomGoal(event.target.value)} placeholder="例如：AI 工具测评封面" value={customGoal} />
                </Field>
              ) : null}
              {visualStyle === "自定义" ? (
                <Field label="自定义视觉风格">
                  <input className={inputClass} onChange={(event) => setCustomStyle(event.target.value)} placeholder="例如：红黑强对比，标题区在左上" value={customStyle} />
                </Field>
              ) : null}

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="标题">
                  <input className={inputClass} onChange={(event) => setTitle(event.target.value)} placeholder="例如：普通人夏天这样穿" value={title} />
                </Field>
                <Field label="副标题">
                  <input className={inputClass} onChange={(event) => setSubtitle(event.target.value)} placeholder="例如：清爽显高，不费力" value={subtitle} />
                </Field>
              </div>

              <Field label="改造说明">
                <textarea className={textareaClass} onChange={(event) => setEditInstructions(event.target.value)} placeholder="例如：保留人物和商品，增强封面点击感，右侧留标题区" value={editInstructions} />
              </Field>

              <div className="grid gap-3 md:grid-cols-3">
                <SelectField label="文字模式" onChange={(value) => setTextMode(value as PlatformCoverTextMode)} options={[["no_text", "无文字底图"], ["with_text", "尝试带字"]]} value={textMode} />
                <SelectField label="质量" onChange={setQuality} options={[["low", "低"], ["medium", "中"], ["high", "高"]]} value={quality} />
                <SelectField label="数量" onChange={(value) => setBatchCount(Number(value))} options={["1", "2", "4", "6", "9", "12"].map((count) => [count, `${count} 张`])} value={String(batchCount)} />
              </div>

              {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
              {notice ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</div> : null}

              <Button className="h-11 gap-2" disabled={!canSubmit} type="submit">
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isGenerating ? "生成中" : "确认提示词并生成"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <PromptPreviewPanel
          meta={[
            { label: "平台", value: getPlatformCoverLabel(platform) },
            { label: "封面原图", value: `${coverImages.length} 张` },
            { label: "风格参考", value: `${styleReferences.length} 张` },
            { label: "比例", value: aspectRatio },
          ]}
          prompt={prompt}
        />
      </div>

      {resultImages.length > 0 ? (
        <section className="mt-5 border-t border-slate-200 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-950">本次生成结果</h2>
              <p className="mt-1 text-sm text-slate-500">已保存到统一图片画廊，可继续查看详情和参考图角色。</p>
            </div>
            <Button asChild variant="secondary"><Link href="/tools/image-gallery">打开图片画廊</Link></Button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {resultImages.map((imageUrl, index) => (
              <a className="block overflow-hidden rounded-lg border border-slate-200 bg-white" href={imageUrl} key={`${imageUrl}-${index}`} rel="noreferrer" target="_blank">
                <img alt={`平台封面结果 ${index + 1}`} className="aspect-square w-full object-cover" src={imageUrl} />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <PromptEditorDialog
        description="请确认或修改完整提示词，保存后才会提交本次平台封面生图任务。"
        onClose={() => setPromptOpen(false)}
        onSave={generate}
        open={isPromptOpen}
        prompt={promptDraft}
        title="确认平台封面提示词"
      />
    </>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return <label className="grid gap-2"><span className="text-sm font-semibold text-slate-700">{label}</span>{children}</label>;
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
  value: string;
}) {
  return (
    <Field label={label}>
      <select className={inputClass} onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </Field>
  );
}

function PresetSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <Field label={label}>
      <select className={inputClass} onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </Field>
  );
}

function isPlatform(value: unknown): value is PlatformCoverPlatform {
  return value === "xiaohongshu" || value === "douyin" || value === "shipinhao" || value === "wechat" || value === "xianyu";
}

const inputClass = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
const textareaClass = "min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
