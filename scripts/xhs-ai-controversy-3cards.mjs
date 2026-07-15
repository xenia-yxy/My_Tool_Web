import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const targetRoot = "E:\\.AAA_profile\\4.副业知识\\小红书\\11-AI争议话题简洁3图";

const chromeCandidates = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
];

const chrome = chromeCandidates.find((candidate) => existsSync(candidate));
if (!chrome) throw new Error("Chrome executable not found.");

const posts = [
  {
    folder: "01-AI会不会替代普通人",
    title: "AI 会不会替代普通人",
    subtitle: "真正危险的不是 AI，而是不会拆任务的人",
    cards: [
      ["争议点", "AI会不会替代普通人？", "很多讨论都把问题说反了：AI 很少直接替代一个完整的人，但会替代一批重复、模糊、低判断含量的任务。"],
      ["关键解释", "岗位不会一下消失，任务会先被重组。", "写初稿、整理资料、做表格、生成图片、查信息，这些环节会越来越便宜。真正值钱的是判断、选择、复核和交付。"],
      ["我的判断", "会用 AI 的人，会先替代不会拆任务的人。", "普通人要练的不是会多少工具，而是把一个工作拆成 AI 能执行的步骤，再判断结果是否可靠。"],
    ],
  },
  {
    folder: "02-AI-Agent是不是噱头",
    title: "AI Agent 是不是噱头",
    subtitle: "现在有泡沫，但方向不是假的",
    cards: [
      ["争议点", "AI Agent 是真趋势，还是新包装？", "很多产品确实只是把聊天机器人换了名字，但 Agent 这个方向本身不是噱头。"],
      ["关键解释", "判断标准只有一个：能不能完成多步骤任务。", "如果它只能回答问题，就还是聊天工具；如果它能拆目标、调用工具、保留上下文、交付结果，才接近 Agent。"],
      ["我的判断", "短期过热，长期重要。", "普通人不用追每个 Agent 工具，但要理解：AI 正在从“回答”走向“执行”。这会影响办公、搜索、浏览器和内容生产。"],
    ],
  },
  {
    folder: "03-国产AI工具够不够用",
    title: "国产 AI 工具够不够用",
    subtitle: "大多数中文场景，已经够用了",
    cards: [
      ["争议点", "一定要用国外 AI 工具吗？", "不一定。对中文写作、日常问答、长文阅读、资料整理、图片视频创作，国产工具已经覆盖很多场景。"],
      ["关键解释", "国外强在前沿能力，国内强在中文生态。", "ChatGPT、Claude、Gemini 适合看综合能力；豆包、Kimi、DeepSeek、通义、元宝更贴近中文资料和本地平台。"],
      ["我的判断", "先用国内工具跑通流程，再考虑国外工具补强。", "工具选择不是站队。普通人应该按任务选：长文用长文工具，推理用推理工具，设计用视觉工具。"],
    ],
  },
  {
    folder: "04-AI视频是不是泡沫",
    title: "AI 视频是不是泡沫",
    subtitle: "样片很热，稳定复用才是真门槛",
    cards: [
      ["争议点", "AI 视频是不是又一波泡沫？", "有泡沫。很多演示片很好看，但真正用于日常创作时，会遇到人物一致、镜头控制、修改成本的问题。"],
      ["关键解释", "短视频创作者看的是可控性。", "不是谁生成一条最惊艳，而是谁能稳定做系列、改镜头、控人物、控成本、适配中文提示词。"],
      ["我的判断", "AI 视频会改变素材生产，但不会立刻替代导演和剪辑。", "它更像低成本素材工厂。先适合广告草稿、分镜、视觉测试和短内容试验。"],
    ],
  },
  {
    folder: "05-知识博主还值不值得做",
    title: "AI 知识博主还值不值得做",
    subtitle: "搬运不值得，判断值钱",
    cards: [
      ["争议点", "AI 内容这么卷，还能做吗？", "如果只是搬运新闻、复制工具介绍，确实越来越难。因为信息本身不稀缺，稀缺的是解释和判断。"],
      ["关键解释", "知识博主的价值不是知道得早，而是讲得清楚。", "用户不缺新闻链接，缺的是：这个工具适合谁？解决什么问题？和我有什么关系？我该不该试？"],
      ["我的判断", "还能做，但要从信息号变成判断号。", "你的壁垒应该是工具地图、场景拆解、工作流方法，而不是每天追最多热点。"],
    ],
  },
  {
    folder: "06-AI工具越多越好吗",
    title: "AI 工具越多越好吗",
    subtitle: "工具越多，不一定效率越高",
    cards: [
      ["争议点", "是不是要收藏很多 AI 工具？", "很多人收藏了几十个工具，但真正稳定使用的只有两三个。工具太多，反而会让执行变慢。"],
      ["关键解释", "工具应该围绕工作流，而不是围绕焦虑。", "普通人先准备 5 类就够：对话写作、搜索研究、长文文档、图片设计、Agent 工作流。"],
      ["我的判断", "少而稳定，比多而混乱更重要。", "真正的效率来自固定流程：选题、查资料、写结构、做图、复盘。工具只是流程里的组件。"],
    ],
  },
  {
    folder: "07-用AI写内容会不会没原创",
    title: "用 AI 写内容会不会没原创",
    subtitle: "原创不是不用 AI，而是你有自己的判断",
    cards: [
      ["争议点", "用 AI 写内容，还算原创吗？", "如果只是复制 AI 输出，当然没什么原创价值。但把 AI 当资料助理、结构助理、编辑助理，是另一回事。"],
      ["关键解释", "原创的核心是判断，不是手打每个字。", "选题角度、案例取舍、观点排序、结论判断，才是知识内容真正的原创部分。"],
      ["我的判断", "AI 可以参与生产，但不能替代立场。", "知识博主要避免 AI 味，最重要的是加入自己的观察、反例、边界和经验判断。"],
    ],
  },
  {
    folder: "08-普通人学AI要不要学编程",
    title: "普通人学 AI 要不要学编程",
    subtitle: "不一定先学代码，但要懂工作流",
    cards: [
      ["争议点", "学 AI 是不是必须学编程？", "不是每个人都要写代码。对大多数普通人，先学会用 AI 做内容、资料、办公和自动化更实际。"],
      ["关键解释", "编程是放大器，不是入场券。", "会编程的人能搭工具、接 API、做自动化；不会编程的人也可以先用现成工具跑通自己的流程。"],
      ["我的判断", "先学场景，再学工具，最后再决定要不要学代码。", "如果你已经明确要做网站、插件、自动化系统，再学编程或用 Coding Agent 会更有效。"],
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

function renderCard(post, card, index, postIndex) {
  const [label, title, body] = card;
  const colors = [
    ["#fff7ed", "#ff6b35"],
    ["#eef6ff", "#2d6cdf"],
    ["#f3f8ef", "#55a630"],
  ][index];
  const titleClass = [...title].length > 12 ? "tight" : "";

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
      color: #111;
      background: ${colors[0]};
    }
    .card {
      position: relative;
      width: 1080px;
      height: 1440px;
      padding: 82px 78px 68px;
      background:
        linear-gradient(90deg, rgba(17,17,17,.045) 1px, transparent 1px) 0 0 / 72px 72px,
        ${colors[0]};
    }
    .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 28px;
      border-bottom: 3px solid #111;
      font-size: 28px;
      font-weight: 900;
    }
    .main {
      padding-top: 116px;
    }
    .label {
      display: inline-block;
      padding: 12px 20px;
      background: ${colors[1]};
      color: #fff;
      font-size: 34px;
      font-weight: 950;
      box-shadow: 8px 8px 0 #111;
    }
    h1 {
      margin: 48px 0 0;
      max-width: 900px;
      font-size: 104px;
      line-height: 1.04;
      letter-spacing: 0;
      font-weight: 950;
    }
    h1.tight {
      font-size: 86px;
      line-height: 1.08;
    }
    .body {
      margin-top: 66px;
      padding: 42px 44px;
      min-height: 330px;
      border: 3px solid #111;
      background: rgba(255, 255, 255, .78);
      font-size: 43px;
      line-height: 1.42;
      font-weight: 780;
    }
    .footer {
      position: absolute;
      left: 78px;
      right: 78px;
      bottom: 72px;
      display: flex;
      justify-content: space-between;
      align-items: end;
      border-top: 3px solid #111;
      padding-top: 28px;
      font-size: 27px;
      font-weight: 900;
    }
    .page {
      font-size: 56px;
      line-height: 1;
      font-weight: 950;
    }
  </style>
</head>
<body>
  <section class="card">
    <header class="top">
      <div>AI争议观察 / ${String(postIndex + 1).padStart(2, "0")}</div>
      <div>3 CARD NOTE</div>
    </header>
    <main class="main">
      <div class="label">${escapeHtml(label)}</div>
      <h1 class="${titleClass}">${escapeHtml(title)}</h1>
      <div class="body">${escapeHtml(body)}</div>
    </main>
    <footer class="footer">
      <div>${escapeHtml(post.title)}</div>
      <div class="page">${index + 1}/3</div>
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

${post.cards.map(([label, title, body], index) => `${index + 1}. ${label}｜${title}\n${body}`).join("\n\n")}

## 标签
#AI工具 #AI争议 #AI知识博主 #人工智能 #AI趋势 #知识分享 #AI Agent #效率工具
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
    writeFileSync(htmlPath, renderCard(post, card, cardIndex, postIndex), "utf8");
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

console.log(`Generated ${posts.length} controversy posts in ${targetRoot}`);
