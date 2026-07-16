type CanvasFlowNode = { kind: string };

export type CanvasFlowStage = "MATERIAL" | "SKILL" | "REFINE";

export function getCanvasFlowStage(nodes: readonly CanvasFlowNode[]): CanvasFlowStage {
  if (!nodes.some((node) => node.kind === "ASSET")) return "MATERIAL";
  if (!nodes.some((node) => node.kind === "SKILL")) return "SKILL";
  return "REFINE";
}

export function getCanvasNodeAccentColor(snapshot: Record<string, unknown>, kind: string) {
  if (kind === "ASSET" && typeof snapshot.accentColor === "string" && /^#[0-9a-f]{6}$/i.test(snapshot.accentColor)) {
    return snapshot.accentColor;
  }

  return kind === "SKILL" ? "#8b5cf6" : kind === "TEXT" ? "#f59e0b" : "#0ea5e9";
}
