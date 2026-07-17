import { getSystemCreativeSkills } from "@/lib/creative-skills";

export type CreativeCanvasPlan = {
  summary: string;
  executorKeys: string[];
  requiresConfirmation: true;
};

export function buildCreativeCanvasPlan(message: string): CreativeCanvasPlan {
  const text = message.trim();
  if (!text) throw new Error("请输入创作需求");

  const executorKeys: string[] = [];
  if (/单品穿搭|单件穿搭|一张图一套|一图一套/.test(text)) executorKeys.push("menswear-single-outfit");
  if (/一衣多搭|搭配|季节|衬衫|衣服|服装/.test(text)) executorKeys.push("menswear-multi-outfit");
  if (/封面|小红书|抖音图文|公众号|视频号|闲鱼/.test(text)) executorKeys.push("platform-cover-design");
  if (/换装|表情包|动作|IP/.test(text)) executorKeys.push("ip-derivative-factory");
  if (/模特|脸部|身材/.test(text)) executorKeys.push("menswear-model-generate");
  if (/提取|裁取|素材/.test(text)) executorKeys.push("menswear-material-extract");
  if (/热点|选题|趋势/.test(text)) executorKeys.push("hotspot-research");
  if (/风格参考|参考图风格/.test(text)) executorKeys.push("menswear-style-reference");
  if (executorKeys.length === 0) executorKeys.push("menswear-generate");

  const catalog = new Set(getSystemCreativeSkills().map((skill) => skill.executorKey));
  return {
    summary: `已根据“${text.slice(0, 60)}”整理 ${executorKeys.length} 个可编辑创作步骤。`,
    executorKeys: executorKeys.filter((key, index) => catalog.has(key as never) && executorKeys.indexOf(key) === index),
    requiresConfirmation: true,
  };
}
