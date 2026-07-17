"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Copy,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PromptEditorDialog } from "@/components/tools/prompt-editor-dialog";
import { ReferenceSlot } from "@/components/tools/menswear/reference-slot";
import type {
  DraftReference,
  MenswearMaterial,
  MenswearModelProfile,
} from "@/components/tools/menswear/types";
import { Button } from "@/components/ui/button";
import {
  buildStrictMenswearPrompt,
  type MenswearCameraDistance,
  type MenswearReferencePolicy,
  type MenswearReferenceRole,
} from "@/lib/menswear-studio";

type GeneratedResult = {
  imageUrl: string;
  title: string;
  caption: string;
  tags: string[];
  productKeywords: string[];
};

type RestoredMenswearProject = {
  id: string;
  name: string;
  description: string | null;
  modelProfileId: string | null;
  references: Array<{
    allowedChanges: string[];
    fidelity: number;
    materialId: string;
    policy: DraftReference["policy"];
    role: string;
  }>;
  settings: unknown;
};

const productSlots: Array<{ label: string; role: DraftReference["role"] }> = [
  { label: "主上衣（必须锁定）", role: "top" },
  { label: "内搭", role: "inner" },
  { label: "裤子", role: "bottom" },
  { label: "鞋子", role: "shoes" },
  { label: "包", role: "bag" },
  { label: "配饰", role: "accessory" },
  { label: "整套穿搭", role: "outfit" },
];

const sceneSlots: Array<{ label: string; role: DraftReference["role"] }> = [
  { label: "模特脸部", role: "model_face" },
  { label: "模特身体", role: "model_body" },
  { label: "姿势参考", role: "pose" },
  { label: "背景环境", role: "background" },
  { label: "构图参考", role: "composition" },
  { label: "光线", role: "lighting" },
  { label: "氛围", role: "mood" },
];

const allSlots = [...productSlots, ...sceneSlots];
const productRoleSet = new Set(productSlots.map((slot) => slot.role));

const styleOptions = [
  "自然电商街拍",
  "商业棚拍",
  "城市通勤杂志感",
  "日系清新街拍",
  "轻户外生活方式",
  "自定义",
];

const systemControlOptions = {
  scene: ["城市通勤街道", "简洁室内空间", "校园树荫", "咖啡馆外景", "纯净影棚", "自定义"],
  pose: ["自然站姿", "缓步行走", "轻松倚靠", "正面展示", "自定义"],
  lighting: ["柔和日光", "阴天漫射光", "影棚柔光", "黄昏暖光", "自定义"],
  mood: ["清爽自然", "克制高级", "轻松日常", "干净通勤", "自定义"],
} as const;

const cameraDistanceOptions: Array<[MenswearCameraDistance, string]> = [
  ["full_body", "全身"],
  ["three_quarter", "七分身"],
  ["half_body", "半身"],
  ["close_detail", "近景细节"],
];

type SystemControls = Record<keyof typeof systemControlOptions, string>;

const defaultSystemControls: SystemControls = {
  scene: "城市通勤街道",
  pose: "自然站姿",
  lighting: "柔和日光",
  mood: "清爽自然",
};

