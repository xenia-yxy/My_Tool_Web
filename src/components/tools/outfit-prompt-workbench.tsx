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
import type { OutfitGender } from "@/lib/outfit-prompt-workbench";

type OutfitPromptWorkbenchProps = {
  fixedGender?: Exclude<OutfitGender, "unisex">;
};

type OutputType =
  | "real_outfit"
  | "one_piece_white"
  | "flatlay_white"
  | "mirror_selfie"
  | "street_snap"
  | "detail_closeup"
  | "try_on_grid"
  | "product_clean";

const inputClass =
  "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
const textareaClass =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

const genderOptions: Array<{ value: OutfitGender; label: string }> = [
  { value: "men", label: "男装" },
  { value: "women", label: "女装" },
  { value: "unisex", label: "通用" },
];

const outputTypes: Array<{ value: OutputType; label: string; hint: string }> = [
  { value: "real_outfit", label: "真实穿搭图", hint: "真人全身/半身，适合图文首图" },
  { value: "one_piece_white", label: "一衣多搭白底", hint: "纯白背景，不要场景，不要文字" },
  { value: "flatlay_white", label: "白底平铺图", hint: "衣服鞋包配饰平铺，不出现真人" },
  { value: "mirror_selfie", label: "镜子随拍", hint: "室内镜子/试衣间，真实手机感" },
  { value: "street_snap", label: "街角随拍", hint: "户外自然光、城市/校园/花墙" },
  { value: "detail_closeup", label: "细节近景", hint: "面料、领口、裤型、鞋包局部" },
  { value: "try_on_grid", label: "试穿对比", hint: "2-4 张真实试穿组合，无文字" },
  { value: "product_clean", label: "商品干净图", hint: "电商感但真实，不要广告字" },
];

const menAudiences = [
  "178左右标准身材",
  "178偏瘦男生",
  "178肩宽男生",
  "大学生",
  "实习生",
  "刚上班通勤",
  "约会出门",
  "普通男生",
  "微胖男生",
];

const womenAudiences = [
  "大学生女生",
  "通勤女生",
  "小个子女生",
  "梨形身材",
  "微胖女生",
  "甜妹日常",
  "气质姐姐",
];

const menBodyProfiles = [
  "178cm，标准身材，肩宽自然，腿部比例正常",
  "178cm，偏瘦身材，穿宽松版型但不空荡",
  "178cm，肩宽身材，上半身有存在感",
  "170-175cm，显高比例，上短下顺",
  "微胖男生，衣服留有余量，显干净不紧绷",
];

const womenBodyProfiles = [
  "165cm左右，标准身材，比例自然",
  "小个子显高，上短下长",
  "梨形身材，弱化胯部，强调高腰线",
  "微胖女生，版型留有余量，显瘦但真实",
];

const menStyles = [
  "干净男友风",
  "夏季清爽",
  "Cityboy日系宽松",
  "校园少年感",
  "基础款通勤",
  "工装宽松",
  "韩系简洁",
  "低饱和高级感",
  "平价显高",
  "户外松弛感",
];

const womenStyles = [
  "气质通勤",
  "夏日甜妹",
  "小个子显高",
  "梨形显瘦",
  "基础高级感",
  "法式日常",
  "返校穿搭",
];

const sceneSources = [
  "保留上传服装参考图的原场景",
  "使用上传场景参考图的场景",
  "使用内置真实场景",
];

const builtInScenes = [
  "户外花墙草地，自然阳光，白色矮墙，抖音真实随拍",
  "校园路边树荫，教学楼外墙，普通学生日常",
  "室内镜子自拍，卧室/试衣间暗光，手机随拍感",
  "简洁白墙走廊，电梯厅，低饱和自然光",
  "城市街角，人行道，咖啡店门口，生活化抓拍",
  "石墙和绿植旁，夏季自然光，半身或全身穿搭",
  "小区楼下/公园步道，真实普通环境，不商业大片",
];

const quickCounts = [4, 6, 9, 12, 18, 30];

