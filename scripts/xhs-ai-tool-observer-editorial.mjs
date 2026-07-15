import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const targetRoot = "E:\\.AAA_profile\\4.副业知识\\小红书\\08-AI工具观察新风格-7篇";

const chromeCandidates = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
];

const chrome = chromeCandidates.find((candidate) => existsSync(candidate));

if (!chrome) {
  throw new Error("Chrome executable not found.");
}

const sourceNote = [
  "参考来源：WorkBuddy 官网与腾讯新闻稿；Manus 官网与 Browser Operator 页面；Genspark 官网与官方博客；Flowith 官方对比文章；腾讯元宝、Kimi、通义官网公开信息。",
  "本文为工具观察笔记，不构成购买建议。功能、价格和可用地区以官方页面为准。",
];

const posts = [
  {
    folder: "01-WorkBuddy不是聊天机器人",
    title: "WorkBuddy 火了，但它不是聊天机器人",
    summary: "WorkBuddy 更像办公 Agent：把一句任务拆成步骤，调用工具，交付结果。",
    cards: [
      ["观察对象", "WorkBuddy", "腾讯系办公 AI Agent，关键词不是“聊天”，而是“执行”。"],
      ["为什么火", "办公场景清晰", "它瞄准的是报告、文档、数据、协作这类高频工作，而不是泛泛问答。"],
      ["核心变化", "从回答到交付", "传统 AI 给你一段答案；Agent 需要理解目标、拆步骤、调用工具、交付可检查结果。"],
      ["能做什么", "研究 / 文档 / 数据", "适合做资料整理、市场分析、表格处理、报告初稿、跨工具办公任务。"],
      ["产品信号", "多 Agent 并行", "官方资料强调专家团队、并行协作、多模型/多场景，这说明办公 Agent 正在平台化。"],
      ["适合谁", "办公室重度用户", "经常做汇报、写方案、查资料、整理表格的人，比单纯聊天用户更容易感受到价值。"],
      ["不适合谁", "只想随便问一句", "如果只是问常识、写几句话，普通聊天工具就够了，没必要上复杂 Agent。"],
      ["一句话判断", "把它看成 AI 同事", "WorkBuddy 的看点不是模型多强，而是它能不能把办公任务从“问答”推进到“完成”。"],
    ],
  },
  {
    folder: "02-Manus强在哪",
    title: "Manus 到底强在哪？一句话讲清楚",
    summary: "Manus 的重点是多步骤执行：研究、网页、Slides、设计、浏览器操作。",
    cards: [
      ["观察对象", "Manus", "它的产品页面直接把 Create slides、Build website、Design、Develop apps 放在入口。"],
      ["核心定位", "通用 AI Agent", "不是只回答问题，而是围绕一个目标拆解任务、持续执行、输出成品。"],
      ["常见任务", "Slides / Web / Design", "适合做汇报页、简单网站、设计方案、研究报告、应用原型这类交付型任务。"],
      ["Browser Operator", "让浏览器变工具", "它强调在你的浏览器上下文里执行任务：导航、点击、整理、表单、跨平台收集。"],
      ["为什么重要", "AI 开始操作网页", "当 Agent 能使用浏览器，AI 就不只是“知道”，还可能帮你完成网页里的流程。"],
      ["风险点", "权限和隐私", "浏览器 Agent 涉及登录态、网页权限和敏感信息，使用前要明确边界。"],
      ["适合谁", "任务明确的人", "目标越清晰、交付标准越明确，Manus 这类工具越容易发挥作用。"],
      ["一句话判断", "适合完整交付", "如果你想让 AI 从想法走到可见成品，Manus 比普通聊天框更值得观察。"],
    ],
  },
  {
    folder: "03-Genspark适合知识博主吗",
    title: "Genspark 为什么适合知识博主",
    summary: "Genspark 的优势在于搜索、研究、文档、Slides 和多格式输出。",
    cards: [
      ["观察对象", "Genspark", "官方定位是 all-in-one AI workspace，博客持续更新 AI Workspace、Super Agent、AI Docs 等产品线。"],
      ["核心优势", "研究到输出", "知识博主最耗时的环节是查资料、整理观点、做结构，Genspark 正好覆盖这段流程。"],
      ["内容场景", "热点资料整理", "适合把一个 AI 热点拆成：背景、时间线、关键功能、影响、使用建议。"],
      ["输出形式", "文档 / PPT / 多媒体", "它的工具列表覆盖文档、演示、报告、设计、音视频，适合做内容素材池。"],
      ["产品信号", "AI Workspace 4.0", "2026 年官方博客主推 AI workspace 和 AI employee，说明它在从工具集合走向工作台。"],
      ["适合谁", "内容研究型用户", "写知识科普、行业观察、工具横评的人，会比普通闲聊用户更容易用出价值。"],
      ["注意点", "不要只复制输出", "AI 能帮你收集和组织，但观点、判断、取舍仍然要人工完成。"],
      ["一句话判断", "像内容助理", "Genspark 更适合做研究和成稿前准备，不适合完全代替知识博主的判断。"],
    ],
  },
  {
    folder: "04-Flowith画布工作台",
    title: "Flowith：AI 时代的画布工作台",
    summary: "Flowith 的关键不是聊天，而是把提示词、输出、参考资料放到可视化画布里。",
    cards: [
      ["观察对象", "Flowith", "它更像一个可视化 AI 工作区，而不是线性聊天窗口。"],
      ["核心差异", "画布式思考", "普通聊天是一条线；画布可以把选题、资料、分支、输出并排放在一个空间。"],
      ["官方对比", "Flowith / Manus / Genspark", "Flowith 官方对比中，把自己定位为更适合可编辑画布、可见分支和长期上下文。"],
      ["适合任务", "复杂选题整理", "当一个主题有多个角度、多个来源、多个版本时，画布比聊天记录更容易回看。"],
      ["内容创作", "从脑图到文章", "适合先放素材，再拆结构，再生成多个标题/大纲/观点版本。"],
      ["不适合", "一次性简单问答", "如果只是问一个概念、写一段话，画布工具反而显得重。"],
      ["观察重点", "上下文能否保留", "AI 工具下一步竞争，不只是模型强弱，而是谁能帮你管理长期项目上下文。"],
      ["一句话判断", "适合思考型工作", "Flowith 的价值在于组织复杂想法，而不是单次输出速度。"],
    ],
  },
  {
    folder: "05-Manus-Genspark-Flowith怎么选",
    title: "Manus、Genspark、Flowith 怎么选",
    summary: "三个都在讲 Agent，但它们解决的问题不一样。",
    cards: [
      ["先说结论", "不是谁替代谁", "Manus 偏执行，Genspark 偏快速研究输出，Flowith 偏长期组织和思考。"],
      ["Manus", "适合完整交付", "当你有明确任务，希望 AI 自动拆步骤并输出成品时，优先看 Manus。"],
      ["Genspark", "适合研究产出", "当你要快速查资料、做报告、做 Slides、整理多格式素材时，Genspark 更顺手。"],
      ["Flowith", "适合复杂思考", "当你要做长期项目、多个分支、反复修改结构时，Flowith 的画布更有优势。"],
      ["选择标准 1", "任务是否明确", "目标越明确，执行型 Agent 越有优势；目标越发散，画布型工具越有优势。"],
      ["选择标准 2", "输出是什么", "要成品，看 Manus；要资料和初稿，看 Genspark；要长期整理，看 Flowith。"],
      ["选择标准 3", "你是否愿意复核", "Agent 输出越完整，越需要用户检查来源、逻辑、权限和结果质量。"],
      ["一句话判断", "按工作流选", "不要问哪个最强，先问：我的工作是执行、研究，还是组织思路？"],
    ],
  },
  {
    folder: "06-国内AI工具怎么选",
    title: "国内 AI 工具怎么选",
    summary: "豆包、Kimi、DeepSeek、通义、元宝，各有适合的任务。",
    cards: [
      ["选工具逻辑", "按任务，不按名气", "先问自己要做对话、长文、推理、代码、多模态，还是中文日常助手。"],
      ["豆包", "日常中文助手", "适合中文对话、创作、语音、图片理解和轻量内容生产，门槛低。"],
      ["Kimi", "长文和工作流", "官网突出 Kimi Work、Kimi Code、Scheduled Tasks 等方向，适合长文阅读和任务整理。"],
      ["DeepSeek", "推理和代码", "适合逻辑推演、代码、技术问题和低成本 API 生态观察。"],
      ["通义 / Qwen", "多模态和开源生态", "通义官网展示 Qwen3-Max、Qwen3-Coder、Qwen3-VL、Qwen-Image、Wan 视频模型等能力。"],
      ["腾讯元宝", "中文问答和创作", "定位为智能助手，适合答疑、创作、中文资料处理和日常场景。"],
      ["扣子 / Dify", "工作流和 Bot", "如果你想把 AI 做成固定流程、知识库或自动回复，就要关注这类平台。"],
      ["一句话判断", "工具不是越多越好", "普通人先准备：一个对话工具、一个长文工具、一个搜索研究工具、一个视觉工具。"],
    ],
  },
  {
    folder: "07-普通人AI工具栈",
    title: "2026 普通人 AI 工具栈，不用装太多",
    summary: "按任务准备 5 类工具，比盲目收藏 30 个软件更有效。",
    cards: [
      ["核心观点", "少而稳定", "AI 工具更新很快，普通人不需要追全，只要覆盖自己的高频任务。"],
      ["第 1 类", "对话和写作", "负责标题、文案、方案、总结、脚本、Prompt 打磨。"],
      ["第 2 类", "搜索和研究", "负责查资料、找来源、做对比、整理行业观点。"],
      ["第 3 类", "文档和长文", "负责 PDF、报告、论文、会议纪要、长文章阅读。"],
      ["第 4 类", "图片和设计", "负责封面、配图、海报、视觉草稿、产品图。"],
      ["第 5 类", "Agent 和工作流", "负责多步骤任务、浏览器操作、表格处理、自动化流程。"],
      ["使用原则", "先手动跑通", "在流程没稳定前，不要急着自动化；先知道哪一步重复，才知道该用什么工具。"],
      ["一句话判断", "工具服务于内容", "知识博主真正的壁垒不是软件数量，而是持续判断、整理和表达。"],
    ],
  },
];

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderCard(card, index, post, postIndex) {
  const [label, title, desc] = card;
  const total = post.cards.length;
  const titleClass = [...title].length > 12 ? "title tight" : "title";
  const isCover = index === 0;
  const isFinal = index === total - 1;

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(post.title)}</title>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      width: 1080px;
      height: 1440px;
      overflow: hidden;
      background: #f7f7f1;
      font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", Arial, sans-serif;
      color: #111;
    }
    .page {
      position: relative;
      width: 1080px;
      height: 1440px;
      padding: 70px 72px 58px;
      background:
        linear-gradient(90deg, rgba(20, 20, 20, .045) 1px, transparent 1px) 0 0 / 54px 54px,
        linear-gradient(180deg, rgba(20, 20, 20, .035) 1px, transparent 1px) 0 0 / 54px 54px,
        linear-gradient(135deg, #fbfbf4 0%, #f4f6ee 58%, #edf7f6 100%);
    }
    .page::before {
      content: "";
      position: absolute;
      inset: 30px;
      border: 2px solid #111;
      pointer-events: none;
    }
    .topbar {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 24px;
      align-items: start;
      border-bottom: 3px solid #111;
      padding-bottom: 24px;
    }
    .series {
      font-size: 27px;
      line-height: 1.2;
      font-weight: 900;
      letter-spacing: 0;
    }
    .date {
      padding: 10px 16px;
      background: #111;
      color: #fff;
      font-size: 24px;
      line-height: 1;
      font-weight: 900;
    }
    .main {
      position: relative;
      z-index: 1;
      padding-top: ${isCover ? "116px" : "92px"};
    }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      min-height: 50px;
      padding: 0 16px;
      background: ${isCover ? "#b9ff66" : isFinal ? "#ff7a59" : "#8be9e1"};
      border: 2px solid #111;
      box-shadow: 6px 6px 0 #111;
      font-size: 30px;
      line-height: 1;
      font-weight: 950;
    }
    h1 {
      margin: 38px 0 0;
      max-width: 900px;
      font-size: ${isCover ? "104px" : "94px"};
      line-height: 1.02;
      letter-spacing: 0;
      font-weight: 950;
    }
    h1.tight {
      font-size: ${isCover ? "86px" : "78px"};
      line-height: 1.08;
    }
    .desc {
      margin-top: 42px;
      max-width: 880px;
      padding: 34px 36px;
      background: rgba(255, 255, 255, .76);
      border-left: 10px solid #111;
      border-top: 2px solid #111;
      border-bottom: 2px solid #111;
      font-size: 43px;
      line-height: 1.38;
      font-weight: 800;
    }
    .meta-grid {
      position: absolute;
      left: 72px;
      right: 72px;
      bottom: 178px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      border: 2px solid #111;
      background: #fff;
      z-index: 1;
    }
    .meta-item {
      min-height: 112px;
      padding: 18px 20px;
      border-right: 2px solid #111;
    }
    .meta-item:last-child { border-right: 0; }
    .meta-k {
      font-size: 22px;
      font-weight: 900;
      color: #333;
    }
    .meta-v {
      margin-top: 8px;
      font-size: 31px;
      line-height: 1.18;
      font-weight: 950;
    }
    .ruler {
      position: absolute;
      left: 72px;
      right: 72px;
      bottom: 135px;
      height: 18px;
      background: repeating-linear-gradient(90deg, #111 0 2px, transparent 2px 54px);
      border-bottom: 2px solid #111;
      z-index: 1;
    }
    .footer {
      position: absolute;
      left: 72px;
      right: 72px;
      bottom: 58px;
      display: flex;
      justify-content: space-between;
      align-items: end;
      font-size: 25px;
      line-height: 1.1;
      font-weight: 900;
      z-index: 1;
    }
    .footer .name {
      max-width: 620px;
    }
    .page-no {
      font-size: 42px;
      line-height: 1;
      font-weight: 950;
    }
  </style>
</head>
<body>
  <section class="page">
    <header class="topbar">
      <div class="series">AI工具观察笔记 / ${String(postIndex + 1).padStart(2, "0")}</div>
      <div class="date">2026 · TOOL NOTE</div>
    </header>
    <main class="main">
      <div class="eyebrow">${escapeHtml(label)}</div>
      <h1 class="${titleClass}">${escapeHtml(title)}</h1>
      <div class="desc">${escapeHtml(desc)}</div>
    </main>
    <div class="meta-grid">
      <div class="meta-item">
        <div class="meta-k">观察维度</div>
        <div class="meta-v">定位 / 场景</div>
      </div>
      <div class="meta-item">
        <div class="meta-k">内容原则</div>
        <div class="meta-v">只分享判断</div>
      </div>
      <div class="meta-item">
        <div class="meta-k">结论类型</div>
        <div class="meta-v">${isFinal ? "一句话判断" : "工具观察"}</div>
      </div>
    </div>
    <div class="ruler"></div>
    <footer class="footer">
      <div class="name">${escapeHtml(post.title)}</div>
      <div class="page-no">${index + 1}/${total}</div>
    </footer>
  </section>
</body>
</html>`;
}

function renderCopy(post) {
  const pages = post.cards
    .map(([label, title, desc], index) => `${index + 1}. ${label}｜${title}\n${desc}`)
    .join("\n\n");

  return `# ${post.title}

## 标题
${post.title}

## 正文
${post.summary}

${pages}

${sourceNote.join("\n")}

## 标签
#AI工具 #AI知识博主 #AI工具观察 #AI Agent #人工智能 #效率工具 #知识分享 #科技趋势
`;
}

mkdirSync(targetRoot, { recursive: true });

posts.forEach((post, postIndex) => {
  const outDir = resolve(targetRoot, post.folder);
  const htmlDir = resolve(outDir, "html");
  const pngDir = resolve(outDir, "png");
  mkdirSync(htmlDir, { recursive: true });
  mkdirSync(pngDir, { recursive: true });

  post.cards.forEach((card, cardIndex) => {
    const stem = `card-${String(cardIndex + 1).padStart(2, "0")}`;
    const htmlPath = resolve(htmlDir, `${stem}.html`);
    const pngPath = resolve(pngDir, `${stem}.png`);
    writeFileSync(htmlPath, renderCard(card, cardIndex, post, postIndex), "utf8");
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

  writeFileSync(resolve(outDir, "发布文案.md"), renderCopy(post), "utf8");
});

console.log(`Generated ${posts.length} editorial posts in ${targetRoot}`);
