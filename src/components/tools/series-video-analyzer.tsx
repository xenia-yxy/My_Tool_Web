"use client";

import {
  ClipboardCopy,
  FileText,
  Info,
  Lightbulb,
  LineChart,
  LinkIcon,
  ListChecks,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { recordWorkbenchAction } from "@/components/tools/workbench-action-recorder";
import {
  analyzeSeriesVideo,
  buildSeriesVideoReport,
  detectVideoPlatform,
  seriesVideoPlatformLabels,
  type SeriesVideoInput,
  type SeriesVideoMetrics,
  type SeriesVideoPlatform,
} from "@/lib/series-video-analyzer";

type PlatformChoice = "auto" | SeriesVideoPlatform;

type VideoFormState = {
  accountType: string;
  contentSummary: string;
  durationSeconds: string;
  episode: string;
  link: string;
  niche: string;
  platform: PlatformChoice;
  publishedAt: string;
  title: string;
};

type MetricField = keyof SeriesVideoMetrics;

const metricLabels: Array<{
  helper: string;
  id: MetricField;
  label: string;
  purpose: string;
  suffix?: string;
}> = [
  {
    helper: "后台显示的播放量，决定这条内容是否获得基础分发。",
    id: "views",
    label: "播放量",
    purpose: "判断标题、封面、开头和平台初始推荐是否有效。",
  },
  {
    helper: "点赞数量，代表轻量认可。",
    id: "likes",
    label: "点赞",
    purpose: "判断观众是否认可这条内容的情绪或观点。",
  },
  {
    helper: "评论数量，代表讨论意愿。",
    id: "comments",
    label: "评论",
    purpose: "判断选题是否有争议、共鸣或继续追问空间。",
  },
  {
    helper: "收藏数量，代表后续复看价值。",
    id: "favorites",
    label: "收藏",
    purpose: "判断内容是否有方法、避坑、清单或参考价值。",
  },
  {
    helper: "转发数量，代表传播意愿。",
    id: "shares",
    label: "转发",
    purpose: "判断内容是否适合被推荐给同类人群。",
  },
  {
    helper: "这条视频带来的新增粉丝。",
    id: "followersGained",
    label: "涨粉",
    purpose: "判断观众是否记住你，而不只是看完这条内容。",
  },
  {
    helper: "填写 0-100，超过 100 会自动按 100 处理。",
    id: "completionRate",
    label: "完播率",
    purpose: "判断前 3 秒、中段节奏和视频长度是否合理。",
    suffix: "%",
  },
  {
    helper: "后台显示的平均观看秒数。",
    id: "averageWatchSeconds",
    label: "平均观看",
    purpose: "结合视频时长判断观众大概在哪个阶段流失。",
    suffix: "秒",
  },
];

const videoParameterGroups = [
  {
    items: [
      "视频链接：用于识别平台和保留复盘素材，不依赖平台抓取。",
      "平台：自动识别不准时可手动选择，影响平台标签和报告描述。",
      "赛道：用于生成赛道判断、标题候选和下一条方向。",
    ],
    title: "基础定位",
  },
  {
    items: [
      "系列期数：帮助区分第几次实验，适合做连续追踪。",
      "标题：用于判断点击理由是否明确，也会进入复制报告。",
      "内容简述：写清楚过程、冲突和结论，便于判断问题在选题还是结构。",
    ],
    title: "内容语境",
  },
  {
    items: [
      "播放：看分发和点击基础。",
      "互动：看共鸣、讨论、收藏和传播。",
      "涨粉与完播：看人设记忆点和内容留存。",
    ],
    title: "数据判断",
  },
];

const platformOptions: Array<{ label: string; value: PlatformChoice }> = [
  { label: "自动识别", value: "auto" },
  { label: "抖音", value: "douyin" },
  { label: "小红书", value: "xiaohongshu" },
  { label: "B站", value: "bilibili" },
  { label: "其他平台", value: "other" },
];

const initialVideoForm: VideoFormState = {
  accountType: "",
  contentSummary: "",
  durationSeconds: "",
  episode: "",
  link: "",
  niche: "",
  platform: "auto",
  publishedAt: "",
  title: "",
};

const initialMetrics: Record<MetricField, string> = {
  averageWatchSeconds: "",
  comments: "",
  completionRate: "",
  favorites: "",
  followersGained: "",
  likes: "",
  shares: "",
  views: "",
};

export function SeriesVideoAnalyzer() {
  const [videoForm, setVideoForm] = useState(initialVideoForm);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const [submittedInput, setSubmittedInput] = useState<SeriesVideoInput | null>(
    null,
  );

  const analysisInput = useMemo<SeriesVideoInput>(() => {
    const selectedPlatform =
      videoForm.platform === "auto" ? undefined : videoForm.platform;

    return {
      accountType: emptyToUndefined(videoForm.accountType),
      contentSummary: emptyToUndefined(videoForm.contentSummary),
      durationSeconds: parseOptionalNumber(videoForm.durationSeconds),
      episode: parseOptionalNumber(videoForm.episode),
      link: emptyToUndefined(videoForm.link),
      metrics: parseMetrics(metrics),
      niche: emptyToUndefined(videoForm.niche),
      platform: selectedPlatform,
      publishedAt: emptyToUndefined(videoForm.publishedAt),
      title: emptyToUndefined(videoForm.title),
    };
  }, [metrics, videoForm]);

  const analysis = useMemo(
    () => (submittedInput ? analyzeSeriesVideo(submittedInput) : null),
    [submittedInput],
  );
  const report = useMemo(
    () => (analysis ? buildSeriesVideoReport(analysis) : ""),
    [analysis],
  );
  const detectedPlatform = detectVideoPlatform(videoForm.link);
  const formulaRows = useMemo(
    () =>
      analysis
        ? [
      {
        label: "互动率",
        value: formatRate(analysis.derivedMetrics.interactionRate),
        detail: "点赞 + 评论 + 收藏 + 转发，再除以播放量",
      },
      {
        label: "涨粉率",
        value: formatRate(analysis.derivedMetrics.followerRate),
        detail: "新增粉丝除以播放量，判断人设承接",
      },
      {
        label: "收藏率",
        value: formatRate(analysis.derivedMetrics.favoriteRate),
        detail: "收藏除以播放量，判断复看和实用价值",
      },
      {
        label: "完播率",
        value: formatRate(analysis.metrics.completionRate / 100),
        detail: "后台完播率，判断开头和中段留存",
      },
    ]
        : [],
    [analysis],
  );

  function runAnalysis() {
    setSubmittedInput(analysisInput);
    setCopyState("idle");
  }

  async function copyReport() {
    if (!analysis || !report) return;

    try {
      await navigator.clipboard.writeText(report);
      void recordWorkbenchAction({
        toolId: "series-video-analyzer",
        toolLabel: "系列视频分析",
        actionLabel: "复制报告",
        title: `视频分析：${videoForm.title || videoForm.link || "未命名视频"}`,
        fields: [
          { label: "标题", value: videoForm.title || "未填写" },
          { label: "平台", value: seriesVideoPlatformLabels[analysis.platform] },
          { label: "赛道", value: videoForm.niche || "未填写" },
          { label: "诊断", value: analysis.primaryDiagnosis },
        ],
        inputSnapshot: {
          videoForm,
          metrics,
        },
        outputSummary: analysis.primaryDiagnosis,
        outputSnapshot: {
          scoreLabel: analysis.scoreLabel,
          report,
          insights: analysis.insights,
          nextActions: analysis.nextActions,
        },
      });
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("failed");
      window.setTimeout(() => setCopyState("idle"), 1800);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1fr)]">
      <section className="grid gap-5">
        <ParameterGuide />

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="rounded-md border border-blue-100 bg-blue-50 p-2 text-blue-700">
                <LinkIcon aria-hidden="true" className="h-4 w-4" />
              </span>
              <div>
                <CardTitle>视频信息</CardTitle>
                <CardDescription>
                  链接用于识别平台，核心判断以你填写的数据为准。
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <TextInput
                helper="用于归档素材和自动识别平台；不会抓取第三方平台数据。"
                label="视频链接"
                onChange={(value) => updateVideoForm("link", value)}
                placeholder="粘贴抖音、小红书、B站或其他视频链接"
                value={videoForm.link}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <SelectInput
                  helper="选择自动识别时会根据链接判断；识别不准就手动覆盖。"
                  label="平台"
                  onChange={(value) =>
                    updateVideoForm("platform", value as PlatformChoice)
                  }
                  options={platformOptions}
                  value={videoForm.platform}
                />
                <TextInput
                  helper="例如舞蹈博主、AI 工具号、探店号；会影响标题候选和赛道建议。"
                  label="赛道"
                  onChange={(value) => updateVideoForm("niche", value)}
                  placeholder="例如：舞蹈博主、AI 工具号、探店号"
                  value={videoForm.niche}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <TextInput
                  helper="记录这是第几条实验内容，方便判断系列追更和复盘节奏。"
                  label="系列期数"
                  onChange={(value) => updateVideoForm("episode", value)}
                  placeholder="1"
                  type="number"
                  value={videoForm.episode}
                />
                <TextInput
                  helper="用于后续复盘发布时间和数据表现，不参与强诊断。"
                  label="发布时间"
                  onChange={(value) => updateVideoForm("publishedAt", value)}
                  type="date"
                  value={videoForm.publishedAt}
                />
                <TextInput
                  helper="填写视频总时长秒数，配合平均观看判断流失阶段。"
                  label="视频时长"
                  onChange={(value) =>
                    updateVideoForm("durationSeconds", value)
                  }
                  placeholder="60"
                  suffix="秒"
                  type="number"
                  value={videoForm.durationSeconds}
                />
              </div>

              <TextInput
                helper="影响点击判断。建议写出挑战对象、时间成本、结果或冲突。"
                label="标题"
                onChange={(value) => updateVideoForm("title", value)}
                placeholder="例如：挑战舞蹈博主第 1 天，我发现普通人最难的是..."
                value={videoForm.title}
              />

              <TextInput
                helper="例如自媒体赛道实验员、普通人实测、养成系；用于判断人设承接。"
                label="账号类型"
                onChange={(value) => updateVideoForm("accountType", value)}
                placeholder="例如：自媒体赛道实验员、普通人实测、养成系"
                value={videoForm.accountType}
              />

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  内容简述
                </span>
                <span className="text-xs leading-5 text-slate-500">
                  写清楚这条视频的过程、冲突、结果和你自己的判断；用于区分选题问题、结构问题和表达问题。
                </span>
                <textarea
                  className="min-h-24 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  onChange={(event) =>
                    updateVideoForm("contentSummary", event.target.value)
                  }
                  placeholder="写清楚这条视频讲了什么、过程里最大的冲突是什么、你自己的判断是什么"
                  value={videoForm.contentSummary}
                />
              </label>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <Badge variant="secondary">
                  识别平台：{seriesVideoPlatformLabels[detectedPlatform]}
                </Badge>
                <span>识别失败也可以继续填写数据分析。</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="rounded-md border border-emerald-100 bg-emerald-50 p-2 text-emerald-700">
                <LineChart aria-hidden="true" className="h-4 w-4" />
              </span>
              <div>
                <CardTitle>数据指标</CardTitle>
                <CardDescription>
                  可以只填你拿得到的数据，空值不会阻断分析。
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {metricLabels.map((metric) => (
                  <MetricInput
                  helper={metric.helper}
                  key={metric.id}
                  label={metric.label}
                  onChange={(value) => updateMetric(metric.id, value)}
                  purpose={metric.purpose}
                  suffix={metric.suffix}
                  value={metrics[metric.id]}
                />
              ))}
            </div>
            <Button className="mt-4 w-full" onClick={runAnalysis} type="button">
              开始分析
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid content-start gap-5 xl:sticky xl:top-5 xl:max-h-[calc(100vh-2.5rem)] xl:overflow-auto xl:pr-1">
        {analysis ? (
          <>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge>{seriesVideoPlatformLabels[analysis.platform]}</Badge>
                  <Badge variant={scoreBadgeVariant(analysis.scoreLabel)}>
                    {analysis.scoreLabel}
                  </Badge>
                </div>
                <CardTitle>分析结果</CardTitle>
                <CardDescription>{analysis.primaryDiagnosis}</CardDescription>
              </div>
              <Button onClick={copyReport} type="button" variant="secondary">
                <ClipboardCopy aria-hidden="true" className="mr-2 h-4 w-4" />
                {copyState === "copied"
                  ? "已复制"
                  : copyState === "failed"
                    ? "复制失败"
                    : "复制报告"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {formulaRows.map((row) => (
                <MetricCard
                  detail={row.detail}
                  key={row.label}
                  label={row.label}
                  value={row.value}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <ResultSection
          icon={<ListChecks aria-hidden="true" className="h-4 w-4" />}
          items={formulaRows.map(
            (row) => `${row.label}：${row.detail}，当前为 ${row.value}`,
          )}
          title="分析依据"
        />

        <ResultSection
          icon={<FileText aria-hidden="true" className="h-4 w-4" />}
          items={analysis.insights}
          title="数据解读"
        />

        <ResultSection
          icon={<Lightbulb aria-hidden="true" className="h-4 w-4" />}
          items={analysis.nextActions}
          title="下一步建议"
        />

        <ResultSection
          icon={<FileText aria-hidden="true" className="h-4 w-4" />}
          items={analysis.titleSuggestions}
          title="标题候选"
        />
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>等待分析</CardTitle>
              <CardDescription>
                填写链接或数据后，点击“开始分析”生成一份固定的复盘结果。
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </section>
    </div>
  );

  function updateVideoForm<Field extends keyof VideoFormState>(
    field: Field,
    value: VideoFormState[Field],
  ) {
    setVideoForm((current) => ({ ...current, [field]: value }));
  }

  function updateMetric(field: MetricField, value: string) {
    setMetrics((current) => ({ ...current, [field]: value }));
  }
}

function TextInput({
  helper,
  label,
  onChange,
  placeholder,
  suffix,
  type = "text",
  value,
}: {
  helper?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suffix?: string;
  type?: "date" | "number" | "text";
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {helper ? (
        <span className="text-xs leading-5 text-slate-500">{helper}</span>
      ) : null}
      <div className="relative">
        <input
          className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          min={type === "number" ? 0 : undefined}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={type}
          value={value}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
  );
}

function SelectInput({
  helper,
  label,
  onChange,
  options,
  value,
}: {
  helper?: string;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {helper ? (
        <span className="text-xs leading-5 text-slate-500">{helper}</span>
      ) : null}
      <select
        className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function MetricInput({
  helper,
  label,
  onChange,
  purpose,
  suffix,
  value,
}: {
  helper: string;
  label: string;
  onChange: (value: string) => void;
  purpose: string;
  suffix?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <div className="relative">
        <input
          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          min={0}
          onChange={(event) => onChange(event.target.value)}
          type="number"
          value={value}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">
            {suffix}
          </span>
        ) : null}
      </div>
      <span className="text-xs leading-5 text-slate-500">{helper}</span>
      <span className="rounded-md bg-white px-2 py-1 text-xs leading-5 text-slate-600">
        影响：{purpose}
      </span>
    </label>
  );
}

function ParameterGuide() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="rounded-md border border-amber-100 bg-amber-50 p-2 text-amber-700">
            <Info aria-hidden="true" className="h-4 w-4" />
          </span>
          <div>
            <CardTitle>参数说明</CardTitle>
            <CardDescription>
              先补齐赛道、标题和核心数据；只有链接也能识别平台，但建议会更偏模板。
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-3">
          {videoParameterGroups.map((group) => (
            <div
              className="rounded-md border border-slate-200 bg-slate-50 p-3"
              key={group.title}
            >
              <div className="mb-2 text-sm font-semibold text-slate-900">
                {group.title}
              </div>
              <ul className="grid gap-2 text-xs leading-5 text-slate-600">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-950">{value}</div>
      <div className="mt-1 text-xs leading-5 text-slate-500">{detail}</div>
    </div>
  );
}

function ResultSection({
  icon,
  items,
  title,
}: {
  icon: React.ReactNode;
  items: string[];
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-slate-200 bg-slate-50 p-2 text-slate-700">
            {icon}
          </span>
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 text-sm leading-6 text-slate-700">
          {items.map((item) => (
            <li className="rounded-md bg-slate-50 px-3 py-2" key={item}>
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function parseMetrics(
  metrics: Record<MetricField, string>,
): Partial<SeriesVideoMetrics> {
  return Object.fromEntries(
    Object.entries(metrics).map(([key, value]) => [
      key,
      parseOptionalNumber(value),
    ]),
  ) as Partial<SeriesVideoMetrics>;
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function emptyToUndefined(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : undefined;
}

function formatRate(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function scoreBadgeVariant(scoreLabel: string) {
  if (scoreLabel.includes("继续")) {
    return "success";
  }

  if (scoreLabel.includes("重测") || scoreLabel.includes("观察")) {
    return "warning";
  }

  return "secondary";
}
