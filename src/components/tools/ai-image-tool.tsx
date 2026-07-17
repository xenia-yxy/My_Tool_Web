"use client";

import Link from "next/link";
import { Loader2, Sparkles, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PromptEditorDialog } from "@/components/tools/prompt-editor-dialog";
import { useWorkbenchSession } from "@/components/tools/workbench-session-client";
import { buildAiPromptPreview } from "@/lib/image-generation-workflow";

type AiImageToolMode = "custom" | "outfit";

type AiImageToolProps = {
  mode: AiImageToolMode;
};

type GenerationPayload = {
  error?: string;
  job?: { id: string };
  results?: Array<{ imageUrl: string; asset?: { id: string } }>;
};

const customPurposes = ["自由创作", "头像", "海报", "电商图", "封面", "插画"];
const styles = ["自然清晰", "商业摄影", "插画", "极简", "国潮", "赛博"];
const categories = ["T 恤", "衬衫", "裙子", "外套", "裤子", "套装"];
const scenes = ["小红书", "电商详情页", "朋友圈", "海报", "穿搭参考"];

export function AiImageTool({ mode }: AiImageToolProps) {
  const isOutfit = mode === "outfit";
  const toolId = isOutfit ? "outfit-image" : "ai-image";
  const [description, setDescription] = useState("");
  const [purpose, setPurpose] = useState(customPurposes[0]);
  const [style, setStyle] = useState(styles[0]);
  const [category, setCategory] = useState(categories[0]);
  const [scene, setScene] = useState(scenes[0]);
  const [aspectRatio, setAspectRatio] = useState(isOutfit ? "landscape" : "square");
  const [quality, setQuality] = useState("low");
  const [batchCount, setBatchCount] = useState(1);
  const [outfitModelMode, setOutfitModelMode] = useState("flatlay");
  const [outfitModelGender, setOutfitModelGender] = useState("unspecified");
  const [outfitModelFace, setOutfitModelFace] = useState("no_face");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [promptDraft, setPromptDraft] = useState("");
  const [isPromptEditorOpen, setIsPromptEditorOpen] = useState(false);
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
  const restoredSessionId = useRef<string | null>(null);
  const { create, persist, session } = useWorkbenchSession(toolId);
  const previewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const title = isOutfit ? "AI 穿搭生图" : "AI 自定义生图";
  const descriptionPlaceholder = isOutfit
    ? "例如：保持白衬衫为主体，生成适合春夏通勤的真实搭配图；图片里不要文字"
    : "例如：一张红色跑车海报，冷色灯光，适合小红书封面；图片里不要文字";
  const canSubmit = description.trim() && (!isOutfit || imageFile) && !isGenerating;
  const fullPrompt = useMemo(
    () =>
      buildAiPromptPreview({
        mode,
        description,
        purpose,
        style,
        category,
        scene,
        outfitModelMode,
        outfitModelGender,
        outfitModelFace,
        hasReferenceImages: Boolean(imageFile),
      }),
    [
      category,
      description,
      imageFile,
      mode,
      outfitModelFace,
      outfitModelGender,
      outfitModelMode,
      purpose,
      scene,
      style,
    ],
  );

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
        setNotice("生成任务仍在进行中，切换页面后状态已恢复。");
      } else if (session.status === "SUCCEEDED") {
        setIsGenerating(false);
        setNotice(typeof output.summary === "string" ? output.summary : "图片已生成，可在下方查看或去画廊管理。");
      } else if (session.status === "FAILED") {
        setIsGenerating(false);
        setError(session.errorMessage || "上一次生成失败，请调整提示词后重试。");
      }

      if (restoredSessionId.current === session.id) return;
      restoredSessionId.current = session.id;
      const input = session.inputSnapshot;
      if (typeof input.description === "string") setDescription(input.description);
      if (typeof input.purpose === "string") setPurpose(input.purpose);
      if (typeof input.style === "string") setStyle(input.style);
      if (typeof input.category === "string") setCategory(input.category);
      if (typeof input.scene === "string") setScene(input.scene);
      if (typeof input.aspectRatio === "string") setAspectRatio(input.aspectRatio);
      if (typeof input.quality === "string") setQuality(input.quality);
      if (typeof input.batchCount === "number") setBatchCount(input.batchCount);
      if (typeof input.outfitModelMode === "string") setOutfitModelMode(input.outfitModelMode);
      if (typeof input.outfitModelGender === "string") setOutfitModelGender(input.outfitModelGender);
      if (typeof input.outfitModelFace === "string") setOutfitModelFace(input.outfitModelFace);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPromptDraft(fullPrompt);
    setIsPromptEditorOpen(true);
  }

  async function generateImages(promptToSubmit: string) {
    if (!promptToSubmit.trim()) {
      setError("完整提示词不能为空");
      return;
    }

    setError(null);
    setNotice(null);
    setIsGenerating(true);

    try {
      const activeSession = await create({
        title: isOutfit ? `${category} ${scene}穿搭图` : purpose || "AI 生图",
        status: "RUNNING",
        prompt: promptToSubmit,
        inputSnapshot: {
          description,
          purpose,
          style,
          category,
          scene,
          aspectRatio,
          quality,
          batchCount,
          outfitModelMode,
          outfitModelGender,
          outfitModelFace,
        },
        outputSnapshot: {},
        imageAssetIds: [],
        externalJobId: null,
        errorMessage: null,
      });
      const response = isOutfit
        ? await submitOutfitRequest(activeSession.id, promptToSubmit)
        : await submitCustomRequest(activeSession.id, promptToSubmit);
      const payload = (await response.json()) as GenerationPayload;

      if (!response.ok) {
        throw new Error(payload.error || "生成失败");
      }

      if ("queued" in payload && payload.queued) {
        setResultImages([]);
        setNotice("已进入任务队列，可继续上传下一组素材；完成后会自动保存到统一图片画廊。");
        return;
      }

      const imageUrls = payload.results?.map((result) => result.imageUrl).filter(Boolean) ?? [];
      setResultImages(imageUrls);
      const summary = `已生成 ${imageUrls.length || batchCount} 张图片，结果已保存到统一图片画廊。`;
      setNotice(summary);
      await persist({
        status: "SUCCEEDED",
        externalJobId: payload.job?.id ?? null,
        imageAssetIds: payload.results?.flatMap((result) => (result.asset?.id ? [result.asset.id] : [])) ?? [],
        outputSnapshot: {
          imageUrl: imageUrls[0] || "",
          imageUrls,
          jobId: payload.job?.id || "",
          summary,
        },
      });
    } catch (caughtError) {
      const errorMessage = caughtError instanceof Error ? caughtError.message : "生成失败";
      setError(errorMessage);
      await persist({ status: "FAILED", errorMessage });
    } finally {
      setIsGenerating(false);
    }
  }

  function submitCustomRequest(workbenchSessionId: string, finalPrompt: string) {
    const fullDescription = `${description}\n\n强制要求：图片里不要出现任何多余文字、水印、账号、价格、标签；标题和文案只在系统画廊显示。`;
    const caption = `${description.trim()}。可在画廊下载图片、复制链接或继续整理发布。`;

    if (imageFile) {
      const formData = new FormData();
      formData.set("mode", "custom");
      formData.set("sourceTool", "custom");
      formData.set("description", fullDescription);
      formData.set("purpose", purpose);
      formData.set("style", style);
      formData.set("caption", caption);
      formData.set("tags", `#AI生图 #${purpose} #${style}`);
      formData.set("aspectRatio", aspectRatio);
      formData.set("quality", quality);
      formData.set("batchCount", String(batchCount));
      formData.set("finalPrompt", finalPrompt);
      formData.set("workbenchSessionId", workbenchSessionId);
      formData.set("image", imageFile);

      return fetch("/api/tools/image-generation", {
        method: "POST",
        body: formData,
      });
    }

    return fetch("/api/tools/image-generation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "custom",
        sourceTool: "custom",
        description: fullDescription,
        purpose,
        style,
        caption,
        tags: ["#AI生图", `#${purpose}`, `#${style}`],
        aspectRatio,
        quality,
        batchCount,
        finalPrompt,
        workbenchSessionId,
      }),
    });
  }

  function submitOutfitRequest(workbenchSessionId: string, finalPrompt: string) {
    if (!imageFile) {
      throw new Error("请先上传服装参考图");
    }

    const formData = new FormData();
    formData.set("mode", "outfit");
    formData.set("sourceTool", "outfit");
    formData.set("description", `${description}\n\n强制要求：图片里不要文字、水印、账号、价格、标签。`);
    formData.set("category", category);
    formData.set("scene", scene);
    formData.set("caption", `${category}｜${scene}｜${description.trim()}`);
    formData.set("tags", `#穿搭 #AI生图 #${category} #${scene}`);
    formData.set("aspectRatio", aspectRatio);
    formData.set("quality", quality);
    formData.set("batchCount", String(batchCount));
    formData.set("finalPrompt", finalPrompt);
    formData.set("workbenchSessionId", workbenchSessionId);
    formData.set("outfitModelMode", outfitModelMode);
    formData.set("outfitModelGender", outfitModelGender);
    formData.set("outfitModelFace", outfitModelFace);
    formData.set("image", imageFile);

    return fetch("/api/tools/image-generation", {
      method: "POST",
      body: formData,
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,420px)_1fr]">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">登录可用</Badge>
            <Badge variant="secondary">
              {isOutfit ? "参考图" : imageFile ? "参考图编辑" : "文生图"}
            </Badge>
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            这里只负责生成图片，所有历史、下载、文案、tags 都统一进入图片画廊。
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">
                {isOutfit ? "服装参考图" : "参考图（可选）"}
              </span>
              <div className="grid min-h-44 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                {previewUrl ? (
                  <button
                    aria-label="查看参考图"
                    className="cursor-zoom-in"
                    onClick={() => setExpandedImageUrl(previewUrl)}
                    type="button"
                  >
                    <img
                      alt={isOutfit ? "服装参考图预览" : "参考图预览"}
                      className="max-h-64 w-full rounded-md object-contain"
                      src={previewUrl}
                    />
                  </button>
                ) : (
                  <div className="grid gap-2 text-sm text-slate-500">
                    <Upload aria-hidden="true" className="mx-auto h-7 w-7" />
                    <span>{isOutfit ? "PNG / JPG / WebP" : "不上传就是文生图；上传后按描述编辑参考图"}</span>
                  </div>
                )}
              </div>
              <input
                accept="image/png,image/jpeg,image/webp"
                className="text-sm text-slate-600"
                onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                type="file"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">生图描述</span>
              <textarea
                className="min-h-32 rounded-md border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                onChange={(event) => setDescription(event.target.value)}
                placeholder={descriptionPlaceholder}
                required
                value={description}
              />
            </label>

            {isOutfit ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SelectField label="品类" onChange={setCategory} options={categories} value={category} />
                  <SelectField label="使用场景" onChange={setScene} options={scenes} value={scene} />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <SelectField
                    label="展示方式"
                    onChange={setOutfitModelMode}
                    options={[
                      ["flatlay", "无模特平铺"],
                      ["half_body", "半身模特"],
                      ["full_body", "全身模特"],
                    ]}
                    value={outfitModelMode}
                  />
                  <SelectField
                    disabled={outfitModelMode === "flatlay"}
                    label="模特性别"
                    onChange={setOutfitModelGender}
                    options={[
                      ["unspecified", "不限"],
                      ["female", "女模特"],
                      ["male", "男模特"],
                    ]}
                    value={outfitModelGender}
                  />
                  <SelectField
                    disabled={outfitModelMode === "flatlay"}
                    label="脸部"
                    onChange={setOutfitModelFace}
                    options={[
                      ["no_face", "不露脸"],
                      ["show_face", "露脸"],
                    ]}
                    value={outfitModelFace}
                  />
                </div>
              </>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField label="用途" onChange={setPurpose} options={customPurposes} value={purpose} />
                <SelectField label="风格" onChange={setStyle} options={styles} value={style} />
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <SelectField
                label="尺寸"
                onChange={setAspectRatio}
                options={[
                  ["square", "方图"],
                  ["portrait", "竖图"],
                  ["landscape", "横图"],
                ]}
                value={aspectRatio}
              />
              <SelectField
                label="质量"
                onChange={setQuality}
                options={[
                  ["low", "低"],
                  ["medium", "中"],
                  ["high", "高"],
                ]}
                value={quality}
              />
              <SelectField
                label="数量"
                onChange={(value) => setBatchCount(Number(value))}
                options={[
                  ["1", "1 张"],
                  ["2", "2 张"],
                  ["4", "4 张"],
                  ["6", "6 张"],
                  ["9", "9 张"],
                  ["12", "12 张"],
                  ["30", "30 张"],
                ]}
                value={String(batchCount)}
              />
            </div>

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <Button className="h-11 gap-2" disabled={!canSubmit} type="submit">
              {isGenerating ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles aria-hidden="true" className="h-4 w-4" />
              )}
              {isGenerating ? "生成中" : `生成 ${batchCount} 张图片`}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>统一画廊</CardTitle>
          <CardDescription>
            生成完成后不在本页堆结果，统一去画廊查看、下载和复制文案。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {notice ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
              {notice}
            </div>
          ) : (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
              图片生成成功后会自动保存到统一图片画廊；批量任务状态也在那里看。
            </div>
          )}
          {resultImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {resultImages.map((imageUrl, index) => (
                <button
                  aria-label={`查看已生成图片 ${index + 1}`}
                  className="cursor-zoom-in"
                  key={imageUrl}
                  onClick={() => setExpandedImageUrl(imageUrl)}
                  type="button"
                >
                  <img
                    alt={`已生成图片 ${index + 1}`}
                    className="aspect-square w-full rounded-md border border-slate-200 object-cover"
                    src={imageUrl}
                  />
                </button>
              ))}
            </div>
          ) : null}
          <Button asChild>
            <Link href="/tools/image-gallery">打开统一图片画廊</Link>
          </Button>
        </CardContent>
      </Card>
      <PromptEditorDialog
        description="请确认或修改完整提示词，保存后才会提交本次生图任务。"
        onClose={() => setIsPromptEditorOpen(false)}
        onSave={generateImages}
        open={isPromptEditorOpen}
        prompt={promptDraft}
        title="确认完整生图提示词"
      />
      <ImagePreviewDialog
        imageUrl={expandedImageUrl}
        onClose={() => setExpandedImageUrl(null)}
      />
    </div>
  );
}

function ImagePreviewDialog({
  imageUrl,
  onClose,
}: {
  imageUrl: string | null;
  onClose: () => void;
}) {
  if (!imageUrl) return null;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4"
      onClick={onClose}
      role="dialog"
    >
      <button aria-label="关闭图片预览" className="max-h-full max-w-full cursor-zoom-out" type="button">
        <img alt="图片预览" className="max-h-[90dvh] max-w-[94vw] rounded-md object-contain" src={imageUrl} />
      </button>
    </div>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  options: string[] | Array<[string, string]>;
  onChange: (value: string) => void;
  disabled?: boolean;
};

function SelectField({
  label,
  value,
  options,
  onChange,
  disabled,
}: SelectFieldProps) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => {
          const [optionValue, optionLabel] = Array.isArray(option)
            ? option
            : [option, option];

          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </label>
  );
}
