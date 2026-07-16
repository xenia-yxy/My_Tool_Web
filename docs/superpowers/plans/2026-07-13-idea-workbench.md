# Idea Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a persisted `/tools/ideas` workspace where signed-in users can capture ideas, analyze them with AI, and retain the full discussion process.

**Architecture:** Add Prisma `Idea` and `IdeaMessage` models owned by `User`, then expose a focused server module plus Next.js route handlers. The UI follows existing tools workspace patterns: server page for auth and initial data, client workbench for list/detail editing and analysis calls.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Prisma/PostgreSQL, Auth.js session helpers, existing `ai-gateway`, Node test runner.

---

## File Structure

- Modify `prisma/schema.prisma`: add `IdeaStatus`, `IdeaMessageRole`, `IdeaAnalysisPhase`, `Idea`, `IdeaMessage`, and `User.ideas`.
- Create `prisma/migrations/20260713120000_add_idea_workbench/migration.sql`: SQL migration for enums, tables, indexes, and foreign keys.
- Create `src/server/ideas.ts`: all idea validation, serialization, persistence, and AI analysis orchestration.
- Create `src/app/api/tools/ideas/route.ts`: list and create ideas for the current user.
- Create `src/app/api/tools/ideas/[id]/route.ts`: read, update, and archive a single idea.
- Create `src/app/api/tools/ideas/[id]/analyze/route.ts`: append user message, generate AI reply, persist both messages.
- Create `src/app/tools/ideas/page.tsx`: authenticated tools page with initial idea list.
- Create `src/components/tools/idea-workbench.tsx`: client UI for creating, selecting, updating, and analyzing ideas.
- Modify `src/components/tools/nav-config.ts`: add `灵感工作台` under the planning group.
- Modify `tests/tool-navigation.test.ts`: assert the new navigation item activates correctly.
- Create `tests/ideas.test.ts`: unit tests for normalization, title derivation, fallback analysis, and analysis context construction.

---

### Task 1: Prisma Models And Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260713120000_add_idea_workbench/migration.sql`

- [ ] **Step 1: Add Prisma enums and relations**

In `prisma/schema.prisma`, add these enums after `DailyPlanQuadrant`:

```prisma
enum IdeaStatus {
  CAPTURED
  ANALYZING
  DISTILLED
  PAUSED
  ARCHIVED
}

enum IdeaMessageRole {
  USER
  ASSISTANT
}

enum IdeaAnalysisPhase {
  CAPTURE
  ANALYSIS
  SUMMARY
  ACTION
}
```

In `model User`, add this relation near `dailyPlanItems`:

```prisma
  ideas         Idea[]
```

Add these models after `DailyPlanItem`:

```prisma
model Idea {
  id          String     @id @default(cuid())
  title       String
  rawContent  String     @db.Text
  status      IdeaStatus @default(CAPTURED)
  summary     String?    @db.Text
  riskNotes   String?    @db.Text
  nextActions String?    @db.Text
  tags        String[]   @default([])
  category    String?
  authorId    String
  author      User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  messages    IdeaMessage[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([authorId, updatedAt])
  @@index([authorId, status, updatedAt])
}

model IdeaMessage {
  id        String            @id @default(cuid())
  ideaId    String
  idea      Idea              @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  role      IdeaMessageRole
  content   String            @db.Text
  phase     IdeaAnalysisPhase @default(ANALYSIS)
  createdAt DateTime          @default(now())

  @@index([ideaId, createdAt])
  @@index([ideaId, phase])
}
```

- [ ] **Step 2: Create SQL migration**

Create `prisma/migrations/20260713120000_add_idea_workbench/migration.sql` with:

