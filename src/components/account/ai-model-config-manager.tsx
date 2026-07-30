"use client";

import { useState, type FormEvent } from "react";
import useSWR from "swr";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Eye,
  FlaskConical,
  ImageIcon,
  KeyRound,
  Loader2,
  Pencil,
  Power,
  Server,
  Sparkles,
  Trash2,
  Wand2,
  Wrench,
  X,
} from "lucide-react";
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
  aiInterfaceOptions,
  aiProviderPresetGroups,
  aiProviderPresets,
  findAiProviderPreset,
  findDefaultAiProviderPreset,
} from "@/lib/ai-provider-presets";

type AiModelConfig = {
  id: string;
  provider: string;
  displayName: string;
  baseUrl: string | null;
  model: string;
  chatPath?: string | null;
  imageGenerationPath?: string | null;
  imageEditPath?: string | null;
  apiKeyPreview: string;
  capabilities: string[];
  enabled: boolean;
  lastUsedAt?: string | null;
};

type ActiveAiModelSelection = {
  capability: string;
  source: "user" | "system" | "missing";
  id: string | null;
  provider: string | null;
  displayName: string;
  model: string | null;
  baseUrlHost: string | null;
  enabled: boolean;
  routeTargetType: "AUTO" | "SYSTEM" | "CREDENTIAL";
  routeCredentialId: string | null;
  routeStatus: "ok" | "fallback" | "missing";
  routeMessage: string | null;
  candidates: ActiveAiModelRouteCandidate[];
};

type ActiveAiModelRouteCandidate = {
  value: string;
  targetType: "AUTO" | "SYSTEM" | "CREDENTIAL";
  credentialId: string | null;
  label: string;
  source: "auto" | "system" | "user";
  provider: string | null;
  model: string | null;
  baseUrlHost: string | null;
};

type AiModelConfigForm = {
  provider: string;
  displayName: string;
  baseUrl: string;
  model: string;
  chatPath: string;
  imageGenerationPath: string;
  imageEditPath: string;
  apiKey: string;
};

const capabilityOptions = [
  ["text", "文本 / Agent"],
  ["vision", "图片识别"],
  ["image.generate", "文生图"],
  ["image.edit", "图生图 / 参考图"],
  ["audio.transcribe", "语音转文字"],
  ["audio.speech", "文字转语音"],
  ["embedding", "向量"],
  ["video.generate", "视频生成"],
  ["tools", "工具调用"],
] as const;

const emptyForm: AiModelConfigForm = {
  provider: "openai-compatible",
  displayName: "",
  baseUrl: findAiProviderPreset("openai-chat")?.baseUrl || "https://api.openai.com",
  model: findAiProviderPreset("openai-chat")?.model || "gpt-4o-mini",
  chatPath: findAiProviderPreset("openai-chat")?.chatPath || "/v1/chat/completions",
  imageGenerationPath:
    findAiProviderPreset("openai-chat")?.imageGenerationPath || "/v1/images/generations",
  imageEditPath: findAiProviderPreset("openai-chat")?.imageEditPath || "/v1/images/edits",
  apiKey: "",
};

async function fetchModelConfigs(url: string) {
  const response = await fetch(url);
  const payload = (await response.json().catch(() => ({}))) as {
    configs?: AiModelConfig[];
    error?: string;
  };

  if (!response.ok) throw new Error(payload.error || "模型配置加载失败");
  return { configs: payload.configs || [] };
}

async function fetchActiveModelSelections(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json().catch(() => ({}))) as {
    selections?: ActiveAiModelSelection[];
    error?: string;
  };

  if (!response.ok) throw new Error(payload.error || "当前模型加载失败");
  return { selections: payload.selections || [] };
}

