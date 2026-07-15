"use client";

import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Database,
  Flame,
  RefreshCw,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { recordWorkbenchAction } from "@/components/tools/workbench-action-recorder";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  buildHotspotSearchShortcuts,
  filterHotspotEntries,
  getHotspotStats,
  hotspotEntries,
  hotspotPlatformLabels,
  hotspotPlatformOptions,
  hotspotTopicOptions,
  type HotspotPlatform,
  type HotspotTopic,
} from "@/lib/hotspot-radar";
import type {
  FallbackHotspotItem,
  HotspotAnalysis,
  HotspotQueryResponse,
  HotspotSourceResult,
  RealHotspotItem,
} from "@/server/hotspot-radar";

type PlatformFilter = (typeof hotspotPlatformOptions)[number];
type TopicFilter = (typeof hotspotTopicOptions)[number];

function getPlatformLabel(platform: PlatformFilter) {
  return platform === "全部" ? platform : hotspotPlatformLabels[platform];
}

async function fetchHotspotData(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      response.status === 401 ? "请先登录后再查询热点数据" : "热点数据查询失败",
    );
  }

  return (await response.json()) as HotspotQueryResponse;
}

export function HotspotRadar() {
  const [platform, setPlatform] = useState<PlatformFilter>("全部");
  const [topic, setTopic] = useState<TopicFilter>("全部");
  const [query, setQuery] = useState("");
  const stats = getHotspotStats(hotspotEntries);
  const filteredEntries = useMemo(
    () => filterHotspotEntries({ platform, query, topic }),
    [platform, query, topic],
  );
  const searchShortcuts = useMemo(
    () => buildHotspotSearchShortcuts(query),
    [query],
  );
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      platform: platform === "全部" ? "all" : platform,
      topic: topic === "全部" ? "all" : topic,
    });
    const trimmedQuery = query.trim();

    if (trimmedQuery) {
      params.set("query", trimmedQuery);
    }

    return `/api/tools/hotspots?${params.toString()}`;
  }, [platform, query, topic]);
  const { data, error, isLoading, mutate } = useSWR(
    apiUrl,
    fetchHotspotData,
  );
  const recordedQueryKey = useRef("");
  const realSourceItems = useMemo(
    () => collectRealItems(data?.sources ?? []),
    [data],
  );
  const fallbackSourceItems = useMemo(
    () => collectFallbackItems(data?.sources ?? []),
    [data],
  );

  useEffect(() => {
    if (!data || isLoading) return;

    const queryKey = JSON.stringify({
      platform,
      topic,
      query,
      fetchedAt: data.sources.map((source) => source.fetchedAt).join("|"),
    });

    if (recordedQueryKey.current === queryKey) return;
    recordedQueryKey.current = queryKey;

    const sourceCount = data.sources.length;
    const realCount = realSourceItems.length;
    const fallbackCount = fallbackSourceItems.length;

    void recordWorkbenchAction({
      toolId: "hotspots",
      toolLabel: "热点查询",
      actionLabel: "查询",
      title: `热点查询：${query.trim() || getPlatformLabel(platform)}`,
      fields: [
        { label: "关键词", value: query.trim() || "全部" },
        { label: "平台", value: getPlatformLabel(platform) },
        { label: "类型", value: topic },
      ],
      inputSnapshot: {
        query: query.trim(),
        platform,
        topic,
      },
      outputSummary: `查询 ${sourceCount} 个来源，命中 ${realCount} 条真实热点和 ${fallbackCount} 个官方入口。`,
      outputSnapshot: {
        sourceCount,
        realCount,
        fallbackCount,
        trendSummary: data.analysis?.trendSummary ?? "",
      },
    });
  }, [
    data,
    fallbackSourceItems.length,
    isLoading,
    platform,
    query,
    realSourceItems.length,
    topic,
  ]);

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4">
          <label className="relative block">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              className="h-11 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-950 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索热点、平台、场景或运营标签"
              value={query}
            />
          </label>

          <FilterGroup label="平台">
            {hotspotPlatformOptions.map((item) => (
              <FilterButton
                isSelected={platform === item}
                key={item}
                label={getPlatformLabel(item)}
                onClick={() => setPlatform(item)}
              />
            ))}
          </FilterGroup>

          <FilterGroup label="类型">
            {hotspotTopicOptions.map((item) => (
              <FilterButton
                isSelected={topic === item}
                key={item}
                label={item}
                onClick={() => setTopic(item)}
              />
            ))}
          </FilterGroup>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            入口库已整理 {stats.platforms} 个平台、{stats.entries} 个热点入口，当前匹配{" "}
            {filteredEntries.length} 个。
          </p>
          <button
            className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950"
            onClick={() => void mutate()}
            type="button"
          >
            <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
            刷新真实数据
          </button>
        </div>
      </section>

      <LiveDataStatus
        error={error instanceof Error ? error.message : null}
        isLoading={isLoading}
        sources={data?.sources ?? []}
      />

      {searchShortcuts.length > 0 ? (
        <section className="grid gap-3">
          <SectionTitle icon={Flame} title="关键词快捷查询" />
          <div className="grid gap-3 md:grid-cols-3">
            {searchShortcuts.map((shortcut) => (
              <a
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-blue-200 hover:text-blue-700"
                href={shortcut.href}
                key={shortcut.platform}
                rel="noreferrer"
                target="_blank"
              >
                <span>
                  {hotspotPlatformLabels[shortcut.platform]} · {shortcut.title}
                </span>
                <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <RealHotspotSection items={realSourceItems} />

      <FallbackSourceSection items={fallbackSourceItems} />

      {data?.analysis ? <AnalysisPanel analysis={data.analysis} /> : null}

      <EntryLibrarySection entries={filteredEntries} />
    </div>
  );
}

function collectRealItems(sources: HotspotSourceResult[]) {
  return sources.flatMap((source) =>
    source.items
      .filter((item): item is RealHotspotItem => item.kind === "real")
      .map((item) => ({ item, source })),
  );
}

function collectFallbackItems(sources: HotspotSourceResult[]) {
  return sources.flatMap((source) =>
    source.items
      .filter((item): item is FallbackHotspotItem => item.kind === "fallback")
      .map((item) => ({ item, source })),
  );
}

function LiveDataStatus({
  error,
  isLoading,
  sources,
}: {
  error: string | null;
  isLoading: boolean;
  sources: HotspotSourceResult[];
}) {
  return (
    <section className="grid gap-3">
      <SectionTitle icon={Database} title="实时数据状态" />
      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      ) : null}
      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          正在查询可验证热点数据...
        </div>
      ) : null}
      {sources.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-3">
          {sources.map((source) => (
            <div
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              key={source.platform}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-950">
                  {hotspotPlatformLabels[source.platform]}
                </span>
                {source.status === "real" ? (
                  <Badge variant="success">真实数据</Badge>
                ) : source.status === "unavailable" ? (
                  <Badge variant="warning">获取失败</Badge>
                ) : (
                  <Badge variant="secondary">人工核验</Badge>
                )}
              </div>
              <p className="text-sm leading-6 text-slate-600">
                {source.message}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                获取时间：{formatDateTime(source.fetchedAt)}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function RealHotspotSection({
  items,
}: {
  items: Array<{ item: RealHotspotItem; source: HotspotSourceResult }>;
}) {
  return (
    <section className="grid gap-3">
      <SectionTitle icon={CheckCircle2} title="真实热点列表" />
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
          当前筛选条件下没有可展示的站内真实热点数据
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map(({ item, source }) => (
            <Card key={`${source.platform}-${item.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <Badge variant="success">#{item.rank}</Badge>
                  <Badge variant="secondary">{item.topic}</Badge>
                </div>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>
                  {item.author ? `${item.author} · ` : ""}
                  {item.heatLabel ?? source.sourceName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-slate-500">
                  来源：{source.sourceName} · {formatDateTime(source.fetchedAt)}
                </p>
                <a
                  className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-900"
                  href={item.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  打开原始链接
                  <ArrowUpRight aria-hidden="true" className="ml-1 h-4 w-4" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function FallbackSourceSection({
  items,
}: {
  items: Array<{ item: FallbackHotspotItem; source: HotspotSourceResult }>;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-3">
      <SectionTitle icon={AlertCircle} title="官方确认入口" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map(({ item, source }) => (
          <Card key={`${source.platform}-${item.id}`}>
            <CardHeader>
              <div className="flex flex-wrap gap-2">
                <Badge variant="warning">
                  {hotspotPlatformLabels[source.platform]}
                </Badge>
                <Badge variant="secondary">{item.topic}</Badge>
              </div>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm leading-6 text-slate-500">
                {item.reason}
              </p>
              <a
                className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-900"
                href={item.url}
                rel="noreferrer"
                target="_blank"
              >
                打开官方入口
                <ArrowUpRight aria-hidden="true" className="ml-1 h-4 w-4" />
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function AnalysisPanel({ analysis }: { analysis: HotspotAnalysis }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <SectionTitle icon={Flame} title="热点分析" />
        {analysis.basis === "real-data" ? (
          <Badge variant="success">基于真实数据</Badge>
        ) : (
          <Badge variant="warning">无实时数据</Badge>
        )}
      </div>
      <p className="text-sm leading-6 text-slate-700">
        {analysis.trendSummary}
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <AnalysisList title="内容角度" values={analysis.contentAngles} />
        <AnalysisList title="平台适配" values={analysis.platformFit} />
        <AnalysisList title="风险校验" values={analysis.riskChecks} />
      </div>
      <div className="mt-4">
        <AnalysisList title="商业化角度" values={analysis.commerceAngles} />
      </div>
    </section>
  );
}

function EntryLibrarySection({
  entries,
}: {
  entries: Array<{
    description: string;
    href: string;
    platform: HotspotPlatform;
    tags: string[];
    title: string;
    topic: HotspotTopic;
  }>;
}) {
  return (
    <section className="grid gap-3">
      <SectionTitle icon={Database} title="入口库" />
      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-12 text-center text-sm text-slate-500">
          没有匹配的热点入口
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => (
            <HotspotCard entry={entry} key={entry.href} />
          ))}
        </div>
      )}
    </section>
  );
}

function FilterGroup({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="grid gap-2 lg:grid-cols-[48px_1fr] lg:items-start">
      <span className="pt-2 text-sm font-semibold text-slate-700">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterButton({
  isSelected,
  label,
  onClick,
}: {
  isSelected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={
        isSelected
          ? "rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white"
          : "rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950"
      }
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function HotspotCard({
  entry,
}: {
  entry: {
    description: string;
    href: string;
    platform: HotspotPlatform;
    tags: string[];
    title: string;
    topic: HotspotTopic;
  };
}) {
  return (
    <Card className="flex min-h-[220px] flex-col">
      <CardHeader className="flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge>{hotspotPlatformLabels[entry.platform]}</Badge>
              <Badge variant="secondary">{entry.topic}</Badge>
            </div>
            <CardTitle>{entry.title}</CardTitle>
          </div>
        </div>
        <CardDescription>{entry.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          {entry.tags.map((tag) => (
            <span
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
        <a
          className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-900"
          href={entry.href}
          rel="noreferrer"
          target="_blank"
        >
          打开入口
          <ArrowUpRight aria-hidden="true" className="ml-1 h-4 w-4" />
        </a>
      </CardContent>
    </Card>
  );
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon aria-hidden={true} className="h-4 w-4 text-blue-600" />
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
    </div>
  );
}

function AnalysisList({
  title,
  values,
}: {
  title: string;
  values: string[];
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-950">{title}</h3>
      <ul className="grid gap-2 text-sm leading-6 text-slate-600">
        {values.map((value) => (
          <li className="rounded-md bg-slate-50 px-3 py-2" key={value}>
            {value}
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    hour12: false,
  });
}