```sql
CREATE TYPE "IdeaStatus" AS ENUM ('CAPTURED', 'ANALYZING', 'DISTILLED', 'PAUSED', 'ARCHIVED');
CREATE TYPE "IdeaMessageRole" AS ENUM ('USER', 'ASSISTANT');
CREATE TYPE "IdeaAnalysisPhase" AS ENUM ('CAPTURE', 'ANALYSIS', 'SUMMARY', 'ACTION');

CREATE TABLE "Idea" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rawContent" TEXT NOT NULL,
    "status" "IdeaStatus" NOT NULL DEFAULT 'CAPTURED',
    "summary" TEXT,
    "riskNotes" TEXT,
    "nextActions" TEXT,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "category" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Idea_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IdeaMessage" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "role" "IdeaMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "phase" "IdeaAnalysisPhase" NOT NULL DEFAULT 'ANALYSIS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdeaMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Idea_authorId_updatedAt_idx" ON "Idea"("authorId", "updatedAt");
CREATE INDEX "Idea_authorId_status_updatedAt_idx" ON "Idea"("authorId", "status", "updatedAt");
CREATE INDEX "IdeaMessage_ideaId_createdAt_idx" ON "IdeaMessage"("ideaId", "createdAt");
CREATE INDEX "IdeaMessage_ideaId_phase_idx" ON "IdeaMessage"("ideaId", "phase");

ALTER TABLE "Idea" ADD CONSTRAINT "Idea_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IdeaMessage" ADD CONSTRAINT "IdeaMessage_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

- [ ] **Step 3: Generate Prisma client**

Run:

```bash
pnpm prisma:generate
```

Expected: Prisma client generation succeeds without schema errors.

- [ ] **Step 4: Commit Prisma model changes**

```bash
git add prisma/schema.prisma prisma/migrations/20260713120000_add_idea_workbench/migration.sql
git commit -m "feat: add idea workbench schema"
```

---

### Task 2: Idea Service Pure Logic

**Files:**
- Create: `tests/ideas.test.ts`
- Create: `src/server/ideas.ts`

- [ ] **Step 1: Write failing pure-logic tests**

Create `tests/ideas.test.ts` with:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildFallbackIdeaAnalysis,
  buildIdeaAnalysisMessages,
  deriveIdeaTitle,
  normalizeIdeaCreateInput,
  normalizeIdeaMessageInput,
  normalizeIdeaUpdateInput,
} from "../src/server/ideas";

test("deriveIdeaTitle creates a stable compact title", () => {
  assert.equal(
    deriveIdeaTitle("  我想做一个可以记录灵感并分析下一步的工具，适合日常运营使用。  "),
    "我想做一个可以记录灵感并分析下一步的工具",
  );
});

test("normalizeIdeaCreateInput trims content and derives title", () => {
  assert.deepEqual(
    normalizeIdeaCreateInput({
      rawContent: "  做一个灵感分析工具  ",
      tags: [" 产品 ", "AI", "AI", ""],
      category: " 工具 ",
    }),
    {
      title: "做一个灵感分析工具",
      rawContent: "做一个灵感分析工具",
      tags: ["产品", "AI"],
      category: "工具",
    },
  );
});

test("normalizeIdeaCreateInput rejects empty and overlong content", () => {
  assert.throws(() => normalizeIdeaCreateInput({ rawContent: "   " }), /灵感内容不能为空/);
  assert.throws(
    () => normalizeIdeaCreateInput({ rawContent: "x".repeat(3001) }),
    /灵感内容不能超过 3000 个字/,
  );
});

test("normalizeIdeaUpdateInput validates status and tag limits", () => {
  assert.deepEqual(
    normalizeIdeaUpdateInput({
      status: "DISTILLED",
      title: "  阶段结论  ",
      tags: ["内容", "运营"],
      summary: " 有价值 ",
      riskNotes: "",
      nextActions: " 明天验证 ",
    }),
    {
      status: "DISTILLED",
      title: "阶段结论",
      tags: ["内容", "运营"],
      summary: "有价值",
      riskNotes: null,
      nextActions: "明天验证",
      category: undefined,
    },
  );

  assert.throws(() => normalizeIdeaUpdateInput({ status: "DONE" }), /灵感状态不正确/);
  assert.throws(
    () => normalizeIdeaUpdateInput({ tags: ["1", "2", "3", "4", "5", "6", "7", "8", "9"] }),
    /标签不能超过 8 个/,
  );
});

test("normalizeIdeaMessageInput validates content and phase", () => {
  assert.deepEqual(
    normalizeIdeaMessageInput({ content: "  帮我分析  ", phase: "SUMMARY" }),
    { content: "帮我分析", phase: "SUMMARY" },
  );
  assert.throws(() => normalizeIdeaMessageInput({ content: "" }), /分析内容不能为空/);
  assert.throws(() => normalizeIdeaMessageInput({ content: "x".repeat(3001) }), /分析内容不能超过 3000 个字/);
  assert.throws(() => normalizeIdeaMessageInput({ content: "继续", phase: "REVIEW" }), /分析阶段不正确/);
});

test("buildFallbackIdeaAnalysis returns structured actionable text", () => {
  const reply = buildFallbackIdeaAnalysis({
    title: "灵感分析工具",
    rawContent: "记录灵感并分析下一步",
    userMessage: "先帮我判断价值",
  });

  assert.match(reply, /我的理解/);
  assert.match(reply, /关键判断/);
  assert.match(reply, /下一步/);
});

test("buildIdeaAnalysisMessages includes current idea and recent messages", () => {
  const messages = buildIdeaAnalysisMessages({
    idea: {
      title: "灵感分析工具",
      rawContent: "记录灵感",
      summary: "适合个人运营",
      riskNotes: "容易变成任务管理",
      nextActions: "先做 MVP",
    },
    history: Array.from({ length: 13 }, (_, index) => ({
      role: index % 2 === 0 ? "USER" as const : "ASSISTANT" as const,
      content: `消息 ${index}`,
    })),
    userMessage: "继续分析",
  });

  assert.equal(messages[0].role, "system");
  assert.equal(messages.at(-1)?.role, "user");
  assert.match(messages.at(-1)?.content || "", /继续分析/);
  assert.equal(messages.filter((message) => message.content.includes("消息 ")).length, 12);
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
pnpm exec tsx --test tests/ideas.test.ts
```

Expected: FAIL because `src/server/ideas.ts` does not exist.

- [ ] **Step 3: Implement service pure logic and exported types**

Create `src/server/ideas.ts` with the pure helpers first:

