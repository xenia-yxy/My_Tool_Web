"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ImageIcon,
  Loader2,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  buildSocialCommerceOutput,
  getSocialCommercePresets,
  type SocialCommercePlatform,
} from "@/lib/social-commerce-workflow";
import { recordWorkbenchAction } from "@/components/tools/workbench-action-recorder";
import { PromptEditorDialog } from "@/components/tools/prompt-editor-dialog";

const inputClass =
  "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
const textareaClass =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

export function SocialCommerceWorkbench() {
  const presets = useMemo(() => getSocialCommercePresets(), []);
  const [platform, setPlatform] = useState<SocialCommercePlatform>("xiaohongshu");
  const [itemDescription, setItemDescription] = useState("夏季通勤白色短袖衬衫，适合小个子女生");
  const [audience, setAudience] = useState("小个子女生");
  const [scene, setScene] = useState("夏季通勤");
  const [sellingPoint, setSellingPoint] = useState("清爽、显高、好搭配");
  const [extraInstructions, setExtraInstructions] = useState("");
  const [contentType, setContentType] = useState(presets.xiaohongshu.contentTypes[0]);
  const [brand, setBrand] = useState("索尼");
  const [model, setModel] = useState("WH-1000XM5");
  const [category, setCategory] = useState("降噪耳机");
  const [condition, setCondition] = useState("95新");
  const [flaws, setFlaws] = useState("右耳罩有轻微使用痕迹");
  const [accessories, setAccessories] = useState("包装盒、收纳盒、音频线、充电线");
  const [priceRange, setPriceRange] = useState("1500-1700");
  const [transferReason, setTransferReason] = useState("换新款");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [batchCount, setBatchCount] = useState(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPromptEditorOpen, setIsPromptEditorOpen] = useState(false);
  const [promptDraft, setPromptDraft] = useState("");
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
  const [generatedCoverUrls, setGeneratedCoverUrls] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const output = useMemo(
    () =>
      buildSocialCommerceOutput({
        platform,
        itemDescription,
        audience,
        scene,
        sellingPoint,
        extraInstructions,
        contentType,
        brand,
        model,
        category,
        condition,
        flaws,
        accessories,
        priceRange,
        transferReason,
        hasReferenceImages: imageFiles.length > 0,
      }),
    [
      accessories,
      audience,
      brand,
      category,
      condition,
      contentType,
      extraInstructions,
      flaws,
      imageFiles.length,
      itemDescription,
      model,
      platform,
      priceRange,
      scene,
      sellingPoint,
      transferReason,
    ],
  );

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setImageFiles((current) => [...current, ...Array.from(files)].slice(0, 8));
  }

  function removeImage(index: number) {
    setImageFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  }

  const imagePreviews = useMemo(
    () => imageFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [imageFiles],
  );

  useEffect(() => {
    return () => imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [imagePreviews]);

  async function copyText(key: string, value: string) {
    await navigator.clipboard.writeText(value);
    void recordWorkbenchAction({
      toolId: "social-commerce",
      toolLabel: "小红书/闲鱼",
      actionLabel: "复制内容",
      title: `复制${copyLabel(key)}：${output.titleCandidates[0]?.title || itemDescription}`,
      fields: [
        { label: "平台", value: platform === "xiaohongshu" ? "小红书" : "闲鱼" },
        { label: "内容", value: copyLabel(key) },
        { label: "商品/主题", value: itemDescription },
      ],
      inputSnapshot: {
        platform,
        itemDescription,
        audience,
        scene,
        sellingPoint,
        contentType,
      },
      outputSummary: `${copyLabel(key)}已复制。`,
      outputSnapshot: {
        key,
        value,
      },
    });
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1200);
  }

  function requestCoverGeneration() {
    setPromptDraft(output.imagePrompt);
    setIsPromptEditorOpen(true);
  }

  async function generateCoverImage(finalPrompt: string) {
    if (!finalPrompt.trim()) {
      setError("完整提示词不能为空");
      return;
    }

    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    try {
      const response =
        imageFiles.length > 0
          ? await submitMultipartImageRequest(finalPrompt)
          : await submitJsonImageRequest(finalPrompt);
      const payload = (await response.json()) as {
        error?: string;
        results?: Array<{ imageUrl?: string }>;
      };

      if (!response.ok) {
        throw new Error(payload.error || "封面底图生成失败");
      }

      const imageUrls = payload.results
        ?.map((item) => item.imageUrl)
        .filter((url): url is string => Boolean(url)) ?? [];
      setGeneratedCoverUrls(imageUrls);
      setNotice(`已生成 ${imageUrls.length || batchCount} 张封面底图，并保存到图片画廊。`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "封面底图生成失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  function submitJsonImageRequest(finalPrompt: string) {
    return fetch("/api/tools/image-generation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "custom",
        sourceTool: "social-commerce",
        description: output.imagePrompt,
        finalPrompt,
        purpose: output.titleCandidates[0]?.title ?? "社交电商封面",
        style: platform === "xiaohongshu" ? "小红书封面" : "闲鱼首图",
        caption: output.caption,
        tags: output.tags,
        productKeywords: output.keywords,
        aspectRatio: output.aspectRatio,
        quality: "low",
        batchCount,
      }),
    });
  }

  function submitMultipartImageRequest(finalPrompt: string) {
    const formData = new FormData();
    formData.set("mode", "custom");
    formData.set("sourceTool", "social-commerce");
    formData.set("description", output.imagePrompt);
    formData.set("finalPrompt", finalPrompt);
    formData.set("purpose", output.titleCandidates[0]?.title ?? "社交电商封面");
    formData.set("style", platform === "xiaohongshu" ? "小红书封面" : "闲鱼首图");
    formData.set("caption", output.caption);
    formData.set("tags", output.tags.join(" "));
    formData.set("productKeywords", output.keywords.join("，"));
    formData.set("aspectRatio", output.aspectRatio);
    formData.set("quality", "low");
    formData.set("batchCount", String(batchCount));
    imageFiles.forEach((file) => formData.append("image", file));

    return fetch("/api/tools/image-generation", {
      method: "POST",
      body: formData,
    });
  }

  const optionScenes =
    platform === "xiaohongshu" ? presets.xiaohongshu.scenes : presets.xianyu.scenes;
  const optionAudiences =
    platform === "xiaohongshu"
      ? presets.xiaohongshu.audiences
      : ["通勤降噪用户", "学生党", "租房党", "数码玩家", "自用买家", "同城买家"];

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>内容输入</CardTitle>
              <CardDescription>选择平台后填写商品、场景和交易信息。</CardDescription>
            </div>
            <Badge variant={platform === "xiaohongshu" ? "default" : "success"}>
              {platform === "xiaohongshu" ? "小红书" : "闲鱼"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
            <PlatformButton
              isActive={platform === "xiaohongshu"}
              label="小红书"
              onClick={() => setPlatform("xiaohongshu")}
            />
            <PlatformButton
              isActive={platform === "xianyu"}
              label="闲鱼"
              onClick={() => setPlatform("xianyu")}
            />
          </div>

          <Field label={platform === "xiaohongshu" ? "商品/主题" : "商品描述"}>
            <textarea
              className={`${textareaClass} min-h-24`}
              onChange={(event) => setItemDescription(event.target.value)}
              value={itemDescription}
            />
          </Field>

          <Field label="目标人群">
            <OptionGrid
              options={optionAudiences}
              selected={audience}
              onSelect={setAudience}
            />
            <input
              className={`${inputClass} mt-2`}
              onChange={(event) => setAudience(event.target.value)}
              value={audience}
            />
          </Field>

          <Field label="场景">
            <OptionGrid options={optionScenes} selected={scene} onSelect={setScene} />
            <input
              className={`${inputClass} mt-2`}
              onChange={(event) => setScene(event.target.value)}
              value={scene}
            />
          </Field>

          <Field label="核心卖点">
            <input
              className={inputClass}
              onChange={(event) => setSellingPoint(event.target.value)}
              value={sellingPoint}
            />
          </Field>

          {platform === "xiaohongshu" ? (
            <Field label="内容类型">
              <OptionGrid
                options={presets.xiaohongshu.contentTypes}
                selected={contentType}
                onSelect={setContentType}
              />
            </Field>
          ) : (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="品牌">
                  <input
                    className={inputClass}
                    onChange={(event) => setBrand(event.target.value)}
                    value={brand}
                  />
                </Field>
                <Field label="型号">
                  <input
                    className={inputClass}
                    onChange={(event) => setModel(event.target.value)}
                    value={model}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="品类">
                  <input
                    className={inputClass}
                    onChange={(event) => setCategory(event.target.value)}
                    value={category}
                  />
                </Field>
                <Field label="成色">
                  <select
                    className={inputClass}
                    onChange={(event) => setCondition(event.target.value)}
                    value={condition}
                  >
                    {presets.xianyu.conditions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="瑕疵">
                <input
                  className={inputClass}
                  onChange={(event) => setFlaws(event.target.value)}
                  value={flaws}
                />
              </Field>
              <Field label="配件">
                <input
                  className={inputClass}
                  onChange={(event) => setAccessories(event.target.value)}
                  value={accessories}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="价格区间">
                  <input
                    className={inputClass}
                    onChange={(event) => setPriceRange(event.target.value)}
                    value={priceRange}
                  />
                </Field>
                <Field label="转卖原因">
                  <input
                    className={inputClass}
                    onChange={(event) => setTransferReason(event.target.value)}
                    value={transferReason}
                  />
                </Field>
              </div>
            </div>
          )}

          <Field label="参考图">
            <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition-colors hover:border-blue-300 hover:bg-blue-50">
              <Upload aria-hidden="true" className="h-5 w-5 text-slate-500" />
              <span className="mt-2 text-sm text-slate-700">上传商品图、实拍图或封面参考</span>
              <span className="mt-1 text-xs text-slate-500">最多 8 张，提交生图时会一并使用</span>
              <input
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                multiple
                onChange={(event) => handleFiles(event.target.files)}
                type="file"
              />
            </label>
            {imagePreviews.length > 0 ? (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {imagePreviews.map(({ file, url }, index) => (
                  <div className="group relative aspect-square overflow-hidden rounded-md border border-slate-200 bg-slate-50" key={`${file.name}-${index}`}>
                    <button
                      aria-label={`查看参考图 ${index + 1}`}
                      className="absolute inset-0 cursor-zoom-in"
                      onClick={() => setExpandedImageUrl(url)}
                      type="button"
                    >
                      <img alt={file.name} className="h-full w-full object-cover" src={url} />
                    </button>
                    <button
                      aria-label={`移除参考图 ${index + 1}`}
                      className="absolute right-1 top-1 z-10 rounded bg-white/90 p-1 text-slate-500 shadow-sm transition-colors hover:bg-white hover:text-slate-900"
                      onClick={() => removeImage(index)}
                      type="button"
                    >
                      <X aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </Field>

          <Field label="补充要求">
            <textarea
              className={`${textareaClass} min-h-20`}
              onChange={(event) => setExtraInstructions(event.target.value)}
              placeholder="例如：更真实、不要棚拍感、突出细节、适合夏季发布"
              value={extraInstructions}
            />
          </Field>

          <Field label="生成数量">
            <select
              className={inputClass}
              onChange={(event) => setBatchCount(Number(event.target.value))}
              value={batchCount}
            >
              {[1, 2, 4, 6, 9, 12].map((count) => (
                <option key={count} value={count}>
                  {count} 张
                </option>
              ))}
            </select>
          </Field>

          <Button
            className="h-11 w-full gap-2"
            disabled={isSubmitting}
            onClick={requestCoverGeneration}
            type="button"
          >
            {isSubmitting ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon aria-hidden="true" className="h-4 w-4" />
            )}
            {isSubmitting ? "提交中" : `生成 ${batchCount} 张封面底图`}
          </Button>

          {notice ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {notice}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-5">
        <ResultCard
          action={
            <CopyButton
              copied={copiedKey === "titles"}
              onClick={() =>
                void copyText(
                  "titles",
                  output.titleCandidates.map((item) => `${item.angle}：${item.title}`).join("\n"),
                )
              }
            />
          }
          icon={<Sparkles aria-hidden="true" className="h-4 w-4 text-blue-600" />}
          title="标题候选"
        >
          <div className="grid gap-2 md:grid-cols-2">
            {output.titleCandidates.map((item) => (
              <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2" key={item.title}>
                <p className="text-xs text-slate-500">{item.angle}</p>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-950">{item.title}</p>
              </div>
            ))}
          </div>
        </ResultCard>

        <ResultCard title="封面方向">
          <div className="grid gap-3 md:grid-cols-2">
            {output.coverDirections.map((item, index) => (
              <div className="rounded-md border border-slate-100 bg-white px-3 py-3" key={item}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-950">方向 {index + 1}</p>
                  <Badge variant="secondary">不写进图里</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item}</p>
              </div>
            ))}
          </div>
        </ResultCard>

        <ResultCard
          action={
            <CopyButton
              copied={copiedKey === "caption"}
              onClick={() => void copyText("caption", output.caption)}
            />
          }
          title={platform === "xiaohongshu" ? "笔记正文" : "商品说明"}
        >
          <pre className="whitespace-pre-wrap rounded-md bg-slate-950 p-4 text-sm leading-7 text-slate-100">
            {output.caption}
          </pre>
        </ResultCard>

        <div className="grid gap-5 xl:grid-cols-2">
          <ResultCard
            action={
              <CopyButton
                copied={copiedKey === "tags"}
                onClick={() =>
                  void copyText(
                    "tags",
                    platform === "xiaohongshu" ? output.tags.join(" ") : output.keywords.join("，"),
                  )
                }
              />
            }
            title={platform === "xiaohongshu" ? "标签" : "搜索关键词"}
          >
            <div className="flex flex-wrap gap-2">
              {(platform === "xiaohongshu" ? output.tags : output.keywords).map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
            </div>
          </ResultCard>

          <ResultCard title="发布检查">
            <div className="grid gap-2">
              {output.publishChecks.map((item) => (
                <div className="flex gap-2 rounded-md bg-slate-50 px-3 py-2" key={item.message}>
                  {item.status === "ok" ? (
                    <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-950">
                      {item.status === "ok" ? "已满足" : "需补充"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ResultCard>
        </div>

        {output.replyScripts.length > 0 ? (
          <ResultCard
            action={
              <CopyButton
                copied={copiedKey === "scripts"}
                onClick={() => void copyText("scripts", output.replyScripts.join("\n"))}
              />
            }
            title="沟通话术"
          >
            <div className="grid gap-2 md:grid-cols-2">
              {output.replyScripts.map((item) => (
                <p className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700" key={item}>
                  {item}
                </p>
              ))}
            </div>
          </ResultCard>
        ) : null}

        <ResultCard
          action={
            <CopyButton
              copied={copiedKey === "prompt"}
              onClick={() => void copyText("prompt", output.imagePrompt)}
            />
          }
          title="封面底图提示词"
        >
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-800">
            {output.imagePrompt}
          </pre>
        </ResultCard>
      </div>
      {generatedCoverUrls.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>本次封面结果</CardTitle>
            <CardDescription>点击图片可放大查看，全部结果也已保存到统一图片画廊。</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {generatedCoverUrls.map((url, index) => (
              <button
                aria-label={`查看封面结果 ${index + 1}`}
                className="cursor-zoom-in"
                key={url}
                onClick={() => setExpandedImageUrl(url)}
                type="button"
              >
                <img alt={`封面结果 ${index + 1}`} className="aspect-square w-full rounded-md border border-slate-200 object-cover" src={url} />
              </button>
            ))}
          </CardContent>
        </Card>
      ) : null}
      <PromptEditorDialog
        description="请确认或修改完整提示词，保存后才会提交本次封面生图。"
        onClose={() => setIsPromptEditorOpen(false)}
        onSave={generateCoverImage}
        open={isPromptEditorOpen}
        prompt={promptDraft}
        title="确认封面完整提示词"
      />
      <ImagePreviewDialog imageUrl={expandedImageUrl} onClose={() => setExpandedImageUrl(null)} />
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

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function PlatformButton({
  isActive,
  label,
  onClick,
}: {
  isActive: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={[
        "h-9 rounded-md text-sm font-medium transition-colors",
        isActive ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-950",
      ].join(" ")}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function OptionGrid({
  onSelect,
  options,
  selected,
}: {
  onSelect: (value: string) => void;
  options: string[];
  selected: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((item) => (
        <button
          className={[
            "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
            selected === item
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950",
          ].join(" ")}
          key={item}
          onClick={() => onSelect(item)}
          type="button"
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function ResultCard({
  action,
  children,
  icon,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  icon?: ReactNode;
  title: string;
}) {
  return (
    <Card>
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          {action}
        </div>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}

function CopyButton({ copied, onClick }: { copied: boolean; onClick: () => void }) {
  return (
    <Button className="h-9 gap-2 px-3" onClick={onClick} type="button" variant="secondary">
      <Copy aria-hidden="true" className="h-4 w-4" />
      {copied ? "已复制" : "复制"}
    </Button>
  );
}

function copyLabel(key: string) {
  if (key === "titles") return "标题候选";
  if (key === "caption") return "正文";
  if (key === "tags") return "标签/关键词";
  if (key === "scripts") return "沟通话术";
  if (key === "prompt") return "封面底图提示词";
  return "内容";
}
