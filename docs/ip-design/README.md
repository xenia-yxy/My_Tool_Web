# Xenia IP 设计包

这是一套用于评审和后续生图的 V1 设计包。

## 文件清单

1. `xenia-ip-design-v1.md`
   - 完整 IP 立意、角色定义、视觉方向、场景图清单和生图提示词模板。

2. `xenia-reference-sketch-board.svg`
   - 第一参考图设计板。
   - 包含三个简笔方向：数字主理人、工作流助手、知识工匠。
   - 推荐方案是“数字主理人 + 知识工匠”融合。

3. `xenia-scene-effect-board.svg`
   - 第三层场景图效果图草案。
   - 包含首页、工具台、IP 原型工坊、知识库、SOP 服务页、社媒封面六个场景。

## 推荐阅读顺序

1. 先看 `xenia-ip-design-v1.md` 的第 2 节，确认 IP 立意是否正确。
2. 再看 `xenia-reference-sketch-board.svg`，确认角色轮廓和道具方向。
3. 最后看 `xenia-scene-effect-board.svg`，确认这个 IP 能否进入真实产品场景。

## 后续接入现有系统

当前系统已有 `/tools/ip-prototype`，可以按以下顺序使用：

1. 将 `xenia-reference-sketch-board.svg` 导出为 PNG，作为草稿图参考。
2. 将当前网站首页或工具台截图作为品牌参考。
3. 将 `xenia-ip-design-v1.md` 第 7 节中的提示词复制到“当前想法”。
4. 先生成角色设定图，再生成六个场景图。
5. 生成结果进入图片画廊后，挑选稳定版本沉淀到知识库或后续前端资产。

