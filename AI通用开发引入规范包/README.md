# AI 通用开发引入规范包

整理日期：2026-05-22

用途：每次开发一个新项目、新页面、新功能时，引入这套规范，约束 AI 从 idea、PRD、MVP、UI、开发、验收到企业级扩展的协作方式。

这个包不是某个具体项目的 PRD，也不是资料库。

它是通用开发规则包，尤其用于防止 UI 设计和前端实现跑偏。

---

## 1. 每次新开发怎么用

把本文件夹作为上下文交给 AI，然后让 AI 先读取：

```text
00-AI驱动从想法到产品交付协作规范.md
rules/ui/00-ui-development-rules.md
rules/ui/01-page-design-input-rules.md
rules/ui/02-state-and-feedback-rules.md
rules/component-libraries/00-component-library-rules.md
prompts/00-ai-development-entry-prompt.md
```

如果只是做 UI 页面，至少读取：

```text
rules/ui/00-ui-development-rules.md
rules/ui/01-page-design-input-rules.md
rules/ui/02-state-and-feedback-rules.md
rules/component-libraries/00-component-library-rules.md
```

---

## 2. 规则优先级

```text
1. 当前用户明确要求
2. 当前项目 PRD / 任务说明
3. 项目硬规则
4. 本规范包 rules/*
5. 00 主规范
6. AI 自己的默认习惯
```

如果用户或项目文档明确说了规则，以用户和项目文档为准。

---

## 3. 这个包解决什么

```text
防止 AI 一上来就写代码。
防止 MVP 被做成完整系统。
防止企业级开发没有路径。
防止 UI 只有功能没有用户任务。
防止页面信息优先级混乱。
防止组件库混用。
防止状态、权限、错误反馈缺失。
防止同一业务能力写两套实现。
```

---

## 4. 最短口诀

```text
主规范管流程。
UI 规则管页面。
组件规则管实现。
状态规则管体验。
硬规则管不能变的事。
```
