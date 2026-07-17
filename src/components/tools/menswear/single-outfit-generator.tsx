"use client";

import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { ImageReferenceUploader } from "@/components/tools/image-reference-uploader";
import { PromptEditorDialog } from "@/components/tools/prompt-editor-dialog";
import { PromptPreviewPanel } from "@/components/tools/prompt-preview-panel";
import { useWorkbenchSession } from "@/components/tools/workbench-session-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildMenswearSingleOutfitPrompt,
  type MenswearSingleOutfitAspectRatio,
  type MenswearSingleOutfitBackgroundMode,
  type MenswearSingleOutfitCameraDistance,
  type MenswearSingleOutfitCompositionFidelity,
  type MenswearSingleOutfitFaceMode,
  type MenswearSingleOutfitModelGender,
  type MenswearSingleOutfitMaskMode,
  type MenswearSingleOutfitPersonScale,
  type MenswearSingleOutfitPoseMode,
} from "@/lib/menswear-single-outfit";

type GenerationPayload = { error?: string; job?: { id?: string }; results?: Array<{ imageUrl?: string; asset?: { id?: string } }> };

const aspectRatioOptions: Array<[MenswearSingleOutfitAspectRatio, string]> = [["portrait", "竖图 3:4"], ["square", "方图 1:1"], ["landscape", "横图"]];
const cameraDistanceOptions: Array<[MenswearSingleOutfitCameraDistance, string]> = [["full_body", "全身"], ["three_quarter", "七分身"], ["half_body", "半身"]];
const personScaleOptions: Array<[MenswearSingleOutfitPersonScale, string]> = [["small", "人物小 / 环境多"], ["balanced", "均衡（55%-70%）"], ["dominant", "人物突出（70%-80%）"], ["close", "近景（80%-90%）"]];

