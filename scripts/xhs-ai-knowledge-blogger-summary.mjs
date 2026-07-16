import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const outDir = "E:\\.AAA_profile\\4.副业知识\\小红书\\00-AI知识博主总纲";
const htmlDir = resolve(outDir, "html");
const pngDir = resolve(outDir, "png");

const chromeCandidates = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
];

const chrome = chromeCandidates.find((candidate) => existsSync(candidate));

if (!chrome) {
  throw new Error("Chrome executable not found.");
}

mkdirSync(htmlDir, { recursive: true });
mkdirSync(pngDir, { recursive: true });

const cards = [
  {
    tag: "AI知识博主 / 总纲",
    kicker: "先定方向",
    title: "普通人AI知识库",
    subtitle: "把热点、工具、方法讲成人话",
    body: [
      "不要只做 AI 新闻搬运，也不要只做工具介绍。",
      "真正适合小红书的是：热点解读 + 工具实测 + 普通人可复制方法。",
    ],
    callout: "定位：帮普通人看懂 AI，并用 AI 提效、做内容、找机会。",
    variant: "cover",
  },
  {
    tag: "账号定位",
    kicker: "一句话讲清楚",
    title: "不是专家人设",
    subtitle: "是帮普通人翻译AI的人",
    body: [
      "人设建议：一个普通人持续实测 AI 工具，把能用的方法整理成清单和模板。",
      "账号简介可以写：每天拆一个 AI 热点/工具，给一个普通人能直接上手的方法。",
    ],
    callout: "关键词：AI 热点、AI 工具、知识博主、普通人提效。",
  },
  {
    tag: "内容支柱",
    kicker: "4条线一起跑",
    title: "内容不要只做一种",
    subtitle: "用热点涨粉，用模板变现",
    blocks: [
      ["热点解读", "GPT、Grok、Agent、AI 视频"],
      ["工具测评", "新软件能做什么，值不值得用"],
      ["实操教程", "怎么用 AI 做选题、资料、图文"],
      ["资料模板", "清单、Prompt、流程表、工具地图"],
    ],
  },
  {
    tag: "最近热点池",
    kicker: "蹭热点但不搬运",
    title: "热点要落到用法",
    subtitle: "发生了什么 + 普通人怎么用",
    body: [
      "GPT-5.6、Grok 4.5、GPT-Live、Claude Fable、Gemini 3.5、Perplexity Deep Research 都适合做解读。",
      "重点不是参数，而是：它能不能帮你写内容、查资料、做决策、完成任务。",
    ],
    callout: "标题公式：新模型/新功能出来了，普通人最该看懂这 3 件事。",
  },
  {
    tag: "AI Agent",
    kicker: "行业主线",
    title: "从聊天到替你做事",
    subtitle: "2026 年最值得讲的方向",
    body: [
      "AI 正在从聊天机器人，变成能搜索、整理、生成、执行任务的 Agent。",
      "WorkBuddy、Manus、Genspark、Flowith 这类工具，本质都在抢“AI 工作台”入口。",
    ],
    callout: "知识博主可以讲：AI Agent 到底能替普通人做哪些事？",
  },
  {
    tag: "国外工具地图",
    kicker: "别只会用一个",
    title: "国外AI工具怎么选",
    subtitle: "按使用场景，而不是按名气",
    blocks: [
      ["ChatGPT", "综合写作、推理、代码、图文工作流"],
      ["Grok", "热点追踪、实时信息、Agent 任务"],
      ["Claude", "长文写作、代码、深度思考"],
      ["Gemini", "Google 生态、搜索、多模态办公"],
      ["Perplexity", "AI 搜索、研究、资料引用"],
    ],
  },
  {
    tag: "新工具观察",
    kicker: "最近软件重点讲",
    title: "新软件别只介绍",
    subtitle: "要讲它解决什么问题",
    blocks: [
      ["WorkBuddy", "办公 Agent，文档、研究、协作任务"],
      ["Manus", "通用 Agent，PPT、网页、研究、设计"],
      ["Genspark", "搜索、研究、文档、Slides、Super Agent"],
      ["Flowith", "画布式 AI 工作台，适合复杂选题"],
      ["Mavis/Marvis", "一个偏内容生产，一个偏企业网络运维"],
    ],
  },
  {
    tag: "国内工具地图",
    kicker: "国内也要讲",
    title: "国内AI工具怎么选",
    subtitle: "更适合中文场景和本地生态",
    blocks: [
      ["豆包", "中文对话、语音、日常创作、图文"],
      ["Kimi", "长文阅读、资料整理、文档分析"],
      ["DeepSeek", "推理、代码、低成本 API、开源生态"],
      ["通义/Qwen", "开源、多模态、图片、代码"],
      ["扣子/Dify", "Bot、知识库、工作流、自动化"],
    ],
  },
  {
    tag: "变现设计",
    kicker: "知识博主也要变现",
    title: "先资料，后服务",
    subtitle: "广告是后期收入，不是第一天目标",
    blocks: [
      ["免费资料", "AI 工具地图、热点清单、Prompt 模板"],
      ["低价产品", "19-99 元资料包/模板库"],
      ["中后端", "陪跑、咨询、知识博主工作流"],
      ["广告", "AI 工具、效率软件、知识库工具"],
    ],
    callout: "内容钩子：看不懂 AI 热点？我帮你翻译成人话。",
  },
  {
    tag: "发布节奏",
    kicker: "先跑7天",
    title: "第一周这样发",
    subtitle: "每篇只测试一个方向",
    steps: [
      ["第 1 天", "GPT-5.6：普通人该看懂什么"],
      ["第 2 天", "Grok 4.5：为什么大家都在聊"],
      ["第 3 天", "WorkBuddy：AI 员工能做什么"],
      ["第 4 天", "Manus/Genspark/Flowith 对比"],
      ["第 5 天", "国内 AI 工具怎么选"],
      ["第 6 天", "AI Agent 到底是什么"],
      ["第 7 天", "知识博主 AI 工具箱"],
    ],
  },
  {
    tag: "结尾引流",
    kicker: "做成资料包",
    title: "把内容变成资产",
    subtitle: "每篇都引导一个关键词",
    body: [
      "这套内容后面可以沉淀成《AI 知识博主工具地图》《AI 热点解读模板》《国内外 AI 工具清单》。",
      "先用免费清单收集需求，再做付费版模板库。",
    ],
    callout: "需要《AI知识博主工具地图》\n评论区打：工具地图",
    variant: "end",
  },
];

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderCard(card, index) {
  const total = cards.length;
  const bodyHtml = card.body
    ? `<div class="body">${card.body.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</div>`
    : "";

  const blocksHtml = card.blocks
    ? `<div class="blocks">${card.blocks
        .map(
          ([name, desc]) => `
            <div class="block">
              <div class="block-name">${escapeHtml(name)}</div>
              <div class="block-desc">${escapeHtml(desc)}</div>
            </div>
          `,
        )
        .join("")}</div>`
    : "";

  const stepsHtml = card.steps
    ? `<div class="steps">${card.steps
        .map(
          ([day, text]) => `
            <div class="step">
              <div class="step-day">${escapeHtml(day)}</div>
              <div class="step-text">${escapeHtml(text)}</div>
            </div>
          `,
        )
        .join("")}</div>`
    : "";

  const calloutHtml = card.callout
    ? `<div class="callout">${escapeHtml(card.callout).replaceAll("\n", "<br>")}</div>`
    : "";

  const titleClass = [...card.title].length > 10 ? "title compact-title" : "title";
  const classes = ["card", card.variant || "standard"].join(" ");

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(card.title)}</title>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      width: 1080px;
      height: 1440px;
      overflow: hidden;
      background: #f6f4ec;
      font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", Arial, sans-serif;
    }
    .card {
      position: relative;
      width: 1080px;
      height: 1440px;
      padding: 76px 74px 62px;
      color: #111;
      background:
        radial-gradient(circle at 92% 9%, rgba(255, 105, 97, 0.22), transparent 27%),
        radial-gradient(circle at 8% 88%, rgba(42, 157, 143, 0.18), transparent 28%),
        linear-gradient(135deg, #fffdf7 0%, #f7f6ec 55%, #eaf4ff 100%);
    }
    .card::before {
      content: "";
      position: absolute;
      inset: 28px;
      border: 3px solid #191919;
      border-radius: 34px;
      pointer-events: none;
    }
    .brand {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
    }
    .tag {
      display: inline-flex;
      align-items: center;
      min-height: 54px;
      padding: 0 24px;
      border: 2px solid #191919;
      border-radius: 999px;
      background: #fff;
      font-size: 27px;
      font-weight: 850;
    }
    .series {
      color: #304036;
      font-size: 27px;
      font-weight: 850;
    }
    .page-mark {
      position: absolute;
      right: 72px;
      top: 190px;
      width: 126px;
      height: 126px;
      border: 3px solid #191919;
      border-radius: 50%;
      background: #ff6f61;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 42px;
      font-weight: 950;
      box-shadow: 7px 7px 0 #191919;
      z-index: 1;
    }
    .main {
      position: relative;
      z-index: 1;
      padding-top: 112px;
    }
    .cover .main {
      padding-top: 140px;
    }
    .kicker {
      display: inline-block;
      margin-bottom: 26px;
      padding: 12px 18px;
      background: #ffdf5d;
      border: 3px solid #191919;
      box-shadow: 8px 8px 0 #191919;
      font-size: 35px;
      line-height: 1.08;
      font-weight: 950;
    }
    h1 {
      margin: 0;
      max-width: 870px;
      font-size: 94px;
      line-height: 1.03;
      letter-spacing: 0;
      font-weight: 950;
    }
    .cover h1 {
      font-size: 110px;
      max-width: 850px;
    }
    .compact-title {
      font-size: 78px;
      line-height: 1.06;
    }
    .subtitle {
      margin-top: 24px;
      max-width: 850px;
      font-size: 44px;
      line-height: 1.22;
      font-weight: 850;
      color: #304036;
    }
    .body {
      margin-top: 48px;
      display: grid;
      gap: 23px;
      max-width: 850px;
    }
    .body p {
      margin: 0;
      padding: 22px 28px;
      border: 3px solid #191919;
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.86);
      box-shadow: 8px 8px 0 rgba(25, 25, 25, 0.92);
      font-size: 36px;
      line-height: 1.4;
      font-weight: 750;
    }
    .blocks {
      margin-top: 46px;
      display: grid;
      gap: 17px;
      max-width: 880px;
    }
    .block {
      display: grid;
      grid-template-columns: 245px 1fr;
      min-height: 88px;
      overflow: hidden;
      border: 3px solid #191919;
      border-radius: 24px;
      background: #fff;
      box-shadow: 7px 7px 0 #191919;
    }
    .block-name {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 14px;
      border-right: 3px solid #191919;
      background: #8bd3dd;
      font-size: 30px;
      line-height: 1.16;
      font-weight: 950;
      text-align: center;
    }
    .block-desc {
      display: flex;
      align-items: center;
      padding: 16px 24px;
      font-size: 31px;
      line-height: 1.24;
      font-weight: 800;
    }
    .steps {
      margin-top: 46px;
      display: grid;
      gap: 14px;
      max-width: 880px;
    }
    .step {
      display: grid;
      grid-template-columns: 175px 1fr;
      min-height: 78px;
      overflow: hidden;
      border: 3px solid #191919;
      border-radius: 22px;
      background: #fff;
      box-shadow: 6px 6px 0 #191919;
    }
    .step-day {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
      border-right: 3px solid #191919;
      background: #8bd3dd;
      font-size: 27px;
      font-weight: 950;
    }
    .step-text {
      display: flex;
      align-items: center;
      padding: 14px 22px;
      font-size: 30px;
      line-height: 1.2;
      font-weight: 850;
    }
    .callout {
      position: absolute;
      left: 74px;
      right: 74px;
      bottom: 148px;
      padding: 28px 34px;
      border: 4px solid #191919;
      border-radius: 28px;
      background: #172118;
      color: #fff;
      box-shadow: 10px 10px 0 #ff6f61;
      font-size: 38px;
      line-height: 1.28;
      font-weight: 900;
      z-index: 1;
    }
    .end .callout {
      background: #ffdf5d;
      color: #111;
      text-align: center;
      box-shadow: 10px 10px 0 #191919;
      font-size: 45px;
    }
    .footer {
      position: absolute;
      left: 74px;
      right: 74px;
      bottom: 67px;
      display: flex;
      justify-content: space-between;
      color: #364036;
      font-size: 27px;
      font-weight: 850;
      z-index: 1;
    }
    .footer::before {
      content: "AI知识博主工具地图";
    }
  </style>