```ts
import { buildAiRuntimeConfigsForUser } from "@/server/ai-model-configs";
import { createAiGateway } from "@/server/ai-gateway/provider-registry";
import { prisma } from "@/lib/prisma";

export type IdeaStatusValue = "CAPTURED" | "ANALYZING" | "DISTILLED" | "PAUSED" | "ARCHIVED";
export type IdeaMessageRoleValue = "USER" | "ASSISTANT";
export type IdeaAnalysisPhaseValue = "CAPTURE" | "ANALYSIS" | "SUMMARY" | "ACTION";

export type IdeaCreateInput = {
  title?: unknown;
  rawContent?: unknown;
  tags?: unknown;
  category?: unknown;
};

export type IdeaUpdateInput = {
  title?: unknown;
  status?: unknown;
  summary?: unknown;
  riskNotes?: unknown;
  nextActions?: unknown;
  tags?: unknown;
  category?: unknown;
};

export type IdeaMessageInput = {
  content?: unknown;
  phase?: unknown;
};

export type IdeaListItemView = {
  id: string;
  title: string;
  rawContent: string;
  status: IdeaStatusValue;
  summary: string | null;
  riskNotes: string | null;
  nextActions: string | null;
  tags: string[];
  category: string | null;
  latestMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type IdeaMessageView = {
  id: string;
  role: IdeaMessageRoleValue;
  content: string;
  phase: IdeaAnalysisPhaseValue;
  createdAt: string;
};

export type IdeaDetailView = Omit<IdeaListItemView, "latestMessage"> & {
  messages: IdeaMessageView[];
};

const validStatuses = new Set<IdeaStatusValue>(["CAPTURED", "ANALYZING", "DISTILLED", "PAUSED", "ARCHIVED"]);
const validPhases = new Set<IdeaAnalysisPhaseValue>(["CAPTURE", "ANALYSIS", "SUMMARY", "ACTION"]);
const maxIdeaLength = 3000;
const maxMessageLength = 3000;
const maxTitleLength = 80;
const maxTags = 8;
const maxTagLength = 20;
const maxTextAreaLength = 4000;

export function deriveIdeaTitle(rawContent: string) {
  const compact = rawContent.trim().replace(/\s+/g, " ");
  const sentenceEnd = compact.search(/[。！？!?；;]/);
  const base = sentenceEnd > 0 ? compact.slice(0, sentenceEnd) : compact;

  return base.slice(0, maxTitleLength) || "未命名灵感";
}

export function normalizeIdeaCreateInput(input: IdeaCreateInput) {
  const rawContent = readRequiredText(input.rawContent, "灵感内容", maxIdeaLength);
  const explicitTitle = readOptionalText(input.title, maxTitleLength);

  return {
    title: explicitTitle || deriveIdeaTitle(rawContent),
    rawContent,
    tags: normalizeTags(input.tags),
    category: readOptionalText(input.category, maxTagLength),
  };
}

export function normalizeIdeaUpdateInput(input: IdeaUpdateInput) {
  return {
    status: "status" in input ? normalizeStatus(input.status) : undefined,
    title: "title" in input ? readRequiredText(input.title, "标题", maxTitleLength) : undefined,
    tags: "tags" in input ? normalizeTags(input.tags) : undefined,
    summary: "summary" in input ? readNullableText(input.summary, maxTextAreaLength, "阶段总结") : undefined,
    riskNotes: "riskNotes" in input ? readNullableText(input.riskNotes, maxTextAreaLength, "风险点") : undefined,
    nextActions: "nextActions" in input ? readNullableText(input.nextActions, maxTextAreaLength, "下一步行动") : undefined,
    category: "category" in input ? readOptionalText(input.category, maxTagLength) : undefined,
  };
}

export function normalizeIdeaMessageInput(input: IdeaMessageInput) {
  return {
    content: readRequiredText(input.content, "分析内容", maxMessageLength),
    phase: normalizePhase(input.phase, "ANALYSIS"),
  };
}

export function buildFallbackIdeaAnalysis(input: {
  title: string;
  rawContent: string;
  userMessage: string;
}) {
  return [
    "我的理解：",
    `- 这个灵感是：${input.title}`,
    `- 当前补充是：${input.userMessage}`,
    "",
    "关键判断：",
    "- 先确认它解决的具体问题、目标用户和使用频率。",
    "- 再判断是否能用一个很小的版本验证价值。",
    "- 暂时不要把它扩成完整项目管理，先保留灵感分析和过程记录。",
    "",
    "下一步：",
    "- 写下一个真实使用场景。",
    "- 列出 3 个你希望它帮你做出的判断。",
    "- 选一个最小输出，例如阶段总结或行动清单。",
  ].join("\n");
}

export function buildIdeaAnalysisMessages(input: {
  idea: {
    title: string;
    rawContent: string;
    summary: string | null;
    riskNotes: string | null;
    nextActions: string | null;
  };
  history: Array<{ role: IdeaMessageRoleValue; content: string }>;
  userMessage: string;
}) {
  const recentHistory = input.history.slice(-12).map((message) => ({
    role: message.role === "USER" ? "user" as const : "assistant" as const,
    content: message.content,
  }));

  return [
    {
      role: "system" as const,
      content:
        "你是用户的个人灵感分析伙伴。回答要具体、直接、偏执行。帮助用户澄清目标、用户、价值、风险和下一步。不编造外部数据。",
    },
    {
      role: "user" as const,
      content: [
        `灵感标题：${input.idea.title}`,
        `原始想法：${input.idea.rawContent}`,
        `阶段总结：${input.idea.summary || "暂无"}`,
        `风险点：${input.idea.riskNotes || "暂无"}`,
        `下一步行动：${input.idea.nextActions || "暂无"}`,
      ].join("\n"),
    },
    ...recentHistory,
    {
      role: "user" as const,
      content: input.userMessage,
    },
  ];
}

function normalizeStatus(value: unknown): IdeaStatusValue {
  const status = typeof value === "string" ? value.trim().toUpperCase() : "";

  if (validStatuses.has(status as IdeaStatusValue)) {
    return status as IdeaStatusValue;
  }

  throw new Error("灵感状态不正确。");
}

function normalizePhase(value: unknown, fallback: IdeaAnalysisPhaseValue): IdeaAnalysisPhaseValue {
  const phase = typeof value === "string" ? value.trim().toUpperCase() : "";

  if (!phase) return fallback;
  if (validPhases.has(phase as IdeaAnalysisPhaseValue)) return phase as IdeaAnalysisPhaseValue;

  throw new Error("分析阶段不正确。");
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) return [];

  const tags: string[] = [];

  for (const item of value) {
    const tag = readOptionalText(item, maxTagLength);
    if (tag && !tags.includes(tag)) tags.push(tag);
  }

  if (tags.length > maxTags) {
    throw new Error(`标签不能超过 ${maxTags} 个。`);
  }

  return tags;
}

function readRequiredText(value: unknown, label: string, maxLength: number) {
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) throw new Error(`${label}不能为空。`);
  if (text.length > maxLength) throw new Error(`${label}不能超过 ${maxLength} 个字。`);

  return text;
}

function readOptionalText(value: unknown, maxLength: number) {
  if (value === null || value === undefined) return null;
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) return null;
  if (text.length > maxLength) throw new Error(`文本不能超过 ${maxLength} 个字。`);

  return text;
}

function readNullableText(value: unknown, maxLength: number, label: string) {
  if (value === null || value === undefined) return null;
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) return null;
  if (text.length > maxLength) throw new Error(`${label}不能超过 ${maxLength} 个字。`);

  return text;
}
```

