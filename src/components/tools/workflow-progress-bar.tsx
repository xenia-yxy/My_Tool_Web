import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import {
  WORKFLOW_STAGES,
  type NextStepConfig,
  type WorkflowStage,
  type WorkflowStageStatus,
} from "@/lib/workflow";
import { cn } from "@/lib/utils";

type WorkflowProgressBarProps = {
  /** 当前所处的工作流阶段 */
  currentStage: WorkflowStage;
  /** 各阶段状态数组，与 WORKFLOW_STAGES 一一对应 */
  stageStatuses: WorkflowStageStatus[];
  /** 下一步引导配置 */
  nextStep: NextStepConfig;
};

/**
 * 工作流进度条组件。
 * 横向展示 4 个阶段（规划→创作→生成→发布），高亮当前阶段，
 * 已完成阶段显示对勾，底部展示推荐下一步操作。
 */
export function WorkflowProgressBar({
  currentStage,
  stageStatuses,
  nextStep,
}: WorkflowProgressBarProps) {
  const currentIndex = WORKFLOW_STAGES.findIndex(
    (stage) => stage.id === currentStage,
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-1">
        {WORKFLOW_STAGES.map((stage, index) => {
          const status = stageStatuses[index] ?? "pending";
          const Icon = stage.icon;
          const isLast = index === WORKFLOW_STAGES.length - 1;

          return (
            <div className="flex flex-1 items-start" key={stage.id}>
              <div className="flex w-20 flex-col items-center gap-2 text-center sm:w-28">
                <div
                  className={cn(
                    "grid h-11 w-11 place-items-center rounded-full border-2 transition-colors",
                    status === "completed" &&
                      "border-emerald-500 bg-emerald-500 text-white",
                    status === "active" &&
                      "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200",
                    status === "pending" &&
                      "border-slate-200 bg-white text-slate-400",
                  )}
                >
                  {status === "completed" ? (
                    <Check aria-hidden="true" className="h-5 w-5" />
                  ) : (
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      status === "active"
                        ? "text-blue-700"
                        : status === "completed"
                          ? "text-emerald-700"
                          : "text-slate-500",
                    )}
                  >
                    {stage.label}
                  </p>
                  <p className="mt-0.5 hidden text-xs leading-4 text-slate-400 sm:block">
                    {stage.description}
                  </p>
                </div>
              </div>

              {!isLast ? (
                <div
                  className={cn(
                    "mt-5 h-0.5 flex-1 rounded-full transition-colors",
                    index < currentIndex ? "bg-emerald-400" : "bg-slate-200",
                  )}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <Link
        className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 transition-colors hover:bg-blue-50"
        href={nextStep.href}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-950">
            推荐下一步
          </span>
          <span className="text-sm text-blue-700">{nextStep.label}</span>
        </div>
        <ArrowRight aria-hidden="true" className="h-4 w-4 text-blue-600" />
      </Link>
    </section>
  );
}