</head>
<body>
  <section class="${classes}">
    <div class="brand">
      <div class="tag">${escapeHtml(card.tag)}</div>
      <div class="series">总纲 / ${total}页</div>
    </div>
    <div class="page-mark">${String(index + 1).padStart(2, "0")}</div>
    <main class="main">
      <div class="kicker">${escapeHtml(card.kicker)}</div>
      <h1 class="${titleClass}">${escapeHtml(card.title)}</h1>
      <div class="subtitle">${escapeHtml(card.subtitle)}</div>
      ${bodyHtml}
      ${blocksHtml}
      ${stepsHtml}
    </main>
    ${calloutHtml}
    <div class="footer"><span>第 ${index + 1}/${total} 页</span></div>
  </section>
</body>
</html>`;
}

const copy = `# AI知识博主总纲：普通人怎么做 AI 内容号

## 标题
想做 AI 知识博主，别只搬运热点，先看这张路线图

## 正文
这段时间我们讨论了 AI 副业、资料包、GPT/Grok 热点、AI Agent、新出的 AI 软件，以及怎么从工具测评转成知识博主。

我把核心思路整理成一句话：

不要只做 AI 新闻搬运，也不要只做工具介绍号。

更适合小红书的方向是：AI 热点解读 + AI 工具实测 + 普通人可复制的方法。