- [ ] **Step 4: Run pure-logic tests**

Run:

```bash
pnpm exec tsx --test tests/ideas.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit pure service logic**

```bash
git add src/server/ideas.ts tests/ideas.test.ts
git commit -m "feat: add idea service validation"
```

---

### Task 3: Idea Persistence And AI Service

**Files:**
- Modify: `src/server/ideas.ts`
- Modify: `tests/ideas.test.ts`

- [ ] **Step 1: Extend tests for serializers and fallback context**

Append to `tests/ideas.test.ts`:

```ts
import {
  toIdeaDetailView,
  toIdeaListItemView,
} from "../src/server/ideas";

test("serializers expose list and detail views", () => {
  const now = new Date("2026-07-13T03:00:00.000Z");
  const idea = {
    id: "idea-1",
    title: "灵感工作台",
    rawContent: "记录灵感",
    status: "ANALYZING" as const,
    summary: "有价值",
    riskNotes: null,
    nextActions: "做 MVP",
    tags: ["AI"],
    category: "工具",
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: "message-1",
        role: "USER" as const,
        content: "先分析",
        phase: "ANALYSIS" as const,
        createdAt: now,
      },
    ],
  };

  assert.deepEqual(toIdeaListItemView(idea), {
    id: "idea-1",
    title: "灵感工作台",
    rawContent: "记录灵感",
    status: "ANALYZING",
    summary: "有价值",
    riskNotes: null,
    nextActions: "做 MVP",
    tags: ["AI"],
    category: "工具",
    latestMessage: "先分析",
    createdAt: "2026-07-13T03:00:00.000Z",
    updatedAt: "2026-07-13T03:00:00.000Z",
  });

  assert.deepEqual(toIdeaDetailView(idea).messages, [
    {
      id: "message-1",
      role: "USER",
      content: "先分析",
      phase: "ANALYSIS",
      createdAt: "2026-07-13T03:00:00.000Z",
    },
  ]);
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
pnpm exec tsx --test tests/ideas.test.ts
```

Expected: FAIL because `toIdeaListItemView` and `toIdeaDetailView` are not exported.

- [ ] **Step 3: Add serializers and persistence functions**

Append these functions to `src/server/ideas.ts`:

```ts
type IdeaRecord = {
  id: string;
  title: string;
  rawContent: string;
  status: IdeaStatusValue;
  summary: string | null;
  riskNotes: string | null;
  nextActions: string | null;
  tags: string[];
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages?: Array<{
    id: string;
    role: IdeaMessageRoleValue;
    content: string;
    phase: IdeaAnalysisPhaseValue;
    createdAt: Date;
  }>;
};

export function toIdeaListItemView(idea: IdeaRecord): IdeaListItemView {
  const latestMessage = idea.messages?.[0]?.content || null;

  return {
    id: idea.id,
    title: idea.title,
    rawContent: idea.rawContent,
    status: idea.status,
    summary: idea.summary,
    riskNotes: idea.riskNotes,
    nextActions: idea.nextActions,
    tags: idea.tags,
    category: idea.category,
    latestMessage,
    createdAt: idea.createdAt.toISOString(),
    updatedAt: idea.updatedAt.toISOString(),
  };
}

export function toIdeaDetailView(idea: IdeaRecord): IdeaDetailView {
  const { latestMessage: _latestMessage, ...base } = toIdeaListItemView(idea);

  return {
    ...base,
    messages:
      idea.messages?.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        phase: message.phase,
        createdAt: message.createdAt.toISOString(),
      })) || [],
  };
}

