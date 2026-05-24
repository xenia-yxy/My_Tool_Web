# AI 开发引入提示词

用途：每次新开发一个产品、页面、功能或模块时，把下面提示词交给 AI。

---

## 完整版

```text
请先读取并遵守本项目引入的 AI 通用开发规范包。

必须读取：
- 00-AI驱动从想法到产品交付协作规范.md
- rules/ui/00-ui-development-rules.md
- rules/ui/01-page-design-input-rules.md
- rules/ui/02-state-and-feedback-rules.md
- rules/component-libraries/00-component-library-rules.md

协作规则：
1. 先判断当前是在 idea、PRD、MVP、UI、开发、验收还是企业级阶段。
2. 不要自动跨阶段推进，每个关键阶段需要人工确认。
3. MVP 阶段只做验证核心假设的最小范围，不做完整企业级系统。
4. UI 设计必须先明确主任务、用户角色、信息优先级、交互、状态和权限。
5. 开发必须遵守组件库规则，不要混用未确认的组件库。
6. 每个页面必须补齐 loading、empty、error、submitting、success、permissionDenied 等必要状态。
7. 如果发现输入不足以开发，先指出缺口，不要自行脑补关键业务规则。
8. 实现后输出自检：完成了什么、未完成什么、是否超出范围、是否符合 UI 规则。

当前任务：
[粘贴当前 idea / PRD / 页面说明 / 开发任务]
```

---

## 只做 UI 页面时

```text
请按 AI 通用开发规范包中的 UI 规则设计/实现当前页面。

必须遵守：
- 页面主任务优先
- P0/P1/P2 信息优先级明确
- 企业后台使用合适密度
- 主按钮只保留一个
- 危险操作使用 danger token 并二次确认
- loading、empty、error、submitting、success、permissionDenied 状态完整
- 无权限时 disabled 并显示原因
- 使用指定组件库，不混用同类 UI 库

页面输入：
[粘贴页面说明]
```

---

## 只做开发实现时

```text
请先读取本规范包中的主规范、UI 规则、状态规则和组件库规则。

实现要求：
1. 只实现当前任务范围，不擅自扩展。
2. 遵守已有项目结构和组件库。
3. 页面状态必须完整。
4. 权限、错误、重试、提交中状态必须处理。
5. 相同业务能力只允许一套实现。
6. 完成后输出自检和风险。

当前开发任务：
[粘贴任务]
```
