"use client";

import { useState, type FormEvent } from "react";
import useSWR from "swr";
import {
  FlaskConical,
  KeyRound,
  Loader2,
  Pencil,
  Power,
  Trash2,
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

type AiModelConfig = {
  id: string;
  provider: string;
  displayName: string;
  baseUrl: string | null;
  model: string;
  apiKeyPreview: string;
  capabilities: string[];
  enabled: boolean;
  lastUsedAt?: string | null;
};

type ProviderPreset = {
  baseUrl: string;
  model: string;
  capabilities: string[];
};

const providerOptions = [
  ["openai-compatible", "OpenAI 兼容接口"],
  ["openai", "OpenAI"],
  ["openrouter", "OpenRouter"],
  ["anthropic", "Claude"],
  ["google", "Gemini"],
  ["aizhzo", "AIZHZO"],
  ["custom", "自定义接口"],
] as const;

const providerPresets: Record<string, ProviderPreset> = {
  "openai-compatible": {
    baseUrl: "https://api.openai.com",
    model: "gpt-4o-mini",
    capabilities: ["text", "vision"],
  },
  openai: {
    baseUrl: "https://api.openai.com",
    model: "gpt-4o-mini",
    capabilities: ["text", "vision"],
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api",
    model: "openai/gpt-4o-mini",
    capabilities: ["text", "vision"],
  },
  anthropic: {
    baseUrl: "https://api.anthropic.com",
    model: "claude-sonnet-4-5",
    capabilities: ["text"],
  },
  google: {
    baseUrl: "https://generativelanguage.googleapis.com",
    model: "gemini-2.5-pro",
    capabilities: ["text", "vision"],
  },
  aizhzo: {
    baseUrl: "https://api.aizhzo.com",
    model: "gpt-image-2",
    capabilities: ["image.generate", "image.edit"],
  },
  custom: { baseUrl: "", model: "", capabilities: ["text"] },
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

const emptyForm = {
  provider: "openai-compatible",
  displayName: "",
  baseUrl: providerPresets["openai-compatible"].baseUrl,
  model: providerPresets["openai-compatible"].model,
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

export function AiModelConfigManager() {
  const { data, error: loadError, isLoading, mutate } = useSWR(
    "/api/ai-model-configs",
    fetchModelConfigs,
  );
  const configs = data?.configs || [];
  const [form, setForm] = useState(emptyForm);
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([
    "text",
    "vision",
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  function resetForm() {
    setForm(emptyForm);
    setSelectedCapabilities(["text", "vision"]);
    setEditingId(null);
  }

  function changeProvider(provider: string) {
    const preset = providerPresets[provider] || providerPresets.custom;
    setForm((current) => ({
      ...current,
      provider,
      baseUrl: preset.baseUrl,
      model: preset.model,
    }));
    setSelectedCapabilities(preset.capabilities);
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
    setNotice(editingId ? "模型配置已更新" : "模型配置已保存");
    resetForm();
  }

  function startEdit(config: AiModelConfig) {
    setError("");
    setNotice("");
    setEditingId(config.id);
    setForm({
      provider: config.provider,
      displayName: config.displayName,
      baseUrl: config.baseUrl || "",
      model: config.model,
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
    await mutate();
  }

  function toggleCapability(value: string) {
    setSelectedCapabilities((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  return (
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
              <span className="text-sm font-medium text-slate-700">供应商</span>
              <select
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                onChange={(event) => changeProvider(event.target.value)}
                value={form.provider}
              >
                {providerOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <TextField label="配置名称" name="displayName" onChange={(value) => setForm((current) => ({ ...current, displayName: value }))} placeholder="例如：我的生图模型" value={form.displayName} />
            <TextField label="Base URL" name="baseUrl" onChange={(value) => setForm((current) => ({ ...current, baseUrl: value }))} placeholder="https://api.openai.com" value={form.baseUrl} />
            <TextField label="模型 ID" name="model" onChange={(value) => setForm((current) => ({ ...current, model: value }))} placeholder="gpt-4o-mini 或 gpt-image-2" value={form.model} />
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
  );
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
  return providerOptions.find(([key]) => key === value)?.[1] || value;
}

function usesBillableConnectionTest(config: AiModelConfig) {
  return !config.capabilities.includes("text") && !config.capabilities.includes("vision") && (config.capabilities.includes("image.generate") || config.capabilities.includes("image.edit"));
}
