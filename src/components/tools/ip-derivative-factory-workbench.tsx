"use client";

import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ImageReferenceUploader } from "@/components/tools/image-reference-uploader";
import {
  PromptConfirmDialog,
  PromptPreviewPanel,
} from "@/components/tools/prompt-preview-panel";
import { useWorkbenchSession } from "@/components/tools/workbench-session-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildIpDerivativePrompt,
  getIpDerivativeModeControlPresets,
  getIpDerivativeModePresets,
  type IpDerivativeMode,
} from "@/lib/ip-derivative-factory";

type GenerationPayload = {
  error?: string;
  job?: { id?: string };
  results?: Array<{ imageUrl?: string; asset?: { id?: string } }>;
};

export function IpDerivativeFactoryWorkbench() {
  const [mode, setMode] = useState<IpDerivativeMode>("meme");
  const [modeControlValues, setModeControlValues] = useState<Record<string, string>>(
    () => defaultModeControlValues("meme"),
  );
  const [modeControlCustomValues, setModeControlCustomValues] = useState<Record<string, string>>({});
  const [ipName, setIpName] = useState("");
  const [identityDescription, setIdentityDescription] = useState("");
  const [preserveRules, setPreserveRules] = useState("");
  const [userInstruction, setUserInstruction] = useState("");
  const [referenceFocus, setReferenceFocus] = useState("");
  const [outfitTransfer, setOutfitTransfer] = useState<string[]>(["服装版型", "配色", "搭配关系", "配饰"]);
  const [stickerText, setStickerText] = useState("");
  const [aspectRatio, setAspectRatio] = useState("square");
  const [quality, setQuality] = useState("medium");
  const [batchCount, setBatchCount] = useState(1);
  const [baseIpImages, setBaseIpImages] = useState<File[]>([]);
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [editablePrompt, setEditablePrompt] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const restoredSessionId = useRef<string | null>(null);
  const { create, session } = useWorkbenchSession("ip-factory");
  const modes = getIpDerivativeModePresets();
  const modeControls = getIpDerivativeModeControlPresets(mode);

  const prompt = useMemo(
    () =>
      buildIpDerivativePrompt({
        mode,
        ipName,
        identityDescription,
        preserveRules,
        userInstruction,
        referenceFocus,
        outfitTransfer,
        stickerText,
        modeControlValues,
        modeControlCustomValues,
        hasBaseImage: baseIpImages.length > 0,
        hasReferenceImages: referenceImages.length > 0,
      }),
    [
      baseIpImages.length,
      identityDescription,
      ipName,
      mode,
      modeControlCustomValues,
      modeControlValues,
      preserveRules,
      referenceFocus,
      outfitTransfer,
      referenceImages.length,
      stickerText,
      userInstruction,
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
        setNotice("生成任务仍在进行中，已恢复任务状态。");
      } else if (session.status === "SUCCEEDED") {
        setIsGenerating(false);
        setNotice(typeof output.summary === "string" ? output.summary : "衍生图片已生成，可在下方预览。");
      } else if (session.status === "FAILED") {
        setIsGenerating(false);
        setError(session.errorMessage || "上一次生成失败，请调整提示词后重试。");
      }

      if (restoredSessionId.current === session.id) return;
      restoredSessionId.current = session.id;
      const input = session.inputSnapshot;
      if (isIpDerivativeMode(input.mode)) setMode(input.mode);
      if (isRecord(input.modeControlValues)) {
        setModeControlValues(
          Object.fromEntries(
            Object.entries(input.modeControlValues).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
          ),
        );
      }
      if (typeof input.ipName === "string") setIpName(input.ipName);
      if (typeof input.identityDescription === "string") setIdentityDescription(input.identityDescription);
      if (typeof input.preserveRules === "string") setPreserveRules(input.preserveRules);
      if (typeof input.userInstruction === "string") setUserInstruction(input.userInstruction);
      if (typeof input.referenceFocus === "string") setReferenceFocus(input.referenceFocus);
      if (Array.isArray(input.outfitTransfer)) setOutfitTransfer(input.outfitTransfer.filter((item): item is string => typeof item === "string"));
      if (typeof input.stickerText === "string") setStickerText(input.stickerText);
      if (isRecord(input.modeControlCustomValues)) {
        setModeControlCustomValues(
          Object.fromEntries(
            Object.entries(input.modeControlCustomValues).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
          ),
        );
      }
      if (typeof input.aspectRatio === "string") setAspectRatio(input.aspectRatio);
      if (typeof input.quality === "string") setQuality(input.quality);
      if (typeof input.batchCount === "number") setBatchCount(input.batchCount);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [session]);

  function openConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (baseIpImages.length === 0) {
      setError("请先上传一张主 IP 图");
      return;
    }

    setError(null);
    setEditablePrompt(prompt);
    setIsConfirmOpen(true);
  }

  async function confirmGenerate(promptToSubmit: string) {
    if (!promptToSubmit.trim()) return;
    setIsConfirmOpen(false);
    setIsGenerating(true);
    setError(null);
    setNotice(null);
    let activeSessionId: string | null = null;

    try {
      const modeLabel = modes.find((item) => item.id === mode)?.label || "IP 衍生";
      const activeSession = await create({
        title: `${ipName.trim() || "未命名 IP"}：${modeLabel}`,
        status: "RUNNING",
        prompt: promptToSubmit,
        inputSnapshot: {
          mode,
          modeControlCustomValues,
          modeControlValues,
          ipName,
          identityDescription,
          preserveRules,
          userInstruction,
          referenceFocus,
          outfitTransfer,
          stickerText,
          aspectRatio,
          quality,
          batchCount,
          baseImageCount: baseIpImages.length,
          referenceImageCount: referenceImages.length,
        },
        outputSnapshot: {},
        imageAssetIds: [],
        externalJobId: null,
        errorMessage: null,
      });
      activeSessionId = activeSession.id;

      const response = await submitGeneration(activeSession.id, promptToSubmit);
      const payload = (await response.json().catch(() => ({}))) as GenerationPayload;
      if (!response.ok) throw new Error(payload.error || "IP 衍生图片生成失败");

      const imageUrls = payload.results?.flatMap((item) => (item.imageUrl ? [item.imageUrl] : [])) || [];
      const summary = `已生成 ${imageUrls.length || batchCount} 张${modeLabel}图片，结果已保存到图片画廊。`;
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
      const message = caughtError instanceof Error ? caughtError.message : "IP 衍生图片生成失败";
      setError(message);
      if (activeSessionId) {
        await patchSession(activeSessionId, { status: "FAILED", errorMessage: message });
      }
    } finally {
      setIsGenerating(false);
    }
  }

  function submitGeneration(workbenchSessionId: string, promptToSubmit: string) {
    const formData = new FormData();
    const modeLabel = modes.find((item) => item.id === mode)?.label || "IP 衍生";
    formData.set("mode", "custom");
    formData.set("sourceTool", "ip-factory");
    formData.set("description", promptToSubmit);
    formData.set("finalPrompt", promptToSubmit);
    formData.set("purpose", `${ipName.trim() || "未命名 IP"}${modeLabel}`);
    formData.set("style", modeLabel);
    formData.set("caption", `${ipName.trim() || "未命名 IP"} ${modeLabel}衍生图`);
    formData.set("tags", `#IP衍生 #${modeLabel} #AI生图`);
    formData.set("aspectRatio", aspectRatio);
    formData.set("quality", quality);
    formData.set("batchCount", String(batchCount));
    formData.set("workbenchSessionId", workbenchSessionId);
    baseIpImages.forEach((file) => formData.append("image", file));
    referenceImages.forEach((file) => formData.append("image", file));

    return fetch("/api/tools/image-generation", { method: "POST", body: formData });
  }

  function selectMode(nextMode: IpDerivativeMode) {
    setMode(nextMode);
    setModeControlValues(defaultModeControlValues(nextMode));
    setModeControlCustomValues({});
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
              <Badge variant="success">主图锁定身份</Badge>
              <Badge variant="secondary">参考图只改指定部分</Badge>
            </div>
            <CardTitle>生成配置</CardTitle>
            <CardDescription>上传主 IP 图，选择衍生方向，先确认完整提示词再生成。</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5" onSubmit={openConfirm}>
              <div className="grid gap-2 md:grid-cols-4" role="tablist">
                {modes.map((item) => (
                  <button
                    aria-selected={mode === item.id}
                    className={`min-h-20 rounded-lg border p-3 text-left transition ${
                      mode === item.id
                        ? "border-emerald-600 bg-emerald-50 text-emerald-950"
                        : "border-slate-200 bg-white text-slate-950 hover:border-slate-300"
                    }`}
                    key={item.id}
                    onClick={() => selectMode(item.id)}
                    role="tab"
                    type="button"
                  >
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{item.hint}</span>
                  </button>
                ))}
              </div>

              <div className="grid gap-3 rounded-lg border border-emerald-100 bg-emerald-50/60 p-4 md:grid-cols-2">
                {modeControls.map((control) => (
                  <div className="grid gap-2" key={control.id}>
                    <SelectField
                      label={control.label}
                      onChange={(value) => setModeControlValues((current) => ({ ...current, [control.id]: value }))}
                      options={control.options.map((option) => ({ value: option.value, label: option.label }))}
                      value={modeControlValues[control.id] || control.options[0]?.value || ""}
                    />
                    {modeControlValues[control.id] === "custom" ? <input className={inputClass} onChange={(event) => setModeControlCustomValues((current) => ({ ...current, [control.id]: event.target.value }))} placeholder={`自定义${control.label}`} value={modeControlCustomValues[control.id] || ""} /> : null}
                  </div>
                ))}
              </div>

              {mode === "outfit" ? <section className="grid gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4"><div><p className="text-sm font-semibold text-emerald-950">IP 画风锁定</p><p className="mt-1 text-sm leading-6 text-emerald-800">主 IP 图锁定角色身份、脸部、比例、线条、上色和原始画风。服装参考图不会覆盖这些内容。</p></div><div className="grid gap-2"><p className="text-sm font-semibold text-slate-800">仅迁移参考图中的</p><div className="flex flex-wrap gap-2">{["服装版型", "配色", "材质层次", "搭配关系", "配饰"].map((item) => <label className="flex h-9 items-center gap-2 rounded-md border border-emerald-200 bg-white px-3 text-sm text-slate-700" key={item}><input checked={outfitTransfer.includes(item)} onChange={() => setOutfitTransfer((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item])} type="checkbox" />{item}</label>)}</div></div></section> : null}

              <div className="grid gap-3 md:grid-cols-2">
                <ImageReferenceUploader
                  emptyText="上传角色正面图、已有 IP 图或设定图"
                  files={baseIpImages}
                  helper="必传，最多 1 张；它是身份基准"
                  label="主 IP 图"
                  maxFiles={1}
                  onChange={setBaseIpImages}
                />
                <ImageReferenceUploader
                  emptyText={mode === "outfit" ? "上传服装、穿搭或配饰参考" : "上传动作、服装、表情或场景参考"}
                  files={referenceImages}
                  helper={mode === "outfit" ? "选传，最多 6 张；只迁移服装和配饰，不改变主 IP 画风" : "选传，最多 6 张；只参考指定元素"}
                  label={mode === "outfit" ? "服装/穿搭参考图" : "辅助参考图"}
                  maxFiles={6}
                  onChange={setReferenceImages}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="IP 名称">
                  <input className={inputClass} onChange={(event) => setIpName(event.target.value)} placeholder="例如：火尾趴趴猫" value={ipName} />
                </Field>
              </div>

              <Field label="角色识别点">
                <input className={inputClass} onChange={(event) => setIdentityDescription(event.target.value)} placeholder="脸型、轮廓、主色、标志性道具或服装" value={identityDescription} />
              </Field>
              <Field label="必须保留">
                <input className={inputClass} onChange={(event) => setPreserveRules(event.target.value)} placeholder="例如：星形轮廓、火焰尾巴、半睁眼表情" value={preserveRules} />
              </Field>
              <Field label="本次修改说明">
                <textarea className={`${textareaClass} min-h-28`} onChange={(event) => setUserInstruction(event.target.value)} placeholder="例如：参考跳舞动作，生成完整跳舞姿势；或换成雨衣并添加透明雨伞。" required value={userInstruction} />
              </Field>
              <Field label="参考图用途">
                <input className={inputClass} onChange={(event) => setReferenceFocus(event.target.value)} placeholder={mode === "outfit" ? "例如：只参考外套、裤装、鞋履和项链，不改变 IP 的线条与画风" : "例如：只参考身体动作和重心，不改变角色"} value={referenceFocus} />
              </Field>

              {mode === "meme" ? (
                <Field label="表情包文字（可选）">
                  <input className={inputClass} onChange={(event) => setStickerText(event.target.value)} placeholder="例如：啊？真的假的" value={stickerText} />
                </Field>
              ) : null}

              <div className="grid gap-3 md:grid-cols-3">
                <SelectField label="画面比例" onChange={setAspectRatio} options={[{ value: "square", label: "方图" }, { value: "portrait", label: "竖图" }, { value: "landscape", label: "横图" }]} value={aspectRatio} />
                <SelectField label="质量" onChange={setQuality} options={[{ value: "low", label: "低" }, { value: "medium", label: "中" }, { value: "high", label: "高" }]} value={quality} />
                <SelectField label="数量" onChange={(value) => setBatchCount(Number(value))} options={[{ value: "1", label: "1 张" }, { value: "2", label: "2 张" }, { value: "4", label: "4 张" }, { value: "6", label: "6 张" }, { value: "9", label: "9 张" }, { value: "12", label: "12 张" }, { value: "18", label: "18 张" }, { value: "30", label: "30 张" }]} value={String(batchCount)} />
              </div>

              {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
              {notice ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</div> : null}

              <Button className="h-11 gap-2" disabled={isGenerating || baseIpImages.length === 0} type="submit">
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isGenerating ? "生成中" : "检查提示词并生成"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <PromptPreviewPanel
          galleryHref="/tools/image-gallery"
          meta={[
            { label: "主 IP 图", value: `${baseIpImages.length} 张` },
            { label: "辅助参考", value: `${referenceImages.length} 张` },
            { label: "模式", value: modes.find((item) => item.id === mode)?.label || "表情包" },
            { label: "数量", value: `${batchCount} 张` },
          ]}
          prompt={prompt}
        />
      </div>

      {resultImages.length > 0 ? (
        <section className="mt-5 border-t border-slate-200 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-950">本次生成结果</h2>
              <p className="mt-1 text-sm text-slate-500">已同步到图片画廊，可继续查看和下载。</p>
            </div>
            <Button asChild variant="secondary"><Link href="/tools/image-gallery">打开图片画廊</Link></Button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {resultImages.map((imageUrl, index) => (
              <a className="block overflow-hidden rounded-lg border border-slate-200 bg-white" href={imageUrl} key={`${imageUrl}-${index}`} rel="noreferrer" target="_blank">
                <img alt={`IP 衍生结果 ${index + 1}`} className="aspect-square w-full object-cover" src={imageUrl} />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <PromptConfirmDialog
        isOpen={isConfirmOpen}
        isSubmitting={isGenerating}
        onCancel={() => setIsConfirmOpen(false)}
        onChange={setEditablePrompt}
        onConfirm={(finalPrompt) => void confirmGenerate(finalPrompt)}
        prompt={editablePrompt}
        title="确认 IP 衍生提示词"
      />
    </>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return <label className="grid gap-2"><span className="text-sm font-semibold text-slate-700">{label}</span>{children}</label>;
}

function SelectField({ label, onChange, options, value }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <select className={inputClass} onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </Field>
  );
}

function isIpDerivativeMode(value: unknown): value is IpDerivativeMode {
  return value === "meme" || value === "pose" || value === "outfit" || value === "scene";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function defaultModeControlValues(mode: IpDerivativeMode) {
  return Object.fromEntries(
    getIpDerivativeModeControlPresets(mode).flatMap((control) =>
      control.options[0] ? [[control.id, control.options[0].value]] : [],
    ),
  );
}

const inputClass = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
const textareaClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
