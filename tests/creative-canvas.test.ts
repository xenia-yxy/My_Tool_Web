import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createCanvasState,
  reduceCanvasState,
} from "../src/components/creative-center/use-creative-canvas-session";
import { serializeCreativeCanvas } from "../src/server/creative-canvas";
import { buildCreativeCanvasPlan } from "../src/server/creative-canvas-agent";
import { buildCanvasTemplateNodes, creativeCanvasTemplates } from "../src/lib/creative-canvas-templates";
import { getCanvasFlowStage } from "../src/lib/creative-canvas-flow";

test("connecting an asset to a Skill records a labelled role edge", () => {
  const initial = createCanvasState();
  const withNodes = reduceCanvasState(initial, {
    type: "replace",
    nodes: [
      { clientId: "asset-1", kind: "ASSET", position: { x: 20, y: 20 }, snapshot: {} },
      { clientId: "skill-1", kind: "SKILL", position: { x: 400, y: 20 }, snapshot: {} },
    ],
    edges: [],
  });
  const next = reduceCanvasState(withNodes, {
    type: "connect",
    sourceClientId: "asset-1",
    targetClientId: "skill-1",
    role: "风格参考",
  });

  assert.equal(next.edges[0]?.role, "风格参考");
});

test("moving a card preserves other canvas state", () => {
  const initial = createCanvasState();
  const withNode = reduceCanvasState(initial, {
    type: "replace",
    nodes: [{ clientId: "skill-1", kind: "SKILL", position: { x: 100, y: 100 }, snapshot: { name: "一衣多搭" } }],
    edges: [],
  });
  const next = reduceCanvasState(withNode, { type: "move", clientId: "skill-1", position: { x: 240, y: 180 } });

  assert.deepEqual(next.nodes[0]?.position, { x: 240, y: 180 });
  assert.equal(next.nodes[0]?.snapshot.name, "一衣多搭");
});

test("canvas serialization exposes role edges using client card identifiers", () => {
  const canvas = serializeCreativeCanvas({
    id: "canvas-1",
    title: "封面项目",
    status: "DRAFT",
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [],
    edges: [{ sourceNodeId: "asset-1", targetNodeId: "skill-1", role: "主体图" }],
    runs: [],
  });

  assert.deepEqual(canvas.edges, [{ sourceClientId: "asset-1", targetClientId: "skill-1", role: "主体图" }]);
});

test("Agent drafts a cover workflow without starting a generation", () => {
  const plan = buildCreativeCanvasPlan("用这件衬衫做秋季小红书封面");

  assert.equal(plan.requiresConfirmation, true);
  assert.deepEqual(plan.executorKeys, ["menswear-multi-outfit", "platform-cover-design"]);
});

test("quick start template creates a linked requirement and first Skill step", () => {
  const template = creativeCanvasTemplates.find((item) => item.id === "menswear-multi-outfit");

  assert.ok(template);
  const result = buildCanvasTemplateNodes(template!, {
    textClientId: "text-template",
    skillClientId: "skill-template",
    skillVersionId: "version-1",
  });

  assert.equal(result.nodes[0]?.kind, "TEXT");
  assert.equal(result.nodes[0]?.snapshot.text, "我想基于服装主体图，生成适合秋季场景的一衣多搭方案。");
  assert.equal(result.nodes[1]?.kind, "SKILL");
  assert.equal(result.nodes[1]?.snapshot.executorKey, "menswear-multi-outfit");
  assert.deepEqual(result.edges, [{ sourceClientId: "text-template", targetClientId: "skill-template", role: "创作需求" }]);
});

test("canvas flow guides creators from material to Skill and refinement", () => {
  assert.equal(getCanvasFlowStage([]), "MATERIAL");
  assert.equal(getCanvasFlowStage([{ kind: "ASSET" }]), "SKILL");
  assert.equal(getCanvasFlowStage([{ kind: "ASSET" }, { kind: "SKILL" }]), "REFINE");
});
