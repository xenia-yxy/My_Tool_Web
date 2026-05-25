# AI Practice Homepage Hero and Assistant Design

Date: 2026-05-25

## Goal

Redesign the public homepage first screen so it feels like a personal AI practice brand rather than a generic SaaS template.

The first impression should be:

```text
This is a personal AI practitioner building real knowledge, tools, projects, and SOP systems.
```

The redesign should keep the current MVP scope small while introducing one distinctive product idea: a floating AI Practice Assistant that helps visitors understand the site, the creator, and basic AI practice methods.

## Positioning

Temporary brand name:

```text
AI Practice
```

Public positioning:

```text
A personal AI practitioner digital base.
```

Chinese positioning:

```text
个人 AI 实践者的数字据点
```

The homepage should balance three meanings:

- Personal IP and knowledge base.
- AI tool and project showcase.
- SOP service and cooperation entrance.

The first screen should emphasize the personal AI practitioner identity first, then reveal tools, projects, and service paths.

## Header Design

The header should be visible immediately on the first screen.

Structure:

```text
AI Practice        知识库   工具   项目   SOP 服务        联系   登录
```

Visual hierarchy:

- `AI Practice` is the brand mark.
- Navigation links are light text links, not pill buttons.
- `联系` is the primary public action.
- `登录` is a quiet private-workbench entrance.

Header style:

- White or near-white background.
- Subtle bottom border.
- No blue icon card.
- No strong colored header band.
- Height around 64px on desktop.
- Mobile can wrap or compress links for this MVP, but must not create horizontal overflow.

Button behavior:

- `联系` points to the homepage contact section.
- `登录` points to the admin/login entry for the private workbench. If login is not implemented yet, it can point to the existing admin placeholder.

## Logo Direction

Use a text-first logo for the MVP:

```text
AI Practice
```

Do not use generic AI symbols such as sparkles, magic wands, robots, or lightning in the header logo.

Later iterations may derive a compact `AP` monogram or favicon, but the first redesign should keep the logo textual and restrained.

## Hero Design

Recommended first-screen structure:

```text
Left:
  AI Practice

  一个个人 AI 实践者的数字据点

  记录真实 AI 实践，
  把知识、工具和流程沉淀成可持续生长的系统。

  [阅读知识库] [查看工具]

Right:
  Practice Map
  Knowledge Notes
  Tool Experiments
  Project Logs
  SOP Systems

Floating:
  问问 AI Practice
```

Hero principles:

- Keep the first-screen color system restrained: black, white, gray, and one cool blue accent.
- Remove the current mixed blue, cyan, violet, and green emphasis from the hero.
- Use fewer cards and clearer spacing.
- Keep the right-side visual simple, like a practice map or system summary, not a full chat panel.
- The floating assistant is the interactive element, not the hero-right visual.

Primary hero copy:

```text
AI Practice
一个个人 AI 实践者的数字据点
记录真实 AI 实践，把知识、工具和流程沉淀成可持续生长的系统。
```

Primary hero actions:

- `阅读知识库`
- `查看工具`

SOP service should be visible in navigation and later page sections, but it should not overpower the first-screen personal-practice message.

## Floating AI Practice Assistant

The assistant is a global floating widget, not a hero-side module.

Floating entry:

```text
问问 AI Practice
```

Compact icon:

```text
AI
```

Panel title:

```text
AI Practice Assistant
```

Panel subtitle:

```text
了解这个网站，也问一些 AI 实践问题。
```

MVP capabilities:

1. Answer site and personal navigation questions.
2. Answer lightweight AI practice, tool-building, and SOP method questions.
3. Provide quick prompt chips for common visitor questions.
4. Keep answers local and deterministic for the first version.

Example prompt chips:

- `这个网站是做什么的？`
- `我应该先看哪里？`
- `有哪些自研工具？`
- `SOP 服务适合谁？`
- `如何联系合作？`
- `如何开始做 AI 工作流？`

Example answer boundaries:

- It can explain the website, knowledge base, tools, projects, and service direction.
- It can answer basic AI workflow and SOP guidance.
- It should not pretend to be a general-purpose AI assistant.
- It should not claim to search the full knowledge base until real retrieval exists.

Future phases:

- P1: connect to public knowledge and project data.
- P2: add retrieval over article content.
- P3: add real model-backed RAG with citations.

## Page Behavior

Desktop:

- Header stays visible at top.
- Hero uses a two-column layout.
- Assistant floats at bottom right.
- Assistant panel opens above the floating trigger.

Mobile:

- Header must not overflow horizontally.
- Hero stacks vertically.
- Assistant remains bottom right, but panel width must fit the viewport.
- Navigation may wrap for MVP, but should remain readable.

Accessibility:

- Assistant open/close control must be a button.
- Panel should have a clear title.
- Preset prompt chips should be keyboard-focusable buttons.
- The chat input can be enabled for keyword matching or disabled with clear placeholder text, depending on implementation scope.

## Out Of Scope For This Redesign

- Real model API calls.
- Vector database.
- Full RAG pipeline.
- User accounts for public visitors.
- Full login/auth redesign.
- Paid membership or knowledge payment.
- Heavy 3D/WebGL hero effects.

## Acceptance Criteria

- First screen clearly presents `AI Practice` as a personal AI practitioner brand.
- Header is visible but visually lighter than the hero content.
- `联系` is the primary public header action.
- `登录` is present but quiet.
- Hero color system is unified and restrained.
- Hero does not use blue/cyan/violet/green as competing accents.
- Floating assistant appears as a distinctive global feature.
- Assistant MVP does not overpromise real AI retrieval.
- Desktop and mobile layouts avoid horizontal overflow.
- Existing public routes remain reachable.

