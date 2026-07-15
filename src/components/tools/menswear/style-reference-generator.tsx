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
  buildMenswearStyleReferencePrompt,
  type MenswearStyleReferenceAspectRatio,
  type MenswearStyleReferenceCameraDistance,
} from "@/lib/menswear-style-reference";

type GenerationPayload = {
  error?: string;
  job?: { id?: string };
  results?: Array<{ imageUrl?: string; asset?: { id?: string } }>;
};

const preservePresets = [
  "保留颜色、版型、面料、纽扣、口袋和领型",
  "保留主商品轮廓、材质肌理、图案和穿着比例",
  "保留整套搭配关系、上下装颜色和鞋包配饰",
  "自定义",
];

const stylePresets = [
  "参考图的柔和日光、城市街拍镜头和自然背景",
  "参考图的棚拍光线、干净背景和商业电商质感",
  "参考图的胶片色调、生活化环境和松弛姿态",
  "自定义",
];

const aspectRatioOptions: Array<[MenswearStyleReferenceAspectRatio, string]> = [
  ["portrait", "竖图 3:4"],
  ["square", "方图 1:1"],
  ["landscape", "横图"],
];

const cameraDistanceOptions: Array<[MenswearStyleReferenceCameraDistance, string]> = [
  ["match_reference", "保持参考图远近"],
  ["full_body", "全身"],
  ["three_quarter", "七分身"],
  ["half_body", "半身"],
  ["close_detail", "近景细节"],
];

