import { prisma } from "@/lib/prisma";
import { getTodayPlanDate, toPlanDate } from "@/server/daily-plan";
import {
  TOOL_NEXT_STEPS,
  WORKFLOW_STAGES,
  getStageIndex,
  type NextStepConfig,
  type WorkflowStage,
  type WorkflowStageStatus,
} from "@/lib/workflow";

/** 工作台摘要数据 */
export type DashboardSummary = {
  todayTaskTotal: number;
  todayTaskCompleted: number;
  draftCount: number;
  todayImageCount: number;
  ipProjectCount: number;
};

/** 最近生成图片 */
export type DashboardRecentImage = {
  id: string;
  title: string;
  imageUrl: string;
  createdAt: string;
};

/** 最近草稿文章 */
export type DashboardRecentDraft = {
  id: string;
  title: string;
  slug: string;
  updatedAt: string;
};

/** 工作台完整数据 */
export type DashboardData = {
  summary: DashboardSummary;
  recentImages: DashboardRecentImage[];
  recentDrafts: DashboardRecentDraft[];
  currentStage: WorkflowStage;
  stageStatuses: WorkflowStageStatus[];
  nextStep: NextStepConfig;
};

/**
 * 获取工作台仪表盘数据。
 * 并行查询 5 类数据：今日计划、草稿文章、今日生图、最近图片、最近草稿、IP 项目数。
 */
export async function getToolsDashboardData(
  userId: string,
): Promise<DashboardData> {
  const todayPlanDate = getTodayPlanDate();
  const todayStart = toPlanDate(todayPlanDate);
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

  const [
    todayPlanItems,
    draftCount,
    todayImageCount,
    recentImages,
    recentDrafts,
    ipProjectCount,
  ] = await Promise.all([
    prisma.dailyPlanItem.findMany({
      where: {
        authorId: userId,
        planDate: todayStart,
      },
      select: { id: true, status: true },
    }),
    prisma.note.count({
      where: {
        authorId: userId,
        status: "PRIVATE",
      },
    }),
    prisma.aiImageAsset.count({
      where: {
        authorId: userId,
        createdAt: { gte: todayStart, lt: todayEnd },
      },
    }),
    prisma.aiImageAsset.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        title: true,
        imageUrl: true,
        createdAt: true,
      },
    }),
    prisma.note.findMany({
      where: {
        authorId: userId,
        status: "PRIVATE",
      },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        slug: true,
        updatedAt: true,
      },
    }),
    prisma.ipPrototypeProject.count({
      where: { authorId: userId },
    }),
  ]);

  const todayTaskTotal = todayPlanItems.length;
  const todayTaskCompleted = todayPlanItems.filter(
    (item) => item.status === "DONE",
  ).length;

  const summary: DashboardSummary = {
    todayTaskTotal,
    todayTaskCompleted,
    draftCount,
    todayImageCount,
    ipProjectCount,
  };

  const currentStage = inferWorkflowStage(summary);
  const stageStatuses = buildStageStatuses(currentStage);
  const nextStep = getNextStepSuggestion(currentStage, summary);

  return {
    summary,
    recentImages: recentImages.map((img) => ({
      id: img.id,
      title: img.title,
      imageUrl: img.imageUrl,
      createdAt: img.createdAt.toISOString(),
    })),
    recentDrafts: recentDrafts.map((draft) => ({
      id: draft.id,
      title: draft.title,
      slug: draft.slug,
      updatedAt: draft.updatedAt.toISOString(),
    })),
    currentStage,
    stageStatuses,
    nextStep,
  };
}

/**
 * 根据摘要数据推断当前所处的工作流阶段。
 * - 无今日任务 → plan
 * - 有任务但今日无生图 → create
 * - 有生图但无草稿 → generate
 * - 有草稿 → publish
 */
export function inferWorkflowStage(summary: DashboardSummary): WorkflowStage {
  if (summary.todayTaskTotal === 0) {
    return "plan";
  }

  if (summary.todayImageCount === 0) {
    return "create";
  }

  if (summary.draftCount === 0) {
    return "generate";
  }

  return "publish";
}

/**
 * 根据当前阶段和摘要数据，生成下一步引导建议。
 * 在 TOOL_NEXT_STEPS 基础上，根据完成情况提供更有上下文的标签。
 */
export function getNextStepSuggestion(
  stage: WorkflowStage,
  summary: DashboardSummary,
): NextStepConfig {
  const base = TOOL_NEXT_STEPS[stage];

  if (
    stage === "plan" &&
    summary.todayTaskTotal > 0 &&
    summary.todayTaskCompleted === summary.todayTaskTotal
  ) {
    return { ...base, label: "今日任务已完成，去生成素材" };
  }

  if (stage === "generate" && summary.todayImageCount > 0) {
    return { ...base, label: "素材已就绪，写文章发布" };
  }

  return base;
}

/** 根据当前阶段构建所有阶段的状态数组（completed / active / pending） */
function buildStageStatuses(
  currentStage: WorkflowStage,
): WorkflowStageStatus[] {
  const currentIndex = getStageIndex(currentStage);

  return WORKFLOW_STAGES.map((stage, index) => {
    if (index < currentIndex) {
      return "completed" as const;
    }

    if (index === currentIndex) {
      return "active" as const;
    }

    return "pending" as const;
  });
}
