"use client";

import { ArrowUpRight, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  externalToolGroups,
  filterExternalToolGroups,
  getExternalToolStats,
  toolDirectoryCategories,
} from "@/components/tools/tool-directory-data";

export function ToolDirectory() {
  const [category, setCategory] = useState("全部");
  const [query, setQuery] = useState("");
  const filteredGroups = useMemo(
    () => filterExternalToolGroups({ category, query }),
    [category, query],
  );
  const stats = getExternalToolStats(externalToolGroups);
  const recordedFilterKey = useRef("");

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (category === "全部" && !trimmedQuery) return;

    const key = `${category}:${trimmedQuery}:${filteredGroups.length}`;
    if (recordedFilterKey.current === key) return;
    recordedFilterKey.current = key;

    const matchedTools = filteredGroups.reduce(
      (sum, group) => sum + group.items.length,
      0,
    );

    void recordWorkbenchAction({
      toolId: "directory",
      toolLabel: "工具目录",
      actionLabel: "筛选",
      title: `工具目录：${trimmedQuery || category}`,
      fields: [
        { label: "关键词", value: trimmedQuery || "全部" },
        { label: "分类", value: category },
      ],
      inputSnapshot: {
        query: trimmedQuery,
        category,
      },
      outputSummary: `匹配 ${filteredGroups.length} 个分组、${matchedTools} 个工具。`,
      outputSnapshot: {
        groupCount: filteredGroups.length,
        toolCount: matchedTools,
      },
    });
  }, [category, filteredGroups, query]);

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <label className="relative block">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              className="h-11 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-950 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索工具名称、功能或网址"
              value={query}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {toolDirectoryCategories.map((item) => (
              <button
                className={
                  category === item
                    ? "rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white"
                    : "rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950"
                }
                key={item}
                onClick={() => setCategory(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          已整理 {stats.groups} 个分组、{stats.tools} 个工具，其中{" "}
          {stats.linkedTools} 个可直接跳转。
        </p>
      </section>

      {filteredGroups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-12 text-center text-sm text-slate-500">
          没有匹配的工具
        </div>
      ) : (
        filteredGroups.map((group) => (
          <section className="grid gap-3" key={group.title}>
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                {group.title}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{group.description}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {group.items.map((tool) => (
                <Card key={`${group.title}-${tool.name}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle>{tool.name}</CardTitle>
                      {tool.href ? (
                        <Badge>可跳转</Badge>
                      ) : (
                        <Badge variant="secondary">需搜索</Badge>
                      )}
                    </div>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {tool.href ? (
                      <a
                        className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-900"
                        href={tool.href}
                        rel="noreferrer"
                        target="_blank"
                      >
                        打开官网
                        <ArrowUpRight
                          aria-hidden="true"
                          className="ml-1 h-4 w-4"
                        />
                      </a>
                    ) : (
                      <span className="text-sm text-slate-400">
                        暂无固定官网地址
                      </span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
