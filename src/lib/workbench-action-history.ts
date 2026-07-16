import type { WorkbenchToolId } from "@/lib/workbench-sessions";

export type WorkbenchActionField = {
  label: string;
  value: string;
};

export type WorkbenchActionSessionInput = {
  toolId: WorkbenchToolId;
  toolLabel: string;
  actionLabel: string;
  title: string;
  fields: WorkbenchActionField[];
  inputSnapshot: Record<string, unknown>;
  outputSummary: string;
  outputSnapshot?: Record<string, unknown>;
};

export function buildWorkbenchActionSessionDraft(input: WorkbenchActionSessionInput) {
  return {
    toolId: input.toolId,
    title: input.title,
    status: "SUCCEEDED" as const,
    prompt: buildWorkbenchActionPrompt(input.toolLabel, input.actionLabel, input.fields),
    inputSnapshot: input.inputSnapshot,
    outputSnapshot: {
      summary: input.outputSummary,
      ...(input.outputSnapshot ?? {}),
    },
    imageAssetIds: [],
    externalJobId: null,
    errorMessage: null,
  };
}

function buildWorkbenchActionPrompt(
  toolLabel: string,
  actionLabel: string,
  fields: WorkbenchActionField[],
) {
  const lines = fields
    .map((field) => ({ label: field.label.trim(), value: field.value.trim() }))
    .filter((field) => field.label && field.value)
    .map((field) => `${field.label}：${field.value}`);

  return [`${toolLabel} ${actionLabel}`, ...lines].join("\n");
}
