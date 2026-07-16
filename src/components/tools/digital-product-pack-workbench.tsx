"use client";

import { Copy, FileText, ShieldAlert, Sparkles } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { recordWorkbenchAction } from "@/components/tools/workbench-action-recorder";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  buildDigitalProductPack,
  getDigitalProductPackPresets,
  type DigitalProductDeliveryFormat,
  type DigitalProductPriceTier,
  type DigitalProductTargetPlatform,
  type DigitalProductType,
} from "@/lib/digital-product-pack";

const inputClass =
  "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
const textareaClass =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

export function DigitalProductPackWorkbench() {
  const presets = useMemo(() => getDigitalProductPackPresets(), []);
  const [productType, setProductType] = useState<DigitalProductType>("ai-cover");
  const [targetPlatform, setTargetPlatform] = useState<DigitalProductTargetPlatform>("xianyu");
  const [priceTier, setPriceTier] = useState<DigitalProductPriceTier>("standard");
  const [deliveryFormat, setDeliveryFormat] =
    useState<DigitalProductDeliveryFormat>("markdown-excel-pdf");
  const [audience, setAudience] = useState("小红书博主和电商卖家");
  const [niche, setNiche] = useState("小红书封面、电商主图和商品换背景");
  const [includesAgentWorkflow, setIncludesAgentWorkflow] = useState(true);
  const [includesImageWorkflow, setIncludesImageWorkflow] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const output = useMemo(
    () =>
      buildDigitalProductPack({
        productType,
        targetPlatform,
        audience,
        niche,
        priceTier,
        deliveryFormat,
        includesAgentWorkflow,
        includesImageWorkflow,
      }),
    [
      audience,
      deliveryFormat,
      includesAgentWorkflow,
      includesImageWorkflow,
      niche,
      priceTier,
      productType,
      targetPlatform,
    ],
  );

  async function copyText(key: string, value: string) {
    await navigator.clipboard.writeText(value);
    void recordWorkbenchAction({
      toolId: "digital-product-pack",
      toolLabel: "资料包生成",
      actionLabel: "复制资料",
      title: `资料包：${output.productLabel}`,
      fields: [
        { label: "复制内容", value: packCopyLabel(key) },
        { label: "目标用户", value: audience },
        { label: "细分场景", value: niche },
        { label: "建议定价", value: `${output.price.label} · ${output.price.value}` },
      ],
      inputSnapshot: {
        productType,
        targetPlatform,
        priceTier,
        deliveryFormat,
        audience,
        niche,
        includesAgentWorkflow,
        includesImageWorkflow,
      },
      outputSummary: `${packCopyLabel(key)}已复制。`,
      outputSnapshot: {
        key,
        value,
        productLabel: output.productLabel,
      },
    });
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1200);
  }

  const fullMarkdown = useMemo(() => renderPackMarkdown(output), [output]);

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>资料包配置</CardTitle>
          <CardDescription>选择方向后生成闲鱼标题、详情页、交付清单和资料来源。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field label="资料方向">
            <OptionGrid
              options={presets.productTypes}
              selected={productType}
              onSelect={(value) => setProductType(value as DigitalProductType)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="目标平台">
              <select
                className={inputClass}
                onChange={(event) =>
                  setTargetPlatform(event.target.value as DigitalProductTargetPlatform)
                }
                value={targetPlatform}
              >
                {presets.targetPlatforms.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="价格档位">
              <select
                className={inputClass}
                onChange={(event) => setPriceTier(event.target.value as DigitalProductPriceTier)}
                value={priceTier}
              >
                {presets.priceTiers.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="交付格式">
            <select
              className={inputClass}
              onChange={(event) =>
                setDeliveryFormat(event.target.value as DigitalProductDeliveryFormat)
              }
              value={deliveryFormat}
            >
              {presets.deliveryFormats.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="目标用户">
            <textarea
              className={`${textareaClass} min-h-20`}
              onChange={(event) => setAudience(event.target.value)}
              value={audience}
            />
          </Field>

          <Field label="细分场景">
            <textarea
              className={`${textareaClass} min-h-20`}
              onChange={(event) => setNiche(event.target.value)}
              value={niche}
            />
          </Field>

          <div className="grid gap-2">
            <ToggleRow
              checked={includesAgentWorkflow}
              label="包含电商 Agent 工作流"
              onChange={setIncludesAgentWorkflow}
            />
            <ToggleRow
              checked={includesImageWorkflow}
              label="包含 AI 图片工作流"
              onChange={setIncludesImageWorkflow}
            />
          </div>

          <Button
            className="h-11 w-full gap-2"
            onClick={() => void copyText("all", fullMarkdown)}
            type="button"
          >
            <Copy aria-hidden="true" className="h-4 w-4" />
            {copiedKey === "all" ? "整包已复制" : "复制完整方案"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-5">
        <div className="grid gap-5 xl:grid-cols-3">
          <SummaryTile label="产品方向" value={output.productLabel} />
          <SummaryTile label="建议定价" value={`${output.price.label} · ${output.price.value}`} />
          <SummaryTile label="资料文件" value={`${output.fileStructure.length} 个交付项`} />
        </div>

        <ResultCard
          action={
            <CopyButton
              copied={copiedKey === "titles"}
              onClick={() => void copyText("titles", output.titleCandidates.join("\n"))}
            />
          }
          icon={<Sparkles aria-hidden="true" className="h-4 w-4 text-blue-600" />}
          title="闲鱼标题候选"
        >
          <div className="grid gap-2 md:grid-cols-2">
            {output.titleCandidates.map((title) => (
              <p
                className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-medium leading-6 text-slate-900"
                key={title}
              >
                {title}
              </p>
            ))}
          </div>
        </ResultCard>

        <ResultCard title="资料包目录">
          <div className="grid gap-2">
            {output.fileStructure.map((file) => (
              <div
                className="grid gap-1 rounded-md border border-slate-100 bg-white px-3 py-2"
                key={file.name}
              >
                <p className="text-sm font-semibold text-slate-950">{file.name}</p>
                <p className="text-sm leading-6 text-slate-600">{file.purpose}</p>
              </div>
            ))}
          </div>
        </ResultCard>

        <ResultCard
          action={
            <CopyButton
              copied={copiedKey === "detail"}
              onClick={() => void copyText("detail", output.detailPage)}
            />
          }
          icon={<FileText aria-hidden="true" className="h-4 w-4 text-emerald-600" />}
          title="详情页文案"
        >
          <pre className="whitespace-pre-wrap rounded-md bg-slate-950 p-4 text-sm leading-7 text-slate-100">
            {output.detailPage}
          </pre>
        </ResultCard>

        <div className="grid gap-5 xl:grid-cols-2">
          <ResultCard
            action={
              <CopyButton
                copied={copiedKey === "script"}
                onClick={() => void copyText("script", output.sellerScript)}
              />
            }
            title="客服话术"
          >
            <pre className="whitespace-pre-wrap rounded-md bg-slate-50 p-4 text-sm leading-7 text-slate-800">
              {output.sellerScript}
            </pre>
          </ResultCard>

          <ResultCard title="交付检查">
            <CheckList items={output.deliveryChecklist} />
          </ResultCard>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <ResultCard title="资料来源方向">
            <CheckList items={output.sourceChecklist} />
          </ResultCard>

          <ResultCard
            icon={<ShieldAlert aria-hidden="true" className="h-4 w-4 text-amber-600" />}
            title="风险提醒"
          >
            <CheckList items={output.riskNotes} variant="warning" />
          </ResultCard>
        </div>

        <ResultCard title="下一版扩展">
          <div className="flex flex-wrap gap-2">
            {output.nextIterationIdeas.map((item) => (
              <Badge key={item} variant="secondary">
                {item}
              </Badge>
            ))}
          </div>
        </ResultCard>
      </div>
    </div>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function OptionGrid({
  onSelect,
  options,
  selected,
}: {
  onSelect: (value: string) => void;
  options: Array<{ label: string; value: string; description: string }>;
  selected: string;
}) {
  return (
    <div className="grid gap-2">
      {options.map((item) => (
        <button
          className={[
            "rounded-md border px-3 py-2 text-left transition-colors",
            selected === item.value
              ? "border-blue-200 bg-blue-50"
              : "border-slate-200 bg-white hover:border-slate-300",
          ].join(" ")}
          key={item.value}
          onClick={() => onSelect(item.value)}
          type="button"
        >
          <span className="block text-sm font-semibold text-slate-950">{item.label}</span>
          <span className="mt-1 block text-xs leading-5 text-slate-600">{item.description}</span>
        </button>
      ))}
    </div>
  );
}

function ToggleRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <input
        checked={checked}
        className="h-4 w-4 accent-blue-600"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/80 p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-base font-semibold leading-6 text-slate-950">{value}</p>
    </div>
  );
}

function ResultCard({
  action,
  children,
  icon,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  icon?: ReactNode;
  title: string;
}) {
  return (
    <Card>
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          {action}
        </div>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}

function CopyButton({ copied, onClick }: { copied: boolean; onClick: () => void }) {
  return (
    <Button className="h-9 gap-2 px-3" onClick={onClick} type="button" variant="secondary">
      <Copy aria-hidden="true" className="h-4 w-4" />
      {copied ? "已复制" : "复制"}
    </Button>
  );
}

function CheckList({ items, variant = "default" }: { items: string[]; variant?: "default" | "warning" }) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div
          className={[
            "rounded-md border px-3 py-2 text-sm leading-6",
            variant === "warning"
              ? "border-amber-100 bg-amber-50 text-amber-800"
              : "border-slate-100 bg-slate-50 text-slate-700",
          ].join(" ")}
          key={item}
        >
          {item}
        </div>
      ))}
    </div>
  );
}

function renderPackMarkdown(output: ReturnType<typeof buildDigitalProductPack>) {
  return [
    `# ${output.productLabel}`,
    `目标用户：${output.audience}`,
    `细分场景：${output.niche}`,
    `建议定价：${output.price.label}，${output.price.value}`,
    "",
    "## 标题候选",
    ...output.titleCandidates.map((item) => `- ${item}`),
    "",
    "## 资料包目录",
    ...output.fileStructure.map((file) => `- ${file.name}：${file.purpose}`),
    "",
    "## 详情页文案",
    output.detailPage,
    "",
    "## 客服话术",
    output.sellerScript,
    "",
    "## 交付检查",
    ...output.deliveryChecklist.map((item) => `- ${item}`),
    "",
    "## 资料来源方向",
    ...output.sourceChecklist.map((item) => `- ${item}`),
    "",
    "## 风险提醒",
    ...output.riskNotes.map((item) => `- ${item}`),
  ].join("\n");
}

function packCopyLabel(key: string) {
  if (key === "all") return "完整方案";
  if (key === "titles") return "闲鱼标题候选";
  if (key === "detail") return "详情页文案";
  if (key === "script") return "客服话术";
  return "资料内容";
}
