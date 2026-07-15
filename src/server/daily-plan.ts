import { prisma } from "@/lib/prisma";

export type DailyPlanStatusValue = "TODO" | "DOING" | "DONE" | "CANCELED";
export type DailyPlanPriorityValue = "LOW" | "MEDIUM" | "HIGH";
export type DailyPlanQuadrantValue =
  | "DO_NOW"
  | "SCHEDULE"
  | "DELEGATE"
  | "DELETE";

export type DailyPlanItemView = {
  id: string;
  planDate: string;
  weekStartDate: string;
  title: string;
  note: string | null;
  status: DailyPlanStatusValue;
  priority: DailyPlanPriorityValue;
  quadrant: DailyPlanQuadrantValue;
  plannedTime: string | null;
  dueDate: string | null;
  estimateMinutes: number | null;
  completedAt: string | null;
  reviewNote: string | null;
  source: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type DailyPlanCreateInput = {
  title?: unknown;
  note?: unknown;
  planDate?: unknown;
  weekStartDate?: unknown;
  priority?: unknown;
  quadrant?: unknown;
  plannedTime?: unknown;
  dueDate?: unknown;
  estimateMinutes?: unknown;
  reviewNote?: unknown;
  source?: unknown;
};

export type DailyPlanUpdateInput = DailyPlanCreateInput & {
  status?: unknown;
  sortOrder?: unknown;
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const maxTitleLength = 80;
const maxNoteLength = 500;
const maxReviewLength = 500;

export function getTodayPlanDate(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getWeekStartDate(date = getTodayPlanDate()) {
  const current = toPlanDate(date);
  const day = current.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;

  current.setUTCDate(current.getUTCDate() + offset);

  return current.toISOString().slice(0, 10);
}

export function getWeekDates(weekStartDate = getWeekStartDate()) {
  const start = toPlanDate(weekStartDate);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

export function normalizePlanDate(value: unknown, fallback = getTodayPlanDate()) {
  const raw = typeof value === "string" ? value.trim() : "";

  if (!raw) {
    return fallback;
  }

  if (!datePattern.test(raw)) {
    throw new Error("计划日期格式不正确。");
  }

  return raw;
}

export function toPlanDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

export function formatPlanDate(date: Date | null) {
  if (!date) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

export function normalizeDailyPlanCreateInput(input: DailyPlanCreateInput) {
  const title = normalizeTitle(input.title);
  const note = normalizeLimitedText(input.note, maxNoteLength, "备注");
  const planDate = normalizePlanDate(input.planDate);
  const weekStartDate = normalizePlanDate(
    input.weekStartDate,
    getWeekStartDate(planDate),
  );
  const priority = normalizePriority(input.priority, "MEDIUM");
  const quadrant = normalizeQuadrant(input.quadrant, "SCHEDULE");
  const plannedTime = normalizePlannedTime(input.plannedTime);
  const dueDate = normalizeNullablePlanDate(input.dueDate);
  const estimateMinutes = normalizeEstimateMinutes(input.estimateMinutes);
  const reviewNote = normalizeLimitedText(
    input.reviewNote,
    maxReviewLength,
    "复盘备注",
  );
  const source = normalizeSource(input.source);

  return {
    title,
    note,
    planDate,
    weekStartDate,
    priority,
    quadrant,
    plannedTime,
    dueDate,
    estimateMinutes,
    reviewNote,
    source,
  };
}

export function normalizeDailyPlanUpdateInput(input: DailyPlanUpdateInput) {
  const data: {
    title?: string;
    note?: string | null;
    status?: DailyPlanStatusValue;
    priority?: DailyPlanPriorityValue;
    quadrant?: DailyPlanQuadrantValue;
    plannedTime?: string | null;
    dueDate?: Date | null;
    estimateMinutes?: number | null;
    completedAt?: Date | null;
    reviewNote?: string | null;
    source?: string;
    sortOrder?: number;
    planDate?: Date;
    weekStartDate?: Date;
  } = {};

  if ("title" in input) data.title = normalizeTitle(input.title);
  if ("note" in input) data.note = normalizeLimitedText(input.note, maxNoteLength, "备注");
  if ("priority" in input) data.priority = normalizePriority(input.priority);
  if ("quadrant" in input) data.quadrant = normalizeQuadrant(input.quadrant);
  if ("plannedTime" in input) data.plannedTime = normalizePlannedTime(input.plannedTime);
  if ("dueDate" in input) data.dueDate = toNullableDate(normalizeNullablePlanDate(input.dueDate));
  if ("estimateMinutes" in input) data.estimateMinutes = normalizeEstimateMinutes(input.estimateMinutes);
  if ("reviewNote" in input) data.reviewNote = normalizeLimitedText(input.reviewNote, maxReviewLength, "复盘备注");
  if ("source" in input) data.source = normalizeSource(input.source);
  if ("sortOrder" in input) data.sortOrder = normalizeSortOrder(input.sortOrder);

  if ("planDate" in input) {
    const planDate = normalizePlanDate(input.planDate);
    data.planDate = toPlanDate(planDate);
    data.weekStartDate = toPlanDate(getWeekStartDate(planDate));
  }

  if ("status" in input) {
    const nextStatus = normalizeStatus(input.status);
    data.status = nextStatus;
    data.completedAt = nextStatus === "DONE" ? new Date() : null;
  }

  return data;
}

export async function listDailyPlanItems(authorId: string, planDate: string) {
  const items = await prisma.dailyPlanItem.findMany({
    where: {
      authorId,
      planDate: toPlanDate(planDate),
    },
    orderBy: [{ sortOrder: "asc" }, { plannedTime: "asc" }, { createdAt: "asc" }],
  });

  return items.map(toDailyPlanItemView);
}

export async function listWeeklyPlanItems(authorId: string, weekStartDate: string) {
  const items = await prisma.dailyPlanItem.findMany({
    where: {
      authorId,
      weekStartDate: toPlanDate(weekStartDate),
    },
    orderBy: [{ planDate: "asc" }, { sortOrder: "asc" }, { plannedTime: "asc" }],
  });

  return items.map(toDailyPlanItemView);
}

export async function createDailyPlanItem(authorId: string, input: DailyPlanCreateInput) {
  const normalized = normalizeDailyPlanCreateInput(input);
  const count = await prisma.dailyPlanItem.count({
    where: {
      authorId,
      planDate: toPlanDate(normalized.planDate),
    },
  });

  const item = await prisma.dailyPlanItem.create({
    data: {
      authorId,
      title: normalized.title,
      note: normalized.note,
      planDate: toPlanDate(normalized.planDate),
      weekStartDate: toPlanDate(normalized.weekStartDate),
      priority: normalized.priority,
      quadrant: normalized.quadrant,
      plannedTime: normalized.plannedTime,
      dueDate: toNullableDate(normalized.dueDate),
      estimateMinutes: normalized.estimateMinutes,
      reviewNote: normalized.reviewNote,
      source: normalized.source,
      sortOrder: count,
    },
  });

  return toDailyPlanItemView(item);
}

export async function updateDailyPlanItem(
  authorId: string,
  id: string,
  input: DailyPlanUpdateInput,
) {
  const data = normalizeDailyPlanUpdateInput(input);
  const result = await prisma.dailyPlanItem.updateMany({
    where: { id, authorId },
    data,
  });

  if (result.count === 0) {
    throw new Error("计划不存在。");
  }

  const item = await prisma.dailyPlanItem.findUniqueOrThrow({
    where: { id },
  });

  return toDailyPlanItemView(item);
}

export async function deleteDailyPlanItem(authorId: string, id: string) {
  const result = await prisma.dailyPlanItem.deleteMany({
    where: { id, authorId },
  });

  if (result.count === 0) {
    throw new Error("计划不存在。");
  }
}

function normalizeTitle(value: unknown) {
  const title = typeof value === "string" ? value.trim() : "";

  if (!title) throw new Error("计划内容不能为空。");
  if (title.length > maxTitleLength) throw new Error(`计划内容不能超过 ${maxTitleLength} 个字。`);

  return title;
}

function normalizeLimitedText(value: unknown, maxLength: number, label: string) {
  if (value === null || value === undefined) return null;

  const text = typeof value === "string" ? value.trim() : "";

  if (!text) return null;
  if (text.length > maxLength) throw new Error(`${label}不能超过 ${maxLength} 个字。`);

  return text;
}

function normalizeStatus(value: unknown): DailyPlanStatusValue {
  if (value === "TODO" || value === "DOING" || value === "DONE" || value === "CANCELED") {
    return value;
  }

  throw new Error("计划状态不正确。");
}

function normalizePriority(
  value: unknown,
  fallback?: DailyPlanPriorityValue,
): DailyPlanPriorityValue {
  if (!value && fallback) return fallback;
  if (value === "LOW" || value === "MEDIUM" || value === "HIGH") return value;

  throw new Error("计划优先级不正确。");
}

function normalizeQuadrant(
  value: unknown,
  fallback?: DailyPlanQuadrantValue,
): DailyPlanQuadrantValue {
  if (!value && fallback) return fallback;
  if (
    value === "DO_NOW" ||
    value === "SCHEDULE" ||
    value === "DELEGATE" ||
    value === "DELETE"
  ) {
    return value;
  }

  throw new Error("计划四象限不正确。");
}

function normalizePlannedTime(value: unknown) {
  if (value === null || value === undefined) return null;

  const plannedTime = typeof value === "string" ? value.trim() : "";

  if (!plannedTime) return null;
  if (!timePattern.test(plannedTime)) throw new Error("计划时间格式不正确。");

  return plannedTime;
}

function normalizeNullablePlanDate(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  return normalizePlanDate(value);
}

function toNullableDate(value: string | null) {
  return value ? toPlanDate(value) : null;
}

function normalizeEstimateMinutes(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const numeric = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(numeric) || numeric < 1 || numeric > 1440) {
    throw new Error("预计耗时不正确。");
  }

  return numeric;
}

function normalizeSortOrder(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(numeric) || numeric < 0 || numeric > 9999) {
    throw new Error("排序值不正确。");
  }

  return numeric;
}

function normalizeSource(value: unknown) {
  const source = typeof value === "string" ? value.trim().toUpperCase() : "MANUAL";

  if (!source) return "MANUAL";
  if (source.length > 24) throw new Error("计划来源不正确。");

  return source;
}

function toDailyPlanItemView(item: {
  id: string;
  planDate: Date;
  weekStartDate: Date;
  title: string;
  note: string | null;
  status: DailyPlanStatusValue;
  priority: DailyPlanPriorityValue;
  quadrant: DailyPlanQuadrantValue;
  plannedTime: string | null;
  dueDate: Date | null;
  estimateMinutes: number | null;
  completedAt: Date | null;
  reviewNote: string | null;
  source: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): DailyPlanItemView {
  return {
    id: item.id,
    planDate: formatPlanDate(item.planDate) || "",
    weekStartDate: formatPlanDate(item.weekStartDate) || "",
    title: item.title,
    note: item.note,
    status: item.status,
    priority: item.priority,
    quadrant: item.quadrant,
    plannedTime: item.plannedTime,
    dueDate: formatPlanDate(item.dueDate),
    estimateMinutes: item.estimateMinutes,
    completedAt: item.completedAt?.toISOString() || null,
    reviewNote: item.reviewNote,
    source: item.source,
    sortOrder: item.sortOrder,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
