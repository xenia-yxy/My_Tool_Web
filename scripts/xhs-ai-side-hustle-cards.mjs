import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const outDir = resolve(root, "output/xiaohongshu/ai-side-hustle-01");
const htmlDir = resolve(outDir, "html");
const pngDir = resolve(outDir, "png");

mkdirSync(htmlDir, { recursive: true });
mkdirSync(pngDir, { recursive: true });

const chromeCandidates = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
];

const chrome = chromeCandidates.find((candidate) => existsSync(candidate));

if (!chrome) {
  throw new Error("Chrome executable not found. Install Chrome or update chromeCandidates.");
}

const cards = [
  {
    tag: "AI副业 / 新手避坑",
    kicker: "别急着买课",
    title: "AI副业别乱做",
    subtitle: "普通人先看这 7 个方向",
    body: [
      "很多人一听 AI 副业，就先去买课、囤工具、收藏一堆教程。",
      "但新手最该做的不是学习更多，而是先找到一个能测试的小方向。",
    ],
    callout: "先用 7 天验证，再决定要不要投入时间。",
    footer: "第 1/8 页",
    variant: "cover",
  },
  {
    tag: "核心认知",
    kicker: "先说结论",
    title: "AI不是暴富按钮",
    subtitle: "它更像一个低成本试错工具",
    body: [
      "AI 能帮你省时间、批量产出、快速搭框架。",
      "但它不能替你判断需求，也不能保证你发一篇就赚钱。",
    ],
    bullets: ["先选人群", "再选场景", "最后才选工具"],
    footer: "第 2/8 页",
  },
  {
    tag: "方向 01",
    kicker: "不露脸也能做",
    title: "AI小红书图文号",
    subtitle: "适合没经验的新手先练手",
    body: [
      "用 AI 做选题、标题、封面文案、正文大纲，再用固定模板出图。",
      "重点不是日更很多篇，而是每篇都测试一个明确痛点。",
    ],
    callout: "适合：不会出镜、想做内容资产的人。",
    footer: "第 3/8 页",
  },
  {
    tag: "方向 02",
    kicker: "最适合资料变现",
    title: "AI资料包 / 模板",
    subtitle: "把复杂流程整理成可复制文件",
    body: [
      "比如选题表、Prompt 模板、图文模板、工具清单、7 天测试表。",
      "资料包能不能卖，关键看它是否解决一个具体问题。",
    ],
    callout: "不要卖“大全”，要卖“拿来就能用”。",
    footer: "第 4/8 页",
  },
  {
    tag: "方向 03",
    kicker: "职场人更容易付费",
    title: "简历 / PPT / 方案服务",
    subtitle: "AI 出初稿，人来做判断和润色",
    body: [
      "你可以用 AI 快速搭简历框架、PPT 大纲、汇报方案、活动策划。",
      "真正有价值的是：你帮别人把模糊需求变成清晰结果。",
    ],
    callout: "适合：有职场经验、愿意做交付的人。",
    footer: "第 5/8 页",
  },
  {
    tag: "方向 04 - 05",
    kicker: "内容和工具两条路",
    title: "AI图片定制 / 工具教程",
    subtitle: "一个偏交付，一个偏流量",
    body: [
      "AI 图片定制：头像、封面、海报、产品场景图。",
      "AI 工具教程：每天实测一个工具，讲清楚适合谁、怎么用、值不值。",
    ],
    callout: "后期接广告，工具教程号更有优势。",
    footer: "第 6/8 页",
  },
  {
    tag: "新手行动表",
    kicker: "别空想，先测试",
    title: "7天只测一个方向",
    subtitle: "用数据决定下一步",
    steps: [
      ["第 1 天", "选一个人群和一个痛点"],
      ["第 2-3 天", "发 2 篇图文测试收藏"],
      ["第 4-5 天", "整理一个免费资料包"],
      ["第 6 天", "看评论和私信需求"],
      ["第 7 天", "决定继续、换题或做付费版"],
    ],
    footer: "第 7/8 页",
  },
  {
    tag: "免费资料",
    kicker: "给新手的启动包",
    title: "我整理了一份清单",
    subtitle: "适合先拿去测试，不用先买课",
    body: [
      "里面包括：30 个 AI 副业方向、50 个小红书选题、20 条 Prompt、5 个图文模板、1 张 7 天测试表。",
      "先跑一轮，再决定你适合做哪条线。",
    ],
    callout: "需要《普通人 AI 副业启动包》\n评论区打：AI",
    footer: "第 8/8 页",
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
  const bodyHtml = card.body
    ? `<div class="body">${card.body.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</div>`
    : "";

  const bulletsHtml = card.bullets
    ? `<div class="pill-row">${card.bullets.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>`
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
      background: #f2f4ee;
      font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", Arial, sans-serif;
    }
    .card {
      position: relative;
      width: 1080px;
      height: 1440px;
      padding: 78px 74px 62px;
      color: #141414;
      background:
        radial-gradient(circle at 94% 8%, rgba(255, 111, 97, 0.22), transparent 26%),
        radial-gradient(circle at 6% 88%, rgba(34, 139, 230, 0.2), transparent 28%),
        linear-gradient(135deg, #fffdf7 0%, #f4f7ec 58%, #e9f2ff 100%);
    }
    .card::before {
      content: "";
      position: absolute;
      inset: 28px;
      border: 3px solid #1b1b1b;
      border-radius: 34px;
      pointer-events: none;
    }
    .brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 22px;
      position: relative;
      z-index: 1;
    }
    .tag {
      display: inline-flex;
      align-items: center;
      min-height: 54px;
      padding: 0 24px;
      border: 2px solid #1b1b1b;
      border-radius: 999px;
      background: #ffffff;
      font-size: 27px;
      font-weight: 800;
    }
    .series {
      font-size: 27px;
      font-weight: 800;
      color: #3f4a3d;
    }
    .main {
      position: relative;
      z-index: 1;
      padding-top: 110px;
    }
    .kicker {
      display: inline-block;
      margin-bottom: 28px;
      padding: 12px 18px;
      background: #ffdf5d;
      border: 3px solid #1b1b1b;
      box-shadow: 8px 8px 0 #1b1b1b;
      font-size: 35px;
      line-height: 1.08;
      font-weight: 900;
    }
    h1 {
      margin: 0;
      max-width: 900px;
      font-size: 112px;
      line-height: 1.02;
      letter-spacing: 0;
      font-weight: 950;
    }
    .standard h1 {
      font-size: 94px;
    }
    .end h1 {
      font-size: 92px;
    }
    .subtitle {
      margin-top: 28px;
      max-width: 860px;
      font-size: 46px;
      line-height: 1.22;
      font-weight: 850;
      color: #304036;
    }
    .body {
      margin-top: 54px;
      display: grid;
      gap: 24px;
      max-width: 850px;
    }
    .body p {
      margin: 0;
      padding: 24px 28px;
      border: 3px solid #1b1b1b;
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.82);
      box-shadow: 8px 8px 0 rgba(27, 27, 27, 0.92);
      font-size: 37px;
      line-height: 1.42;
      font-weight: 700;
    }
    .pill-row {
      margin-top: 54px;
      display: flex;
      flex-wrap: wrap;
      gap: 18px;
    }
    .pill-row span {
      padding: 20px 28px;
      border: 3px solid #1b1b1b;
      border-radius: 999px;
      background: #ffffff;
      box-shadow: 6px 6px 0 #1b1b1b;
      font-size: 36px;
      font-weight: 900;
    }
    .callout {
      position: absolute;
      left: 74px;
      right: 74px;
      bottom: 148px;
      padding: 28px 34px;
      border: 4px solid #1b1b1b;
      border-radius: 28px;
      background: #172118;
      color: #ffffff;
      box-shadow: 10px 10px 0 #ff6f61;
      font-size: 39px;
      line-height: 1.28;
      font-weight: 900;
      z-index: 1;
    }
    .steps {
      margin-top: 54px;
      display: grid;
      gap: 19px;
      max-width: 880px;
    }
    .step {
      display: grid;
      grid-template-columns: 210px 1fr;
      align-items: center;
      min-height: 96px;
      overflow: hidden;
      border: 3px solid #1b1b1b;
      border-radius: 24px;
      background: #ffffff;
      box-shadow: 7px 7px 0 #1b1b1b;
    }
    .step-day {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 14px;
      background: #8bd3dd;
      border-right: 3px solid #1b1b1b;
      font-size: 30px;
      font-weight: 950;
    }
    .step-text {
      padding: 18px 24px;
      font-size: 35px;
      line-height: 1.22;
      font-weight: 850;
    }
    .footer {
      position: absolute;
      left: 74px;
      right: 74px;
      bottom: 67px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #364036;
      font-size: 27px;
      font-weight: 800;
      z-index: 1;
    }
    .footer::before {
      content: "普通人AI副业资料库";
    }
    .cover .main {
      padding-top: 142px;
    }
    .cover h1 {
      font-size: 126px;
      max-width: 820px;
    }
    .cover .subtitle {
      font-size: 52px;
    }
    .cover .body p {
      font-size: 36px;
    }
    .end .callout {
      background: #ffdf5d;
      color: #111111;
      box-shadow: 10px 10px 0 #1b1b1b;
      text-align: center;
      font-size: 46px;
    }
    .page-mark {
      position: absolute;
      right: 72px;
      top: 190px;
      width: 126px;
      height: 126px;
      border: 3px solid #1b1b1b;
      border-radius: 50%;
      background: #ff6f61;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 42px;
      font-weight: 950;
      box-shadow: 7px 7px 0 #1b1b1b;
      z-index: 1;
    }
  </style>
