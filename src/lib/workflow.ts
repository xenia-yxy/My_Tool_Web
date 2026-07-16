import {
  CalendarDays,
  Lightbulb,
  Send,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

/** 工作流四阶段 */
export type WorkflowStage = "plan" | "create" | "generate" | "publish";

/** 阶段元数据 */
export type WorkflowStageMeta = {
  id: WorkflowStage;
  label: string;
  description: string;
  icon: LucideIcon;
};

/** 阶段状态（用于进度条渲染） */
export type WorkflowStageStatus = "completed" | "active" | "pending";

/** 下一步引导配置 */
export type NextStepConfig = {
  label: string;
  href: string;
  stage: WorkflowStage;
};

/** 工作流阶段有序列表（规划→创作→生成→发布） */
export const WORKFLOW_STAGES: WorkflowStageMeta[] = [
  {
    id: "plan",
    label: "规划",
    description: "确定今天/本周要创作什么内容",
    icon: CalendarDays,
  },
  {
    id: "create",
    label: "创作",
    description: "构思内容方向、生成文案提示词",
    icon: Lightbulb,
  },
  {
    id: "generate",
    label: "生成",
    description: "生成视觉素材",
    icon: Sparkles,
  },
  {
    id: "publish",
    label: "发布",
    description: "整理成果为文章并发布",
    icon: Send,
  },
];

/**
 * 工具 → 下一步引导映射表。
 * 键为当前工具所处的工作流阶段，值为推荐的下一步操作。
 */
export const TOOL_NEXT_STEPS: Record<WorkflowStage, NextStepConfig> = {
  plan: {
    label: "去生成素材",
    href: "/tools/ai-image",
    stage: "generate",
  },
  create: {
    label: "去 AI 生图",
    href: "/tools/ai-image",
    stage: "generate",
  },
  generate: {
    label: "写文章发布",
    href: "/admin",
    stage: "publish",
  },
  publish: {
    label: "返回工作台",
    href: "/tools",
    stage: "plan",
  },
};

/** 阶段排序索引，用于比较前后关系 */
const STAGE_ORDER: Record<WorkflowStage, number> = {
  plan: 0,
  create: 1,
  generate: 2,
  publish: 3,
};

/** 判断 stageA 是否在 stageB 之前（不含相等） */
export function isStageBefore(stageA: WorkflowStage, stageB: WorkflowStage): boolean {
  return STAGE_ORDER[stageA] < STAGE_ORDER[stageB];
}

/** 获取某个阶段在有序列表中的索引 */
export function getStageIndex(stage: WorkflowStage): number {
  return STAGE_ORDER[stage];
}