export function StyleReferenceGenerator() {
  const [mainImages, setMainImages] = useState<File[]>([]);
  const [styleImages, setStyleImages] = useState<File[]>([]);
  const [preservePreset, setPreservePreset] = useState(preservePresets[0]);
  const [customPreserve, setCustomPreserve] = useState("");
  const [stylePreset, setStylePreset] = useState(stylePresets[0]);
  const [customStyle, setCustomStyle] = useState("");
  const [aspectRatio, setAspectRatio] = useState<MenswearStyleReferenceAspectRatio>("portrait");
  const [cameraDistance, setCameraDistance] = useState<MenswearStyleReferenceCameraDistance>("match_reference");
  const [quality, setQuality] = useState("medium");
  const [batchCount, setBatchCount] = useState(2);
  const [promptDraft, setPromptDraft] = useState("");
  const [isPromptOpen, setPromptOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const restoredSessionId = useRef<string | null>(null);
  const { create, session } = useWorkbenchSession("menswear-style-reference");

  const preserveInstructions = preservePreset === "自定义" ? customPreserve : preservePreset;
  const styleInstructions = stylePreset === "自定义" ? customStyle : stylePreset;
  const prompt = useMemo(
    () =>
      buildMenswearStyleReferencePrompt({
        aspectRatio,
        cameraDistance,
        mainImageCount: mainImages.length,
        preserveInstructions,
        styleInstructions,
      }),
    [aspectRatio, cameraDistance, mainImages.length, preserveInstructions, styleInstructions],
  );
  const canSubmit = mainImages.length > 0 && styleImages.length === 1 && !isGenerating;

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
        setNotice(typeof output.summary === "string" ? output.summary : "风格参考图已生成。");
      } else if (session.status === "FAILED") {
        setIsGenerating(false);
        setError(session.errorMessage || "上一次生成失败，请调整后重试。");
      }

      if (restoredSessionId.current === session.id) return;
      restoredSessionId.current = session.id;
      const input = session.inputSnapshot;
      if (typeof input.preservePreset === "string") setPreservePreset(input.preservePreset);
      if (typeof input.customPreserve === "string") setCustomPreserve(input.customPreserve);
      if (typeof input.stylePreset === "string") setStylePreset(input.stylePreset);
      if (typeof input.customStyle === "string") setCustomStyle(input.customStyle);
      if (isAspectRatio(input.aspectRatio)) setAspectRatio(input.aspectRatio);
      if (isCameraDistance(input.cameraDistance)) setCameraDistance(input.cameraDistance);
      if (typeof input.quality === "string") setQuality(input.quality);
      if (typeof input.batchCount === "number") setBatchCount(input.batchCount);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [session]);

  function openPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mainImages.length === 0) {
      setError("请先上传至少一张服装主图");
      return;
    }
    if (styleImages.length !== 1) {
      setError("请上传一张风格参考图");
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
        title: "男装风格参考生图",
        status: "RUNNING",
        prompt: finalPrompt,
        inputSnapshot: {
          preservePreset,
          customPreserve,
          stylePreset,
          customStyle,
          aspectRatio,
          cameraDistance,
          quality,
          batchCount,
          mainImageCount: mainImages.length,
          styleImageCount: styleImages.length,
        },
        outputSnapshot: {},
        imageAssetIds: [],
        externalJobId: null,
        errorMessage: null,
      });
      activeSessionId = activeSession.id;

      const response = await submitGeneration(activeSession.id, finalPrompt);
      const payload = (await response.json().catch(() => ({}))) as GenerationPayload;
      if (!response.ok) throw new Error(payload.error || "男装风格参考生图失败");

      const imageUrls = payload.results?.flatMap((item) => (item.imageUrl ? [item.imageUrl] : [])) || [];
      const summary = `已生成 ${imageUrls.length || batchCount} 张图片，结果已保存到统一图片画廊。`;
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
      const message = caughtError instanceof Error ? caughtError.message : "男装风格参考生图失败";
      setError(message);
      if (activeSessionId) await patchSession(activeSessionId, { status: "FAILED", errorMessage: message });
    } finally {
      setIsGenerating(false);
    }
  }

  function submitGeneration(workbenchSessionId: string, finalPrompt: string) {
    const formData = new FormData();
    formData.set("mode", "menswear");
    formData.set("sourceTool", "menswear-style-reference");
    formData.set("description", "男装主图参考风格生成");
    formData.set("purpose", "男装风格参考生图");
    formData.set("style", styleInstructions);
    formData.set("caption", `按风格参考图生成真实男装图，保留要求：${preserveInstructions}`);
    formData.set("tags", "#男装 #风格参考 #AI生图");
    formData.set("productKeywords", "男装 风格参考 真实服装摄影");
    formData.set("aspectRatio", aspectRatio);
    formData.set("quality", quality);
    formData.set("batchCount", String(batchCount));
    formData.set("finalPrompt", finalPrompt);
    formData.set("workbenchSessionId", workbenchSessionId);
    mainImages.forEach((file) => formData.append("image", file));
    styleImages.forEach((file) => formData.append("image", file));

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
              <Badge variant="success">主图真实保留</Badge>
              <Badge variant="secondary">参考图只取风格</Badge>
            </div>
            <CardTitle>生成配置</CardTitle>
            <CardDescription>上传多张服装主图和一张风格参考图，确认完整提示词后生成。</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5" onSubmit={openPrompt}>
              <div className="grid gap-3 lg:grid-cols-2">
                <ImageReferenceUploader
                  emptyText="上传服装主图"
                  files={mainImages}
                  helper="可上传 1-6 张，前置图片会被视为商品真实依据"
                  label="服装主图"
                  maxFiles={6}
                  onChange={setMainImages}
                />
                <ImageReferenceUploader
                  emptyText="上传风格参考图"
                  files={styleImages}
                  helper="仅 1 张，只参考光线、镜头、氛围与色彩"
                  label="风格参考图"
                  maxFiles={1}
                  onChange={setStyleImages}
                />
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <SelectField label="保留内容" onChange={setPreservePreset} options={preservePresets} value={preservePreset} />
                <SelectField label="参考风格" onChange={setStylePreset} options={stylePresets} value={stylePreset} />
              </div>

              {preservePreset === "自定义" ? (
                <Field label="自定义保留说明">
                  <textarea className={textareaClass} onChange={(event) => setCustomPreserve(event.target.value)} placeholder="例如：保留蓝白条纹、落肩版型、贝壳纽扣和裤装垂感" value={customPreserve} />
                </Field>
              ) : null}
              {stylePreset === "自定义" ? (
                <Field label="自定义风格说明">
                  <textarea className={textareaClass} onChange={(event) => setCustomStyle(event.target.value)} placeholder="例如：参考图的雨后街道、长焦压缩感和低饱和绿色调" value={customStyle} />
                </Field>
              ) : null}

              <div className="grid gap-3 md:grid-cols-3">
                <SelectField
                  label="画面比例"
                  onChange={(value) => setAspectRatio(value as MenswearStyleReferenceAspectRatio)}
                  options={aspectRatioOptions}
                  value={aspectRatio}
                />
                <SelectField
                  label="人物远近"
                  onChange={(value) => setCameraDistance(value as MenswearStyleReferenceCameraDistance)}
                  options={cameraDistanceOptions}
                  value={cameraDistance}
                />
                <SelectField label="质量" onChange={setQuality} options={["low", "medium", "high"]} value={quality} />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <SelectField label="数量" onChange={(value) => setBatchCount(Number(value))} options={["1", "2", "4", "6", "9", "12"]} value={String(batchCount)} />
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
            { label: "服装主图", value: `${mainImages.length} 张` },
            { label: "风格参考", value: `${styleImages.length} 张` },
            { label: "人物远近", value: cameraDistanceLabel(cameraDistance) },
            { label: "数量", value: `${batchCount} 张` },
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
                <img alt={`男装风格参考结果 ${index + 1}`} className="aspect-[3/4] w-full object-cover" src={imageUrl} />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <PromptEditorDialog
        description="请确认或修改完整提示词，保存后才会提交本次生图任务。"
        onClose={() => setPromptOpen(false)}
        onSave={generate}
        open={isPromptOpen}
        prompt={promptDraft}
        title="确认男装风格参考提示词"
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
  options: string[] | Array<[string, string]>;
  value: string;
}) {
  const normalizedOptions = options.map((option) =>
    Array.isArray(option) ? option : [option, option],
  );

  return (
    <Field label={label}>
      <select className={inputClass} onChange={(event) => onChange(event.target.value)} value={value}>
        {normalizedOptions.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </Field>
  );
}

const inputClass = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
const textareaClass = "min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

function isAspectRatio(value: unknown): value is MenswearStyleReferenceAspectRatio {
  return aspectRatioOptions.some(([option]) => option === value);
}

function isCameraDistance(value: unknown): value is MenswearStyleReferenceCameraDistance {
  return cameraDistanceOptions.some(([option]) => option === value);
}

function cameraDistanceLabel(value: MenswearStyleReferenceCameraDistance) {
  return cameraDistanceOptions.find(([option]) => option === value)?.[1] || "保持参考图远近";
}
