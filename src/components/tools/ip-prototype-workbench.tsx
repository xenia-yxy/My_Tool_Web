"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ImageReferenceUploader } from "@/components/tools/image-reference-uploader";
import {
  PromptConfirmDialog,
  PromptPreviewPanel,
} from "@/components/tools/prompt-preview-panel";
import { useWorkbenchSession } from "@/components/tools/workbench-session-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buildIpPromptPreview } from "@/lib/image-generation-workflow";

type IpType = "person" | "product" | "content";
type OutputGoal =
  | "prototype"
  | "refine"
  | "character-sheet"
  | "avatar"
  | "cover"
  | "poster"
  | "series";

const ipTypeOptions: Array<{ value: IpType; label: string; hint: string }> = [
  { value: "person", label: "人物 IP", hint: "头像、虚拟人、个人形象、账号主理人" },
  { value: "product", label: "产品 IP", hint: "包装、周边、玩具、商品视觉" },
  { value: "content", label: "内容 IP", hint: "栏目封面、账号视觉、系列模板" },
];

const outputGoalOptions: Array<{ value: OutputGoal; label: string }> = [
  { value: "prototype", label: "原型图" },
  { value: "refine", label: "精修图" },
  { value: "character-sheet", label: "设定图" },
  { value: "avatar", label: "头像" },
  { value: "cover", label: "封面" },
  { value: "poster", label: "海报" },
  { value: "series", label: "系列图" },
];