export async function listIdeas(authorId: string): Promise<IdeaListItemView[]> {
  const ideas = await prisma.idea.findMany({
    where: {
      authorId,
      status: { not: "ARCHIVED" },
    },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return ideas.map((idea) => toIdeaListItemView(idea as IdeaRecord));
}

export async function getIdeaDetail(authorId: string, id: string): Promise<IdeaDetailView> {
  const idea = await prisma.idea.findFirst({
    where: { id, authorId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!idea) {
    throw new Error("灵感不存在。");
  }

  return toIdeaDetailView(idea as IdeaRecord);
}

export async function createIdea(authorId: string, input: IdeaCreateInput): Promise<IdeaDetailView> {
  const normalized = normalizeIdeaCreateInput(input);
  const idea = await prisma.idea.create({
    data: {
      authorId,
      title: normalized.title,
      rawContent: normalized.rawContent,
      tags: normalized.tags,
      category: normalized.category,
    },
    include: { messages: true },
  });

  return toIdeaDetailView(idea as IdeaRecord);
}

export async function updateIdea(authorId: string, id: string, input: IdeaUpdateInput): Promise<IdeaDetailView> {
  const data = normalizeIdeaUpdateInput(input);
  const result = await prisma.idea.updateMany({
    where: { id, authorId },
    data,
  });

  if (result.count === 0) {
    throw new Error("灵感不存在。");
  }

  return getIdeaDetail(authorId, id);
}

export async function archiveIdea(authorId: string, id: string) {
  const result = await prisma.idea.updateMany({
    where: { id, authorId },
    data: { status: "ARCHIVED" },
  });

  if (result.count === 0) {
    throw new Error("灵感不存在。");
  }

  return { ok: true };
}
```

- [ ] **Step 4: Add AI analysis orchestration**

Append to `src/server/ideas.ts`:

```ts
export async function analyzeIdea(authorId: string, id: string, input: IdeaMessageInput): Promise<IdeaDetailView> {
  const normalized = normalizeIdeaMessageInput(input);
  const idea = await prisma.idea.findFirst({
    where: { id, authorId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!idea) {
    throw new Error("灵感不存在。");
  }

  await prisma.ideaMessage.create({
    data: {
      ideaId: id,
      role: "USER",
      content: normalized.content,
      phase: normalized.phase,
    },
  });

  const assistantContent = await createIdeaAnalysisReply({
    authorId,
    idea: idea as IdeaRecord,
    userMessage: normalized.content,
  });

  await prisma.ideaMessage.create({
    data: {
      ideaId: id,
      role: "ASSISTANT",
      content: assistantContent,
      phase: normalized.phase === "SUMMARY" ? "SUMMARY" : "ANALYSIS",
    },
  });

  await prisma.idea.update({
    where: { id },
    data: { status: "ANALYZING" },
  });

  return getIdeaDetail(authorId, id);
}

async function createIdeaAnalysisReply(input: {
  authorId: string;
  idea: IdeaRecord;
  userMessage: string;
}) {
  const models = await buildAiRuntimeConfigsForUser(input.authorId);

  if (models.length === 0) {
    return buildFallbackIdeaAnalysis({
      title: input.idea.title,
      rawContent: input.idea.rawContent,
      userMessage: input.userMessage,
    });
  }

  try {
    return await createAiGateway({ models }).generateText({
      messages: buildIdeaAnalysisMessages({
        idea: {
          title: input.idea.title,
          rawContent: input.idea.rawContent,
          summary: input.idea.summary,
          riskNotes: input.idea.riskNotes,
          nextActions: input.idea.nextActions,
        },
        history:
          input.idea.messages?.map((message) => ({
            role: message.role,
            content: message.content,
          })) || [],
        userMessage: input.userMessage,
      }),
      temperature: 0.35,
    });
  } catch {
    return buildFallbackIdeaAnalysis({
      title: input.idea.title,
      rawContent: input.idea.rawContent,
      userMessage: input.userMessage,
    });
  }
}
```

- [ ] **Step 5: Run service tests**

Run:

```bash
pnpm exec tsx --test tests/ideas.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit persistence and analysis service**

```bash
git add src/server/ideas.ts tests/ideas.test.ts
git commit -m "feat: add idea persistence service"
```

---

### Task 4: Ideas API Routes

**Files:**
- Create: `src/app/api/tools/ideas/route.ts`
- Create: `src/app/api/tools/ideas/[id]/route.ts`
- Create: `src/app/api/tools/ideas/[id]/analyze/route.ts`

- [ ] **Step 1: Create collection route**

Create `src/app/api/tools/ideas/route.ts`:

```ts
import { NextResponse } from "next/server";
import { canUseMemberTools } from "@/server/auth-permissions";
import { getAppSession } from "@/server/auth";
import { createIdea, listIdeas } from "@/server/ideas";

export async function GET() {
  const user = await getApiUser();

  if (!user) {
    return NextResponse.json({ error: "未登录。" }, { status: 401 });
  }

  try {
    const ideas = await listIdeas(user.id);
    return NextResponse.json({ ideas });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "读取灵感失败。" },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  const user = await getApiUser();

  if (!user) {
    return NextResponse.json({ error: "未登录。" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const idea = await createIdea(user.id, body);
    return NextResponse.json({ idea }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建灵感失败。" },
      { status: 400 },
    );
  }
}

async function getApiUser() {
  const session = await getAppSession();

  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    return null;
  }

  return session.user;
}
```

- [ ] **Step 2: Create detail route**

Create `src/app/api/tools/ideas/[id]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { canUseMemberTools } from "@/server/auth-permissions";
import { getAppSession } from "@/server/auth";
import { archiveIdea, getIdeaDetail, updateIdea } from "@/server/ideas";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await getApiUser();

  if (!user) {
    return NextResponse.json({ error: "未登录。" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const idea = await getIdeaDetail(user.id, id);
    return NextResponse.json({ idea });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "读取灵感失败。" },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getApiUser();

  if (!user) {
    return NextResponse.json({ error: "未登录。" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const idea = await updateIdea(user.id, id, body);
    return NextResponse.json({ idea });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新灵感失败。" },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getApiUser();

  if (!user) {
    return NextResponse.json({ error: "未登录。" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await archiveIdea(user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "归档灵感失败。" },
      { status: 400 },
    );
  }
}

async function getApiUser() {
  const session = await getAppSession();

  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    return null;
  }

  return session.user;
}
```

- [ ] **Step 3: Create analyze route**

Create `src/app/api/tools/ideas/[id]/analyze/route.ts`:

```ts
import { NextResponse } from "next/server";
import { canUseMemberTools } from "@/server/auth-permissions";
import { getAppSession } from "@/server/auth";
import { analyzeIdea } from "@/server/ideas";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const user = await getApiUser();

  if (!user) {
    return NextResponse.json({ error: "未登录。" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const idea = await analyzeIdea(user.id, id, body);
    return NextResponse.json({ idea });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "分析灵感失败。" },
      { status: 400 },
    );
  }
}

async function getApiUser() {
  const session = await getAppSession();

  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    return null;
  }

  return session.user;
}
```

- [ ] **Step 4: Type-check API routes**

Run:

```bash
pnpm exec tsc --noEmit
```

Expected: PASS, with no route context or import type errors.

- [ ] **Step 5: Commit API routes**

```bash
git add src/app/api/tools/ideas
git commit -m "feat: add idea workbench api"
```

---

### Task 5: Idea Workbench UI

**Files:**
- Create: `src/app/tools/ideas/page.tsx`
- Create: `src/components/tools/idea-workbench.tsx`

- [ ] **Step 1: Create authenticated page**

Create `src/app/tools/ideas/page.tsx`:

```tsx
import { IdeaWorkbench } from "@/components/tools/idea-workbench";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";
import { listIdeas } from "@/server/ideas";

export const dynamic = "force-dynamic";

export default async function IdeasPage() {
  const user = await requireSignedInUser("/tools/ideas");
  const ideas = await listIdeas(user.id);

  return (
    <>
      <WorkspacePageHeader
        description="记录零散想法，和 AI 一起分析价值、风险与下一步，并保留完整思考过程。"
        title="灵感工作台"
      />
      <IdeaWorkbench initialIdeas={ideas} />
    </>
  );
}
```

- [ ] **Step 2: Create client workbench**

Create `src/components/tools/idea-workbench.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  Bot,
  Clipboard,
  Lightbulb,
  LoaderCircle,
  Plus,
  Save,
  Send,
  Tag,
  User,
} from "lucide-react";
import type {
  IdeaDetailView,
  IdeaListItemView,
  IdeaStatusValue,
} from "@/server/ideas";
import { cn } from "@/lib/utils";

type IdeaWorkbenchProps = {
  initialIdeas: IdeaListItemView[];
};

const statusOptions: Array<{ value: IdeaStatusValue; label: string; className: string }> = [
  { value: "CAPTURED", label: "待分析", className: "bg-slate-100 text-slate-700" },
  { value: "ANALYZING", label: "分析中", className: "bg-blue-50 text-blue-700" },
  { value: "DISTILLED", label: "已沉淀", className: "bg-emerald-50 text-emerald-700" },
  { value: "PAUSED", label: "暂缓", className: "bg-amber-50 text-amber-700" },
  { value: "ARCHIVED", label: "归档", className: "bg-slate-100 text-slate-500" },
];

export function IdeaWorkbench({ initialIdeas }: IdeaWorkbenchProps) {
  const [ideas, setIdeas] = useState(initialIdeas);
  const [selectedId, setSelectedId] = useState(initialIdeas[0]?.id || "");
  const [detail, setDetail] = useState<IdeaDetailView | null>(null);
  const [rawContent, setRawContent] = useState("");
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState("");
  const [riskNotes, setRiskNotes] = useState("");
  const [nextActions, setNextActions] = useState("");
  const [tagText, setTagText] = useState("");
  const [status, setStatus] = useState<IdeaStatusValue>("CAPTURED");
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedIdea = useMemo(
    () => detail || ideas.find((idea) => idea.id === selectedId) || null,
    [detail, ideas, selectedId],
  );

  async function createIdea(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsCreating(true);

    const response = await fetch("/api/tools/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawContent }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      idea?: IdeaDetailView;
      error?: string;
    };

    setIsCreating(false);

    if (!response.ok || !payload.idea) {
      setError(payload.error || "创建灵感失败。");
      return;
    }

    syncIdea(payload.idea);
    setSelectedId(payload.idea.id);
    setDetail(payload.idea);
    loadEditor(payload.idea);
    setRawContent("");
  }

  async function loadIdea(id: string) {
    setSelectedId(id);
    setError("");
    setIsLoadingDetail(true);

    const response = await fetch(`/api/tools/ideas/${id}`);
    const payload = (await response.json().catch(() => ({}))) as {
      idea?: IdeaDetailView;
      error?: string;
    };

    setIsLoadingDetail(false);

    if (!response.ok || !payload.idea) {
      setError(payload.error || "读取灵感失败。");
      return;
    }

    setDetail(payload.idea);
    loadEditor(payload.idea);
  }

  async function saveIdea() {
    if (!selectedIdea) return;
    setError("");
    setIsSaving(true);

    const response = await fetch(`/api/tools/ideas/${selectedIdea.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        summary,
        riskNotes,
        nextActions,
        tags: tagText
          .split(/[，,\s]+/)
          .map((tag) => tag.trim())
          .filter(Boolean),
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      idea?: IdeaDetailView;
      error?: string;
    };

    setIsSaving(false);

    if (!response.ok || !payload.idea) {
      setError(payload.error || "保存灵感失败。");
      return;
    }

    setDetail(payload.idea);
    syncIdea(payload.idea);
    loadEditor(payload.idea);
  }

  async function analyzeIdea(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedIdea || !message.trim()) return;

    setError("");
    setIsAnalyzing(true);

    const response = await fetch(`/api/tools/ideas/${selectedIdea.id}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      idea?: IdeaDetailView;
      error?: string;
    };

    setIsAnalyzing(false);

    if (!response.ok || !payload.idea) {
      setError(payload.error || "分析灵感失败。");
      return;
    }

    setMessage("");
    setDetail(payload.idea);
    syncIdea(payload.idea);
    loadEditor(payload.idea);
  }

  async function archiveSelectedIdea() {
    if (!selectedIdea) return;
    setError("");

    const response = await fetch(`/api/tools/ideas/${selectedIdea.id}`, {
      method: "DELETE",
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setError(payload.error || "归档灵感失败。");
      return;
    }

    const nextIdeas = ideas.filter((idea) => idea.id !== selectedIdea.id);
    setIdeas(nextIdeas);
    setSelectedId(nextIdeas[0]?.id || "");
    setDetail(null);
  }

  function syncIdea(idea: IdeaDetailView) {
    setIdeas((current) => {
      const item: IdeaListItemView = {
        ...idea,
        latestMessage: idea.messages.at(-1)?.content || null,
      };
      const exists = current.some((currentIdea) => currentIdea.id === item.id);
      const next = exists
        ? current.map((currentIdea) => (currentIdea.id === item.id ? item : currentIdea))
        : [item, ...current];

      return next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    });
  }

  function loadEditor(idea: IdeaDetailView | IdeaListItemView) {
    setSummary(idea.summary || "");
    setRiskNotes(idea.riskNotes || "");
    setNextActions(idea.nextActions || "");
    setTagText(idea.tags.join(" "));
    setStatus(idea.status);
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[21rem_1fr]">
      <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form className="grid gap-3" onSubmit={createIdea}>
          <label className="text-sm font-semibold text-slate-900" htmlFor="idea-content">
            记录新灵感
          </label>
          <textarea
            className="min-h-28 resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            id="idea-content"
            maxLength={3000}
            onChange={(event) => setRawContent(event.target.value)}
            placeholder="写下刚冒出来的想法..."
            required
            value={rawContent}
          />
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            disabled={isCreating}
            type="submit"
          >
            {isCreating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            新建灵感
          </button>
        </form>

        <div className="mt-5 grid gap-2">
          {ideas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              还没有灵感记录。
            </div>
          ) : (
            ideas.map((idea) => (
              <button
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors",
                  selectedId === idea.id
                    ? "border-blue-200 bg-blue-50"
                    : "border-slate-200 bg-slate-50 hover:bg-white",
                )}
                key={idea.id}
                onClick={() => loadIdea(idea.id)}
                type="button"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="line-clamp-2 text-sm font-semibold text-slate-950">{idea.title}</h2>
                  <StatusBadge status={idea.status} />
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                  {idea.summary || idea.latestMessage || idea.rawContent}
                </p>
              </button>
            ))
          )}
        </div>
      </aside>

      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {error ? (
          <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        ) : null}

        {!selectedIdea ? (
          <div className="grid min-h-[28rem] place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
            <div>
              <Lightbulb className="mx-auto h-10 w-10 text-blue-600" />
              <p className="mt-3 text-sm font-semibold text-slate-900">先记录一个灵感</p>
              <p className="mt-1 text-sm text-slate-500">创建后可以在这里持续分析和保存过程。</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={selectedIdea.status} />
                  {selectedIdea.tags.map((tag) => (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600" key={tag}>
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  {selectedIdea.title}
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {selectedIdea.rawContent}
                </p>
              </div>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                onClick={archiveSelectedIdea}
                type="button"
              >
                <Archive className="h-4 w-4" />
                归档
              </button>
            </div>

            <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-3">
              <Field label="阶段总结" onChange={setSummary} value={summary} />
              <Field label="风险点" onChange={setRiskNotes} value={riskNotes} />
              <Field label="下一步行动" onChange={setNextActions} value={nextActions} />
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-slate-700">状态</span>
                <select
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  onChange={(event) => setStatus(event.target.value as IdeaStatusValue)}
                  value={status}
                >
                  {statusOptions.filter((option) => option.value !== "ARCHIVED").map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm md:col-span-2">
                <span className="font-medium text-slate-700">标签</span>
                <input
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  maxLength={180}
                  onChange={(event) => setTagText(event.target.value)}
                  placeholder="用空格或逗号分隔"
                  value={tagText}
                />
              </label>
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 md:col-span-3"
                disabled={isSaving}
                onClick={saveIdea}
                type="button"
              >
                {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                保存沉淀
              </button>
            </div>

            <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              {isLoadingDetail ? (
                <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  正在读取
                </div>
              ) : null}
              {(detail?.messages || []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                  还没有分析过程，先发起第一轮拆解。
                </div>
              ) : (
                detail?.messages.map((item) => (
                  <div
                    className={cn(
                      "max-w-[88%] rounded-xl border px-3 py-2 text-sm leading-6",
                      item.role === "USER"
                        ? "ml-auto border-blue-200 bg-blue-600 text-white"
                        : "mr-auto border-slate-200 bg-white text-slate-700",
                    )}
                    key={item.id}
                  >
                    <div className="mb-1 flex items-center gap-1 text-xs opacity-75">
                      {item.role === "USER" ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                      {item.role === "USER" ? "我" : "AI 分析"}
                    </div>
                    <p className="whitespace-pre-wrap">{item.content}</p>
                  </div>
                ))
              )}
            </div>

            <form className="grid gap-3" onSubmit={analyzeIdea}>
              <textarea
                className="min-h-24 resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                maxLength={3000}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="继续补充背景、提问或让 AI 生成阶段总结..."
                required
                value={message}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  disabled={isAnalyzing}
                  type="submit"
                >
                  {isAnalyzing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  发送分析
                </button>
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => setMessage("请基于目前过程，帮我整理阶段总结、风险点和下一步行动。")}
                  type="button"
                >
                  <Clipboard className="h-4 w-4" />
                  生成阶段总结
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: IdeaStatusValue }) {
  const option = statusOptions.find((item) => item.value === status) || statusOptions[0];

  return (
    <span className={cn("shrink-0 rounded-full px-2 py-1 text-xs font-medium", option.className)}>
      {option.label}
    </span>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <textarea
        className="min-h-24 resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-6"
        maxLength={4000}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}
```

- [ ] **Step 3: Type-check UI**

Run:

```bash
pnpm exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 4: Commit UI**

```bash
git add src/app/tools/ideas/page.tsx src/components/tools/idea-workbench.tsx
git commit -m "feat: add idea workbench ui"
```

---

### Task 6: Navigation And Tests

**Files:**
- Modify: `src/components/tools/nav-config.ts`
- Modify: `tests/tool-navigation.test.ts`

- [ ] **Step 1: Update nav config**

In `src/components/tools/nav-config.ts`, add `Lightbulb` to the lucide import:

```ts
  Lightbulb,
```

Add this item under the `planning` group's `items`, before `plan`:

```ts
      {
        id: "ideas",
        label: "灵感工作台",
        href: "/tools/ideas",
        icon: Lightbulb,
      },
```

- [ ] **Step 2: Update navigation tests**

Append to `tests/tool-navigation.test.ts`:

```ts
test("planning sidebar exposes idea workbench", () => {
  const planning = navGroups.find((group) => group.id === "planning");

  assert.ok(planning);
  assert.deepEqual(
    planning.items.map((item) => item.id),
    ["ideas", "plan"],
  );
});

test("idea workbench route activates planning sidebar entry", () => {
  assert.equal(getActiveNavId("/tools/ideas"), "ideas");
  assert.equal(getActiveGroupId("/tools/ideas"), "planning");
});
```

- [ ] **Step 3: Run targeted tests**

Run:

```bash
pnpm exec tsx --test tests/tool-navigation.test.ts tests/ideas.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit navigation**

```bash
git add src/components/tools/nav-config.ts tests/tool-navigation.test.ts
git commit -m "feat: add idea workbench navigation"
```

---

### Task 7: Final Verification

**Files:**
- Verify only; no planned edits.

- [ ] **Step 1: Run Prisma verification**

Run:

```bash
pnpm prisma:generate
```

Expected: Prisma client generation succeeds.

- [ ] **Step 2: Run targeted tests**

Run:

```bash
pnpm exec tsx --test tests/ideas.test.ts tests/tool-navigation.test.ts
```

Expected: all tests pass.

- [ ] **Step 3: Run full test suite**

Run:

```bash
pnpm test
```

Expected: all configured tests pass. If unrelated pre-existing tests fail, record the exact failing test names and errors before continuing.

- [ ] **Step 4: Run lint**

Run:

```bash
pnpm lint
```

Expected: lint passes. If unrelated pre-existing lint errors fail, record the exact files and messages.

- [ ] **Step 5: Run production build**

Run:

```bash
pnpm build
```

Expected: Next.js build completes.

- [ ] **Step 6: Manual browser smoke test**

Run:

```bash
pnpm dev
```

Open `http://localhost:3000/tools/ideas`.

Verify:

- Navigation shows `灵感工作台` under `规划`.
- Creating a new idea adds it to the list.
- Selecting an idea loads its detail.
- Sending an analysis message appends user and AI/fallback messages.
- Saving summary, risk notes, next actions, tags, and status persists after refresh.
- Archiving removes the idea from the active list.

- [ ] **Step 7: Handle verification fixes**

If verification requires edits, return to the task that owns the failing file, apply the smallest fix there, rerun that task's verification command, and use that task's commit step. If no fixes are required, stop after recording the successful verification output.

---

## Self-Review

- Spec coverage: The plan covers persisted ideas, process messages, AI/fallback analysis, status/tags/summary/risk/next actions, `/tools/ideas`, planning navigation, auth boundaries through `authorId`, tests, and validation.
- Scope check: The plan does not add public sharing, plan-center sync, attachments, search, vector retrieval, or project management features.
- Placeholder scan: No unresolved placeholder markers or undefined implementation steps remain.
- Type consistency: Status values use `CAPTURED`, `ANALYZING`, `DISTILLED`, `PAUSED`, and `ARCHIVED` consistently across Prisma, service, API, UI, and tests. Message phases use `CAPTURE`, `ANALYSIS`, `SUMMARY`, and `ACTION` consistently.
