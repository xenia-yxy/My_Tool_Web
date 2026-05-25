export type AssistantPrompt = {
  label: string;
  question: string;
};

type AnswerRule = {
  keywords: string[];
  answer: string;
};

export const assistantPrompts: AssistantPrompt[] = [
  {
    label: "这个网站是做什么的？",
    question: "这个网站是做什么的？",
  },
  {
    label: "我应该先看哪里？",
    question: "我应该先看哪里？",
  },
  {
    label: "有哪些自研工具？",
    question: "有哪些自研工具？",
  },
  {
    label: "SOP 服务适合谁？",
    question: "SOP 服务适合谁？",
  },
  {
    label: "如何联系合作？",
    question: "如何联系合作？",
  },
  {
    label: "如何开始做 AI 工作流？",
    question: "如何开始做 AI 工作流？",
  },
];

export const fallbackAssistantAnswer =
  "这个问题我暂时还不能完整回答。你可以先问我：这个网站是做什么的、有哪些自研工具、SOP 服务适合谁，或者如何开始做 AI 工作流。";

const answerRules: AnswerRule[] = [
  {
    keywords: ["网站", "做什么", "ai practice", "介绍", "是什么"],
    answer:
      "AI Practice 是一个个人 AI 实践者的数字据点，用来记录真实 AI 实践，并把知识、工具、项目和流程逐步沉淀成可持续生长的系统。",
  },
  {
    keywords: ["先看", "入口", "开始", "哪里"],
    answer:
      "如果你是第一次来，可以先看知识库了解实践记录，再看工具和项目了解正在构建的东西。需要合作或咨询时，可以从联系入口开始。",
  },
  {
    keywords: ["工具", "自研", "tool"],
    answer:
      "自研工具会优先围绕内容生产、效率工作流、知识管理和 SOP 自动化来做。首版先展示方向，后续会逐步接入真实工具。",
  },
  {
    keywords: ["sop", "服务", "咨询", "企业", "流程"],
    answer:
      "SOP 服务适合想把 AI 工作流、内容流程、知识库流程或企业内部协作流程沉淀成可执行系统的人和团队。重点不是炫技，而是把流程变得更稳定、可复用。",
  },
  {
    keywords: ["联系", "合作", "邮箱", "微信"],
    answer:
      "你可以通过首页的联系区域开始沟通。当前 MVP 先保留联系入口，后续会补充更明确的微信、邮箱或表单方式。",
  },
  {
    keywords: ["工作流", "方法", "自动化", "怎么开始"],
    answer:
      "开始做 AI 工作流时，先选一个高频、重复、结果可判断的场景，把输入、步骤、输出和验收标准写清楚，再逐步把其中稳定的环节工具化。",
  },
];

export function getAssistantAnswer(question: string) {
  const normalizedQuestion = question.trim().toLowerCase();

  if (!normalizedQuestion) {
    return fallbackAssistantAnswer;
  }

  const matchedRule = answerRules.find((rule) =>
    rule.keywords.some((keyword) => normalizedQuestion.includes(keyword.toLowerCase())),
  );

  return matchedRule?.answer ?? fallbackAssistantAnswer;
}
