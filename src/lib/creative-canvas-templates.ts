import { buildSkillPrompt, getSystemCreativeSkills, type SystemCreativeSkill } from "@/lib/creative-skills";

export type CreativeCanvasTemplate = {
  id: string;
  title: string;
  description: string;
  requirement: string;
  executorKey: SystemCreativeSkill["executorKey"];
};

export const creativeCanvasTemplates: readonly CreativeCanvasTemplate[] = [
  {
    id: "menswear-generate",
    title: "男装真实图",
    description: "上传服装主体，生成真实男装视觉图。",
    requirement: "我想基于服装主体图，生成真实、符合商品细节的男装视觉图。",
    executorKey: "menswear-generate",
  },
  {
    id: "menswear-multi-outfit",
    title: "一衣多搭",
    description: "按季节、场景和展示方式设计多组搭配。",
    requirement: "我想基于服装主体图，生成适合秋季场景的一衣多搭方案。",
    executorKey: "menswear-multi-outfit",
  },
  {
    id: "menswear-single-outfit",
    title: "单品穿搭",
    description: "将单品图搭配为一张一套的真实上身穿搭图。",
    requirement: "我想上传男装单品和构图参考，生成一张一套的上身穿搭图。",
    executorKey: "menswear-single-outfit",
  },
  {
    id: "platform-cover-design",
    title: "小红书封面",
    description: "使用原图和可选参考图制作平台封面。",
    requirement: "我想用封面原图制作一张适合小红书发布的内容封面。",
    executorKey: "platform-cover-design",
  },
  {
    id: "ip-derivative-factory",
    title: "IP 换装与表情",
    description: "让 IP 延展动作、换装、表情或场景。",
    requirement: "我想基于现有 IP 主图，生成可用于传播的换装、动作或表情素材。",
    executorKey: "ip-derivative-factory",
  },
];

export function buildCanvasTemplateNodes(
  template: CreativeCanvasTemplate,
  identifiers: { textClientId: string; skillClientId: string; skillVersionId: string },
) {
  const skill = getSystemCreativeSkills().find((item) => item.executorKey === template.executorKey);
  if (!skill) throw new Error(`未找到 ${template.title} 对应的 Skill`);

  return {
    nodes: [
      {
        clientId: identifiers.textClientId,
        kind: "TEXT" as const,
        position: { x: 120, y: 160 },
        snapshot: { name: "创作需求", text: template.requirement },
      },
      {
        clientId: identifiers.skillClientId,
        kind: "SKILL" as const,
        position: { x: 420, y: 160 },
        skillVersionId: identifiers.skillVersionId,
        snapshot: createSkillSnapshot(skill),
      },
    ],
    edges: [{ sourceClientId: identifiers.textClientId, targetClientId: identifiers.skillClientId, role: "创作需求" }],
  };
}

export function createSkillSnapshot(skill: SystemCreativeSkill) {
  return {
    name: skill.name,
    description: skill.description,
    executorKey: skill.executorKey,
    inputs: skill.inputs,
    prompt: buildSkillPrompt(skill, {}),
    values: {},
    status: "DRAFT",
  };
}
