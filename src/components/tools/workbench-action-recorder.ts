"use client";

import {
  buildWorkbenchActionSessionDraft,
  type WorkbenchActionSessionInput,
} from "@/lib/workbench-action-history";

export async function recordWorkbenchAction(input: WorkbenchActionSessionInput) {
  try {
    await fetch("/api/tools/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildWorkbenchActionSessionDraft(input)),
    });
  } catch {
    // 历史记录不能阻断工具主流程。
  }
}