内容可以分 4 条线：

1. 热点解读：GPT-5.6、Grok 4.5、GPT-Live、Claude、Gemini、AI Agent。
2. 工具测评：WorkBuddy、Manus、Genspark、Flowith、Mavis、Marvis、Lovart、Perplexity。
3. 国内工具：豆包、Kimi、DeepSeek、通义/Qwen、扣子、Dify。
4. 资料模板：工具地图、Prompt 模板、图文工作流、热点解读模板。

核心不是“这个工具很厉害”，而是讲清楚：

它是什么？
最近更新了什么？
普通人能用它做什么？
适合谁，不适合谁？
和同类工具怎么选？
怎么转成内容、资料包或服务？

如果你想做知识博主，可以先发 7 天：

第 1 天：GPT-5.6 普通人该看懂什么
第 2 天：Grok 4.5 为什么大家都在聊
第 3 天：WorkBuddy 这个 AI 员工能做什么
第 4 天：Manus/Genspark/Flowith 对比
第 5 天：国内 AI 工具怎么选
第 6 天：AI Agent 到底是什么
第 7 天：知识博主 AI 工具箱

后面可以把内容沉淀成资料包：
《AI 知识博主工具地图》
《AI 热点解读模板》
《国内外 AI 工具清单》
《AI 知识博主 Prompt 包》

需要《AI知识博主工具地图》的，评论区打：工具地图

## 标签
#AI工具 #AI知识博主 #AI副业 #Grok #GPT #AI Agent #小红书运营 #知识博主 #工具测评 #普通人副业

## 置顶评论
整理好了《AI知识博主工具地图》，包括热点选题、国内外工具、发布节奏和资料包方向。需要的评论“工具地图”。
`;

cards.forEach((card, index) => {
  const stem = `card-${String(index + 1).padStart(2, "0")}`;
  const htmlPath = resolve(htmlDir, `${stem}.html`);
  const pngPath = resolve(pngDir, `${stem}.png`);
  writeFileSync(htmlPath, renderCard(card, index), "utf8");
  execFileSync(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--window-size=1080,1440",
      `--screenshot=${pngPath}`,
      pathToFileURL(htmlPath).href,
    ],
    { stdio: "inherit" },
  );
});

writeFileSync(resolve(outDir, "发布文案.md"), copy, "utf8");

console.log(`Generated ${cards.length} summary cards in ${pngDir}`);
