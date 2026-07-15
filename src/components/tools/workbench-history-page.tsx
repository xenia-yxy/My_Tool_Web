"use client";

import Link from "next/link";
import { Clock3, FileText, ImageIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PromptEditorDialog } from "@/components/tools/prompt-editor-dialog";
import type { WorkbenchSessionState } from "@/components/tools/workbench-session-client";

type WorkbenchHistoryPageProps = {
  sessions: WorkbenchSessionState[];
  tool: { href: string; id: string; label: string };
};

export function WorkbenchHistoryPage({ sessions, tool }: WorkbenchHistoryPageProps) {
  const [selected, setSelected] = useState<WorkbenchSessionState | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{tool.label}</p>
          <h1 className="text-2xl font-semibold text-slate-950">历史记录</h1>
        </div>
        <Button asChild>
          <Link href={tool.href}>返回工具</Link>
        </Button>
      </div>
      {sessions.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-48 flex-col items-center justify-center text-center">
            <Clock3 aria-hidden="true" className="h-7 w-7 text-slate-400" />
            <p className="mt-3 text-sm text-slate-600">尚无历史记录。</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {sessions.map((session) => {
            const imageUrl = getImageUrl(session.outputSnapshot);
            return (
              <Card key={session.id}>
                <CardHeader className="border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="text-base">{session.title}</CardTitle>
                    <Badge variant="secondary">{getStatusLabel(session.status)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 pt-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div>
                    <p className="text-sm leading-6 text-slate-600">{getSummary(session.outputSnapshot, session.errorMessage)}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {session.updatedAt ? new Date(session.updatedAt).toLocaleString("zh-CN") : "刚刚"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-start gap-2">
                    {imageUrl ? <ImageIcon aria-label="包含图片结果" className="h-5 w-5 text-slate-500" /> : null}
                    <Button className="gap-2" onClick={() => setSelected(session)} type="button" variant="secondary">
                      <FileText aria-hidden="true" className="h-4 w-4" />
                      完整提示词
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <PromptEditorDialog
        description="历史记录中的提示词仅供查看，返回工具页后可继续编辑并再次生成。"
        onClose={() => setSelected(null)}
        onSave={() => undefined}
        open={Boolean(selected)}
        prompt={selected?.prompt ?? ""}
      />
    </div>
  );
}

function getStatusLabel(status: WorkbenchSessionState["status"]) {
  return { DRAFT: "草稿", RUNNING: "进行中", SUCCEEDED: "已完成", FAILED: "失败" }[status];
}

function getImageUrl(snapshot: Record<string, unknown>) {
  return typeof snapshot.imageUrl === "string" ? snapshot.imageUrl : null;
}

function getSummary(snapshot: Record<string, unknown>, errorMessage?: string | null) {
  if (errorMessage) return errorMessage;
  if (typeof snapshot.summary === "string") return snapshot.summary;
  if (typeof snapshot.notice === "string") return snapshot.notice;
  return "已保存本次输入、提示词和结果。";
}
