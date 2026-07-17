"use client";

import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ImageReferenceUploader } from "@/components/tools/image-reference-uploader";
import { ModelFaceReferenceSelector, type ModelFaceReferenceSource } from "@/components/tools/menswear/model-face-reference-selector";
import { PromptEditorDialog } from "@/components/tools/prompt-editor-dialog";
import { PromptPreviewPanel } from "@/components/tools/prompt-preview-panel";
import { useWorkbenchSession } from "@/components/tools/workbench-session-client";
import {
  getImageAspectClass,
  IMAGE_ASPECT_RATIO_OPTIONS,
} from "@/lib/image-aspect-ratios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildMenswearMultiOutfitPrompt,
  type MenswearMultiOutfitAspectRatio,
  type MenswearMultiOutfitBackgroundMode,
  type MenswearMultiOutfitCameraDistance,
  type MenswearMultiOutfitCompositionMode,
  type MenswearMultiOutfitDisplayMode,
  type MenswearMultiOutfitModelFaceMode,
  type MenswearMultiOutfitModelGender,
  type MenswearMultiOutfitMaskMode,
  type MenswearMultiOutfitPoseMode,
  type MenswearMultiOutfitSeason,
  type MenswearMultiOutfitTextMode,
} from "@/lib/menswear-multi-outfit";

type GenerationPayload = {
  error?: string;
  job?: { id?: string };
  results?: Array<{ imageUrl?: string; asset?: { id?: string } }>;
};

const preservePresets = [
  "保留颜色、版型、面料、印花、领口、袖型和整体比例",
  "保留主商品图案、Logo 位置、廓形和材质肌理",
  "保留整套主体商品关系，只变化搭配裤装、鞋包和配饰",
  "自定义",
];

const stylePresets = [
  "干净白底横版合集，像电商一衣多搭封面",
  "高级灰白背景，杂志式男装搭配合集",
  "社媒图文封面，留白充足，搭配排列清晰",
  "自定义",
];

const splitStylePresets = [
  "真实人物穿搭摄影，单张全幅画面，服装主体清晰，背景自然且不抢主体",
  "参考人物穿搭图的摄影感，单张完整人物画面，不要海报或拼贴",
  "自然街拍人物穿搭，单张全幅，真实环境与自然光线",
  "自定义",
];

const seasonOptions: Array<[MenswearMultiOutfitSeason, string]> = [
  ["spring", "春季"],
  ["summer", "夏季"],
  ["spring_autumn", "春秋过渡"],
  ["autumn_winter", "秋冬过渡"],
  ["winter", "冬季"],
  ["all_season", "四季通用"],
];

const aspectRatioOptions = IMAGE_ASPECT_RATIO_OPTIONS;

const cameraDistanceOptions: Array<[MenswearMultiOutfitCameraDistance, string]> = [
  ["full_body", "全身"],
  ["three_quarter", "七分身"],
  ["half_body", "半身"],
  ["product_grid", "商品陈列"],
];

const modelGenderOptions: Array<[MenswearMultiOutfitModelGender, string]> = [
  ["any", "不限"],
  ["male", "男模特"],
  ["female", "女模特"],
  ["none", "无模特"],
];

const modelFaceOptions: Array<[MenswearMultiOutfitModelFaceMode, string]> = [
  ["hidden_face", "不露脸 / 无头"],
  ["visible_face", "露脸"],
  ["no_model", "无模特"],
];

