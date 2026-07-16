type CanvasFlowNode = { kind: string };

export type CanvasFlowStage = "MATERIAL" | "SKILL" | "REFINE";

export function getCanvasFlowStage(nodes: readonly CanvasFlowNode[]): CanvasFlowStage {
  if (!nodes.some((node) => node.kind === "ASSET")) return "MATERIAL";
  if (!nodes.some((node) => node.kind === "SKILL")) return "SKILL";
  return "REFINE";
}
