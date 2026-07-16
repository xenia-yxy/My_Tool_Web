export type IpDerivativeMode = "meme" | "pose" | "outfit" | "scene";

export type IpDerivativeModePreset = {
  id: IpDerivativeMode;
  label: string;
  hint: string;
};

export type IpDerivativeModeControlPreset = {
  id: string;
  label: string;
  options: Array<{ value: string; label: string; instruction: string }>;
};

export type IpDerivativePromptInput = {
  mode: IpDerivativeMode;
  ipName: string;
  identityDescription: string;
  preserveRules: string;
  userInstruction: string;
  referenceFocus: string;
  stickerText: string;
  hasBaseImage: boolean;
  hasReferenceImages: boolean;
  modeControlValues?: Record<string, string>;
  modeControlCustomValues?: Record<string, string>;
};

const modePresets: IpDerivativeModePreset[] = [
  { id: "meme", label: "表情包", hint: "把同一个 IP 扩展为可传播的情绪表达" },
  { id: "pose", label: "动作姿势", hint: "参考动作图，保持角色身份后完成姿势迁移" },
  { id: "outfit", label: "换装装饰", hint: "参考穿搭替换服装与配件，保留 IP 原画风" },
  { id: "scene", label: "场景海报", hint: "让 IP 进入指定场景，生成可发布主视觉" },
];

const modeControlPresets: Record<IpDerivativeMode, IpDerivativeModeControlPreset[]> = {
  meme: [
    { id: "expression", label: "情绪表情", options: [
      { value: "surprised", label: "震惊", instruction: "眼睛睁大、身体轻微后仰的震惊情绪" },
      { value: "happy", label: "开心", instruction: "自然笑容、轻松有感染力的开心情绪" },
      { value: "speechless", label: "无语", instruction: "克制白眼、停顿感明显的无语情绪" },
      { value: "crying", label: "委屈", instruction: "眼眶含泪但保持角色可爱的委屈情绪" },
      { value: "angry", label: "生气", instruction: "有力度但不过度攻击的生气情绪" },
      { value: "shy", label: "害羞", instruction: "轻微脸红、目光回避的害羞情绪" },
      { value: "sleepy", label: "困倦", instruction: "自然打哈欠或半眯眼的困倦情绪" },
      { value: "custom", label: "自定义", instruction: "按用户输入的情绪和表情设计" },
    ] },
    { id: "sticker-style", label: "表情包形式", options: [
      { value: "single", label: "单张表情", instruction: "一张主体清晰的独立表情包" },
      { value: "gesture", label: "表情加手势", instruction: "表情搭配简洁手势，留出排版空间" },
      { value: "reaction", label: "反应动作", instruction: "强化身体反应和情绪张力" },
      { value: "headshot", label: "头像特写", instruction: "突出脸部和表情细节的头像特写" },
      { value: "full", label: "全身反应", instruction: "完整展示角色身体语言和情绪" },
      { value: "series", label: "系列留白", instruction: "统一构图并预留后续系列扩展空间" },
      { value: "custom", label: "自定义", instruction: "按用户输入的表情包形式设计" },
    ] },
  ],
  pose: [
    { id: "action", label: "指定动作", options: [
      { value: "dance", label: "跳舞", instruction: "完整跳舞动作，重心自然，肢体舒展" },
      { value: "run", label: "奔跑", instruction: "动态奔跑姿势，动作方向明确" },
      { value: "wave", label: "挥手", instruction: "自然挥手互动，手部结构准确" },
      { value: "sit", label: "坐姿", instruction: "放松坐姿，角色比例自然" },
      { value: "jump", label: "跳跃", instruction: "重心清晰、落点可信的跳跃动作" },
      { value: "cheer", label: "庆祝", instruction: "有明确节奏和感染力的庆祝动作" },
      { value: "point", label: "指向", instruction: "手势清晰、视觉方向明确的指向动作" },
      { value: "custom", label: "自定义", instruction: "按用户输入的动作设计" },
    ] },
    { id: "shot", label: "取景范围", options: [
      { value: "full", label: "全身", instruction: "完整展示全身和动作轨迹" },
      { value: "half", label: "半身", instruction: "突出上半身动作和情绪" },
      { value: "close", label: "动作特写", instruction: "突出关键动作细节和表情" },
      { value: "three-quarter", label: "三分之二身", instruction: "兼顾动作姿态与角色识别点" },
      { value: "side", label: "侧面动态", instruction: "从侧面突出动作方向和轮廓" },
      { value: "low-angle", label: "低机位", instruction: "以自然低机位强调动作张力" },
      { value: "custom", label: "自定义", instruction: "按用户输入的取景范围设计" },
    ] },
  ],
  outfit: [
    { id: "outfit-theme", label: "服装主题", options: [
      { value: "street", label: "街头日常", instruction: "街头日常服装，保留角色主色与身份元素" },
      { value: "formal", label: "正式礼服", instruction: "正式礼服造型，保持角色辨识度" },
      { value: "sport", label: "运动套装", instruction: "轻量运动套装和自然运动配件" },
      { value: "festival", label: "节日限定", instruction: "节日限定主题服装，不改变核心角色" },
      { value: "rainy", label: "雨天出行", instruction: "适合雨天的功能性外套和鞋履" },
      { value: "travel", label: "旅行度假", instruction: "轻松旅行主题服装与实用配件" },
      { value: "work", label: "职业制服", instruction: "有职业识别但不改变角色本体的制服造型" },
      { value: "custom", label: "自定义", instruction: "按用户输入的服装主题设计" },
    ] },
    { id: "decoration", label: "装饰重点", options: [
      { value: "headwear", label: "头部装饰", instruction: "增加与主题匹配的头部装饰" },
      { value: "handheld", label: "手持道具", instruction: "增加一件清晰可辨的手持道具" },
      { value: "jewelry", label: "饰品细节", instruction: "增加克制的饰品细节，不遮挡角色脸部" },
      { value: "backpack", label: "背部装备", instruction: "增加与主题一致的背包或背部装备" },
      { value: "pattern", label: "服装图案", instruction: "增加简洁、有辨识度但不喧宾夺主的图案" },
      { value: "material", label: "材质变化", instruction: "调整服装材质质感并保持结构清晰" },
      { value: "custom", label: "自定义", instruction: "按用户输入的装饰重点设计" },
    ] },
  ],
  scene: [
    { id: "scene", label: "场景主题", options: [
      { value: "cafe", label: "咖啡店", instruction: "温暖干净的咖啡店场景" },
      { value: "city", label: "城市街头", instruction: "具有真实层次的城市街头场景" },
      { value: "festival", label: "节日活动", instruction: "有明确节日元素的活动场景" },
      { value: "nature", label: "自然户外", instruction: "光线自然的户外自然场景" },
      { value: "home", label: "居家空间", instruction: "干净舒适、具有生活感的居家空间" },
      { value: "beach", label: "海边假日", instruction: "层次清晰、轻松明快的海边场景" },
      { value: "fantasy", label: "轻幻想世界", instruction: "有想象力但角色主体清晰的轻幻想场景" },
      { value: "custom", label: "自定义", instruction: "按用户输入的场景主题设计" },
    ] },
    { id: "lighting", label: "光线氛围", options: [
      { value: "daylight", label: "自然日光", instruction: "明亮柔和的自然日光" },
      { value: "sunset", label: "日落暖光", instruction: "层次柔和的日落暖光" },
      { value: "night", label: "夜景灯光", instruction: "清晰但不过曝的夜景灯光" },
      { value: "studio", label: "影棚柔光", instruction: "干净稳定、主体突出的影棚柔光" },
      { value: "neon", label: "霓虹夜色", instruction: "受控且不杂乱的霓虹环境光" },
      { value: "rain", label: "雨后反光", instruction: "具有地面反光和空气湿度的雨后光线" },
      { value: "custom", label: "自定义", instruction: "按用户输入的光线氛围设计" },
    ] },
  ],
};

