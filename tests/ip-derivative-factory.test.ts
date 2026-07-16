import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildIpDerivativePrompt,
  getIpDerivativeModeControlPresets,
  getIpDerivativeModePresets,
} from "../src/lib/ip-derivative-factory";

test("exposes the first four IP derivative modes", () => {
  assert.deepEqual(
    getIpDerivativeModePresets().map((mode) => mode.id),
    ["meme", "pose", "outfit", "scene"],
  );
});

test("builds a meme prompt that can keep the IP identity and allow sticker text", () => {
  const prompt = buildIpDerivativePrompt({
    mode: "meme",
    ipName: "火尾趴趴猫",
    identityDescription: "黄色星形猫，懒散半睁眼，尾巴是火焰",
    preserveRules: "保留星形轮廓和火焰尾巴",
    userInstruction: "做一个震惊表情包",
    referenceFocus: "只参考表情，不改变角色",
    stickerText: "啊？真的假的",
    hasBaseImage: true,
    hasReferenceImages: true,
  });

  assert.match(prompt, /上传的主视觉素材是角色身份基准/);
  assert.match(prompt, /保留星形轮廓和火焰尾巴/);
  assert.match(prompt, /表情包/);
  assert.match(prompt, /啊？真的假的/);
  assert.match(prompt, /只参考表情/);
});

test("builds a no-text pose prompt for action transfer", () => {
  const prompt = buildIpDerivativePrompt({
    mode: "pose",
    ipName: "短发女生 IP",
    identityDescription: "短发、黑色上衣、棕色长裤、干净漫画风",
    preserveRules: "",
    userInstruction: "参考跳舞动作，生成全身跳舞姿势",
    referenceFocus: "只参考身体动作和重心",
    stickerText: "",
    hasBaseImage: true,
    hasReferenceImages: true,
  });

  assert.match(prompt, /动作姿势/);
  assert.match(prompt, /不要出现任何文字/);
  assert.match(prompt, /短发、黑色上衣/);
  assert.match(prompt, /只参考身体动作和重心/);
});

test("offers broad mode controls with a manual input fallback", () => {
  for (const mode of ["meme", "pose", "outfit", "scene"] as const) {
    const controls = getIpDerivativeModeControlPresets(mode);
    assert.ok(controls.length >= 2);
    for (const control of controls) {
      assert.ok(control.options.length >= 6);
      assert.ok(control.options.some((option) => option.value === "custom"));
    }
  }
});

test("builds a general derivative prompt without output use and honors manual control text", () => {
  const prompt = buildIpDerivativePrompt({
    mode: "outfit",
    ipName: "任意角色",
    identityDescription: "",
    preserveRules: "",
    userInstruction: "换成雨天出行造型",
    referenceFocus: "",
    stickerText: "",
    hasBaseImage: true,
    hasReferenceImages: false,
    modeControlValues: { "outfit-theme": "custom", decoration: "headwear" },
    modeControlCustomValues: { "outfit-theme": "透明雨衣与雨靴" },
  });

  assert.doesNotMatch(prompt, /输出用途/);
  assert.doesNotMatch(prompt, /IP 名称/);
  assert.match(prompt, /透明雨衣与雨靴/);
  assert.match(prompt, /上传的主视觉素材/);
});

test("provides distinct built-in controls for every IP derivative mode", () => {
  assert.deepEqual(
    getIpDerivativeModeControlPresets("meme").map((item) => item.id),
    ["expression", "sticker-style"],
  );
  assert.deepEqual(
    getIpDerivativeModeControlPresets("pose").map((item) => item.id),
    ["action", "shot"],
  );
  assert.deepEqual(
    getIpDerivativeModeControlPresets("outfit").map((item) => item.id),
    ["outfit-theme", "decoration"],
  );
  assert.deepEqual(
    getIpDerivativeModeControlPresets("scene").map((item) => item.id),
    ["scene", "lighting"],
  );
});
