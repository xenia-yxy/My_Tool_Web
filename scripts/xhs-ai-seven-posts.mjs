import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const targetRoot = "E:\\.AAA_profile\\4.副业知识\\小红书";

const chromeCandidates = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
];

const chrome = chromeCandidates.find((candidate) => existsSync(candidate));

if (!chrome) {
  throw new Error("Chrome executable not found. Install Chrome or update chromeCandidates.");
}

const commonTags = "#AI副业 #AI工具 #小红书运营 #不露脸账号 #副业思路 #普通人副业 #AI提效 #资料包";

const posts = [
  {
    folder: "01-AI副业别乱做",
    title: "普通人想做 AI 副业，先别急着买课，先看这 7 个方向",
    keyword: "AI",
    resource: "普通人 AI 副业启动包",
    cards: [
      {
        tag: "AI副业 / 新手避坑",
        kicker: "别急着买课",
        title: "AI副业别乱做",
        subtitle: "普通人先看这 7 个方向",
        body: ["很多人一听 AI 副业，就先去买课、囤工具、收藏一堆教程。", "但新手最该做的不是学习更多，而是先找到一个能测试的小方向。"],
        callout: "先用 7 天验证，再决定要不要投入时间。",
        variant: "cover",
      },
      {
        tag: "核心认知",
        kicker: "先说结论",
        title: "AI不是暴富按钮",
        subtitle: "它更像一个低成本试错工具",
        body: ["AI 能帮你省时间、批量产出、快速搭框架。", "但它不能替你判断需求，也不能保证你发一篇就赚钱。"],
        bullets: ["先选人群", "再选场景", "最后才选工具"],
      },
      {
        tag: "方向 01",
        kicker: "不露脸也能做",
        title: "AI小红书图文号",
        subtitle: "适合没经验的新手先练手",
        body: ["用 AI 做选题、标题、封面文案、正文大纲，再用固定模板出图。", "重点不是日更很多篇，而是每篇都测试一个明确痛点。"],
        callout: "适合：不会出镜、想做内容资产的人。",
      },
      {
        tag: "方向 02",
        kicker: "最适合资料变现",
        title: "AI资料包 / 模板",
        subtitle: "把复杂流程整理成可复制文件",
        body: ["比如选题表、Prompt 模板、图文模板、工具清单、7 天测试表。", "资料包能不能卖，关键看它是否解决一个具体问题。"],
        callout: "不要卖“大全”，要卖“拿来就能用”。",
      },
      {
        tag: "方向 03",
        kicker: "职场人更容易付费",
        title: "简历 / PPT / 方案服务",
        subtitle: "AI 出初稿，人来做判断和润色",
        body: ["你可以用 AI 快速搭简历框架、PPT 大纲、汇报方案、活动策划。", "真正有价值的是：你帮别人把模糊需求变成清晰结果。"],
        callout: "适合：有职场经验、愿意做交付的人。",
      },
      {
        tag: "方向 04 - 05",
        kicker: "内容和工具两条路",
        title: "AI图片定制 / 工具教程",
        subtitle: "一个偏交付，一个偏流量",
        body: ["AI 图片定制：头像、封面、海报、产品场景图。", "AI 工具教程：每天实测一个工具，讲清楚适合谁、怎么用、值不值。"],
        callout: "后期接广告，工具教程号更有优势。",
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
      },
      {
        tag: "免费资料",
        kicker: "给新手的启动包",
        title: "我整理了一份清单",
        subtitle: "适合先拿去测试，不用先买课",
        body: ["里面包括：30 个 AI 副业方向、50 个小红书选题、20 条 Prompt、5 个图文模板、1 张 7 天测试表。", "先跑一轮，再决定你适合做哪条线。"],
        callout: "需要《普通人 AI 副业启动包》\n评论区打：AI",
        variant: "end",
      },
    ],
    copy: [
      "很多人一听 AI 副业，就先去买课、囤工具、收藏一堆教程。",
      "但新手最该做的不是学习更多，而是先找到一个能测试的小方向。",
      "AI 不是暴富按钮，它更像一个低成本试错工具。你可以用它做选题、写初稿、搭框架、整理资料、生成封面文案，但真正决定能不能做起来的，是你有没有找到具体人群和具体需求。",
      "我建议新手先看这几个方向：AI 小红书图文号、AI 资料包/模板、AI 简历/PPT/方案服务、AI 图片定制、AI 工具教程号。",
      "先用 7 天测试一个方向，看收藏、评论和私信，再决定继续做还是换方向。",
    ],
  },
  {
    folder: "02-不露脸AI图文号5步走",
    title: "不露脸做 AI 图文号，我建议新手按这 5 步走",
    keyword: "图文",
    resource: "AI 图文号流程表",
    cards: [
      {
        tag: "不露脸账号",
        kicker: "新手先做简单版",
        title: "AI图文号5步走",
        subtitle: "不露脸，也能开始测试",
        body: ["不露脸账号不是不能做，关键是内容要稳定、结构要清楚。", "新手别先纠结人设，先把一套可复制流程跑起来。"],
        callout: "目标：先发出 7 篇，再看数据。",
        variant: "cover",
      },
      {
        tag: "第 1 步",
        kicker: "先定人群",
        title: "不要写给所有人",
        subtitle: "越具体，越容易出内容",
        body: ["比如：想做副业的职场人、不会写文案的小白、想做图文号的新手。", "人群越清楚，标题、封面、资料包都会更好做。"],
        callout: "公式：人群 + 痛点 + 可复制方法。",
      },
      {
        tag: "第 2 步",
        kicker: "固定选题",
        title: "只做3类内容",
        subtitle: "别每天临时想发什么",
        bullets: ["避坑类", "模板类", "实测类"],
        body: ["避坑负责停留，模板负责收藏，实测负责信任。", "先用这 3 类跑数据，不要一开始做太杂。"],
      },
      {
        tag: "第 3 步",
        kicker: "批量标题",
        title: "让AI先给20个标题",
        subtitle: "你只负责筛选和改口语化",
        body: ["不要直接用 AI 第一版标题。", "让它按痛点、反常识、清单、结果展示各写 5 个，再挑最像小红书的。"],
        callout: "标题要具体，不要大而空。",
      },
      {
        tag: "第 4 步",
        kicker: "模板化出图",
        title: "封面只放一个钩子",
        subtitle: "正文每页只讲一个点",
        body: ["不露脸图文号最怕信息太散。", "封面负责让人点进来，正文负责让人收藏，最后一页负责评论或私信。"],
        callout: "不要把一页塞成 PPT。",
      },
      {
        tag: "第 5 步",
        kicker: "承接需求",
        title: "评论区要有资料",
        subtitle: "不然流量来了也留不住",
        body: ["每篇笔记只引导一个关键词。", "比如评论“图文”领流程表，评论“AI”领启动包，评论“工具”领清单。"],
        callout: "关键词越简单，评论越容易发生。",
      },
      {
        tag: "7天节奏",
        kicker: "照着发就行",
        title: "第一周这样安排",
        subtitle: "先跑通，不追求完美",
        steps: [
          ["第 1 天", "账号定位 + 第 1 篇避坑"],
          ["第 2 天", "发模板类内容"],
          ["第 3 天", "发工具实测"],
          ["第 4 天", "整理免费资料"],
          ["第 5-7 天", "重复测试标题和封面"],
        ],
      },
      {
        tag: "免费资料",
        kicker: "流程表给你",
        title: "想做图文号",
        subtitle: "先把这套流程跑一遍",
        body: ["我整理了 AI 图文号流程表：定位、选题、标题、封面、正文、评论引导。", "新手先照着发 7 篇，再复盘数据。"],
        callout: "需要《AI 图文号流程表》\n评论区打：图文",
        variant: "end",
      },
    ],
    copy: [
      "不露脸账号可以做，但不要一开始就想着做得很复杂。",
      "新手先跑通 5 步：定人群、固定 3 类选题、AI 批量标题、模板化出图、评论区承接资料。",
      "建议第一周先发 7 篇，重点看收藏、评论和私信，不要只看点赞。",
    ],
  },
  {
    folder: "03-新手必存10条Prompt",
    title: "不会写 Prompt 的人，把这 10 条 AI 指令直接存下来",
    keyword: "Prompt",
    resource: "50 条 AI Prompt 模板",
    cards: [
      {
        tag: "Prompt 模板",
        kicker: "别再只说帮我写",
        title: "这10条够用了",
        subtitle: "新手直接复制改关键词",
        body: ["很多人觉得 AI 不好用，是因为提问太空。", "把任务、背景、格式、限制说清楚，AI 的结果会立刻变稳定。"],
        callout: "先会提问，再谈效率。",
        variant: "cover",
      },
      {
        tag: "基础公式",
        kicker: "万能结构",
        title: "好Prompt长这样",
        subtitle: "角色 + 目标 + 素材 + 格式",
        body: ["你是一个什么角色？要完成什么任务？参考什么信息？输出成什么格式？", "这 4 个信息越清楚，结果越可用。"],
        bullets: ["角色", "目标", "素材", "格式"],
      },
      {
        tag: "选题指令",
        kicker: "做内容先用它",
        title: "生成小红书选题",
        subtitle: "一次要 30 个，不要只要 3 个",
        body: ["请围绕【人群】的【痛点】，生成 30 个小红书图文选题。", "要求：具体、有收藏价值、适合不露脸账号、避免夸张承诺。"],
        callout: "把【人群】和【痛点】换成你的方向。",
      },
      {
        tag: "标题指令",
        kicker: "标题决定点击",
        title: "生成爆款标题",
        subtitle: "按不同钩子分类输出",
        body: ["请为这个选题写 20 个小红书标题。", "分为：痛点型、反常识型、清单型、结果展示型，每类 5 个。"],
        callout: "最后人工改得更像人话。",
      },
      {
        tag: "正文指令",
        kicker: "图文大纲",
        title: "拆成8页内容",
        subtitle: "每页只讲一个重点",
        body: ["请把这个选题拆成 8 页小红书图文。", "每页包括：封面标题、主标题、2 句正文、最后一页评论引导。"],
        callout: "别让 AI 写成长文章。",
      },
      {
        tag: "封面指令",
        kicker: "只留强钩子",
        title: "生成封面文案",
        subtitle: "8到12个字最稳",
        body: ["请为这个选题写 10 个封面大标题。", "要求：短、有冲突感、适合小红书封面，不要超过 12 个字。"],
        callout: "封面不是摘要，是点击理由。",
      },
      {
        tag: "复盘指令",
        kicker: "发完要看数据",
        title: "让AI帮你复盘",
        subtitle: "不要只凭感觉判断",
        body: ["这是我的笔记数据：曝光、点赞、收藏、评论、关注、私信。", "请判断问题在选题、标题、封面、正文还是引导，并给 3 个改法。"],
        callout: "重点看收藏和私信。",
      },
      {
        tag: "完整版",
        kicker: "我整理好了",
        title: "50条Prompt模板",
        subtitle: "选题、标题、正文、封面、复盘都有",
        body: ["新手先别收藏一堆工具。", "把这 50 条 Prompt 跑熟，做图文、资料包、办公提效都够用了。"],
        callout: "需要《50 条 AI Prompt 模板》\n评论区打：Prompt",
        variant: "end",
      },
    ],
    copy: [
      "AI 不好用，很多时候不是工具问题，是提问太空。",
      "新手先掌握一个公式：角色 + 目标 + 素材 + 格式。",
      "这篇整理了选题、标题、正文、封面、复盘几个最常用的 Prompt 场景，可以直接替换关键词使用。",
    ],
  },
  {
    folder: "04-AI小红书图文工作流",
    title: "我用 AI 做小红书图文，一篇笔记只走这 6 步",
    keyword: "流程",
    resource: "AI 图文工作流模板",
    cards: [
      {
        tag: "图文工作流",
        kicker: "别凭感觉发",
        title: "AI图文工作流",
        subtitle: "一篇笔记只走这 6 步",
        body: ["AI 不是让你偷懒乱发，而是帮你把流程标准化。", "流程固定后，才能稳定测试选题、封面和正文。"],
        callout: "先标准化，再谈爆款。",
        variant: "cover",
      },
      {
        tag: "第 1 步",
        kicker: "先找痛点",
        title: "不要先想标题",
        subtitle: "先问用户卡在哪里",
        body: ["比如：不知道做什么副业、不会写 Prompt、不会做封面、不会复盘数据。", "痛点越具体，内容越容易被收藏。"],
        callout: "痛点比热点更重要。",
      },
      {
        tag: "第 2 步",
        kicker: "标题多生成",
        title: "20个标题选3个",
        subtitle: "再人工改成小红书口吻",
        body: ["让 AI 分别写痛点型、清单型、反常识型、结果型标题。", "不要直接用最正式的那一个，通常太像报告。"],
        callout: "标题要像朋友提醒你。",
      },
      {
        tag: "第 3 步",
        kicker: "封面要克制",
        title: "只放一个强钩子",
        subtitle: "不要把正文搬到封面",
        body: ["封面只需要让人知道：这篇和我有关，点进去有用。", "大标题 8-12 个字，副标题一句具体收益就够。"],
        callout: "封面越复杂，越没人看。",
      },
      {
        tag: "第 4 步",
        kicker: "正文分层",
        title: "每页只讲一个点",
        subtitle: "一页一个观点或一个步骤",
        body: ["小红书图文不是 PPT 汇报。", "每页只解决一个小问题，用户才愿意一页一页看完。"],
        callout: "信息密度要高，但不能乱。",
      },
      {
        tag: "第 5 步",
        kicker: "工具组合",
        title: "别同时用太多工具",
        subtitle: "新手先用最小组合",
        body: ["一个 AI 写作工具做选题和正文。", "一个设计工具做封面模板。一个表格存选题和复盘数据。"],
        callout: "工具少一点，执行会快很多。",
      },
      {
        tag: "第 6 步",
        kicker: "发完复盘",
        title: "只看4个指标",
        subtitle: "收藏、评论、关注、私信",
        body: ["点赞多不一定能变现。", "收藏说明内容有用，评论说明有互动，私信说明有需求。"],
        callout: "资料包变现，重点看私信。",
      },
      {
        tag: "模板领取",
        kicker: "工作流给你",
        title: "照着跑一遍",
        subtitle: "选题到复盘都整理好了",
        body: ["我整理了 AI 图文工作流模板。", "包括选题表、标题生成、8 页图文结构、评论引导和复盘表。"],
        callout: "需要《AI 图文工作流模板》\n评论区打：流程",
        variant: "end",
      },
    ],
    copy: [
      "我现在做 AI 图文，基本只走 6 步：找痛点、生成标题、做封面、拆正文、用最小工具组合、发完复盘。",
      "新手最容易犯的错是每天凭感觉发，结果不知道哪一步出了问题。",
      "把流程固定下来，才知道爆不爆是选题问题、封面问题，还是正文和引导问题。",
    ],
  },
  {
    folder: "05-新手别乱买AI工具",
    title: "我测了 6 个 AI 工具，新手真正先用这 3 个就够了",
    keyword: "工具",
    resource: "新手 AI 工具清单",
    cards: [
      {
        tag: "AI工具测评",
        kicker: "先别乱买",
        title: "新手3个工具够了",
        subtitle: "工具越多，越容易不行动",
        body: ["很多人做 AI 副业，第一步不是发内容，而是研究工具。", "结果收藏一堆，真正用起来的一个都没有。"],
        callout: "工具要为流程服务，不是为焦虑服务。",
        variant: "cover",
      },
      {
        tag: "原则",
        kicker: "先看场景",
        title: "不要为功能付费",
        subtitle: "要为你正在做的任务付费",
        body: ["你现在是要写选题、做封面、整理表格，还是自动化流程？", "任务不清楚，买再多工具也没用。"],
        callout: "先定任务，再选工具。",
      },
      {
        tag: "工具 01",
        kicker: "写作类",
        title: "负责选题和正文",
        subtitle: "先把内容框架跑出来",
        body: ["用来生成选题、标题、正文大纲、评论区话术、资料包目录。", "重点是多给背景和格式，不要只说“帮我写”。"],
        callout: "写作工具是新手第一优先级。",
      },
      {
        tag: "工具 02",
        kicker: "设计类",
        title: "负责封面和排版",
        subtitle: "固定模板，比每次重做更重要",
        body: ["封面不要追求复杂。", "准备 2-3 套模板：避坑类、清单类、教程类，每次只换标题和内容。"],
        callout: "统一视觉，比花哨更重要。",
      },
      {
        tag: "工具 03",
        kicker: "表格类",
        title: "负责选题和复盘",
        subtitle: "别把数据只放脑子里",
        body: ["记录标题、发布时间、封面钩子、收藏、评论、私信。", "一周后你就能看出哪类内容更值得继续做。"],
        callout: "表格是最便宜的运营系统。",
      },
      {
        tag: "先不急",
        kicker: "自动化工具",
        title: "新手先别碰太深",
        subtitle: "流程没跑通，自动化也没意义",
        body: ["自动化适合已经知道哪些步骤重复、哪些数据有用的人。", "前 7 天先手动跑一遍，别一开始就搭复杂系统。"],
        callout: "先有流程，再自动化。",
      },
      {
        tag: "新手组合",
        kicker: "最小可用",
        title: "3个工具就能开跑",
        subtitle: "写作 + 设计 + 表格",
        bullets: ["写作工具", "设计工具", "表格工具"],
        body: ["先用这 3 类工具跑通第一批图文。", "等有数据和需求，再考虑付费工具或自动化。"],
      },
      {
        tag: "清单领取",
        kicker: "我整理好了",
        title: "新手工具清单",
        subtitle: "按场景分类，不是工具大全",
        body: ["清单里按写作、设计、表格、资料整理、自动化来分。", "每类都标了适合谁、用来做什么、什么时候再升级。"],
        callout: "需要《新手 AI 工具清单》\n评论区打：工具",
        variant: "end",
      },
    ],
    copy: [
      "新手做 AI 副业，不要一上来买一堆工具。",
      "我建议先用最小组合：写作工具、设计工具、表格工具。",
      "先跑通选题、标题、封面、正文、复盘这条线，再决定要不要上更复杂的工具。",
    ],
  },
  {
    folder: "06-AI资料包怎么卖",
    title: "AI 资料包生意适合普通人吗？我拆给你看",
    keyword: "资料",
    resource: "资料包目录模板",
    cards: [
      {
        tag: "资料包变现",
        kicker: "别乱打包文件",
        title: "资料包怎么卖",
        subtitle: "核心不是多，而是能解决问题",
        body: ["资料包不是把一堆文档塞进网盘。", "真正好卖的资料包，是帮用户省时间、少踩坑、直接开始做。"],
        callout: "卖的是路径，不是文件数量。",
        variant: "cover",
      },
      {
        tag: "核心判断",
        kicker: "先问一句",
        title: "解决什么问题",
        subtitle: "问题越具体，越容易成交",
        body: ["比如：不会选题、不会写 Prompt、不会做封面、不会复盘。", "不要做“AI 大全”，新手反而不知道怎么用。"],
        callout: "具体问题 > 大而全资料。",
      },
      {
        tag: "适合做",
        kicker: "5类资料包",
        title: "新手先做这些",
        subtitle: "低门槛，容易交付",
        bullets: ["选题表", "Prompt库", "图文模板", "工具清单", "测试表"],
        body: ["这些资料都能用 AI 辅助整理。", "但最后一定要你自己筛选、排序、补充使用说明。"],
      },
      {
        tag: "制作流程",
        kicker: "AI负责初稿",
        title: "人负责判断",
        subtitle: "不要直接复制 AI 输出",
        body: ["让 AI 先生成目录、模板、案例和说明。", "你再删掉空话，补上步骤、示例、适合谁和注意事项。"],
        callout: "资料包越能落地，越值钱。",
      },
      {
        tag: "定价",
        kicker: "先低价测试",
        title: "19到99元最稳",
        subtitle: "先看有没有真实需求",
        body: ["前期不要一上来卖高价。", "先用 19、39、69、99 元测试不同版本，看哪类资料最容易成交。"],
        callout: "低价不是廉价，是验证。",
      },
      {
        tag: "内容引流",
        kicker: "别硬广",
        title: "先免费给一小份",
        subtitle: "用评论筛选需求",
        body: ["比如免费送 20 条 Prompt，付费版是 100 条加使用案例。", "免费送选题表，付费版是完整图文工作流。"],
        callout: "免费版解决入门，付费版解决完整流程。",
      },
      {
        tag: "避坑",
        kicker: "不要夸张承诺",
        title: "别写包赚钱",
        subtitle: "写清楚适合谁、不适合谁",
        body: ["平台和用户都不喜欢过度承诺。", "你可以说帮你省时间、少踩坑、快速开始测试，但不要承诺收益。"],
        callout: "长期账号，靠信任变现。",
      },
      {
        tag: "模板领取",
        kicker: "目录给你",
        title: "资料包目录模板",
        subtitle: "照着搭一个低价产品",
        body: ["我整理了资料包目录模板。", "包括封面、目录、使用说明、交付清单、定价和引流话术。"],
        callout: "需要《资料包目录模板》\n评论区打：资料",
        variant: "end",
      },
    ],
    copy: [
      "AI 资料包不是把文件打包卖，而是把一个具体问题整理成可复制路径。",
      "新手可以先做选题表、Prompt 库、图文模板、工具清单、7 天测试表。",
      "前期用低价测试需求，不要夸张承诺收益，重点讲省时间、少踩坑、能开始。",
    ],
  },
  {
    folder: "07-30天AI副业实测计划",
    title: "我准备用 30 天测试 AI 副业，过程和数据都公开",
    keyword: "实测",
    resource: "30 天 AI 副业实测表",
    cards: [
      {
        tag: "公开实测",
        kicker: "不讲玄学",
        title: "30天AI副业实测",
        subtitle: "过程、数据、踩坑都公开",
        body: ["我不想只讲 AI 副业能不能做。", "接下来直接用 30 天测试：发内容、送资料、看私信、做低价产品。"],
        callout: "用数据判断，不靠感觉。",
        variant: "cover",
      },
      {
        tag: "测试目标",
        kicker: "看4个结果",
        title: "不是只看点赞",
        subtitle: "真正有用的是需求信号",
        bullets: ["收藏", "评论", "关注", "私信"],
        body: ["点赞只能说明有人看过。", "收藏说明内容有用，评论说明愿意互动，私信才接近真实需求。"],
      },
      {
        tag: "第 1 周",
        kicker: "测选题",
        title: "先发7篇图文",
        subtitle: "看哪类最容易被收藏",
        body: ["内容包括：副业避坑、图文流程、Prompt 模板、工具清单。", "这一周不急着卖，先看用户到底想要什么。"],
        callout: "选题跑不通，后面都白搭。",
      },
      {
        tag: "第 2 周",
        kicker: "测资料",
        title: "做一个免费资料包",
        subtitle: "用评论关键词收需求",
        body: ["每篇只引导一个关键词。", "比如 AI、图文、Prompt、工具、资料，看哪个词评论和私信最多。"],
        callout: "评论区是需求收集器。",
      },
      {
        tag: "第 3 周",
        kicker: "测低价",
        title: "做19到39元版本",
        subtitle: "先验证有没有人愿意付费",
        body: ["低价产品不用复杂。", "可以是模板库、Prompt 包、选题表、图文工作流中的一个小版本。"],
        callout: "先成交一单，再优化产品。",
      },
      {
        tag: "第 4 周",
        kicker: "测放大",
        title: "复盘后只留有效线",
        subtitle: "别什么都继续做",
        body: ["如果 Prompt 类收藏高，就做模板库。", "如果副业类私信多，就做启动包。如果工具类数据好，后期适合接广告。"],
        callout: "数据会告诉你该做什么。",
      },
      {
        tag: "公开数据",
        kicker: "我会记录这些",
        title: "每周复盘一次",
        subtitle: "不只看爆没爆",
        steps: [
          ["曝光", "看封面和标题"],
          ["收藏", "看内容价值"],
          ["评论", "看互动钩子"],
          ["私信", "看变现需求"],
          ["成交", "看产品是否成立"],
        ],
      },
      {
        tag: "一起实测",
        kicker: "表格给你",
        title: "跟着跑30天",
        subtitle: "不用先买课，先看数据",
        body: ["我整理了 30 天 AI 副业实测表。", "包括每日选题、发布记录、评论关键词、私信需求和复盘字段。"],
        callout: "需要《30 天 AI 副业实测表》\n评论区打：实测",
        variant: "end",
      },
    ],
    copy: [
      "我准备用 30 天测试 AI 副业，不讲玄学，只看数据。",
      "第 1 周测选题，第 2 周测免费资料，第 3 周测低价产品，第 4 周复盘放大。",
      "重点看收藏、评论、关注、私信和成交，不只看点赞。",
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

function renderCard(card, index, post) {
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
  const titleLength = [...card.title].length;
  const titleClass = titleLength > 12 ? "title compact-title" : "title";

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
      white-space: nowrap;
    }
    .series {
      font-size: 27px;
      font-weight: 800;
      color: #3f4a3d;
      white-space: nowrap;
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
      font-size: 94px;
      line-height: 1.02;
      letter-spacing: 0;
      font-weight: 950;
    }
    .compact-title {
      font-size: 80px;
      line-height: 1.05;
    }
    .cover .main {
      padding-top: 142px;
    }
    .cover h1 {
      font-size: 118px;
      max-width: 850px;
    }
    .cover .compact-title {
      font-size: 94px;
      line-height: 1.06;
    }
    .end h1 {
      font-size: 88px;
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
      max-width: 850px;
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
      <div class="series">第 ${posts.indexOf(post) + 1} 篇 / 7</div>
    </div>
    <div class="page-mark">${String(index + 1).padStart(2, "0")}</div>
    <main class="main">
      <div class="kicker">${escapeHtml(card.kicker)}</div>
      <h1 class="${titleClass}">${escapeHtml(card.title)}</h1>
      <div class="subtitle">${escapeHtml(card.subtitle)}</div>
      ${bodyHtml}
      ${bulletsHtml}
      ${stepsHtml}
    </main>
    ${calloutHtml}
    <div class="footer"><span>第 ${index + 1}/8 页</span></div>
  </section>
</body>
</html>`;
}

function renderCopy(post) {
  return `# ${post.title}

## 标题
${post.title}

## 正文
${post.copy.join("\n\n")}

我整理了一份《${post.resource}》，需要的可以在评论区打：${post.keyword}

## 标签
${commonTags}

## 置顶评论
整理好了《${post.resource}》，需要的评论“${post.keyword}”。
`;
}

mkdirSync(targetRoot, { recursive: true });

for (const post of posts) {
  const outDir = resolve(targetRoot, post.folder);
  const htmlDir = resolve(outDir, "html");
  const pngDir = resolve(outDir, "png");
  mkdirSync(htmlDir, { recursive: true });
  mkdirSync(pngDir, { recursive: true });

  post.cards.forEach((card, index) => {
    const stem = `card-${String(index + 1).padStart(2, "0")}`;
    const htmlPath = resolve(htmlDir, `${stem}.html`);
    const pngPath = resolve(pngDir, `${stem}.png`);
    writeFileSync(htmlPath, renderCard(card, index, post), "utf8");
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
}

console.log(`Generated ${posts.length} posts in ${targetRoot}`);