export function StrictFidelityGenerator({ gender = "men" }: { gender?: "men" | "women" }) {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [materials, setMaterials] = useState<MenswearMaterial[]>([]);
  const [profiles, setProfiles] = useState<MenswearModelProfile[]>([]);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [modelProfileId, setModelProfileId] = useState("");
  const [references, setReferences] = useState<DraftReference[]>([]);
  const [selectedSlotRoles, setSelectedSlotRoles] = useState<DraftReference["role"][]>(["top"]);
  const [stylePreset, setStylePreset] = useState("自定义");
  const [customStyle, setCustomStyle] = useState("");
  const [systemControls, setSystemControls] = useState<SystemControls>(defaultSystemControls);
  const [customSystemControls, setCustomSystemControls] = useState<Partial<SystemControls>>({});
  const [aspectRatio, setAspectRatio] = useState<"square" | "portrait" | "landscape">("portrait");
  const [cameraDistance, setCameraDistance] = useState<MenswearCameraDistance>("three_quarter");
  const [batchCount, setBatchCount] = useState(1);
  const [quality, setQuality] = useState<"low" | "medium" | "high">("medium");
  const [customInstructions, setCustomInstructions] = useState("");
  const [promptDraft, setPromptDraft] = useState("");
  const [promptOpen, setPromptOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProjectLoading, setIsProjectLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [linkedProjectId, setLinkedProjectId] = useState<string | null>(null);

  const modelName = profiles.find((profile) => profile.id === modelProfileId)?.name;
  const selectedSlots = allSlots.filter((slot) => selectedSlotRoles.includes(slot.role));
  const projectReferences = references.map((reference, position) => ({ ...reference, position }));
  const promptStyle = stylePreset === "自定义" ? customStyle : stylePreset;
  const promptSystemControls = (Object.keys(systemControls) as Array<keyof SystemControls>)
    .map((key) => systemControls[key] === "自定义" ? customSystemControls[key] : systemControls[key])
    .filter((value): value is string => Boolean(value?.trim()));
  const promptPreview = useMemo(() => adaptPromptGender(buildStrictMenswearPrompt({
    aspectRatio,
    cameraDistance,
    customInstructions,
    description: description || `请根据锁定的商品素材生成真实${gender === "women" ? "女装" : "男装"}穿搭图`,
    modelName,
    references: projectReferences.map((reference) => ({
      fidelity: reference.fidelity,
      materialName: materials.find((material) => material.id === reference.materialId)?.name || "未命名素材",
      policy: reference.policy as MenswearReferencePolicy,
      role: reference.role as MenswearReferenceRole,
    })),
    stylePreset: promptStyle,
    systemControls: promptSystemControls,
  }), gender), [aspectRatio, cameraDistance, customInstructions, description, gender, materials, modelName, projectReferences, promptStyle, promptSystemControls]);

  const loadDependencies = useCallback(async () => {
    setIsLoading(true);
    try {
      const [materialsResponse, profilesResponse] = await Promise.all([
        fetch("/api/tools/menswear/materials"),
        fetch("/api/tools/menswear/models"),
      ]);
      const materialPayload = (await materialsResponse.json()) as { error?: string; materials?: MenswearMaterial[] };
      const profilePayload = (await profilesResponse.json()) as { error?: string; profiles?: MenswearModelProfile[] };
      if (!materialsResponse.ok) throw new Error(materialPayload.error || "加载素材失败");
      if (!profilesResponse.ok) throw new Error(profilePayload.error || "加载模特档案失败");
      setMaterials(materialPayload.materials ?? []);
      setProfiles(profilePayload.profiles ?? []);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "加载生图配置失败");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDependencies(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDependencies]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!projectId) {
        setLinkedProjectId(null);
        return;
      }

      void (async () => {
        setIsProjectLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/tools/menswear/projects/${projectId}`);
          const payload = (await response.json()) as {
            error?: string;
            project?: RestoredMenswearProject;
          };
          if (!response.ok || !payload.project) {
            throw new Error(payload.error || "加载男装项目失败");
          }

          const settings = normalizeProjectSettings(payload.project.settings);
          setLinkedProjectId(payload.project.id);
          setProjectName(payload.project.name);
          setDescription(payload.project.description || "");
          setModelProfileId(payload.project.modelProfileId || "");
          setReferences(normalizeRestoredReferences(payload.project.references).filter(
            (reference) => reference.role !== "scene",
          ));
          setSelectedSlotRoles(settings.selectedSlotRoles.length
            ? settings.selectedSlotRoles
            : ["top"]);
          setAspectRatio(settings.aspectRatio);
          setCameraDistance(settings.cameraDistance);
          setBatchCount(settings.batchCount);
          setCustomInstructions(settings.customInstructions);
          setStylePreset(settings.stylePreset);
          setCustomStyle(settings.customStyle);
          setSystemControls(settings.systemControls);
          setCustomSystemControls(settings.customSystemControls);
        } catch (caughtError) {
          setError(caughtError instanceof Error ? caughtError.message : "加载男装项目失败");
        } finally {
          setIsProjectLoading(false);
        }
      })();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [projectId]);

  function updateReference(role: string, next: DraftReference | null) {
    setReferences((current) => {
      const remaining = current.filter((reference) => reference.role !== role);
      return next ? [...remaining, next] : remaining;
    });
  }

  function toggleSlot(role: DraftReference["role"]) {
    if (role === "top") return;
    setSelectedSlotRoles((current) => current.includes(role)
      ? current.filter((item) => item !== role)
      : [...current, role]);
    setReferences((current) => current.filter((reference) => reference.role !== role));
  }

  function updateSystemControl(key: keyof SystemControls, value: string) {
    setSystemControls((current) => ({ ...current, [key]: value }));
  }

  function addUploadedMaterial(material: MenswearMaterial) {
    setMaterials((current) => [material, ...current.filter((item) => item.id !== material.id)]);
  }

  function openPrompt() {
    const hasLockedProduct = references.some((reference) =>
      productRoleSet.has(reference.role as DraftReference["role"]) && reference.policy === "LOCKED",
    );
    if (!hasLockedProduct) {
      setError("至少选择一件服装、鞋包或整套穿搭素材，并设为锁定保留");
      return;
    }
    if (!projectName.trim()) {
      setError("请填写项目名称");
      return;
    }
    setError(null);
    setPromptDraft(promptPreview);
    setPromptOpen(true);
  }

  async function generate(finalPrompt: string) {
    setIsGenerating(true);
    setError(null);
    try {
      const projectPayload = {
        body: JSON.stringify({
          description,
          modelProfileId: modelProfileId || null,
          name: projectName.trim(),
          references: projectReferences,
          settings: {
            aspectRatio,
            batchCount,
            cameraDistance,
            customInstructions,
            customStyle,
            customSystemControls,
            selectedSlotRoles,
            stylePreset,
            systemControls,
          },
        }),
        headers: { "Content-Type": "application/json" },
        method: linkedProjectId ? "PATCH" : "POST",
      };
      const projectResponse = await fetch(
        linkedProjectId
          ? `/api/tools/menswear/projects/${linkedProjectId}`
          : "/api/tools/menswear/projects",
        projectPayload,
      );
      const savedProject = (await projectResponse.json()) as { error?: string; project?: { id: string } };
      if (!projectResponse.ok || !savedProject.project) {
        throw new Error(savedProject.error || "保存男装项目失败");
      }
      setLinkedProjectId(savedProject.project.id);
      const response = await fetch(`/api/tools/menswear/projects/${savedProject.project.id}/generate`, {
        body: JSON.stringify({ aspectRatio, batchCount, cameraDistance, finalPrompt, quality }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string; results?: GeneratedResult[] };
      if (!response.ok) throw new Error(payload.error || "严格保真生图失败");
      setResults(payload.results ?? []);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "严格保真生图失败");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.4fr)]">
      <section className="grid gap-4">
        {/* 项目配置区 */}
        <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">项目名称</span>
            <input
              className="h-10 rounded-md border border-slate-200 px-3 text-sm"
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="例如：夏季校园衬衫"
              value={projectName}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">模特档案</span>
            <select
              className="h-10 rounded-md border border-slate-200 px-3 text-sm"
              onChange={(event) => setModelProfileId(event.target.value)}
              value={modelProfileId}
            >
              <option value="">系统生成模特</option>
              {profiles.filter((profile) => profile.status === "READY").map((profile) => (
                <option key={profile.id} value={profile.id}>{profile.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">图片风格</span>
            <select
              className="h-10 rounded-md border border-slate-200 px-3 text-sm"
              onChange={(event) => setStylePreset(event.target.value)}
              value={stylePreset}
            >
              {styleOptions.map((style) => <option key={style} value={style}>{style}</option>)}
            </select>
          </label>
          {stylePreset === "自定义" ? (
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">自定义风格</span>
              <input
                className="h-10 rounded-md border border-slate-200 px-3 text-sm"
                onChange={(event) => setCustomStyle(event.target.value)}
                placeholder="例如：低饱和胶片质感"
                value={customStyle}
              />
            </label>
          ) : null}
          <label className="grid gap-1.5 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">商品与画面描述</span>
            <textarea
              className="min-h-20 rounded-md border border-slate-200 px-3 py-2 text-sm leading-6"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="描述商品组合、目标人群和画面用途；商品细节以锁定素材为准。"
              value={description}
            />
          </label>
          <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 md:col-span-2 md:grid-cols-2">
            <div className="md:col-span-2">
              <p className="text-sm font-semibold text-slate-800">系统补全设置</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">未上传的画面元素按此处选择生成，保持真实、协调且符合整体风格。</p>
            </div>
            {(Object.keys(systemControlOptions) as Array<keyof SystemControls>).map((key) => (
              <label className="grid gap-1.5" key={key}>
                <span className="text-xs font-medium text-slate-700">{{ scene: "场景", pose: "姿势", lighting: "光线", mood: "氛围" }[key]}</span>
                <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" onChange={(event) => updateSystemControl(key, event.target.value)} value={systemControls[key]}>
                  {systemControlOptions[key].map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                {systemControls[key] === "自定义" ? <input className="h-9 rounded-md border border-slate-200 px-2 text-sm" onChange={(event) => setCustomSystemControls((current) => ({ ...current, [key]: event.target.value }))} placeholder="输入自定义要求" value={customSystemControls[key] || ""} /> : null}
              </label>
            ))}
          </div>
        </div>

        <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">选择需要上传或引用的素材</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">先勾选本次需要控制的商品或画面元素，下面只显示对应的上传框和素材库选择器。</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {allSlots.map((slot) => (
              <label className="flex min-h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm text-slate-700" key={slot.role}>
                <input checked={selectedSlotRoles.includes(slot.role)} disabled={slot.role === "top"} onChange={() => toggleSlot(slot.role)} type="checkbox" />
                {slot.label}
              </label>
            ))}
          </div>
        </section>

        <CollapsibleSection title="已选择的素材" defaultOpen count={selectedSlots.length}>
          <div className="grid gap-2">
            {selectedSlots.map((slot) => (
              <ReferenceSlot
                key={slot.role}
                label={slot.label}
                materials={materials}
                onChange={(reference) => updateReference(slot.role, reference)}
                onMaterialCreated={addUploadedMaterial}
                reference={references.find((reference) => reference.role === slot.role) ?? null}
                role={slot.role}
              />
            ))}
          </div>
        </CollapsibleSection>

        {/* 参数区 */}
        <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-5">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">比例</span>
            <select
              className="h-10 rounded-md border border-slate-200 px-3 text-sm"
              onChange={(event) => setAspectRatio(event.target.value as typeof aspectRatio)}
              value={aspectRatio}
            >
              <option value="portrait">竖图 3:4</option>
              <option value="square">方图 1:1</option>
              <option value="landscape">横图</option>
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">人物远近</span>
            <select
              className="h-10 rounded-md border border-slate-200 px-3 text-sm"
              onChange={(event) => setCameraDistance(event.target.value as MenswearCameraDistance)}
              value={cameraDistance}
            >
              {cameraDistanceOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">数量</span>
            <select
              className="h-10 rounded-md border border-slate-200 px-3 text-sm"
              onChange={(event) => setBatchCount(Number(event.target.value))}
              value={batchCount}
            >
              {[1, 2, 4, 6, 9, 12].map((count) => (
                <option key={count} value={count}>{count} 张</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">质量</span>
            <select
              className="h-10 rounded-md border border-slate-200 px-3 text-sm"
              onChange={(event) => setQuality(event.target.value as typeof quality)}
              value={quality}
            >
              <option value="low">低（快速）</option>
              <option value="medium">中（标准）</option>
              <option value="high">高（高清）</option>
            </select>
          </label>
          <div className="flex items-end">
            <Button
              className="w-full gap-2"
              disabled={isLoading || isProjectLoading || isGenerating}
              onClick={openPrompt}
              type="button"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isGenerating ? "生成中" : `生成 ${batchCount} 张`}
            </Button>
          </div>
          <label className="grid gap-1.5 md:col-span-5">
            <span className="text-sm font-medium text-slate-700">自定义补充</span>
            <textarea
              className="min-h-16 rounded-md border border-slate-200 px-3 py-2 text-sm leading-6"
              onChange={(event) => setCustomInstructions(event.target.value)}
              placeholder="例如：自然走路、不要文字、不改服装任何细节"
              value={customInstructions}
            />
          </label>
        </div>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        {/* 结果区 */}
        {results.length > 0 ? (
          <section className="grid gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-950">本次生成结果</h2>
              <Button asChild type="button" variant="secondary">
                <Link href="/tools/image-gallery?mode=menswear">打开图片画廊</Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((result, index) => <ResultCard key={`${result.imageUrl}-${index}`} result={result} />)}
            </div>
          </section>
        ) : null}
      </section>

      {/* 右侧提示词预览 - 可折叠，默认收起 */}
      <aside className="grid content-start gap-3 border-l border-slate-200 pl-0 xl:pl-5">
        <CollapsibleSection title="提示词预览" defaultOpen>
          <pre className="max-h-[500px] overflow-auto whitespace-pre-wrap text-sm leading-7 text-slate-700">{promptPreview}</pre>
          <p className="mt-3 text-sm leading-6 text-slate-500">服装、鞋包等锁定素材固定为 100% 保真；点击生成后可在弹窗中编辑最终提示词。</p>
        </CollapsibleSection>
      </aside>

      <PromptEditorDialog
        description="请确认或修改完整提示词，保存后才会创建项目并提交严格保真生图任务。"
        onClose={() => setPromptOpen(false)}
        onSave={generate}
        open={promptOpen}
        prompt={promptDraft}
        title="确认严格保真生图提示词"
      />
    </div>
  );
}

function CollapsibleSection({
  title,
  defaultOpen = false,
  count,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  count?: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{title}</span>
          {count !== undefined && count > 0 ? (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{count}</span>
          ) : null}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="border-t border-slate-200 p-3">{children}</div>
      ) : null}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      type="button"
      className="inline-flex shrink-0 items-center gap-1 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      onClick={handleCopy}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      <span className="text-xs">{copied ? "已复制" : "复制"}</span>
    </button>
  );
}

function ResultCard({ result }: { result: GeneratedResult }) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <a className="relative block aspect-[3/4] overflow-hidden bg-slate-50" href={result.imageUrl} rel="noreferrer" target="_blank">
        <Image alt={result.title} className="object-cover" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" src={result.imageUrl} unoptimized />
      </a>
      <div className="grid gap-2 p-3">
        <h3 className="text-sm font-bold text-slate-900">{result.title}</h3>
        {result.tags.length > 0 ? <div className="flex flex-wrap gap-1">{result.tags.map((tag) => <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600" key={tag}>{tag}</span>)}</div> : null}
        {result.caption ? <div className="flex items-start gap-1"><p className="flex-1 text-xs leading-5 text-slate-500">{result.caption}</p><CopyButton text={result.caption} /></div> : null}
        {result.productKeywords.length > 0 ? <p className="text-xs text-slate-400">选品关键词：{result.productKeywords.join("、")}</p> : null}
      </div>
    </article>
  );
}

function normalizeRestoredReferences(value: RestoredMenswearProject["references"]): DraftReference[] {
  return value.flatMap((reference) => {
    if (!reference.materialId || !reference.role) return [];
    return [{
      allowedChanges: Array.isArray(reference.allowedChanges) ? reference.allowedChanges : [],
      fidelity: Number.isFinite(reference.fidelity) ? reference.fidelity : 0,
      materialId: reference.materialId,
      policy: reference.policy,
      role: reference.role,
    }];
  });
}

function normalizeProjectSettings(value: unknown): {
  aspectRatio: "square" | "portrait" | "landscape";
  batchCount: number;
  cameraDistance: MenswearCameraDistance;
  customInstructions: string;
  customStyle: string;
  customSystemControls: Partial<SystemControls>;
  selectedSlotRoles: DraftReference["role"][];
  stylePreset: string;
  systemControls: SystemControls;
} {
  const settings = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const aspectRatio = settings.aspectRatio === "square" || settings.aspectRatio === "landscape"
    ? settings.aspectRatio
    : "portrait";
  const batchCount = [1, 2, 4, 6, 9, 12].includes(Number(settings.batchCount))
    ? Number(settings.batchCount)
    : 4;
  const cameraDistance = cameraDistanceOptions.some(([option]) => option === settings.cameraDistance)
    ? settings.cameraDistance as MenswearCameraDistance
    : "three_quarter";
  return {
    aspectRatio,
    batchCount,
    cameraDistance,
    customInstructions: typeof settings.customInstructions === "string"
      ? settings.customInstructions
      : "",
    customStyle: typeof settings.customStyle === "string" ? settings.customStyle : "",
    customSystemControls: normalizeSystemControls(settings.customSystemControls),
    selectedSlotRoles: Array.isArray(settings.selectedSlotRoles)
      ? settings.selectedSlotRoles.filter((role): role is DraftReference["role"] => allSlots.some((slot) => slot.role === role))
      : [],
    stylePreset: styleOptions.includes(settings.stylePreset as typeof styleOptions[number])
      ? settings.stylePreset as string
      : "自定义",
    systemControls: {
      ...defaultSystemControls,
      ...normalizeSystemControls(settings.systemControls),
    },
  };
}

function normalizeSystemControls(value: unknown): Partial<SystemControls> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  return (Object.keys(systemControlOptions) as Array<keyof SystemControls>).reduce<Partial<SystemControls>>((result, key) => {
    if (typeof source[key] === "string") result[key] = source[key];
    return result;
  }, {});
}

function adaptPromptGender(prompt: string, gender: "men" | "women") {
  return gender === "women" ? prompt.replaceAll("男装", "女装").replaceAll("男模特", "女模特") : prompt;
}
