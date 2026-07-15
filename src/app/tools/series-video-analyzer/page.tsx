import { SeriesVideoAnalyzer } from "@/components/tools/series-video-analyzer";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function SeriesVideoAnalyzerPage() {
  await requireSignedInUser("/tools/series-video-analyzer");

  return (
    <>
      <WorkspacePageHeader
        description="记录系列视频链接和关键数据，诊断标题、开头、人设、赛道价值，并生成下一条建议。"
        title="系列视频分析"
      />
      <SeriesVideoAnalyzer />
    </>
  );
}