export function getIpDerivativeModePresets() {
  return modePresets;
}

export function getIpDerivativeModeControlPresets(mode: IpDerivativeMode) {
  return modeControlPresets[mode];
}

export function buildIpDerivativePrompt(input: IpDerivativePromptInput) {
  const mode = modePresets.find((item) => item.id === input.mode) ?? modePresets[0];
  const canUseStickerText = input.mode === "meme" && Boolean(input.stickerText.trim());
  const builtInControls = getIpDerivativeModeControlPresets(input.mode)
    .flatMap((control) => {
      const selectedValue = input.modeControlValues?.[control.id];
      const selected = control.options.find((option) => option.value === selectedValue) || control.options[0];
      const customValue = input.modeControlCustomValues?.[control.id]?.trim();
      if (!selected) return [];
      return selected.value === "custom" && customValue
        ? [`${control.label}：${customValue}。`]
        : [`${control.label}：${selected.label}，${selected.instruction}。`];
    });

  return [
    "你是专业角色衍生设计师。请根据上传的主视觉素材生成一个可直接使用的角色衍生成品。",
    "上传的主视觉素材是角色身份基准，必须优先识别并锁定角色本体。",
    `衍生方向：${mode.label}。`,
    input.identityDescription.trim()
      ? `角色识别点：${input.identityDescription.trim()}。`
      : "角色识别点：以主 IP 图中的脸型、轮廓、主色、标志性服装和道具为准。",
    input.preserveRules.trim()
      ? `必须保留：${input.preserveRules.trim()}。`
      : "必须保留：脸部特征、轮廓比例、主色、标志性元素和原有视觉风格。",
    "身份一致性要求：不要把角色替换成另一个人物或物种；不要改变核心脸型、眼睛、发型、体型比例、标志性图案与配色关系。",
    input.mode === "outfit"
      ? "换装规则：主 IP 图决定角色的原始画风、线条、上色方式、脸部与比例。服装/穿搭参考图只迁移服装版型、颜色、材质层次、搭配关系和指定配饰；不得迁移真人五官、摄影风格、背景、光影风格或参考图本身的画风。"
      : "",
    input.userInstruction.trim()
      ? `本次修改说明：${input.userInstruction.trim()}。`
      : `本次修改说明：完成一张符合${mode.label}用途的清晰成品。`,
    builtInControls.length ? `内置创作设置：${builtInControls.join(" ")}` : "",
    input.hasReferenceImages
      ? input.referenceFocus.trim()
        ? `参考图用途：${input.referenceFocus.trim()}。参考图只影响这次指定的目标，不得覆盖主 IP 的身份。`
        : "参考图用途：只提取本次需要的动作、服装、表情、装饰或场景，不得覆盖主 IP 的身份。"
      : "没有额外参考图，请只依据主 IP 图与文字说明完成设计。",
    input.hasBaseImage
      ? "图片顺序说明：第一张是主 IP 图，其余图片为辅助参考。"
      : "请等待主 IP 图后再生成，不能自行发明角色身份。",
    canUseStickerText
      ? `表情包文字：只使用“${input.stickerText.trim()}”，文字清晰、适合表情包排版，不要添加其他文字。`
      : "不要出现任何文字、标题、价格、标签、logo、水印或说明。",
    "输出要求：主体完整清晰，结构自然，风格统一，避免畸形肢体、错误手指、重复五官和杂乱背景。",
  ].join("\n");
}