export function IpPrototypeWorkbench() {
  const router = useRouter();
  const [ipName, setIpName] = useState("");
  const [ipType, setIpType] = useState<IpType>("person");
  const [outputGoal, setOutputGoal] = useState<OutputGoal>("prototype");
  const [prompt, setPrompt] = useState("");
  const [styleText, setStyleText] = useState("");
  const [conceptStatement, setConceptStatement] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [personality, setPersonality] = useState("");
  const [visualAnchors, setVisualAnchors] = useState("");
  const [avoidDirections, setAvoidDirections] = useState("");
  const [scenario, setScenario] = useState("");
  const [aspectRatio, setAspectRatio] = useState("square");
  const [quality, setQuality] = useState("low");
  const [batchCount, setBatchCount] = useState(1);
  const [draftImages, setDraftImages] = useState<File[]>([]);
  const [styleImages, setStyleImages] = useState<File[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editablePrompt, setEditablePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { create, persist, session } = useWorkbenchSession("ip-prototype");

  const projectName = ipName.trim() || buildDraftProjectName(prompt);
  const promptPreview = useMemo(
    () =>
      buildIpPromptPreview({
        projectName,
        projectDescription: prompt,
        brandTone: styleText,
        conceptStatement,
        targetAudience,
        personality,
        visualAnchors,
        avoidDirections,
        scenario,
        ipType,
        outputGoal,
        prompt,
        styleText,
        hasDraftImage: draftImages.length > 0,
        hasStyleImage: styleImages.length > 0,
      }),
    [
      avoidDirections,
      conceptStatement,
      draftImages.length,
      ipType,
      outputGoal,
      personality,
      projectName,
      prompt,
      scenario,
      styleImages.length,
      styleText,
      targetAudience,
      visualAnchors,
    ],
  );

  function openConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setEditablePrompt(promptPreview);
    setIsConfirmOpen(true);
  }

  async function confirmGenerate() {
    setError(null);
    setIsGenerating(true);
    setIsConfirmOpen(false);
    let activeSessionId: string | null = null;

    try {
      const activeSession = await create({
        title: `IP 原型：${projectName}`,
        status: "RUNNING",
        prompt: editablePrompt,
        inputSnapshot: {
          projectName,
          ipType,
          outputGoal,
          prompt,
          styleText,
          conceptStatement,
          targetAudience,
          personality,
          visualAnchors,
          avoidDirections,
          scenario,
          aspectRatio,
          quality,
          batchCount,
          draftImageCount: draftImages.length,
          styleImageCount: styleImages.length,
        },
        outputSnapshot: {},
        imageAssetIds: [],
        externalJobId: null,
        errorMessage: null,
      });
      activeSessionId = activeSession.id;
      const project = await createHiddenProject();
      const formData = new FormData();
      formData.set("ipType", ipType);
      formData.set("outputGoal", outputGoal);
      formData.set("prompt", prompt);
      formData.set("styleText", styleText);
      formData.set("conceptStatement", conceptStatement);
      formData.set("targetAudience", targetAudience);
      formData.set("personality", personality);
      formData.set("visualAnchors", visualAnchors);
      formData.set("avoidDirections", avoidDirections);
      formData.set("scenario", scenario);
      formData.set("aspectRatio", aspectRatio);
      formData.set("quality", quality);
      formData.set("batchCount", String(batchCount));
      formData.set("finalPrompt", editablePrompt);
      draftImages.forEach((image) => formData.append("draftImage", image));
      styleImages.forEach((image) => formData.append("styleImage", image));

      const response = await fetch(`/api/tools/ip-prototypes/${project.id}/generate`, {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "IP 原型生成失败");
      }

      await persistIpSession(activeSession.id, {
        status: "SUCCEEDED",
        outputSnapshot: {
          projectId: project.id,
          galleryHref: "/tools/image-gallery?mode=ip-prototype",
          summary: `${projectName} 的 IP 原型已提交生成，结果进入图片画廊。`,
        },
      });
      router.push("/tools/image-gallery?mode=ip-prototype");
    } catch (caughtError) {
      const errorMessage = caughtError instanceof Error ? caughtError.message : "IP 原型生成失败";
      setError(errorMessage);
      await persistIpSession(activeSessionId, {
        status: "FAILED",
        errorMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function persistIpSession(
    sessionId: string | null,
    patch: Parameters<typeof persist>[0],
  ) {
    if (sessionId && session?.id !== sessionId) {
      await fetch(`/api/tools/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      return;
    }

    await persist(patch);
  }

  async function createHiddenProject() {
    const response = await fetch("/api/tools/ip-prototypes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: projectName,
        ipType,
        description: prompt,
        brandTone: styleText,
      }),
    });
    const payload = (await response.json()) as {
      project?: { id: string };
      error?: string;
    };

    if (!response.ok || !payload.project) {
      throw new Error(payload.error || "创建临时 IP 记录失败");
    }

    return payload.project;
  }

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="min-w-0">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success">IP 原型</Badge>
                <Badge variant="secondary">想法 + 风格 + 参考图</Badge>
              </div>
              <CardTitle>生成配置</CardTitle>
              <CardDescription>
                先描述核心想法，再补充风格或参考图；高级设定按需展开。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-5" onSubmit={openConfirm}>
                <div className="grid gap-3 md:grid-cols-3">
                  {ipTypeOptions.map((option) => (
                    <button
                      className={`rounded-xl border p-4 text-left transition ${
                        ipType === option.value
                          ? "border-blue-600 bg-blue-50 text-blue-950"
                          : "border-slate-200 bg-white text-slate-950 hover:border-slate-300"
                      }`}
                      key={option.value}
                      onClick={() => setIpType(option.value)}
                      type="button"
                    >
                      <span className="text-sm font-semibold">{option.label}</span>
                      <span className="mt-2 block text-xs leading-5 text-slate-500">
                        {option.hint}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="IP 名称">
                    <input
                      className={inputClass}
                      onChange={(event) => setIpName(event.target.value)}
                      placeholder="例如：租房打工人小夏、Bingou 日常"
                      value={ipName}
                    />
                  </Field>
                  <SelectField
                    label="输出类型"
                    onChange={(value) => setOutputGoal(value as OutputGoal)}
                    options={outputGoalOptions}
                    value={outputGoal}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <ImageReferenceUploader
                    emptyText="上传草稿、截图、旧图或原始想法"
                    files={draftImages}
                    helper="可多图，最多 8 张；用于保留构图和主体关系"
                    label="草稿图"
                    onChange={setDraftImages}
                  />
                  <ImageReferenceUploader
                    emptyText="上传风格、质感、配色参考"
                    files={styleImages}
                    helper="可多图，最多 8 张；用于提取色彩、镜头和视觉情绪"
                    label="风格参考"
                    onChange={setStyleImages}
                  />
                </div>

                <Field label="核心想法">
                  <textarea
                    className={`${textareaClass} min-h-32`}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="例如：做一个普通租房打工人 IP，白墙走廊真实拍摄感，人物干净但有一点疲惫，适合做账号头像和图文封面。"
                    required
                    value={prompt}
                  />
                </Field>

                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="风格描述">
                    <input
                      className={inputClass}
                      onChange={(event) => setStyleText(event.target.value)}
                      placeholder="例如：真实照片、白墙、自然光、轻微胶片感"
                      value={styleText}
                    />
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <SelectField
                      label="尺寸"
                      onChange={setAspectRatio}
                      options={[
                        { value: "square", label: "方图" },
                        { value: "portrait", label: "竖图" },
                        { value: "landscape", label: "横图" },
                      ]}
                      value={aspectRatio}
                    />
                    <SelectField
                      label="质量"
                      onChange={setQuality}
                      options={[
                        { value: "low", label: "低" },
                        { value: "medium", label: "中" },
                        { value: "high", label: "高" },
                      ]}
                      value={quality}
                    />
                    <SelectField
                      label="数量"
                      onChange={(value) => setBatchCount(Number(value))}
                      options={[
                        { value: "1", label: "1 张" },
                        { value: "2", label: "2 张" },
                        { value: "3", label: "3 张" },
                        { value: "4", label: "4 张" },
                        { value: "6", label: "6 张" },
                      ]}
                      value={String(batchCount)}
                    />
                  </div>
                </div>

                <details className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-800">补充设定（可选）</summary>
                  <div className="mt-4 grid gap-3">
                    <Field label="一句话立意"><input className={inputClass} onChange={(event) => setConceptStatement(event.target.value)} placeholder="这个 IP 为什么存在" value={conceptStatement} /></Field>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="目标用户"><input className={inputClass} onChange={(event) => setTargetAudience(event.target.value)} placeholder="服务谁" value={targetAudience} /></Field>
                      <Field label="性格关键词"><input className={inputClass} onChange={(event) => setPersonality(event.target.value)} placeholder="例如：冷静、可信、直接" value={personality} /></Field>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="视觉锚点"><input className={inputClass} onChange={(event) => setVisualAnchors(event.target.value)} placeholder="反复出现的视觉元素" value={visualAnchors} /></Field>
                      <Field label="避免方向"><input className={inputClass} onChange={(event) => setAvoidDirections(event.target.value)} placeholder="不希望出现的风格" value={avoidDirections} /></Field>
                    </div>
                    <Field label="应用场景"><input className={inputClass} onChange={(event) => setScenario(event.target.value)} placeholder="例如：头像、封面或栏目主视觉" value={scenario} /></Field>
                  </div>
                </details>

                {error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <Button className="h-11 gap-2" disabled={isGenerating} type="submit">
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {isGenerating ? "正在生成" : "检查提示词并生成"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        <PromptPreviewPanel
          galleryHref="/tools/image-gallery?mode=ip-prototype"
          meta={[
            { label: "草稿图", value: `${draftImages.length} 张` },
            { label: "风格图", value: `${styleImages.length} 张` },
            { label: "输出", value: goalLabel(outputGoal) },
            { label: "数量", value: `${batchCount} 张` },
          ]}
          prompt={promptPreview}
        />
      </div>

      <PromptConfirmDialog
        isOpen={isConfirmOpen}
        isSubmitting={isGenerating}
        onCancel={() => setIsConfirmOpen(false)}
        onChange={setEditablePrompt}
        onConfirm={() => void confirmGenerate()}
        prompt={editablePrompt}
        title="确认 IP 生图提示词"
      />
    </>
  );
}

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
const textareaClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

function Field({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <select
        className={inputClass}
        onChange={(event) => onChange(event.target.value)}
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

function goalLabel(goal: OutputGoal) {
  return outputGoalOptions.find((option) => option.value === goal)?.label ?? "原型图";
}

function buildDraftProjectName(prompt: string) {
  const normalized = prompt.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return "临时 IP 原型";
  }

  return normalized.length > 18 ? `${normalized.slice(0, 18)}...` : normalized;
}
