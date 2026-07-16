"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TOOL_NEXT_STEPS, type WorkflowStage } from "@/lib/workflow";

type WorkflowNextStepProps = {
  /** 当前工具所处的工作流阶段 */
  stage: WorkflowStage;
  /** 自定义按钮文字，不传则使用 TOOL_NEXT_STEPS 默认值 */
  label?: string;
  /** 自定义跳转地址，不传则使用 TOOL_NEXT_STEPS 默认值 */
  href?: string;
};

/**
 * 工作流下一步引导卡片。
 * 在各工具页面底部展示，引导用户进入工作流的下一个环节。
 */
export function WorkflowNextStep({
  stage,
  label,
  href,
}: WorkflowNextStepProps) {
  const config = TOOL_NEXT_STEPS[stage];
  const displayLabel = label ?? config.label;
  const displayHref = href ?? config.href;

  return (
    <Link
      className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 px-5 py-4 transition-colors hover:border-blue-200 hover:bg-blue-50"
      href={displayHref}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-blue-700 shadow-sm">
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-blue-600">下一步</p>
          <p className="truncate text-sm font-semibold text-slate-950">
            {displayLabel}
          </p>
        </div>
      </div>
      <ArrowRight
        aria-hidden="true"
        className="h-5 w-5 shrink-0 text-blue-500"
      />
    </Link>
  );
}