export function AiModelConfigManager() {
  const { data, error: loadError, isLoading, mutate } = useSWR(
    "/api/ai-model-configs",
    fetchModelConfigs,
  );
  const {
    data: activeData,
    error: activeLoadError,
    mutate: mutateActive,
  } = useSWR("/api/ai-model-configs/active", fetchActiveModelSelections);
  const configs = data?.configs || [];
  const activeSelections = activeData?.selections || [];
  const [form, setForm] = useState(emptyForm);
  const [selectedPresetId, setSelectedPresetId] = useState("openai-chat");
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([
    "text",
    "vision",
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [activeTestingCapability, setActiveTestingCapability] = useState<string | null>(null);
  const [routingCapability, setRoutingCapability] = useState<string | null>(null);
  const selectedPreset = findAiProviderPreset(selectedPresetId);

  function resetForm() {
    setForm(emptyForm);
    setSelectedPresetId("openai-chat");
    setSelectedCapabilities(["text", "vision"]);
    setEditingId(null);
  }

  function changeProvider(provider: string) {
    const preset =
      findDefaultAiProviderPreset(provider as typeof aiInterfaceOptions[number][0]) ||
      findAiProviderPreset("custom");
    setForm((current) => ({
      ...current,
      provider,
      baseUrl: preset?.baseUrl || "",
      model: preset?.model || "",
      chatPath: preset?.chatPath || "",
      imageGenerationPath: preset?.imageGenerationPath || "",
      imageEditPath: preset?.imageEditPath || "",
    }));
    setSelectedPresetId("");
    setSelectedCapabilities([...(preset?.capabilities || ["text"])]);
  }

  function applyVendorPreset(presetId: string) {
    const preset = findAiProviderPreset(presetId);

    setSelectedPresetId(presetId);
    if (!preset) return;

    setForm((current) => ({
      ...current,
      provider: preset.provider,
      displayName: preset.displayName,
      baseUrl: preset.baseUrl,
      model: preset.model,
      chatPath: preset.chatPath,
      imageGenerationPath: preset.imageGenerationPath,
      imageEditPath: preset.imageEditPath,
    }));
    setSelectedCapabilities([...preset.capabilities]);
  }

  async function submitConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSaving(true);

    const response = await fetch(
      editingId ? `/api/ai-model-configs/${editingId}` : "/api/ai-model-configs",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, capabilities: selectedCapabilities }),
      },
    );
    const payload = (await response.json().catch(() => ({}))) as {
      config?: AiModelConfig;
      error?: string;
    };
    setIsSaving(false);

    if (!response.ok || !payload.config) {
      setError(payload.error || "模型配置保存失败");
      return;
    }

    await mutate(
      {
        configs: editingId
          ? configs.map((config) => (config.id === payload.config?.id ? payload.config : config))
          : [payload.config, ...configs],
      },
      false,
    );
    await mutateActive();
    setNotice(editingId ? "模型配置已更新" : "模型配置已保存");
    resetForm();
  }

  function startEdit(config: AiModelConfig) {
    setError("");
    setNotice("");
    setEditingId(config.id);
    setSelectedPresetId("");
    setForm({
      provider: config.provider,
      displayName: config.displayName,
      baseUrl: config.baseUrl || "",
      model: config.model,
      chatPath: config.chatPath || findAiProviderPreset("custom")?.chatPath || "/v1/chat/completions",
      imageGenerationPath:
        config.imageGenerationPath || findAiProviderPreset("custom")?.imageGenerationPath || "/v1/images/generations",
      imageEditPath: config.imageEditPath || findAiProviderPreset("custom")?.imageEditPath || "/v1/images/edits",
      apiKey: "",
    });
    setSelectedCapabilities(config.capabilities);
  }

  async function updateConfig(config: AiModelConfig, values: Partial<AiModelConfig>) {
    setError("");
    const response = await fetch(`/api/ai-model-configs/${config.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: values.provider ?? config.provider,
        displayName: values.displayName ?? config.displayName,
        baseUrl: values.baseUrl ?? config.baseUrl ?? "",
        model: values.model ?? config.model,
        chatPath: values.chatPath ?? config.chatPath ?? "",
        imageGenerationPath:
          values.imageGenerationPath ?? config.imageGenerationPath ?? "",
        imageEditPath: values.imageEditPath ?? config.imageEditPath ?? "",
        apiKey: "",
        capabilities: values.capabilities ?? config.capabilities,
        enabled: values.enabled ?? config.enabled,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      config?: AiModelConfig;
      error?: string;
    };

    if (!response.ok || !payload.config) {
      setError(payload.error || "模型配置更新失败");
      return;
    }

    await mutate(
      { configs: configs.map((item) => (item.id === payload.config?.id ? payload.config : item)) },
      false,
    );
    await mutateActive();
  }

  async function deleteConfig(id: string) {
    setError("");
    const response = await fetch(`/api/ai-model-configs/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error || "模型配置删除失败");
      return;
    }
    await mutate({ configs: configs.filter((config) => config.id !== id) }, false);
    await mutateActive();
    if (editingId === id) resetForm();
  }

  async function testConfig(config: AiModelConfig) {
    setError("");
    setNotice("");
    setTestingId(config.id);
    const response = await fetch(`/api/ai-model-configs/${config.id}/test`, { method: "POST" });
    const payload = (await response.json().catch(() => ({}))) as {
      capability?: string;
      error?: string;
    };
    setTestingId(null);

    if (!response.ok) {
      setError(payload.error || "模型连接测试失败");
      return;
    }
    setNotice(`${config.displayName} 连接正常，已验证 ${capabilityLabel(payload.capability || "")}`);
    await Promise.all([mutate(), mutateActive()]);
  }

  async function updateRoute(capability: string, value: string) {
    const route = parseRouteValue(value);

    setError("");
    setNotice("");
    setRoutingCapability(capability);
    const response = await fetch("/api/ai-model-configs/routes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        capability,
        targetType: route.targetType,
        credentialId: route.credentialId,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      selections?: ActiveAiModelSelection[];
      error?: string;
    };
    setRoutingCapability(null);

    if (!response.ok || !payload.selections) {
      setError(payload.error || "当前生效模型切换失败");
      await mutateActive();
      return;
    }

    await mutateActive({ selections: payload.selections }, false);
    setNotice(`${capabilityLabel(capability)} 已切换模型`);
  }

  async function testActiveCapability(capability: string) {
    setError("");
    setNotice("");
    setActiveTestingCapability(capability);
    const response = await fetch("/api/ai-model-configs/active/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ capability }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      displayName?: string;
      model?: string;
      error?: string;
    };
    setActiveTestingCapability(null);

    if (!response.ok) {
      setError(payload.error || "当前模型测试失败");
      return;
    }

    setNotice(
      `${capabilityLabel(capability)} 当前路由真实请求成功：${payload.displayName || "当前模型"} / ${payload.model || ""}`,
    );
    await Promise.all([mutate(), mutateActive()]);
  }

  function toggleCapability(value: string) {
    setSelectedCapabilities((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  return (
    <div className="grid gap-5">
      <CurrentModelPanel
        error={activeLoadError instanceof Error ? activeLoadError.message : ""}
        activeTestingCapability={activeTestingCapability}
        onRouteChange={(capability, value) => void updateRoute(capability, value)}
        onTestCapability={(capability) => void testActiveCapability(capability)}
        routingCapability={routingCapability}
        selections={activeSelections}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,420px)_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "编辑模型" : "新增模型"}</CardTitle>
          <CardDescription>
            Key 只加密保存在服务端。保存后不会回显明文；更换 Key 时再填写即可。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={submitConfig}>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">厂商预设</span>
              <select
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                onChange={(event) => applyVendorPreset(event.target.value)}
                value={selectedPresetId}
              >
                <option value="">不使用预设，手动配置</option>
                {aiProviderPresetGroups.map((group) => {
                  const groupPresets = aiProviderPresets.filter(
                    (preset) => preset.group === group,
                  );

                  if (groupPresets.length === 0) return null;

                  return (
                    <optgroup key={group} label={group}>
                      {groupPresets.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.label}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              <p className="text-xs leading-5 text-slate-500">
                {selectedPreset
                  ? selectedPreset.description
                  : "适合厂商文档有特殊域名、路径或模型名时使用。下面每个字段都可以修改。"}
              </p>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">底层接口类型</span>
              <select
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                onChange={(event) => changeProvider(event.target.value)}
                value={form.provider}
              >
                {aiInterfaceOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <p className="text-xs leading-5 text-slate-500">
                国内外大多数厂商选择 OpenAI 兼容接口即可；Claude 原生、Gemini 原生只有服务端已适配的文本调用。
              </p>
            </label>
            <TextField label="配置名称" name="displayName" onChange={(value) => setForm((current) => ({ ...current, displayName: value }))} placeholder="例如：我的生图模型" value={form.displayName} />
            <TextField label="Base URL" name="baseUrl" onChange={(value) => setForm((current) => ({ ...current, baseUrl: value }))} placeholder="https://api.openai.com" value={form.baseUrl} />
            <TextField label="模型 ID" name="model" onChange={(value) => setForm((current) => ({ ...current, model: value }))} placeholder="gpt-4o-mini 或 gpt-image-2" value={form.model} />
            <fieldset className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <legend className="px-1 text-sm font-medium text-slate-700">高级接口路径</legend>
              <TextField label="聊天 / 视觉接口路径" name="chatPath" onChange={(value) => setForm((current) => ({ ...current, chatPath: value }))} placeholder="/v1/chat/completions" required={false} value={form.chatPath} />
              <TextField label="文生图接口路径" name="imageGenerationPath" onChange={(value) => setForm((current) => ({ ...current, imageGenerationPath: value }))} placeholder="/v1/images/generations" required={false} value={form.imageGenerationPath} />
              <TextField label="图生图接口路径" name="imageEditPath" onChange={(value) => setForm((current) => ({ ...current, imageEditPath: value }))} placeholder="/v1/images/edits" required={false} value={form.imageEditPath} />
              <p className="text-xs leading-5 text-slate-500">
                OpenAI 兼容接口通常保持默认即可；如果厂商文档给的是完整地址，请把域名填到 Base URL，把后面的路径填在这里。
              </p>
            </fieldset>
            <TextField label={editingId ? "替换 API Key（留空则保留原 Key）" : "API Key"} name="apiKey" onChange={(value) => setForm((current) => ({ ...current, apiKey: value }))} placeholder="粘贴供应商 API Key" required={!editingId} type="password" value={form.apiKey} />

            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium text-slate-700">这个模型可以做什么</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {capabilityOptions.map(([value, label]) => (
                  <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" key={value}>
                    <input checked={selectedCapabilities.includes(value)} onChange={() => toggleCapability(value)} type="checkbox" />
                    {label}
                  </label>
                ))}
              </div>
              <p className="text-xs leading-5 text-slate-500">文生图、图生图需要供应商提供 OpenAI 兼容图片接口。不要给不支持图片的模型勾选这两项。</p>
            </fieldset>

            {error || loadError ? <StatusMessage tone="error">{error || (loadError instanceof Error ? loadError.message : "模型配置加载失败")}</StatusMessage> : null}
            {notice ? <StatusMessage tone="success">{notice}</StatusMessage> : null}

            <div className="flex flex-wrap gap-2">
              <Button className="h-11 gap-2" disabled={isSaving} type="submit">
                {isSaving ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <KeyRound aria-hidden="true" className="h-4 w-4" />}
                {editingId ? "保存修改" : "保存模型"}
              </Button>
              {editingId ? <Button className="h-11" onClick={resetForm} type="button" variant="secondary"><X aria-hidden="true" className="mr-2 h-4 w-4" />取消编辑</Button> : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>已保存模型</CardTitle>
          <CardDescription>AI 功能会按所需能力优先使用你的已启用配置；缺少能力时才使用系统默认配置。</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />加载中</div> : null}
          {!isLoading && configs.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">暂无模型配置。添加后可以立即用于生图、识图和 Agent。</div> : null}
          <div className="grid gap-3">
            {configs.map((config) => <article className="rounded-lg border border-slate-200 bg-white p-4" key={config.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-950">{config.displayName}</h3><Badge variant={config.enabled ? "success" : "secondary"}>{config.enabled ? "启用" : "停用"}</Badge></div>
                  <p className="mt-2 text-sm text-slate-600">{providerLabel(config.provider)} / {config.model}</p>
                  <p className="mt-1 text-xs text-slate-500">Key：{config.apiKeyPreview}{config.lastUsedAt ? `  最近验证或使用：${new Date(config.lastUsedAt).toLocaleString("zh-CN")}` : ""}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => startEdit(config)} type="button" variant="secondary"><Pencil aria-hidden="true" className="mr-2 h-4 w-4" />编辑</Button>
                  <Button disabled={!config.enabled || testingId === config.id} onClick={() => void testConfig(config)} type="button" variant="secondary"><FlaskConical aria-hidden="true" className={`mr-2 h-4 w-4 ${testingId === config.id ? "animate-pulse" : ""}`} />{testingId === config.id ? "测试中" : "测试连接"}</Button>
                  <Button onClick={() => void updateConfig(config, { enabled: !config.enabled })} type="button" variant="secondary"><Power aria-hidden="true" className="mr-2 h-4 w-4" />{config.enabled ? "停用" : "启用"}</Button>
                  <Button onClick={() => void deleteConfig(config.id)} type="button" variant="danger"><Trash2 aria-hidden="true" className="mr-2 h-4 w-4" />删除</Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">{config.capabilities.map((capability) => <Badge key={capability} variant="secondary">{capabilityLabel(capability)}</Badge>)}</div>
              {usesBillableConnectionTest(config) ? <p className="mt-3 text-xs text-amber-700">此配置仅含图片能力，测试连接会请求一张最低质量测试图，并可能消耗供应商额度。</p> : null}
            </article>)}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

function CurrentModelPanel({
  activeTestingCapability,
  error,
  onRouteChange,
  onTestCapability,
  routingCapability,
  selections,
}: {
  activeTestingCapability: string | null;
  error: string;
  onRouteChange: (capability: string, value: string) => void;
  onTestCapability: (capability: string) => void;
  routingCapability: string | null;
  selections: ActiveAiModelSelection[];
}) {
  const visibleCapabilities = [
    "text",
    "vision",
    "image.generate",
    "image.edit",
    "tools",
  ];
  const visibleSelections = visibleCapabilities.map(
    (capability) =>
      selections.find((item) => item.capability === capability) || {
        capability,
        source: "missing" as const,
        id: null,
        provider: null,
        displayName: "未配置",
        model: null,
        baseUrlHost: null,
        enabled: false,
        routeTargetType: "AUTO" as const,
        routeCredentialId: null,
        routeStatus: "missing" as const,
        routeMessage: "当前能力没有可用模型",
        candidates: [{ value: "AUTO", targetType: "AUTO" as const, credentialId: null, label: "自动选择（你的模型优先）", source: "auto" as const, provider: null, model: null, baseUrlHost: null }],
      },
  );
  const healthyCount = visibleSelections.filter(
    (selection) => selection.routeStatus === "ok",
  ).length;

  return (
    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-blue-100">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              实时路由
            </div>
            <CardTitle className="mt-4 text-2xl text-white">当前生效模型</CardTitle>
            <CardDescription className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
              每个能力单独选择模型，保存后下一次 Agent、识图、生图、图生图会立即生效。API Key 只在服务端加密保存，不会回传浏览器。
            </CardDescription>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-right">
            <p className="text-2xl font-semibold">{healthyCount}/{visibleSelections.length}</p>
            <p className="mt-1 text-xs text-blue-100">能力可用</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleSelections.map((selection) => {
            const selectedValue = routeValueForSelection(selection);
            const hasSelectedCandidate = selection.candidates.some(
              (candidate) => candidate.value === selectedValue,
            );
            const isRouting = routingCapability === selection.capability;
            const isTesting = activeTestingCapability === selection.capability;
            const Icon = capabilityIcon(selection.capability);
            const isHealthy = selection.routeStatus === "ok";
            const canTest = canTestCapability(selection.capability);

            return (
            <div
              className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm transition hover:border-blue-200 hover:bg-white hover:shadow-md"
              key={selection.capability}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-white text-blue-700">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-slate-950">
                      {capabilityLabel(selection.capability)}
                    </h3>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {routeModeLabel(selection.routeTargetType)}
                    </p>
                  </div>
                </div>
                <span
                  className={
                    isHealthy
                      ? "inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                      : "inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
                  }
                >
                  {isHealthy ? (
                    <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
                  ) : (
                    <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />
                  )}
                  {selection.routeStatus === "fallback" ? "临时兜底" : activeSourceLabel(selection.source)}
                </span>
              </div>
              <label className="mt-4 grid min-w-0 gap-1.5">
                <span className="text-xs font-medium text-slate-500">使用模型</span>
                <select
                  className="h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-wait disabled:bg-slate-100"
                  disabled={isRouting}
                  onChange={(event) => onRouteChange(selection.capability, event.target.value)}
                  value={selectedValue}
                >
                  {!hasSelectedCandidate ? (
                    <option disabled value={selectedValue}>当前已选模型不可用</option>
                  ) : null}
                  {selection.candidates.map((candidate) => (
                    <option key={candidate.value} value={candidate.value}>
                      {candidate.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Server aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
                  <p className="truncate text-sm font-medium text-slate-800">
                    {selection.displayName}
                  </p>
                </div>
                <div className="mt-2 grid gap-1 text-xs leading-5 text-slate-500">
                  <p className="truncate">{selection.model || "暂无模型"}</p>
                  {selection.baseUrlHost ? (
                    <p className="truncate text-slate-400">{selection.baseUrlHost}</p>
                  ) : null}
                </div>
              </div>
              {selection.routeMessage ? (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
                  {selection.routeMessage}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  className="h-9 gap-2"
                  disabled={!canTest || isTesting || selection.source === "missing"}
                  onClick={() => onTestCapability(selection.capability)}
                  type="button"
                  variant="secondary"
                >
                  {isTesting ? (
                    <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                  ) : (
                    <FlaskConical aria-hidden="true" className="h-4 w-4" />
                  )}
                  {isTesting ? "真实测试中" : "测试当前路由"}
                </Button>
                {!canTest ? (
                  <span className="text-xs text-slate-400">此能力需在具体功能内验证</span>
                ) : null}
              </div>
              {isRouting ? (
                <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                  <Loader2 aria-hidden="true" className="h-3 w-3 animate-spin" />
                  切换中
                </p>
              ) : null}
            </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function capabilityIcon(value: string) {
  if (value === "text") return Bot;
  if (value === "vision") return Eye;
  if (value === "image.generate") return ImageIcon;
  if (value === "image.edit") return Wand2;
  if (value === "tools") return Wrench;
  return Sparkles;
}

function canTestCapability(value: string) {
  return ["text", "vision", "image.generate", "image.edit"].includes(value);
}

function TextField({ label, name, onChange, placeholder, required = true, type = "text", value }: { label: string; name: string; onChange: (value: string) => void; placeholder: string; required?: boolean; type?: string; value: string }) {
  return <label className="grid gap-2"><span className="text-sm font-medium text-slate-700">{label}</span><input className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" name={name} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} type={type} value={value} /></label>;
}

function StatusMessage({ children, tone }: { children: React.ReactNode; tone: "error" | "success" }) {
  return <div className={tone === "error" ? "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" : "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"}>{children}</div>;
}

function capabilityLabel(value: string) {
  return capabilityOptions.find(([key]) => key === value)?.[1] || value;
}

function providerLabel(value: string) {
  return aiInterfaceOptions.find(([key]) => key === value)?.[1] || value;
}

function activeSourceLabel(value: ActiveAiModelSelection["source"]) {
  if (value === "user") return "你的配置";
  if (value === "system") return "系统默认";
  return "缺少配置";
}

function routeModeLabel(value: ActiveAiModelSelection["routeTargetType"]) {
  if (value === "CREDENTIAL") return "指定模型";
  if (value === "SYSTEM") return "系统默认";
  return "自动选择";
}

function usesBillableConnectionTest(config: AiModelConfig) {
  return !config.capabilities.includes("text") && !config.capabilities.includes("vision") && (config.capabilities.includes("image.generate") || config.capabilities.includes("image.edit"));
}

function parseRouteValue(value: string) {
  if (value.startsWith("CREDENTIAL:")) {
    return {
      targetType: "CREDENTIAL" as const,
      credentialId: value.slice("CREDENTIAL:".length),
    };
  }

  return {
    targetType: value === "SYSTEM" ? "SYSTEM" as const : "AUTO" as const,
    credentialId: null,
  };
}

function routeValueForSelection(selection: ActiveAiModelSelection) {
  if (selection.routeTargetType === "CREDENTIAL") {
    return `CREDENTIAL:${selection.routeCredentialId || ""}`;
  }

  return selection.routeTargetType;
}