export function MenswearSingleOutfitGenerator({ gender = "men" }: { gender?: "men" | "women" }) {
  const isWomen = gender === "women";
  const genderLabel = isWomen ? "女装" : "男装";
  const [productImages, setProductImages] = useState<File[]>([]);
  const [compositionImages, setCompositionImages] = useState<File[]>([]);
  const [compositionFidelity, setCompositionFidelity] = useState<MenswearSingleOutfitCompositionFidelity>("locked");
  const [backgroundMode, setBackgroundMode] = useState<MenswearSingleOutfitBackgroundMode>("custom");
  const [modelFaceFiles, setModelFaceFiles] = useState<File[]>([]);
  const [modelGender, setModelGender] = useState<MenswearSingleOutfitModelGender>(isWomen ? "female" : "male");
  const [maskMode, setMaskMode] = useState<MenswearSingleOutfitMaskMode>("no_mask");
  const [faceMode, setFaceMode] = useState<MenswearSingleOutfitFaceMode>("show_face");
  const [aspectRatio, setAspectRatio] = useState<MenswearSingleOutfitAspectRatio>("portrait");
  const [cameraDistance, setCameraDistance] = useState<MenswearSingleOutfitCameraDistance>("three_quarter");
  const [personScale, setPersonScale] = useState<MenswearSingleOutfitPersonScale>("balanced");
  const [poseInstruction, setPoseInstruction] = useState("");
  const [poseMode, setPoseMode] = useState<MenswearSingleOutfitPoseMode>("random");
  const [backgroundInstruction, setBackgroundInstruction] = useState("");
  const [batchCount, setBatchCount] = useState(1);
  const [quality, setQuality] = useState("medium");
  const [promptDraft, setPromptDraft] = useState("");
  const [isPromptOpen, setPromptOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const { create } = useWorkbenchSession(isWomen ? "womenswear-single-outfit" : "menswear-single-outfit");

  const prompt = useMemo(() => buildMenswearSingleOutfitPrompt({
    aspectRatio,
    backgroundInstruction,
    backgroundMode,
    compositionFidelity,
    cameraDistance,
    faceMode,
    hasCompositionReference: compositionImages.length > 0,
    hasFaceReference: modelFaceFiles.length > 0,
    modelGender,
    maskMode,
    personScale,
    poseInstruction,
    poseMode,
    productImageCount: productImages.length,
    gender,
  }), [aspectRatio, backgroundInstruction, backgroundMode, cameraDistance, compositionFidelity, compositionImages.length, faceMode, gender, maskMode, modelFaceFiles.length, modelGender, personScale, poseInstruction, poseMode, productImages.length]);

  function openPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (productImages.length === 0) {
      setError("请先上传至少一张服装单品图");
      return;
    }
    if (faceMode === "show_face" && modelFaceFiles.length === 0) {
      setError("选择完整露脸时，请先上传脸部参考图；也可以改为无头 / 不露脸");
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
    setIsGenerating(true);
    setError(null);
    setNotice(null);
    try {
      const session = await create({
        title: `${genderLabel}单品穿搭生图`,
        status: "RUNNING",
        prompt: finalPrompt,
        inputSnapshot: { aspectRatio, backgroundInstruction, backgroundMode, batchCount, cameraDistance, compositionFidelity, compositionImageCount: compositionImages.length, faceMode, hasFaceReference: modelFaceFiles.length > 0, maskMode, modelGender, personScale, poseInstruction, poseMode, productImageCount: productImages.length, quality },
        outputSnapshot: {}, imageAssetIds: [], externalJobId: null, errorMessage: null,
      });
      const response = await submitGeneration(session.id, finalPrompt);
      const payload = (await response.json().catch(() => ({}))) as GenerationPayload;
      if (!response.ok) throw new Error(payload.error || `${genderLabel}单品穿搭生图失败`);
      if ("queued" in payload && payload.queued) {
        setResultImages([]);
        setNotice("已进入任务队列，可继续上传下一组素材；完成后会自动保存到统一图片画廊。");
        return;
      }
      const imageUrls = payload.results?.flatMap((item) => item.imageUrl ? [item.imageUrl] : []) || [];
      setResultImages(imageUrls);
      setNotice(`已生成 ${imageUrls.length || batchCount} 张单品穿搭图，每张为独立的一套完整搭配。`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : `${genderLabel}单品穿搭生图失败`);
    } finally {
      setIsGenerating(false);
    }
  }

  function submitGeneration(workbenchSessionId: string, finalPrompt: string) {
    const formData = new FormData();
    formData.set("mode", isWomen ? "womenswear" : "menswear");
    formData.set("sourceTool", isWomen ? "womenswear-single-outfit" : "menswear-single-outfit");
    formData.set("description", `${genderLabel}单品上身穿搭生成`);
    formData.set("purpose", `${genderLabel}单品穿搭生图`);
    formData.set("caption", `单品锁定，一张图一套完整${genderLabel}穿搭。`);
    formData.set("tags", isWomen ? "#女装 #女生穿搭 #AI生图" : "#男装 #单品穿搭 #AI生图");
    formData.set("productKeywords", `${genderLabel} 单品 穿搭 上身图`);
    formData.set("aspectRatio", aspectRatio);
    formData.set("quality", quality);
    formData.set("batchCount", String(batchCount));
    formData.set("finalPrompt", finalPrompt);
    formData.set("workbenchSessionId", workbenchSessionId);
    productImages.forEach((file) => formData.append("image", file));
    compositionImages.forEach((file) => formData.append("image", file));
    modelFaceFiles.forEach((file) => formData.append("image", file));
    return fetch("/api/tools/image-generation", { method: "POST", body: formData });
  }

  return <>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2"><Badge variant="success">单品锁定</Badge><Badge variant="secondary">一图一套穿搭</Badge></div>
          <CardTitle>生成配置</CardTitle>
          <CardDescription>上传衣服、裤子、内搭、鞋包等单品；可选构图参考图，只借用动作、镜头与氛围。</CardDescription>
        </CardHeader>
        <CardContent><form className="grid gap-5" onSubmit={openPrompt}>
          <ImageReferenceUploader emptyText="上传服装单品图" files={productImages} helper="1-6 张；支持衣服、裤子、内搭、鞋包和配饰，本次会严格保留。" label="锁定单品图" materialCategories={["top", "inner", "bottom", "shoes", "bag", "accessory", "outfit"]} maxFiles={6} onChange={setProductImages} />
          <ImageReferenceUploader emptyText="上传穿搭/构图参考图（可选）" files={compositionImages} helper="只借鉴动作、人物占比、镜头、构图和氛围，不复制参考图中的衣服。" label="构图参考图" materialCategories={["pose", "background", "composition", "lighting", "mood"]} maxFiles={1} onChange={setCompositionImages} />
          {compositionImages.length ? <SelectField label="构图复刻方式" onChange={(value) => setCompositionFidelity(value as MenswearSingleOutfitCompositionFidelity)} options={[["locked", "严格复刻参考图构图"], ["adjustable", "参考构图，可按说明微调"]]} value={compositionFidelity} /> : null}
          <div className="grid gap-3 md:grid-cols-2">
            <SelectField label="背景控制" onChange={(value) => setBackgroundMode(value as MenswearSingleOutfitBackgroundMode)} options={compositionImages.length ? [["inherit", "保持参考图背景"], ["custom", "自定义背景"]] : [["custom", "自定义背景"]]} value={backgroundMode} />
            <SelectField label="动作控制" onChange={(value) => setPoseMode(value as MenswearSingleOutfitPoseMode)} options={compositionImages.length ? [["inherit", "保持参考图动作"], ["custom", "自定义动作"], ["random", "随机自然动作"]] : [["custom", "自定义动作"], ["random", "随机自然动作"]]} value={poseMode} />
          </div>
          <ImageReferenceUploader emptyText="上传脸部参考图" files={modelFaceFiles} helper="可本地上传或从素材库选择模特脸部；选择完整露脸时必填，仅锁定人物身份。" label="脸部参考图" materialCategories={["model_face"]} maxFiles={1} onChange={setModelFaceFiles} />
          <div className="grid gap-3 md:grid-cols-2">
            <SelectField label="模特性别" onChange={(value) => setModelGender(value as MenswearSingleOutfitModelGender)} options={[["male", "男模特"], ["female", "女模特"], ["auto", "按商品判断"]]} value={modelGender} />
            <SelectField label="是否露脸" onChange={(value) => setFaceMode(value as MenswearSingleOutfitFaceMode)} options={[["show_face", "完整露脸"], ["hidden_face", "无头 / 不露脸"]]} value={faceMode} />
            <SelectField label="口罩" onChange={(value) => setMaskMode(value as MenswearSingleOutfitMaskMode)} options={[["no_mask", "不戴口罩"], ["wear_mask", "戴口罩"], ["auto", "自动判断"]]} value={maskMode} />
            <SelectField label="人物远近" onChange={(value) => setCameraDistance(value as MenswearSingleOutfitCameraDistance)} options={cameraDistanceOptions} value={cameraDistance} />
            <SelectField label="人物占比" onChange={(value) => setPersonScale(value as MenswearSingleOutfitPersonScale)} options={personScaleOptions} value={personScale} />
            <SelectField label="图片比例" onChange={(value) => setAspectRatio(value as MenswearSingleOutfitAspectRatio)} options={aspectRatioOptions} value={aspectRatio} />
            <SelectField label="生成数量" onChange={(value) => setBatchCount(Number(value))} options={["1", "2", "4", "6"].map((item): [string, string] => [item, `${item} 张`])} value={String(batchCount)} />
          </div>
          {poseMode === "custom" ? <Field label="自定义动作"><textarea className={textareaClass} onChange={(event) => setPoseInstruction(event.target.value)} placeholder="例如：自然站立、侧身行走或坐姿" value={poseInstruction} /></Field> : null}
          {backgroundMode === "custom" ? <Field label="自定义背景"><textarea className={textareaClass} onChange={(event) => setBackgroundInstruction(event.target.value)} placeholder="例如：室内白墙、城市街角；自然日光，背景不能抢服装" value={backgroundInstruction} /></Field> : null}
          <SelectField label="生成质量" onChange={setQuality} options={[["low", "低"], ["medium", "中"], ["high", "高"]]} value={quality} />
          {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          {notice ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p> : null}
          <Button className="h-11 gap-2" disabled={productImages.length === 0 || isGenerating} type="submit">{isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{isGenerating ? "生成中" : "确认提示词并生成"}</Button>
        </form></CardContent>
      </Card>
      <PromptPreviewPanel meta={[{ label: "锁定单品", value: `${productImages.length} 张` }, { label: "构图参考", value: compositionImages.length ? "已提供" : "系统生成" }, { label: "人物占比", value: personScaleOptions.find(([value]) => value === personScale)?.[1] || "均衡" }, { label: "露脸", value: faceMode === "show_face" ? "完整露脸" : "无头 / 不露脸" }, { label: "口罩", value: maskMode === "wear_mask" ? "戴口罩" : maskMode === "no_mask" ? "不戴口罩" : "自动判断" }, { label: "数量", value: `${batchCount} 张` }]} prompt={prompt} />
    </div>
    {resultImages.length ? <section className="mt-5 border-t border-slate-200 pt-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-slate-950">本次生成结果</h2><p className="mt-1 text-sm text-slate-500">每张图片是一套独立穿搭，可继续在画廊查看完整提示词和参考图。</p></div><Button asChild variant="secondary"><Link href="/tools/image-gallery">打开图片画廊</Link></Button></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{resultImages.map((url, index) => <a className="block overflow-hidden rounded-md border border-slate-200 bg-white" href={url} key={`${url}-${index}`} rel="noreferrer" target="_blank"><img alt={`单品穿搭结果 ${index + 1}`} className="aspect-[3/4] w-full object-cover" src={url} /></a>)}</div></section> : null}
    <PromptEditorDialog description="请确认或修改完整提示词，保存后提交单品穿搭生图任务。" onClose={() => setPromptOpen(false)} onSave={generate} open={isPromptOpen} prompt={promptDraft} title={`确认${genderLabel}单品穿搭提示词`} />
  </>;
}

function Field({ children, label }: { children: React.ReactNode; label: string }) { return <label className="grid gap-2"><span className="text-sm font-semibold text-slate-700">{label}</span>{children}</label>; }
function SelectField({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: string[] | Array<[string, string]>; value: string }) { const normalized = options.map((item) => Array.isArray(item) ? item : [item, item]); return <Field label={label}><select className={inputClass} onChange={(event) => onChange(event.target.value)} value={value}>{normalized.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></Field>; }
const inputClass = "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
const textareaClass = "min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