export function MenswearMultiOutfitGenerator({ gender = "men", variant = "board" }: { gender?: "men" | "women"; variant?: "board" | "split" }) {
  const isSplit = variant === "split";
  const isWomen = gender === "women";
  const genderLabel = isWomen ? "女装" : "男装";
  const outputFormat = variant;
  const [subjectImages, setSubjectImages] = useState<File[]>([]);
  const [layoutReferenceImages, setLayoutReferenceImages] = useState<File[]>([]);
  const [styleReferenceImages, setStyleReferenceImages] = useState<File[]>([]);
  const [isAnalyzingLayout, setIsAnalyzingLayout] = useState(false);
  const [layoutAnalysis, setLayoutAnalysis] = useState<string | null>(null);
  const [modelFaceFiles, setModelFaceFiles] = useState<File[]>([]);
  const [modelFaceSource, setModelFaceSource] = useState<ModelFaceReferenceSource>("system");
  const [modelProfileId, setModelProfileId] = useState("");
  const [displayMode, setDisplayMode] = useState<MenswearMultiOutfitDisplayMode>("model");
  const [backgroundMode, setBackgroundMode] = useState<MenswearMultiOutfitBackgroundMode>("custom");
  const [backgroundInstruction, setBackgroundInstruction] = useState("");
  const [compositionMode, setCompositionMode] = useState<MenswearMultiOutfitCompositionMode>(isSplit ? "custom" : "inherit");
  const [modelGender, setModelGender] = useState<MenswearMultiOutfitModelGender>(isWomen ? "female" : "male");
  const [modelFaceMode, setModelFaceMode] = useState<MenswearMultiOutfitModelFaceMode>("hidden_face");
  const [maskMode, setMaskMode] = useState<MenswearMultiOutfitMaskMode>("no_mask");
  const [poseMode, setPoseMode] = useState<MenswearMultiOutfitPoseMode>("random");
  const [poseInstruction, setPoseInstruction] = useState("");
  const [textMode, setTextMode] = useState<MenswearMultiOutfitTextMode>(isSplit ? "no_text" : "with_labels");
  const [targetAudience, setTargetAudience] = useState("");
  const [usageScene, setUsageScene] = useState("");
  const [season, setSeason] = useState<MenswearMultiOutfitSeason>("spring_autumn");
  const [aspectRatio, setAspectRatio] = useState<MenswearMultiOutfitAspectRatio>(isSplit ? "3:4" : "16:9");
  const [cameraDistance, setCameraDistance] = useState<MenswearMultiOutfitCameraDistance>("three_quarter");
  const [preservePreset, setPreservePreset] = useState(preservePresets[0]);
  const [customPreserve, setCustomPreserve] = useState("");
  const [stylePreset, setStylePreset] = useState(isSplit ? splitStylePresets[0] : stylePresets[0]);
  const [customStyle, setCustomStyle] = useState("");
  const [outfitCount, setOutfitCount] = useState(5);
  const [quality, setQuality] = useState("medium");
  const [batchCount, setBatchCount] = useState(1);
  const [promptDraft, setPromptDraft] = useState("");
  const [isPromptOpen, setPromptOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const restoredSessionId = useRef<string | null>(null);
  const { create, session } = useWorkbenchSession(isWomen ? (isSplit ? "womenswear-flatlay-outfit-split" : "womenswear-multi-outfit") : (isSplit ? "menswear-flatlay-outfit-split" : "menswear-multi-outfit"));

  const preserveInstructions = preservePreset === "自定义" ? customPreserve : preservePreset;
  const styleInstructions = stylePreset === "自定义" ? customStyle : stylePreset;
  const prompt = useMemo(
    () =>
      buildMenswearMultiOutfitPrompt({
        aspectRatio,
        backgroundInstruction,
        backgroundMode,
        cameraDistance,
        compositionMode,
        displayMode,
        flatlayImageCount: isSplit ? layoutReferenceImages.length : 0,
        modelFaceMode,
        modelFaceReferenceSource: modelFaceFiles.length > 0 ? modelFaceSourceLabel(modelFaceSource) : undefined,
        hasLayoutReference: layoutReferenceImages.length > 0,
        hasStyleReference: styleReferenceImages.length > 0,
        outputFormat,
        gender,
        modelGender,
        maskMode,
        outfitCount,
        preserveInstructions,
        poseInstruction,
        poseMode,
        season,
        styleInstructions,
        subjectImageCount: isSplit ? 0 : subjectImages.length,
        targetAudience,
        textMode,
        usageScene,
      }),
    [
      aspectRatio,
      backgroundInstruction,
      backgroundMode,
      cameraDistance,
      compositionMode,
      displayMode,
      gender,
      modelFaceMode,
      modelFaceFiles.length,
      modelFaceSource,
      layoutReferenceImages.length,
      styleReferenceImages.length,
      outputFormat,
      modelGender,
      maskMode,
      outfitCount,
      preserveInstructions,
      poseInstruction,
      poseMode,
      season,
      styleInstructions,
      subjectImages.length,
      targetAudience,
      textMode,
      usageScene,
      isSplit,
    ],
  );
  const canSubmit = !isGenerating && (isSplit ? layoutReferenceImages.length > 0 : subjectImages.length > 0);

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
        setNotice(typeof output.summary === "string" ? output.summary : "一衣多搭图片已生成。");
      } else if (session.status === "FAILED") {
        setIsGenerating(false);
        setError(session.errorMessage || "上一次生成失败，请调整提示词后重试。");
      }

      if (restoredSessionId.current === session.id) return;
      restoredSessionId.current = session.id;
      const input = session.inputSnapshot;
      if (input.displayMode === "model" || input.displayMode === "flatlay") setDisplayMode(input.displayMode);
      if (input.backgroundMode === "inherit" || input.backgroundMode === "custom") setBackgroundMode(input.backgroundMode);
      if (typeof input.backgroundInstruction === "string") setBackgroundInstruction(input.backgroundInstruction);
      if (input.compositionMode === "inherit" || input.compositionMode === "custom") setCompositionMode(input.compositionMode);
      if (isModelGender(input.modelGender)) setModelGender(input.modelGender);
      if (isModelFaceMode(input.modelFaceMode)) setModelFaceMode(input.modelFaceMode);
      if (input.maskMode === "wear_mask" || input.maskMode === "no_mask" || input.maskMode === "auto") setMaskMode(input.maskMode);
      if (input.poseMode === "inherit" || input.poseMode === "custom" || input.poseMode === "random") setPoseMode(input.poseMode);
      if (typeof input.poseInstruction === "string") setPoseInstruction(input.poseInstruction);
      if (input.textMode === "with_labels" || input.textMode === "no_text") setTextMode(input.textMode);
      if (typeof input.targetAudience === "string") setTargetAudience(input.targetAudience);
      if (typeof input.usageScene === "string") setUsageScene(input.usageScene);
      if (isSeason(input.season)) setSeason(input.season);
      if (isAspectRatio(input.aspectRatio)) setAspectRatio(input.aspectRatio);
      if (isCameraDistance(input.cameraDistance)) setCameraDistance(input.cameraDistance);
      if (typeof input.preservePreset === "string") setPreservePreset(input.preservePreset);
      if (typeof input.customPreserve === "string") setCustomPreserve(input.customPreserve);
      if (typeof input.stylePreset === "string") setStylePreset(input.stylePreset);
      if (typeof input.customStyle === "string") setCustomStyle(input.customStyle);
      if (typeof input.outfitCount === "number") setOutfitCount(input.outfitCount);
      if (typeof input.quality === "string") setQuality(input.quality);
      if (typeof input.batchCount === "number") setBatchCount(input.batchCount);
      if (typeof input.layoutAnalysis === "string") setLayoutAnalysis(input.layoutAnalysis);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [session]);

  function openPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSplit && subjectImages.length === 0) {
      setError("请先上传至少一张服装主体参考图");
      return;
    }
    if (isSplit && layoutReferenceImages.length === 0) {
      setError("请先上传平铺多搭图");
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
        title: isSplit ? `${genderLabel}平铺多搭拆分生图` : `${genderLabel}一衣多搭合集生图`,
        status: "RUNNING",
        prompt: finalPrompt,
        inputSnapshot: {
          displayMode,
          backgroundInstruction,
          backgroundMode,
          compositionMode,
          modelGender,
          modelFaceMode,
          maskMode,
          poseInstruction,
          poseMode,
          modelFaceReferenceSource: modelFaceFiles.length > 0 ? modelFaceSourceLabel(modelFaceSource) : undefined,
          modelProfileId: modelProfileId || null,
          textMode,
          targetAudience,
          usageScene,
          season,
          aspectRatio,
          cameraDistance,
          preservePreset,
          customPreserve,
          stylePreset,
          customStyle,
          outfitCount,
          quality,
          batchCount: outputFormat === "split" ? outfitCount : batchCount,
          subjectImageCount: isSplit ? 0 : subjectImages.length,
          flatlayImageCount: isSplit ? layoutReferenceImages.length : 0,
          styleReferenceImageCount: styleReferenceImages.length,
          outputFormat,
          hasLayoutReference: layoutReferenceImages.length > 0,
          layoutAnalysis,
        },
        outputSnapshot: {},
        imageAssetIds: [],
        externalJobId: null,
        errorMessage: null,
      });
      activeSessionId = activeSession.id;

      const response = await submitGeneration(activeSession.id, finalPrompt);
      const payload = (await response.json().catch(() => ({}))) as GenerationPayload;
      if (!response.ok) throw new Error(payload.error || (isSplit ? `${genderLabel}平铺多搭拆分生图失败` : `${genderLabel}一衣多搭生图失败`));

      if ("queued" in payload && payload.queued) {
        setResultImages([]);
        setNotice("已进入任务队列，可继续上传下一组素材；完成后会自动保存到统一图片画廊。");
        return;
      }

      const imageUrls = payload.results?.flatMap((item) => (item.imageUrl ? [item.imageUrl] : [])) || [];
      const summary = isSplit
        ? `已按平铺搭配顺序生成 ${imageUrls.length || outfitCount} 张单张人物穿搭图，结果已保存到统一图片画廊。`
        : `已生成 ${imageUrls.length || batchCount} 张一衣多搭合集图，结果已保存到统一图片画廊。`;
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
      const message = caughtError instanceof Error ? caughtError.message : (isSplit ? `${genderLabel}平铺多搭拆分生图失败` : `${genderLabel}一衣多搭生图失败`);
      setError(message);
      if (activeSessionId) await patchSession(activeSessionId, { status: "FAILED", errorMessage: message });
    } finally {
      setIsGenerating(false);
    }
  }

  function submitGeneration(workbenchSessionId: string, finalPrompt: string) {
    const formData = new FormData();
    formData.set("mode", isWomen ? "womenswear" : "menswear");
    formData.set("sourceTool", isWomen ? (isSplit ? "womenswear-flatlay-outfit-split" : "womenswear-multi-outfit") : (isSplit ? "menswear-flatlay-outfit-split" : "menswear-multi-outfit"));
    formData.set("description", isSplit ? `${genderLabel}平铺多搭拆分生成` : `${genderLabel}一衣多搭合集生成`);
    formData.set("purpose", isSplit ? `${genderLabel}平铺多搭拆分生图` : `${genderLabel}一衣多搭合集生图`);
    formData.set("style", styleInstructions);
    formData.set("caption", isSplit ? `${outfitCount} 套平铺搭配按顺序拆分为单张人物穿搭，模特：${modelGenderLabel(modelGender)}，脸部：${modelFaceLabel(modelFaceMode)}，季节：${seasonLabel(season)}` : `${outfitCount} 套${genderLabel}一衣多搭合集，展示方式：${displayModeLabel(displayMode)}，模特：${modelGenderLabel(displayMode === "flatlay" ? "none" : modelGender)}，脸部：${modelFaceLabel(displayMode === "flatlay" ? "no_model" : modelFaceMode)}，季节：${seasonLabel(season)}`);
    formData.set("tags", isWomen ? "#女装 #女生穿搭 #一衣多搭 #AI生图" : "#男装 #一衣多搭 #AI生图");
    formData.set("productKeywords", isSplit ? `${genderLabel} 平铺多搭 单张穿搭` : `${genderLabel} 一衣多搭 搭配合集`);
    formData.set("aspectRatio", aspectRatio);
    formData.set("quality", quality);
    formData.set("batchCount", String(outputFormat === "split" ? outfitCount : batchCount));
    formData.set("splitOutfitMode", outputFormat === "split" ? "true" : "false");
    formData.set("finalPrompt", finalPrompt);
    formData.set("workbenchSessionId", workbenchSessionId);
    if (!isSplit) {
      subjectImages.forEach((file) => {
        formData.append("image", file);
        formData.append("referenceLabel", "锁定主体商品图");
      });
    }
    layoutReferenceImages.forEach((file) => {
      formData.append("image", file);
      formData.append("referenceLabel", isSplit ? "平铺多搭图" : "平铺多搭参考图");
    });
    styleReferenceImages.forEach((file) => {
      formData.append("image", file);
      formData.append("referenceLabel", "人物穿搭参考图");
    });
    modelFaceFiles.forEach((file) => {
      formData.append("image", file);
      formData.append("referenceLabel", "脸部身份参考图");
    });

    return fetch("/api/tools/image-generation", { method: "POST", body: formData });
  }

  async function analyzeLayoutReference() {
    const image = layoutReferenceImages[0];
    if (!image) {
      setError("请先上传一张平铺多搭参考图");
      return;
    }

    setIsAnalyzingLayout(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("image", image);
      const response = await fetch("/api/tools/menswear/multi-outfit/analyze", { method: "POST", body: formData });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; analysis?: { outfitCount?: number; summary?: string } };
      if (!response.ok) throw new Error(payload.error || "平铺搭配识别失败");
      const detectedCount = payload.analysis?.outfitCount;
      if (typeof detectedCount === "number") setOutfitCount(detectedCount);
      setLayoutAnalysis(payload.analysis?.summary || (typeof detectedCount === "number" ? `已识别 ${detectedCount} 套搭配，可继续手动调整。` : "已完成平铺搭配识别。"));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "平铺搭配识别失败");
    } finally {
      setIsAnalyzingLayout(false);
    }
  }

  async function patchSession(sessionId: string, patch: Record<string, unknown>) {
    await fetch(`/api/tools/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  function updateDisplayMode(value: MenswearMultiOutfitDisplayMode) {
    if (isSplit && value === "flatlay") {
      setDisplayMode("model");
      setModelGender((current) => current === "none" ? (isWomen ? "female" : "male") : current);
      setModelFaceMode((current) => current === "no_model" ? "hidden_face" : current);
      return;
    }
    setDisplayMode(value);
    if (value === "flatlay") {
      setModelGender("none");
      setModelFaceMode("no_model");
      setCameraDistance("product_grid");
    } else {
      if (modelGender === "none") setModelGender(isWomen ? "female" : "male");
      if (modelFaceMode === "no_model") setModelFaceMode("hidden_face");
      if (cameraDistance === "product_grid") setCameraDistance("three_quarter");
    }
  }

  function updateModelGender(value: MenswearMultiOutfitModelGender) {
    setModelGender(value);
    if (value === "none") {
      updateDisplayMode("flatlay");
    } else if (displayMode === "flatlay") {
      setDisplayMode("model");
      if (modelFaceMode === "no_model") setModelFaceMode("hidden_face");
      if (cameraDistance === "product_grid") setCameraDistance("three_quarter");
    }
  }

  function updateModelFaceMode(value: MenswearMultiOutfitModelFaceMode) {
    setModelFaceMode(value);
    if (value === "no_model") {
      updateDisplayMode("flatlay");
    } else if (displayMode === "flatlay") {
      setDisplayMode("model");
      if (modelGender === "none") setModelGender(isWomen ? "female" : "male");
      if (cameraDistance === "product_grid") setCameraDistance("three_quarter");
    }
  }

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">主商品锁定</Badge>
              <Badge variant="secondary">{isSplit ? "平铺顺序拆分" : "横版搭配合集"}</Badge>
            </div>
            <CardTitle>生成配置</CardTitle>
            <CardDescription>{isSplit ? "上传平铺多搭图，识别每套组合后按顺序生成对应数量的单张人物穿搭图。" : "上传一个或多个服装主体参考图，生成上身模特或无模特平铺的一衣多搭合集。"}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5" onSubmit={openPrompt}>
              {!isSplit ? <ImageReferenceUploader
                emptyText="上传服装主体参考图"
                files={subjectImages}
                helper="可上传 1-6 张；主商品会出现在每一套搭配里"
                label="服装主体参考图"
                maxFiles={6}
                onChange={setSubjectImages}
              /> : null}
              {isSplit ? <ImageReferenceUploader
                emptyText="上传平铺多搭图"
                files={layoutReferenceImages}
                helper="必填。系统按从左到右、从上到下识别每套组合，逐套输出单张人物穿搭。"
                label="平铺多搭图"
                materialCategories={["outfit", "composition", "mood"]}
                maxFiles={1}
                onChange={setLayoutReferenceImages}
              /> : null}
              {isSplit ? <ImageReferenceUploader
                emptyText="上传人物穿搭参考图（可选）"
                files={styleReferenceImages}
                helper="只借鉴最终人物图的构图、背景、动作、镜头和视觉风格，不复制参考图里的服装。"
                label="人物穿搭参考图"
                materialCategories={["outfit", "pose", "background", "composition", "lighting", "mood"]}
                maxFiles={1}
                onChange={setStyleReferenceImages}
              /> : null}
              {isSplit && layoutReferenceImages.length ? (
                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-sky-200 bg-sky-50 p-3">
                  <Button disabled={isAnalyzingLayout} onClick={analyzeLayoutReference} type="button" variant="secondary">
                    {isAnalyzingLayout ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                    {isAnalyzingLayout ? "识别中" : "AI 识别平铺套数"}
                  </Button>
                  <p className="text-xs leading-5 text-sky-900">{layoutAnalysis || "识别后会自动回填套数；可按实际平铺搭配手动修正。"}</p>
                </div>
              ) : null}
              {isSplit ? (
                <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-3">
                  <div className="md:col-span-3">
                    <p className="text-sm font-semibold text-slate-900">人物穿搭参考控制</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">平铺图始终锁定每套服装组合和顺序；以下设置只控制人物穿搭参考图的画面效果。</p>
                  </div>
                  <SelectField label="构图控制" onChange={(value) => setCompositionMode(value as MenswearMultiOutfitCompositionMode)} options={styleReferenceImages.length ? [["inherit", "保持参考构图"], ["custom", "按说明变化"]] : [["custom", "按说明生成"]]} value={compositionMode} />
                  <SelectField label="背景控制" onChange={(value) => setBackgroundMode(value as MenswearMultiOutfitBackgroundMode)} options={styleReferenceImages.length ? [["inherit", "保持参考背景"], ["custom", "自定义背景"]] : [["custom", "自定义背景"]]} value={backgroundMode} />
                  <SelectField label="动作控制" onChange={(value) => setPoseMode(value as MenswearMultiOutfitPoseMode)} options={styleReferenceImages.length ? [["inherit", "保持参考动作"], ["custom", "自定义动作"], ["random", "随机自然动作"]] : [["custom", "自定义动作"], ["random", "随机自然动作"]]} value={poseMode} />
                </div>
              ) : null}

              {displayMode === "model" ? <ModelFaceReferenceSelector
                files={modelFaceFiles}
                onChange={setModelFaceFiles}
                onProfileChange={setModelProfileId}
                onSourceChange={setModelFaceSource}
                profileId={modelProfileId}
                source={modelFaceSource}
              /> : null}

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="目标客群">
                  <input
                    className={inputClass}
                    onChange={(event) => setTargetAudience(event.target.value)}
                    placeholder="选择或输入客群，可留空让 AI 推断"
                    value={targetAudience}
                  />
                </Field>
                <Field label="使用场景">
                  <input
                    className={inputClass}
                    onChange={(event) => setUsageScene(event.target.value)}
                    placeholder="例如详情页、社媒运营、小红书内容"
                    value={usageScene}
                  />
                </Field>
              </div>

              <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-3">
                <div className="md:col-span-3">
                  <p className="text-sm font-semibold text-slate-900">模特设置</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{isSplit ? "拆分图固定为单张人物穿搭；可设置脸部、口罩与人物远近。" : "可选择上身模特或无模特平铺合集。"}</p>
                </div>
                {!isSplit ? <SelectField
                  label="展示方式"
                  onChange={(value) => updateDisplayMode(value as MenswearMultiOutfitDisplayMode)}
                  options={[
                    ["flatlay", "无模特平铺"],
                    ["model", "有模特上身"],
                  ]}
                  value={displayMode}
                /> : null}
                <SelectField
                  label="模特性别"
                  onChange={(value) => updateModelGender(value as MenswearMultiOutfitModelGender)}
                  options={isSplit ? modelGenderOptions.filter(([value]) => value !== "none") : modelGenderOptions}
                  value={modelGender}
                />
                <SelectField
                  label="脸部"
                  onChange={(value) => updateModelFaceMode(value as MenswearMultiOutfitModelFaceMode)}
                  options={isSplit ? modelFaceOptions.filter(([value]) => value !== "no_model") : modelFaceOptions}
                  value={modelFaceMode}
                />
                {isSplit ? <SelectField
                  label="口罩"
                  onChange={(value) => setMaskMode(value as MenswearMultiOutfitMaskMode)}
                  options={[["no_mask", "不戴口罩"], ["wear_mask", "戴口罩"], ["auto", "自动判断"]]}
                  value={maskMode}
                /> : null}
              </div>

              {!isSplit ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <SelectField
                    label="版式文字"
                    onChange={(value) => setTextMode(value as MenswearMultiOutfitTextMode)}
                    options={[
                      ["with_labels", "标题与搭配名"],
                      ["no_text", "无文字"],
                    ]}
                    value={textMode}
                  />
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-2">
                <SelectField
                  label="季节搭配"
                  onChange={(value) => setSeason(value as MenswearMultiOutfitSeason)}
                  options={seasonOptions}
                  value={season}
                />
                <SelectField
                  label="画面比例"
                  onChange={(value) => setAspectRatio(value as MenswearMultiOutfitAspectRatio)}
                  options={aspectRatioOptions}
                  value={aspectRatio}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <SelectField
                  label="人物远近"
                  onChange={(value) => setCameraDistance(value as MenswearMultiOutfitCameraDistance)}
                  options={cameraDistanceOptions}
                  value={cameraDistance}
                />
                <PresetSelect label="保留内容" onChange={setPreservePreset} options={preservePresets} value={preservePreset} />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <PresetSelect label="画面风格" onChange={setStylePreset} options={isSplit ? splitStylePresets : stylePresets} value={stylePreset} />
              </div>

              {preservePreset === "自定义" ? (
                <Field label="自定义保留说明">
                  <textarea className={textareaClass} onChange={(event) => setCustomPreserve(event.target.value)} placeholder="例如：保留黑色卫衣的粉色印花、连帽结构、袖口和宽松版型" value={customPreserve} />
                </Field>
              ) : null}
              {stylePreset === "自定义" ? (
                <Field label="自定义风格说明">
                  <textarea className={textareaClass} onChange={(event) => setCustomStyle(event.target.value)} placeholder="例如：参考韩系男装白底合集，5 套横向排列，鞋包配饰完整" value={customStyle} />
                </Field>
              ) : null}
              {isSplit && poseMode === "custom" ? <Field label="自定义动作"><textarea className={textareaClass} onChange={(event) => setPoseInstruction(event.target.value)} placeholder="例如：自然站立、侧身行走或坐姿" value={poseInstruction} /></Field> : null}
              {isSplit && backgroundMode === "custom" ? <Field label="自定义背景"><textarea className={textareaClass} onChange={(event) => setBackgroundInstruction(event.target.value)} placeholder="例如：明亮街角、室内白墙或自然日光；背景不要抢服装" value={backgroundInstruction} /></Field> : null}

              <div className="grid gap-3 md:grid-cols-3">
                <SelectField label="搭配套数" onChange={(value) => setOutfitCount(Number(value))} options={["3", "4", "5", "6"].map((count) => [count, `${count} 套`])} value={String(outfitCount)} />
                <SelectField label="质量" onChange={setQuality} options={[["low", "低"], ["medium", "中"], ["high", "高"]]} value={quality} />
                {!isSplit ? <SelectField label="生成数量" onChange={(value) => setBatchCount(Number(value))} options={["1", "2", "4", "6"].map((count) => [count, `${count} 张`])} value={String(batchCount)} /> : <Field label="拆分输出"><div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">按识别/设置套数输出 {outfitCount} 张</div></Field>}
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
            { label: isSplit ? "平铺多搭图" : "主体参考", value: `${isSplit ? layoutReferenceImages.length : subjectImages.length} 张` },
            ...(isSplit ? [{ label: "人物穿搭参考", value: styleReferenceImages.length ? "已提供" : "自定义生成" }] : []),
            { label: "展示方式", value: displayModeLabel(displayMode) },
            { label: "模特性别", value: modelGenderLabel(displayMode === "flatlay" ? "none" : modelGender) },
            { label: "脸部", value: modelFaceLabel(displayMode === "flatlay" ? "no_model" : modelFaceMode) },
            { label: "季节", value: seasonLabel(season) },
            { label: "人物远近", value: cameraDistanceLabel(cameraDistance) },
            { label: "搭配套数", value: `${outfitCount} 套` },
            { label: "输出方式", value: outputFormat === "split" ? `拆分 ${outfitCount} 张` : "一张多搭合集" },
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
              <p className="mt-1 text-sm text-slate-500">已保存到统一图片画廊，可继续查看详情和下载。</p>
            </div>
            <Button asChild variant="secondary"><Link href="/tools/image-gallery">打开图片画廊</Link></Button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {resultImages.map((imageUrl, index) => (
              <a className="block overflow-hidden rounded-lg border border-slate-200 bg-white" href={imageUrl} key={`${imageUrl}-${index}`} rel="noreferrer" target="_blank">
                <img alt={`${isSplit ? "平铺多搭拆分" : "男装一衣多搭"}结果 ${index + 1}`} className={`${getImageAspectClass(aspectRatio)} w-full object-cover`} src={imageUrl} />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <PromptEditorDialog
        description={isSplit ? "请确认或修改完整提示词，保存后按平铺搭配顺序提交单张人物穿搭任务。" : "请确认或修改完整提示词，保存后才会提交本次一衣多搭合集生图任务。"}
        onClose={() => setPromptOpen(false)}
        onSave={generate}
        open={isPromptOpen}
        prompt={promptDraft}
        title={isSplit ? "确认平铺多搭拆分提示词" : `确认${genderLabel}一衣多搭合集提示词`}
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

const inputClass = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
const textareaClass = "min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

function isSeason(value: unknown): value is MenswearMultiOutfitSeason {
  return seasonOptions.some(([option]) => option === value);
}

function isAspectRatio(value: unknown): value is MenswearMultiOutfitAspectRatio {
  return aspectRatioOptions.some(([option]) => option === value);
}

function isCameraDistance(value: unknown): value is MenswearMultiOutfitCameraDistance {
  return cameraDistanceOptions.some(([option]) => option === value);
}

function isModelGender(value: unknown): value is MenswearMultiOutfitModelGender {
  return modelGenderOptions.some(([option]) => option === value);
}

function isModelFaceMode(value: unknown): value is MenswearMultiOutfitModelFaceMode {
  return modelFaceOptions.some(([option]) => option === value);
}

function displayModeLabel(value: MenswearMultiOutfitDisplayMode) {
  return value === "model" ? "有模特上身" : "无模特平铺";
}

function modelGenderLabel(value: MenswearMultiOutfitModelGender) {
  return modelGenderOptions.find(([option]) => option === value)?.[1] || "不限";
}

function modelFaceLabel(value: MenswearMultiOutfitModelFaceMode) {
  return modelFaceOptions.find(([option]) => option === value)?.[1] || "不露脸 / 无头";
}

function modelFaceSourceLabel(source: ModelFaceReferenceSource) {
  return {
    material: "素材库模特脸部",
    profile: "模特档案脸部",
    system: "系统生成模特",
    upload: "上传脸部参考图",
  }[source];
}

function seasonLabel(value: MenswearMultiOutfitSeason) {
  return seasonOptions.find(([option]) => option === value)?.[1] || "春秋过渡";
}

function cameraDistanceLabel(value: MenswearMultiOutfitCameraDistance) {
  return cameraDistanceOptions.find(([option]) => option === value)?.[1] || "七分身";
}
