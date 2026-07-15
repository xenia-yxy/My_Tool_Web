import { notFound } from "next/navigation";
import { WorkbenchHistoryPage } from "@/components/tools/workbench-history-page";
import type { WorkbenchSessionState } from "@/components/tools/workbench-session-client";
import { getWorkbenchTool } from "@/lib/workbench-sessions";
import { requireSignedInUser } from "@/server/auth";
import { listWorkbenchSessions } from "@/server/workbench-sessions";

type PageProps = { params: Promise<{ toolId: string }> };

export default async function ToolHistoryPage({ params }: PageProps) {
  const { toolId } = await params;
  const tool = getWorkbenchTool(toolId);

  if (!tool) notFound();

  const user = await requireSignedInUser(`/tools/history/${tool.id}`);
  const sessions = await listWorkbenchSessions(user.id, tool.id);

  const historySessions: WorkbenchSessionState[] = sessions.map((session) => ({
    id: session.id,
    toolId: session.toolId,
    title: session.title,
    status: session.status,
    prompt: session.prompt,
    inputSnapshot: asRecord(session.inputSnapshot),
    outputSnapshot: asRecord(session.outputSnapshot),
    imageAssetIds: session.imageAssetIds,
    externalJobId: session.externalJobId,
    errorMessage: session.errorMessage,
    updatedAt: session.updatedAt.toISOString(),
  }));

  return <WorkbenchHistoryPage sessions={historySessions} tool={tool} />;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