export function OutfitPromptWorkbench({
  fixedGender,
}: OutfitPromptWorkbenchProps = {}) {
  const [gender, setGender] = useState<OutfitGender>(fixedGender ?? "men");
  const effectiveGender = fixedGender ?? gender;
  const isWomen = effectiveGender === "women";
  const imageMode = isWomen ? "womenswear" : "menswear";
  const [clothingFiles, setClothingFiles] = useState<File[]>([]);
  const [sceneFiles, setSceneFiles] = useState<File[]>([]);
  const [itemDescription, setItemDescription] = useState("");
  const [category, setCategory] = useState("上衣/套装自动判断");
  const [audience, setAudience] = useState(isWomen ? womenAudiences[0] : menAudiences[0]);
  const [bodyProfile, setBodyProfile] = useState(
    isWomen ? womenBodyProfiles[0] : menBodyProfiles[0],
  );
  const [style, setStyle] = useState(isWomen ? womenStyles[0] : menStyles[0]);
  const [sceneSource, setSceneSource] = useState(sceneSources[0]);
  const [builtInScene, setBuiltInScene] = useState(builtInScenes[0]);
  const [outputType, setOutputType] = useState<OutputType>("real_outfit");
  const [batchCount, setBatchCount] = useState(6);
  const [extra, setExtra] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPromptEditorOpen, setIsPromptEditorOpen] = useState(false);
  const [promptDraft, setPromptDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const clothingPreviewUrls = useObjectUrls(clothingFiles);
  const scenePreviewUrls = useObjectUrls(sceneFiles);

  function handleFiles(files: FileList | null, kind: "clothing" | "scene") {
    if (!files?.length) return;
    const setter = kind === "clothing" ? setClothingFiles : setSceneFiles;
    setter((current) => [...current, ...Array.from(files)].slice(0, 8));
  }

  function removeFile(index: number, kind: "clothing" | "scene") {
    const setter = kind === "clothing" ? setClothingFiles : setSceneFiles;
    setter((current) => current.filter((_, fileIndex) => fileIndex !== index));
  }

  function changeGender(nextGender: OutfitGender) {
    setGender(nextGender);
    const nextIsWomen = nextGender === "women";
    setAudience(nextIsWomen ? womenAudiences[0] : menAudiences[0]);
    setBodyProfile(nextIsWomen ? womenBodyProfiles[0] : menBodyProfiles[0]);
    setStyle(nextIsWomen ? womenStyles[0] : menStyles[0]);
  }

  function buildCurrentPrompt() {
    return buildImagePrompt({
      gender: effectiveGender,
      itemDescription,
      category,
      audience,
      bodyProfile,
      style,
      sceneSource,
      builtInScene,
      outputType,
      hasClothingReference: clothingFiles.length > 0,
      hasSceneReference: sceneFiles.length > 0,
      extra,
    });
  }

  function requestImageGeneration() {
    setPromptDraft(buildCurrentPrompt());
    setIsPromptEditorOpen(true);
  }

  async function generateImages(prompt: string) {
    if (!prompt.trim()) {
      setError("完整提示词不能为空");
      return;
    }

    setError(null);
    setNotice(null);
    setIsGenerating(true);

    try {
      const meta = buildMeta({
        gender: effectiveGender,
        audience,
        style,
        itemDescription,
        outputType,
      });
      const response =
        clothingFiles.length > 0 || sceneFiles.length > 0
          ? await submitMultipart(prompt, meta)
          : await submitJson(prompt, meta);
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "批量生图失败");
      }

      setNotice(`已提交并生成 ${batchCount} 张图片。结果已保存到统一图片画廊。`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "批量生图失败");
    } finally {
      setIsGenerating(false);
    }
  }

  function submitJson(prompt: string, meta: ReturnType<typeof buildMeta>) {
    return fetch("/api/tools/image-generation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: imageMode,
        sourceTool: imageMode,
        description: prompt,
        purpose: meta.title,
        style,
        caption: meta.caption,
        tags: meta.tags,
        productKeywords: meta.productKeywords,
        aspectRatio: getAspectRatio(outputType),
        quality: "low",
        batchCount,
        finalPrompt: prompt,
      }),
    });
  }

  function submitMultipart(prompt: string, meta: ReturnType<typeof buildMeta>) {
    const formData = new FormData();
    formData.set("mode", imageMode);
    formData.set("sourceTool", imageMode);
    formData.set("description", prompt);
    formData.set("purpose", meta.title);
    formData.set("style", style);
    formData.set("caption", meta.caption);
    formData.set("tags", meta.tags.join(" "));
    formData.set("productKeywords", meta.productKeywords.join("，"));
    formData.set("aspectRatio", getAspectRatio(outputType));
    formData.set("quality", "low");
    formData.set("batchCount", String(batchCount));
    formData.set("finalPrompt", prompt);
    [...clothingFiles, ...sceneFiles].forEach((file) => formData.append("image", file));

    return fetch("/api/tools/image-generation", {
      method: "POST",
      body: formData,
    });
  }

  const currentAudiences = isWomen ? womenAudiences : menAudiences;
  const currentBodyProfiles = isWomen ? womenBodyProfiles : menBodyProfiles;
  const currentStyles = isWomen ? womenStyles : menStyles;

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{isWomen ? "女装批量生图" : "男装批量生图"}</CardTitle>
              <CardDescription>
                先生成真实图片，再到统一画廊复制对应标题、文案和 tags。
              </CardDescription>
            </div>
            <Badge variant="success">先出图</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <ReferenceUpload
            description="上传衣服、裤子、鞋包或整套参考。生成时保持主商品款式、颜色、材质。"
            label="服装参考图"
            onFiles={(files) => handleFiles(files, "clothing")}
          />
          <PreviewGrid
            files={clothingFiles}
            onRemove={(index) => removeFile(index, "clothing")}
            urls={clothingPreviewUrls}
          />

          <ReferenceUpload
            description="可选。上传你想复刻的花墙、镜子、走廊、街角等场景图。"
            label="场景参考图"
            onFiles={(files) => handleFiles(files, "scene")}
          />
          <PreviewGrid
            files={sceneFiles}
            onRemove={(index) => removeFile(index, "scene")}
            urls={scenePreviewUrls}
          />

          {!fixedGender ? (
            <Field label="男装/女装">
              <select
                className={inputClass}
                onChange={(event) => changeGender(event.target.value as OutfitGender)}
                value={gender}
              >
                {genderOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}

          <Field label="主商品描述">
            <textarea
              className={textareaClass}
              onChange={(event) => setItemDescription(event.target.value)}
              placeholder={isWomen ? "例如：白色娃娃领短袖，夏季甜妹风" : "例如：浅黄色短袖衬衫，宽松版型，夏季男友风"}
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
                <p className="mt-1 line-clamp-2">
                  {audience} / {bodyProfile} / {style}
                </p>
                <p className="line-clamp-1 text-xs text-slate-500">
                  {sceneSource === "使用内置真实场景" ? builtInScene : sceneSource}
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
            description="这些参数会影响人物、场景、风格和细节要求，不会直接出现在图片里。"
            onClose={() => setAdvancedOpen(false)}
            open={advancedOpen}
            title="服装高级参数"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="服装品类" onChange={setCategory} options={[
                "上衣/套装自动判断",
                "短袖T恤",
                "短袖衬衫",
                "防晒衬衫/外套",
                "工装裤",
                "牛仔裤",
                "短裤",
                "鞋包配饰",
              ]} value={category} />
              <SelectField label="目标人群" onChange={setAudience} options={currentAudiences} value={audience} />
              <SelectField label="身材比例" onChange={setBodyProfile} options={currentBodyProfiles} value={bodyProfile} />
              <SelectField label="风格方向" onChange={setStyle} options={currentStyles} value={style} />
              <SelectField label="场景来源" onChange={setSceneSource} options={sceneSources} value={sceneSource} />
              {sceneSource === "使用内置真实场景" ? (
                <SelectField label="内置场景" onChange={setBuiltInScene} options={builtInScenes} value={builtInScene} />
              ) : null}
              <div className="sm:col-span-2">
                <Field label="补充要求">
                  <textarea
                    className={textareaClass}
                    onChange={(event) => setExtra(event.target.value)}
                    placeholder="例如：不要网红脸；不要夸张 pose；裤子要宽松；保留参考图自然光"
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
              <span className="text-xs text-slate-500">最多 30 张</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {quickCounts.map((count) => (
                <Button
                  className="h-9 px-3"
                  key={count}
                  onClick={() => setBatchCount(count)}
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
        description="请确认或修改完整提示词，保存后才会提交本次批量生图。"
        onClose={() => setIsPromptEditorOpen(false)}
        onSave={generateImages}
        open={isPromptEditorOpen}
        prompt={promptDraft}
        title="确认完整穿搭生图提示词"
      />

      <section className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>生成规则</CardTitle>
            <CardDescription>
              本页不再展示大段提示词，生成结果统一进入图片画廊。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              {[
                "图片里不要中文、英文标题、水印、账号号、价格、标签。",
                "所有画面必须真实，像普通人抖音图文/手机随拍，不要商业大片。",
                "一衣多搭和白底平铺必须是白底，不要场景。",
                "真实穿搭可保留参考图场景、使用场景参考图，或选择内置场景。",
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
                  <Button asChild className="gap-2">
                    <Link href="/tools/image-gallery">打开统一图片画廊</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                建议先用同一件衣服生成 6-9 张，挑点击感最强的图，再去画廊复制对应 tags 和文案发布。
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>参考图风格分析</CardTitle>
            <CardDescription>
              根据你给的男装参考图，默认倾向真实抖音穿搭，不做虚假模特大片。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm leading-6 text-slate-700">
              <p>核心画面：户外花墙/草地/白墙、室内镜子、试衣间、石墙绿植、校园路边。</p>
              <p>核心身材：178 左右普通男生，偏瘦或标准身材，宽松裤型和清爽上衣更适合。</p>
              <p>核心风格：干净男友风、日系宽松、校园少年感、工装松弛、夏季清爽。</p>
              <p>避雷：不要过度精修、不要明星脸、不要夸张潮牌、不要在图片中生成任何文字。</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function buildImagePrompt(input: {
  gender: OutfitGender;
  itemDescription: string;
  category: string;
  audience: string;
  bodyProfile: string;
  style: string;
  sceneSource: string;
  builtInScene: string;
  outputType: OutputType;
  hasClothingReference: boolean;
  hasSceneReference: boolean;
  extra: string;
}) {
  const genderLabel = input.gender === "women" ? "年轻女性" : "年轻男性";
  const item = input.itemDescription.trim() || "服装主商品";
  const referenceRule = input.hasClothingReference
    ? "先分析上传服装参考图，严格保留主商品的品类、颜色、版型、材质、图案、结构和主要视觉特征，不要改款、换色或把主商品变成其他衣服。"
    : "根据商品描述生成真实可购买的服装主商品，保持款式清楚、结构真实、材质可信。";
  const sceneRule = buildSceneRule(input);
  const imageTypeRule = buildImageTypeRule(input.outputType);

  return [
    referenceRule,
    "",
    `主商品：${item}`,
    `品类：${input.category}`,
    `目标人群：${input.audience}`,
    `身材比例：${input.bodyProfile}`,
    `风格方向：${input.style}`,
    `人物要求：${genderLabel}，普通人气质，真实身材比例，姿态自然。`,
    "",
    sceneRule,
    imageTypeRule,
    input.extra.trim() ? `补充要求：${input.extra.trim()}` : "",
    "",
    "强制要求：画面中不要出现任何中文、英文、数字标题、账号、水印、价格、标签、说明文字、品牌logo。不要商业大片感，不要AI感，不要塑料皮肤，不要怪异手指，不要身体畸形。图片只需要真实画面，所有标题、tags、文案都由系统在画廊卡片里展示。",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildSceneRule(input: {
  sceneSource: string;
  builtInScene: string;
  outputType: OutputType;
  hasSceneReference: boolean;
}) {
  if (input.outputType === "one_piece_white" || input.outputType === "flatlay_white" || input.outputType === "product_clean") {
    return "场景：纯白或浅灰白干净背景，不要真实场景，不要墙角杂物，不要任何文字。";
  }

  if (input.sceneSource === "保留上传服装参考图的原场景") {
    return "场景：优先保留上传服装参考图里的真实场景、光线、构图氛围和拍摄距离。";
  }

  if (input.sceneSource === "使用上传场景参考图的场景" && input.hasSceneReference) {
    return "场景：分析上传的场景参考图，复刻其空间、光线、背景元素、拍摄角度和真实生活感。";
  }

  return `场景：${input.builtInScene}`;
}

function buildImageTypeRule(outputType: OutputType) {
  const rules: Record<OutputType, string> = {
    real_outfit: "图片类型：真实穿搭图。生成一张全身或半身真实手机随拍，服装清楚，人物自然站姿。",
    one_piece_white: "图片类型：一衣多搭白底图。纯白背景，同一主商品搭配 3-5 套完整穿搭，可有人体/半身模特或无脸模特，但不要任何文字和标签。",
    flatlay_white: "图片类型：白底平铺图。服装、鞋包、配饰平铺摆放，俯拍视角，不出现真人、人脸或手。",
    mirror_selfie: "图片类型：镜子随拍。室内镜子、试衣间或卧室，手机自拍感，真实光线，允许手机入镜。",
    street_snap: "图片类型：街角随拍。户外自然光，真实生活抓拍，全身构图，背景不抢衣服。",
    detail_closeup: "图片类型：细节近景。突出面料纹理、领口、袖口、裤型、鞋包局部，真实商品质感。",
    try_on_grid: "图片类型：试穿对比。生成 2-4 张同一主商品不同搭配的真实试穿拼图，但不要任何文字、编号或标签。",
    product_clean: "图片类型：商品干净图。白底或浅灰白背景，主商品清楚完整，真实电商质感，不要广告文字。",
  };

  return rules[outputType];
}

function buildMeta(input: {
  gender: OutfitGender;
  audience: string;
  style: string;
  itemDescription: string;
  outputType: OutputType;
}) {
  const item = input.itemDescription.trim() || "这件衣服";
  const genderTags =
    input.gender === "women"
      ? ["#女生穿搭", "#女装", "#ootd"]
      : ["#男生穿搭", "#男友感穿搭", "#ootd"];
  const outputTag = outputTypes.find((itemType) => itemType.value === input.outputType)?.label ?? "穿搭图";
  const title = `${item}｜${input.audience}｜${input.style}`;

  return {
    title,
    caption: `${item}适合做${input.style}方向，目标人群是${input.audience}。先看图片点击和收藏，再决定是否挂同款/相似款。`,
    tags: [
      ...genderTags,
      "#夏季穿搭",
      "#平价穿搭",
      `#${input.style.replace(/\s+/g, "")}`,
      `#${outputTag.replace(/\s+/g, "")}`,
    ],
    productKeywords: [
      item,
      `${input.style}同款`,
      input.audience,
      "平价基础款",
      "夏季穿搭",
    ],
  };
}

function getAspectRatio(outputType: OutputType) {
  if (outputType === "one_piece_white" || outputType === "try_on_grid") {
    return "landscape";
  }

  if (outputType === "flatlay_white" || outputType === "product_clean") {
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

function ReferenceUpload({
  description,
  label,
  onFiles,
}: {
  description: string;
  label: string;
  onFiles: (files: FileList | null) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <div className="mt-2 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition-colors hover:border-blue-300 hover:bg-blue-50">
        <Upload aria-hidden="true" className="h-5 w-5 text-slate-500" />
        <span className="mt-2 text-sm text-slate-700">{description}</span>
        <span className="mt-1 text-xs text-slate-500">可多图，最多保留 8 张</span>
        <input
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          multiple
          onChange={(event) => onFiles(event.target.files)}
          type="file"
        />
      </div>
    </label>
  );
}

function PreviewGrid({
  files,
  onRemove,
  urls,
}: {
  files: File[];
  onRemove: (index: number) => void;
  urls: string[];
}) {
  if (urls.length === 0) return null;

  return (
    <div className="grid grid-cols-4 gap-2">
      {urls.map((url, index) => (
        <div
          className="group relative aspect-square overflow-hidden rounded-md border border-slate-200 bg-slate-100"
          key={`${files[index]?.name}-${index}`}
        >
          <Image
            alt={`参考图 ${index + 1}`}
            className="object-cover"
            fill
            sizes="80px"
            src={url}
            unoptimized
          />
          <button
            aria-label="删除参考图"
            className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-950/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => onRemove(index)}
            type="button"
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
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