</head>
<body>
  <section class="${classes}">
    <div class="brand">
      <div class="tag">${escapeHtml(card.tag)}</div>
      <div class="series">7天测试法</div>
    </div>
    <div class="page-mark">${String(index + 1).padStart(2, "0")}</div>
    <main class="main">
      <div class="kicker">${escapeHtml(card.kicker)}</div>
      <h1>${escapeHtml(card.title)}</h1>
      <div class="subtitle">${escapeHtml(card.subtitle)}</div>
      ${bodyHtml}
      ${bulletsHtml}
      ${stepsHtml}
    </main>
    ${calloutHtml}
    <div class="footer"><span>${escapeHtml(card.footer)}</span></div>
  </section>
</body>
</html>`;
}

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

const copy = `# 小红书图文 01：普通人想做 AI 副业，先别急着买课

## 标题
普通人想做 AI 副业，先别急着买课，先看这 7 个方向

## 正文
很多人一听 AI 副业，就先去买课、囤工具、收藏一堆教程。

但新手最该做的不是学习更多，而是先找到一个能测试的小方向。

AI 不是暴富按钮，它更像一个低成本试错工具。你可以用它做选题、写初稿、搭框架、整理资料、生成封面文案，但真正决定能不能做起来的，是你有没有找到具体人群和具体需求。

