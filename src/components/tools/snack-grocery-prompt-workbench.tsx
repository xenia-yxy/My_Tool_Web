"use client";

import Link from "next/link";
import { Loader2, Sparkles, Upload, X } from "lucide-react";
import Image from "next/image";
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
import { AdvancedParameterModal } from "@/components/tools/advanced-parameter-modal";
import { PromptEditorDialog } from "@/components/tools/prompt-editor-dialog";
import {
  buildSnackGroceryPublishingPack,
  getSnackGroceryPublishingPresets,
  type SnackGroceryAccountStage,
  type SnackGroceryColumnTemplate,
  type SnackGroceryContentType,
  type SnackGroceryMaterialMode,
  type SnackGroceryPublishingGoal,
  type SnackGrocerySceneStrategy,
} from "@/lib/snack-grocery-publishing-pack";

type OutputType =
  | "real_scene"
  | "product_combo"
  | "dorm_desk"
  | "office_drawer"
  | "rental_kitchen"
  | "summer_outdoor"
  | "clean_flatlay"
  | "detail_closeup";

const inputClass =
  "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
const textareaClass =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

const audiences = [
  "大学生",
  "宿舍党",
  "职场打工人",
  "办公室人群",
  "租房党",
  "暑假返校",
  "夜宵人群",
  "低预算人群",
];

const categories = [
  "零食饮料",
  "速食夜宵",
  "办公室零食",
  "百货收纳",
  "清洁消耗品",
  "防暑降温",
  "厨房小物",
  "桌面整理",
];

const useScenes = [
  "大学宿舍桌面",
  "宿舍床边/床头柜",
  "办公室工位",
  "办公室抽屉",
  "租房小厨房",
  "租房浴室/玄关",
  "暑假出门随身带",
  "返校行李箱旁",
  "真实白底平铺",
];

const outputTypes: Array<{ value: OutputType; label: string; hint: string }> = [
  { value: "real_scene", label: "真实使用场景", hint: "像用户自己拍的桌面/厨房/工位" },
  { value: "product_combo", label: "商品组合图", hint: "多件商品组合展示，不写字" },
  { value: "dorm_desk", label: "宿舍桌面", hint: "大学生宿舍囤货/桌面收纳" },
  { value: "office_drawer", label: "办公室抽屉", hint: "打工人零食饮料/抽屉囤货" },
  { value: "rental_kitchen", label: "租房厨房", hint: "收纳、清洁、厨房小物" },
  { value: "summer_outdoor", label: "夏季出门", hint: "防暑降温、随身带、清爽自然光" },
  { value: "clean_flatlay", label: "干净平铺", hint: "白底/桌面平铺，商品清楚" },
  { value: "detail_closeup", label: "细节近景", hint: "包装、材质、尺寸、使用细节" },
];

const quickCounts = [4, 5, 6];

