"use client";

import { useState, type FormEvent } from "react";
import useSWR from "swr";
import { KeyRound, Loader2, Trash2 } from "lucide-react";
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
};

const providerOptions = [
  ["openai-compatible", "OpenAI 兼容"],
  ["openai", "OpenAI"],
  ["openrouter", "OpenRouter"],
  ["anthropic", "Claude"],
  ["google", "Gemini"],
  ["aizhzo", "AIZHZO"],
  ["custom", "自定义"],
];

const capabilityOptions = [
  ["text", "文本"],
  ["vision", "视觉"],
  ["image.generate", "文生图"],
  ["image.edit", "图生图/编辑"],
  ["audio.transcribe", "语音转文字"],
  ["audio.speech", "文字转语音"],
  ["embedding", "向量"],
  ["video.generate", "视频生成"],
  ["tools", "工具调用"],
];

async function fetchModelConfigs(url: string) {
  const response = await fetch(url);
  const payload = (await response.json().catch(() => ({}))) as {
    configs?: AiModelConfig[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || "模型配置加载失败");
  }

  return { configs: payload.configs || [] };
}

export function AiModelConfigManager() {
  const {
    data,
    error: loadError,
    isLoading,
    mutate,
  } = useSWR("/api/ai-model-configs", fetchModelConfigs);
  const configs = data?.configs || [];
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([
    "text",
  ]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function submitConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/ai-model-configs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: formData.get("provider"),
        displayName: formData.get("displayName"),
        baseUrl: formData.get("baseUrl"),
        model: formData.get("model"),
        apiKey: formData.get("apiKey"),
        capabilities: selectedCapabilities,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      config?: AiModelConfig;
      error?: string;
    };

    setIsSaving(false);

    if (!response.ok || !payload.config) {
      setError(payload.error || "模型配置保存失败");
      return;
    }

    await mutate({ configs: [payload.config, ...configs] }, false);
    event.currentTarget.reset();
    setSelectedCapabilities(["text"]);
  }

  async function deleteConfig(id: string) {
    const response = await fetch(`/api/ai-model-configs/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      setError(payload.error || "模型配置删除失败");
      return;
    }

    await mutate(
      { configs: configs.filter((config) => config.id !== id) },
      false,
    );
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
          <CardTitle>新增模型</CardTitle>
          <CardDescription>
            API Key 只会加密保存在服务端，页面不会回显明文。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={submitConfig}>
            <SelectField label="供应商" name="provider" options={providerOptions} />
            <TextField label="配置名称" name="displayName" placeholder="我的 GPT" />
            <TextField
              label="Base URL"
              name="baseUrl"
              placeholder="https://api.openai.com"
            />
            <TextField label="模型 ID" name="model" placeholder="gpt-4o-mini" />
            <TextField
              label="API Key"
              name="apiKey"
              placeholder="粘贴供应商 API Key"
              type="password"
            />

            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium text-slate-700">
                模型能力
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {capabilityOptions.map(([value, label]) => (
                  <label
                    className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    key={value}
                  >
                    <input
                      checked={selectedCapabilities.includes(value)}
                      onChange={() => toggleCapability(value)}
                      type="checkbox"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            {error || loadError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error || (loadError instanceof Error ? loadError.message : "模型配置加载失败")}
              </div>
            ) : null}

            <Button className="h-11 gap-2" disabled={isSaving} type="submit">
              {isSaving ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound aria-hidden="true" className="h-4 w-4" />
              )}
              保存模型
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>已保存模型</CardTitle>
          <CardDescription>
            业务功能会按能力选择可用模型；同能力下优先使用最新保存的配置。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              加载中
            </div>
          ) : configs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              暂无模型配置
            </div>
          ) : (
            <div className="grid gap-3">
              {configs.map((config) => (
                <article
                  className="rounded-lg border border-slate-200 bg-white p-4"
                  key={config.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-950">
                          {config.displayName}
                        </h3>
                        <Badge variant={config.enabled ? "success" : "secondary"}>
                          {config.enabled ? "启用" : "停用"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        {config.provider} / {config.model}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Key：{config.apiKeyPreview}
                      </p>
                    </div>
                    <Button
                      onClick={() => void deleteConfig(config.id)}
                      type="button"
                      variant="danger"
                    >
                      <Trash2 aria-hidden="true" className="mr-2 h-4 w-4" />
                      删除
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {config.capabilities.map((capability) => (
                      <Badge key={capability} variant="secondary">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TextField({
  label,
  name,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        name={name}
        placeholder={placeholder}
        required={name !== "baseUrl"}
        type={type}
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: string[][];
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        name={name}
      >
        {options.map(([value, labelText]) => (
          <option key={value} value={value}>
            {labelText}
          </option>
        ))}
      </select>
    </label>
  );
}