我建议新手先看这几个方向：

1. AI 小红书图文号：适合不露脸、想做内容资产的人。
2. AI 资料包/模板：适合把流程、Prompt、表格整理成可复制文件。
3. AI 简历/PPT/方案服务：适合有职场经验、愿意做交付的人。
4. AI 图片定制：适合做头像、封面、海报、产品场景图。
5. AI 工具教程号：适合后期接广告和工具推广。

新手不要一上来就追求变现，先用 7 天测试一个方向：

第 1 天：选一个人群和一个痛点。
第 2-3 天：发 2 篇图文测试收藏。
第 4-5 天：整理一个免费资料包。
第 6 天：看评论和私信需求。
第 7 天：决定继续、换题或做付费版。

我也整理了一份《普通人 AI 副业启动包》，里面包括 30 个 AI 副业方向、50 个小红书选题、20 条 Prompt、5 个图文模板、1 张 7 天测试表。

需要的可以在评论区打：AI

## 标签
#AI副业 #AI工具 #小红书运营 #不露脸账号 #副业思路 #普通人副业 #AI提效 #资料包

## 置顶评论
整理好了《普通人 AI 副业启动包》，包括方向清单、选题表、Prompt 和 7 天测试表。需要的评论“AI”。
`;

writeFileSync(resolve(outDir, "post-copy.md"), copy, "utf8");

console.log(`Generated ${cards.length} cards in ${pngDir}`);
