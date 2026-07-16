import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const targetRoot = "E:\\.AAA_profile\\4.副业知识\\小红书\\09-AI知识博主多风格内容包";

const chromeCandidates = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
];

const chrome = chromeCandidates.find((candidate) => existsSync(candidate));
if (!chrome) throw new Error("Chrome executable not found.");

const posts = [
  {
    style: "radar",
    folder: "01-热点雷达-AI-Agent为什么是主线",
    title: "AI Agent 为什么是 2026 主线",
    subtitle: "从会聊天，到能拆任务、调工具、交付结果",
    pages: [
      ["核心判断", "AI 的竞争正在从模型参数，转向谁能把任务真正完成。"],
      ["变化 1", "聊天框解决的是问答，Agent 解决的是流程。"],
      ["变化 2", "浏览器、文档、表格、PPT 会变成 Agent 的操作对象。"],
      ["变化 3", "WorkBuddy、Manus、Genspark、Flowith 都在抢 AI 工作台入口。"],
      ["普通人看点", "不是追每个新工具，而是观察哪些任务能被稳定托管。"],
      ["一句话", "AI Agent 火，不是因为更会说，而是因为开始更会做。"],
    ],
  },
  {
    style: "radar",
    folder: "02-热点雷达-AI浏览器会成为入口吗",
    title: "AI 浏览器会成为新入口吗",
    subtitle: "当 AI 能打开网页、点按钮、整理信息，搜索会变成执行",
    pages: [
      ["核心判断", "AI 浏览器的重点不是换个搜索框，而是让 AI 进入真实网页流程。"],
      ["代表方向", "Browser Operator、AI Browser、浏览器 Agent 都在做同一件事。"],
      ["能做什么", "查资料、打开页面、比价、填表、整理表格、跨网站收集信息。"],
      ["风险点", "登录态、权限、隐私、支付页面，都需要明确边界。"],
      ["内容角度", "适合做成“AI 能不能替我完成某个网页任务”的实测系列。"],
      ["一句话", "AI 浏览器不是浏览器换皮，而是 Agent 的手和眼睛。"],
    ],
  },
  {
    style: "radar",
    folder: "03-热点雷达-AI视频工具下半场",
    title: "AI 视频工具进入下半场",
    subtitle: "不只看能不能生成，而要看镜头、人物、成本和稳定性",
    pages: [
      ["核心判断", "AI 视频从炫技，进入短视频创作者能否长期使用的阶段。"],
      ["国外工具", "Sora、Veo、Runway、Pika 更适合观察画面控制和模型能力。"],
      ["国内工具", "可灵、即梦、海螺等更贴近中文创作和本地平台生态。"],
      ["关键指标", "人物一致性、镜头稳定、中文理解、可修改性、生成成本。"],
      ["内容角度", "不要做“谁最强”，做“哪个场景最适合哪个工具”。"],
      ["一句话", "AI 视频的价值，不在一条惊艳样片，而在能不能稳定复用。"],
    ],
  },
  {
    style: "radar",
    folder: "04-热点雷达-Coding-Agent普通人也要懂",
    title: "Coding Agent 普通人也要懂",
    subtitle: "不是人人都要写代码，而是更多工具会被 AI 自动搭出来",
    pages: [
      ["核心判断", "Coding Agent 会让小工具、自动化脚本、数据处理变得更低门槛。"],
      ["代表工具", "Codex、Claude Code、Cursor、Trae、通义灵码都在抢开发工作流。"],
      ["对知识博主", "可以用它做选题表、数据整理脚本、网页落地页、工具导航。"],
      ["边界", "不会技术的人可以做原型，但上线、支付、隐私仍要谨慎。"],
      ["内容角度", "适合做“我用 AI 搭一个小工具”的过程型笔记。"],
      ["一句话", "Coding Agent 的本质，是把想法到工具的距离变短。"],
    ],
  },
  {
    style: "matrix",
    folder: "05-工具矩阵-AI搜索工具怎么选",
    title: "AI 搜索工具怎么选",
    subtitle: "搜索不是找答案，而是建立可靠材料链",
    pages: [
      ["Perplexity", "适合查资料、看来源、做研究型问答。"],
      ["Genspark", "适合从搜索走到报告、文档、Slides。"],
      ["Google/Gemini", "适合结合 Google 生态和多模态信息。"],
      ["秘塔/夸克/国内搜索", "适合中文资料、本地内容和移动端检索。"],
      ["选择标准", "看来源透明度、总结质量、中文能力、导出能力。"],
      ["一句话", "知识博主选 AI 搜索，最重要的是可核查，而不是回答快。"],
    ],
  },
  {
    style: "matrix",
    folder: "06-工具矩阵-AI设计工具怎么选",
    title: "AI 设计工具怎么选",
    subtitle: "不会设计的人，先选能稳定出封面和视觉草稿的工具",
    pages: [
      ["Midjourney", "适合高质量视觉概念和风格探索。"],
      ["Lovart", "适合观察 AI 设计 Agent 和品牌视觉工作流。"],
      ["Canva/稿定类", "适合模板化封面、海报、社媒图。"],
      ["即梦/通义万相", "适合中文提示词、国内场景和平台素材。"],
      ["选择标准", "看中文理解、文字准确、模板效率、可修改性。"],
      ["一句话", "知识博主的设计目标不是艺术感，而是清楚、统一、可复用。"],
    ],
  },
  {
    style: "matrix",
    folder: "07-工具矩阵-国内AI应用怎么选",
    title: "国内 AI 应用怎么选",
    subtitle: "按任务选：对话、长文、推理、多模态、工作流",
    pages: [
      ["豆包", "适合日常中文对话、语音、创作和轻量图文。"],
      ["Kimi", "适合长文阅读、资料整理、文档分析和任务计划。"],
      ["DeepSeek", "适合推理、代码、技术问答和 API 生态观察。"],
      ["通义/Qwen", "适合多模态、开源生态、图片、代码、视频模型观察。"],
      ["元宝/扣子/Dify", "一个偏中文助手，一个偏 Bot 和工作流搭建。"],
      ["一句话", "国内工具不是替代关系，而是中文场景下的任务分工。"],
    ],
  },
  {
    style: "matrix",
    folder: "08-工具矩阵-国际AI工作台怎么选",
    title: "国际 AI 工作台怎么选",
    subtitle: "Manus、Genspark、Flowith、Notion AI 解决的不是同一个问题",
    pages: [
      ["Manus", "适合明确目标后的多步骤执行和成品交付。"],
      ["Genspark", "适合研究、搜索、文档、Slides 和内容资料整理。"],
      ["Flowith", "适合复杂思考、项目画布、分支结构和长期上下文。"],
      ["Notion AI", "适合团队知识库、文档协作和内部内容沉淀。"],
      ["选择标准", "先看你要交付成品、整理资料，还是管理项目。"],
      ["一句话", "AI 工作台的竞争，是谁能成为你的第二工作桌面。"],
    ],
  },
  {
    style: "flow",
    folder: "09-方法流程-知识博主每天怎么选题",
    title: "AI 知识博主每天怎么选题",
    subtitle: "别等灵感，用固定流程筛内容",
    pages: [
      ["第 1 步", "看热点：模型发布、工具更新、行业报告、产品融资。"],
      ["第 2 步", "找冲突：它解决了什么问题？和旧工具有什么不同？"],
      ["第 3 步", "定人群：职场人、内容创作者、学生、创业者、程序员。"],
      ["第 4 步", "选角度：解释型、对比型、实测型、避坑型、趋势型。"],
      ["第 5 步", "写结论：先给判断，再给证据，不写流水账。"],
      ["一句话", "选题不是找新闻，而是把新闻转成普通人能理解的问题。"],
    ],
  },
  {
    style: "flow",
    folder: "10-方法流程-工具测评文章怎么写",
    title: "工具测评文章怎么写",
    subtitle: "不要介绍功能，要回答值不值得用",
    pages: [
      ["第 1 页", "一句话定位：这个工具到底是什么。"],
      ["第 2 页", "最近变化：为什么现在值得聊。"],
      ["第 3 页", "使用场景：普通人可以拿它做什么。"],
      ["第 4 页", "对比对象：它和同类工具差在哪里。"],
      ["第 5 页", "使用边界：不适合什么人，哪里容易踩坑。"],
      ["第 6 页", "个人判断：一句话结论，不做夸张推荐。"],
    ],
  },
  {
    style: "flow",
    folder: "11-方法流程-一周内容节奏",
    title: "AI 知识号一周内容节奏",
    subtitle: "热点、工具、方法、复盘要混合发",
    pages: [
      ["周一", "热点解释：把一个新模型或新功能讲清楚。"],
      ["周二", "工具观察：拆一个新 AI 软件的定位和场景。"],
      ["周三", "工具对比：同类 3 个工具怎么选。"],
      ["周四", "方法教程：一个具体工作流怎么跑。"],
      ["周五", "行业趋势：Agent、视频、搜索、浏览器、工作台。"],
      ["周末", "复盘整理：本周 AI 工具有哪些真正值得记住。"],
    ],
  },
  {
    style: "flow",
    folder: "12-方法流程-从内容到收入路线",
    title: "从内容到收入的路线",
    subtitle: "先做信任，再做产品，最后做合作",
    pages: [
      ["阶段 1", "内容资产：稳定输出热点解释、工具观察、方法流程。"],
      ["阶段 2", "需求验证：看哪些主题收藏、转发、搜索和主页访问更高。"],
      ["阶段 3", "轻产品：把高频问题沉淀成工具表、模板、课程小节。"],
      ["阶段 4", "服务化：账号诊断、工作流搭建、企业内训、工具选型。"],
      ["阶段 5", "商业合作：工具赞助、广告、联合直播、课程分销。"],
      ["一句话", "知识博主变现的前提，是持续提供清晰判断，而不是先卖东西。"],
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

function theme(style) {
  if (style === "matrix") {
    return {
      bg: "#111318",
      fg: "#f4f1e8",
      accent: "#7cf7d4",
      soft: "rgba(124,247,212,.12)",
      label: "工具矩阵",
    };
  }
  if (style === "flow") {
    return {
      bg: "#f5efe3",
      fg: "#16130f",
      accent: "#ff7a59",
      soft: "#fffaf0",
      label: "方法流程",
    };
  }
  return {
    bg: "#eef4ff",
    fg: "#111827",
    accent: "#315cff",
    soft: "#ffffff",
    label: "热点雷达",
  };
}

function renderCard(post, page, index, postIndex) {
  const t = theme(post.style);
  const [kicker, detail] = page;
  const headline = index === 0 ? post.title : kicker;
  const total = post.pages.length;
  const titleClass = [...headline].length > 13 ? "tight" : "";

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
      font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", Arial, sans-serif;
      color: ${t.fg};
      background: ${t.bg};
    }
    .card {
      position: relative;
      width: 1080px;
      height: 1440px;
      padding: 72px;
      background:
        ${post.style === "matrix"
          ? `linear-gradient(90deg, rgba(255,255,255,.055) 1px, transparent 1px) 0 0 / 64px 64px,
             linear-gradient(180deg, rgba(255,255,255,.04) 1px, transparent 1px) 0 0 / 64px 64px,
             ${t.bg}`
          : post.style === "flow"
            ? `radial-gradient(circle at 88% 12%, rgba(255,122,89,.20), transparent 25%),
               linear-gradient(180deg, #f8f0df 0%, #f5efe3 100%)`
            : `radial-gradient(circle at 12% 12%, rgba(49,92,255,.16), transparent 25%),
               radial-gradient(circle at 92% 82%, rgba(124,247,212,.30), transparent 27%),
               ${t.bg}`};
    }
    .frame {
      position: absolute;
      inset: 34px;
      border: ${post.style === "matrix" ? "2px solid rgba(244,241,232,.75)" : "2px solid #111"};
      pointer-events: none;
    }
    .top {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 24px;
      border-bottom: ${post.style === "matrix" ? "2px solid rgba(244,241,232,.65)" : "2px solid #111"};
      font-size: 27px;
      font-weight: 900;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 12px 18px;
      background: ${t.accent};
      color: ${post.style === "matrix" ? "#07110e" : post.style === "radar" ? "#fff" : "#111"};
      font-weight: 950;
      font-size: 31px;
      border: ${post.style === "matrix" ? "0" : "2px solid #111"};
      box-shadow: ${post.style === "flow" ? "7px 7px 0 #111" : "none"};
    }
    .main {
      position: relative;
      z-index: 1;
      padding-top: 112px;
    }
    h1 {
      margin: 36px 0 0;
      max-width: 900px;
      font-size: 96px;
      line-height: 1.04;
      letter-spacing: 0;
      font-weight: 950;
    }
    h1.tight {
      font-size: 80px;
      line-height: 1.08;
    }
    .detail {
      margin-top: 58px;
      max-width: 880px;
      min-height: 245px;
      padding: 36px 38px;
      background: ${t.soft};
      border: ${post.style === "matrix" ? "2px solid rgba(244,241,232,.62)" : "2px solid #111"};
      font-size: 43px;
      line-height: 1.38;
      font-weight: 780;
    }
    .index {
      position: absolute;
      left: 72px;
      right: 72px;
      bottom: 192px;
      display: grid;
      grid-template-columns: repeat(${total}, 1fr);
      height: 18px;
      gap: 10px;
      z-index: 1;
    }
    .dot {
      background: ${post.style === "matrix" ? "rgba(244,241,232,.22)" : "rgba(17,17,17,.16)"};
    }
    .dot.active {
      background: ${t.accent};
    }
    .footer {
      position: absolute;
      left: 72px;
      right: 72px;
      bottom: 72px;
      display: flex;
      justify-content: space-between;
      align-items: end;
      z-index: 1;
      font-size: 26px;
      line-height: 1.15;
      font-weight: 900;
    }
    .post-title {
      max-width: 700px;
    }
    .page-no {
      font-size: 54px;
      line-height: 1;
      font-weight: 950;
    }
  </style>
</head>
<body>
  <section class="card">
    <div class="frame"></div>
    <header class="top">
      <div>${escapeHtml(t.label)} / ${String(postIndex + 1).padStart(2, "0")}</div>
      <div>AI KNOWLEDGE NOTE</div>
    </header>
    <main class="main">
      <div class="badge">${escapeHtml(kicker)}</div>
      <h1 class="${titleClass}">${escapeHtml(headline)}</h1>
      <div class="detail">${escapeHtml(detail)}</div>
    </main>
    <div class="index">
      ${post.pages.map((_, i) => `<div class="dot ${i === index ? "active" : ""}"></div>`).join("")}
    </div>
    <footer class="footer">
      <div class="post-title">${escapeHtml(post.title)}</div>
      <div class="page-no">${index + 1}/${total}</div>
    </footer>
  </section>
</body>
</html>`;
}

function renderCopy(post) {
  return `# ${post.title}

## 标题
${post.title}

## 正文
${post.subtitle}

${post.pages.map(([k, d], i) => `${i + 1}. ${k}\n${d}`).join("\n\n")}

## 标签
#AI工具 #AI知识博主 #AI工具观察 #AI趋势 #AI工作流 #人工智能 #效率工具 #知识分享
`;
}

mkdirSync(targetRoot, { recursive: true });

posts.forEach((post, postIndex) => {
  const outDir = resolve(targetRoot, post.folder);
  const htmlDir = resolve(outDir, "html");
  const pngDir = resolve(outDir, "png");
  mkdirSync(htmlDir, { recursive: true });
  mkdirSync(pngDir, { recursive: true });

  post.pages.forEach((page, pageIndex) => {
    const stem = `card-${String(pageIndex + 1).padStart(2, "0")}`;
    const htmlPath = resolve(htmlDir, `${stem}.html`);
    const pngPath = resolve(pngDir, `${stem}.png`);
    writeFileSync(htmlPath, renderCard(post, page, pageIndex, postIndex), "utf8");
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

console.log(`Generated ${posts.length} multi-style posts in ${targetRoot}`);