export function SnackGroceryPromptWorkbench() {
  const publishingPresets = useMemo(() => getSnackGroceryPublishingPresets(), []);
  const [accountStage, setAccountStage] =
    useState<SnackGroceryAccountStage>("cold_start");
  const [publishingGoal, setPublishingGoal] =
    useState<SnackGroceryPublishingGoal>("traffic");
  const [contentType, setContentType] =
    useState<SnackGroceryContentType>("checklist");
  const [columnTemplate, setColumnTemplate] =
    useState<SnackGroceryColumnTemplate>("office_snack_drawer");
  const [materialMode, setMaterialMode] =
    useState<SnackGroceryMaterialMode>("category_only");
  const [sceneStrategy, setSceneStrategy] =
    useState<SnackGrocerySceneStrategy>("recommended");
  const [customScene, setCustomScene] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [audience, setAudience] = useState(audiences[0]);
  const [category, setCategory] = useState(categories[0]);
  const [scene, setScene] = useState(useScenes[0]);
  const [outputType, setOutputType] = useState<OutputType>("real_scene");
  const [itemDescription, setItemDescription] = useState("");
  const [sellingPoint, setSellingPoint] = useState("低价、刚需、适合囤、真实会用到");
  const [extra, setExtra] = useState("");
  const [batchCount, setBatchCount] = useState(6);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPromptEditorOpen, setIsPromptEditorOpen] = useState(false);
  const [promptDraft, setPromptDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const previewUrls = useObjectUrls(imageFiles);
  const publishingPack = useMemo(
    () =>
      buildSnackGroceryPublishingPack({
        accountStage,
        publishingGoal,
        contentType,
        columnTemplate,
        audience,
        category,
        itemDescription,
        materialMode,
        sceneStrategy,
        customScene,
        extraInstructions: extra,
      }),
    [
      accountStage,
      audience,
      category,
      columnTemplate,
      contentType,
      customScene,
      extra,
      itemDescription,
      materialMode,
      publishingGoal,
      sceneStrategy,
    ],
  );

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setImageFiles((current) => [...current, ...Array.from(files)].slice(0, 8));
  }

  function removeImage(index: number) {
    setImageFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  }

  function getGenerationFrames() {
    return publishingPack.storyboard.slice(
      0,
      Math.min(batchCount, publishingPack.storyboard.length),
    );
  }

  function requestImageGeneration() {
    setPromptDraft(
      getGenerationFrames()
        .map((frame) => `--- 第 ${frame.index} 张 ---\n${frame.imagePrompt}`)
        .join("\n\n"),
    );
    setIsPromptEditorOpen(true);
  }

  async function generateImages(editablePrompt: string) {
    if (!editablePrompt.trim()) {
      setError("完整提示词不能为空");
      return;
    }

    setError(null);
    setNotice(null);
    setIsGenerating(true);

    try {
      const meta = buildPublishingMeta(publishingPack);
      const frames = getGenerationFrames();
      const prompts = splitEditablePrompts(editablePrompt, frames.map((frame) => frame.imagePrompt));

      for (const [index, frame] of frames.entries()) {
        const prompt = prompts[index] || frame.imagePrompt;
        const response =
          imageFiles.length > 0
            ? await submitMultipart(prompt, meta)
            : await submitJson(prompt, meta);
        const payload = (await response.json()) as { error?: string };

        if (!response.ok) {
          throw new Error(payload.error || "发布包图片生成失败");
        }
      }

      setNotice(`已按发布包分镜生成 ${frames.length} 张图片。结果已保存到统一图片画廊。`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "批量生图失败");
    } finally {
      setIsGenerating(false);
    }
  }

  function submitJson(prompt: string, meta: ReturnType<typeof buildPublishingMeta>) {
    return fetch("/api/tools/image-generation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "snack-grocery",
        sourceTool: "snack-grocery",
        description: prompt,
        purpose: meta.title,
        style: category,
        caption: meta.caption,
        tags: meta.tags,
        productKeywords: meta.productKeywords,
        aspectRatio: getAspectRatio(outputType),
        quality: "low",
        batchCount: 1,
        finalPrompt: prompt,
      }),
    });
  }

  function submitMultipart(prompt: string, meta: ReturnType<typeof buildPublishingMeta>) {
    const formData = new FormData();
    formData.set("mode", "snack-grocery");
    formData.set("sourceTool", "snack-grocery");
    formData.set("description", prompt);
    formData.set("purpose", meta.title);
    formData.set("style", category);
    formData.set("caption", meta.caption);
    formData.set("tags", meta.tags.join(" "));
    formData.set("productKeywords", meta.productKeywords.join("，"));
    formData.set("aspectRatio", getAspectRatio(outputType));
    formData.set("quality", "low");
    formData.set("batchCount", "1");
    formData.set("finalPrompt", prompt);
    imageFiles.forEach((file) => formData.append("image", file));

    return fetch("/api/tools/image-generation", {
      method: "POST",
      body: formData,
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>零食百货批量生图</CardTitle>
              <CardDescription>
                先出真实商品/场景图，再到画廊复制 tags 和文案。
              </CardDescription>
            </div>
            <Badge variant="success">不写进图里</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
            <div className="text-sm font-semibold text-blue-950">发布包模式</div>
            <div className="mt-1 text-xs leading-5 text-blue-800">
              前期优先跑流量、留有效粉丝和测试栏目，缺场景素材时自动推荐场景。
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <OptionSelectField
              label="账号阶段"
              onChange={(value) => setAccountStage(value as SnackGroceryAccountStage)}
              options={publishingPresets.accountStages}
              value={accountStage}
            />
            <OptionSelectField
              label="发布目标"
              onChange={(value) => setPublishingGoal(value as SnackGroceryPublishingGoal)}
              options={publishingPresets.publishingGoals}
              value={publishingGoal}
            />
            <OptionSelectField
              label="内容类型"
              onChange={(value) => setContentType(value as SnackGroceryContentType)}
              options={publishingPresets.contentTypes}
              value={contentType}
            />
            <OptionSelectField
              label="栏目模板"
              onChange={(value) => setColumnTemplate(value as SnackGroceryColumnTemplate)}
              options={publishingPresets.columnTemplates}
              value={columnTemplate}
            />
            <OptionSelectField
              label="素材状态"
              onChange={(value) => setMaterialMode(value as SnackGroceryMaterialMode)}
              options={publishingPresets.materialModes}
              value={materialMode}
            />
            <OptionSelectField
              label="场景方式"
              onChange={(value) => setSceneStrategy(value as SnackGrocerySceneStrategy)}
              options={publishingPresets.sceneStrategies}
              value={sceneStrategy}
            />
          </div>

          {sceneStrategy === "custom" ? (
            <Field label="自定义场景">
              <textarea
                className={textareaClass}
                onChange={(event) => setCustomScene(event.target.value)}
                placeholder="例如：宿舍床边小桌，晚上台灯暖光，旁边有书和水杯"
                rows={2}
                value={customScene}
              />
            </Field>
          ) : null}

          <label className="block">
            <span className="text-sm font-medium text-slate-800">商品参考图</span>
            <div className="mt-2 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition-colors hover:border-blue-300 hover:bg-blue-50">
              <Upload aria-hidden="true" className="h-5 w-5 text-slate-500" />
              <span className="mt-2 text-sm text-slate-700">
                上传商品图、包装图、场景图，生成时保持商品外观真实
              </span>
              <span className="mt-1 text-xs text-slate-500">可多图，最多保留 8 张</span>
              <input
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                multiple
                onChange={(event) => handleFiles(event.target.files)}
                type="file"
              />
            </div>
          </label>

          {previewUrls.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {previewUrls.map((url, index) => (
                <div
                  className="group relative aspect-square overflow-hidden rounded-md border border-slate-200 bg-slate-100"
                  key={`${imageFiles[index]?.name}-${index}`}
                >
                  <Image
                    alt={`商品参考图 ${index + 1}`}
                    className="object-cover"
                    fill
                    sizes="80px"
                    src={url}
                    unoptimized
                  />
                  <button
                    aria-label="删除参考图"
                    className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-950/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => removeImage(index)}
                    type="button"
                  >
                    <X aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <Field label="主商品/组合描述">
            <textarea
              className={textareaClass}
              onChange={(event) => setItemDescription(event.target.value)}
              placeholder="例如：宿舍低卡零食组合、办公室无糖饮料和坚果、租房厨房收纳套装"
              rows={3}
              value={itemDescription}
            />
          </Field>

          <Field label="图片类型">
            <select
              className={inputClass}
              onChange={(event) => setOutputType(event.target.value as OutputType)}
              value={outputType}
            >
              {outputTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {outputTypes.find((item) => item.value === outputType)?.hint}
            </p>
          </Field>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 text-sm leading-6 text-slate-700">
                <p className="font-semibold text-slate-900">当前高级参数</p>
                <p className="mt-1 line-clamp-1">
                  {audience} / {category} / {scene}
                </p>
                <p className="line-clamp-2 text-xs text-slate-500">
                  {sellingPoint}
                </p>
              </div>
              <Button
                className="shrink-0"
                onClick={() => setAdvancedOpen(true)}
                type="button"
                variant="secondary"
              >
                高级参数
              </Button>
            </div>
          </div>

          <AdvancedParameterModal
            description="这些参数会影响目标用户、场景和卖点，图片里不会生成文字说明。"
            onClose={() => setAdvancedOpen(false)}
            open={advancedOpen}
            title="零食百货高级参数"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="目标人群" onChange={setAudience} options={audiences} value={audience} />
              <SelectField label="商品品类" onChange={setCategory} options={categories} value={category} />
              <SelectField label="使用场景" onChange={setScene} options={useScenes} value={scene} />
              <div className="sm:col-span-2">
                <Field label="卖点方向">
                  <textarea
                    className={textareaClass}
                    onChange={(event) => setSellingPoint(event.target.value)}
                    rows={2}
                    value={sellingPoint}
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="补充要求">
                  <textarea
                    className={textareaClass}
                    onChange={(event) => setExtra(event.target.value)}
                    placeholder="例如：不要品牌logo；不要价格；不要虚假功效；商品别变形"
                    rows={3}
                    value={extra}
                  />
                </Field>
              </div>
            </div>
          </AdvancedParameterModal>

          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-800">批量数量</span>
              <span className="text-xs text-slate-500">按分镜生成，最多 6 张</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {quickCounts.map((count) => (
                <Button
                  className="h-9 px-3"
                  key={count}
                  onClick={() => setBatchCount(Math.min(count, publishingPack.storyboard.length))}
                  type="button"
                  variant={batchCount === count ? "default" : "secondary"}
                >
                  {count}
                </Button>
              ))}
            </div>
          </div>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <Button
            className="h-11 w-full gap-2"
            disabled={isGenerating}
            onClick={requestImageGeneration}
            type="button"
          >
            {isGenerating ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles aria-hidden="true" className="h-4 w-4" />
            )}
            {isGenerating ? "批量生成中" : `批量生成 ${batchCount} 张`}
          </Button>
        </CardContent>
      </Card>
      <PromptEditorDialog
        description="每一段对应一张分镜图。可直接修改文本，保存后按顺序提交。"
        onClose={() => setIsPromptEditorOpen(false)}
        onSave={generateImages}
        open={isPromptEditorOpen}
        prompt={promptDraft}
        title="确认零食百货完整分镜提示词"
      />

      <section className="space-y-5">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>发布包预览</CardTitle>
                <CardDescription>{publishingPack.positioning}</CardDescription>
              </div>
              <Badge>{publishingPack.materialLevel}级素材</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <PreviewSection
              title="素材判断"
              items={[publishingPack.materialSummary, publishingPack.missingMaterialPlan]}
            />
            <PreviewSection title="推荐场景" items={publishingPack.recommendedScenes} />
            <PreviewSection title="标题备选" items={publishingPack.titleOptions} />
            <PreviewSection title="首图钩子" items={publishingPack.firstImageHooks} />

            <div>
              <div className="text-sm font-semibold text-slate-900">组图分镜</div>
              <div className="mt-2 grid gap-3">
                {publishingPack.storyboard.map((frame) => (
                  <div
                    className="rounded-lg border border-slate-200 bg-white p-3"
                    key={frame.index}
                  >
                    <div className="text-sm font-semibold text-slate-900">
                      图{frame.index}：{frame.role}
                    </div>
                    <div className="mt-1 text-sm leading-6 text-slate-600">
                      {frame.visualDirection}
                    </div>
                    <div className="mt-2 rounded-md bg-slate-50 p-2 text-xs leading-5 text-slate-600">
                      {frame.copyCue}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <PreviewSection title="素材需求" items={publishingPack.materialNeeds} />
            <PreviewSection title="风险提醒" items={publishingPack.riskNotes} />

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
              <div className="font-semibold text-slate-900">正文</div>
              <div className="mt-1">{publishingPack.caption}</div>
              <div className="mt-3 font-semibold text-slate-900">置顶评论</div>
              <div className="mt-1">{publishingPack.pinnedComment}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>生成规则</CardTitle>
            <CardDescription>
              不再先输出一堆文案，图片完成后统一去画廊管理。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              {[
                "图片里不要文字、价格、标签、水印、品牌logo。",
                "食品不要暗示医疗/减肥功效，包装和保质感要真实。",
                "百货重点表现尺寸、材质、收纳/清洁场景，不要样板间豪宅感。",
                "所有标题、正文、tags、选品词都在画廊卡片里显示。",
              ].map((rule) => (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700" key={rule}>
                  {rule}
                </div>
              ))}
            </div>

            {notice ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
                {notice}
                <div className="mt-3">
                  <Button asChild>
                    <Link href="/tools/image-gallery">打开统一图片画廊</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                建议先生成 6-9 张不同场景图，挑真实感最强的一组发图文。
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function buildPublishingMeta(pack: ReturnType<typeof buildSnackGroceryPublishingPack>) {
  return {
    title: pack.titleOptions[0],
    caption: `${pack.caption}\n\n置顶评论：${pack.pinnedComment}`,
    tags: pack.tags,
    productKeywords: pack.productKeywords,
  };
}

function splitEditablePrompts(prompt: string, fallbackPrompts: string[]) {
  const prompts = prompt
    .split(/---\s*第\s*\d+\s*张\s*---/)
    .map((item) => item.trim())
    .filter(Boolean);

  return fallbackPrompts.map((fallback, index) => prompts[index] || fallback);
}

function getAspectRatio(outputType: OutputType) {
  if (outputType === "clean_flatlay" || outputType === "product_combo") {
    return "square";
  }

  return "portrait";
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function SelectField({
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
      <select
        className={inputClass}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
  );
}

function OptionSelectField<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  value: T;
}) {
  return (
    <Field label={label}>
      <select
        className={inputClass}
        onChange={(event) => onChange(event.target.value as T)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function PreviewSection({
  items,
  title,
}: {
  items: string[];
  title: string;
}) {
  return (
    <div>
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs leading-5 text-slate-700"
            key={item}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function useObjectUrls(files: File[]) {
  const urls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  useEffect(() => {
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [urls]);

  return urls;
}
