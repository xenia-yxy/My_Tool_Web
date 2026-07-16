"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import type {
  DailyPlanItemView,
  DailyPlanPriorityValue,
  DailyPlanQuadrantValue,
  DailyPlanStatusValue,
} from "@/server/daily-plan";
import { recordWorkbenchAction } from "@/components/tools/workbench-action-recorder";
import { cn } from "@/lib/utils";

type DailyPlanPanelProps = {
  initialItems: DailyPlanItemView[];
  initialWeekItems: DailyPlanItemView[];
  planDate: string;
  weekDates: string[];
  weekStartDate: string;
};

type EditingState = {
  title: string;
  note: string;
  plannedTime: string;
  priority: DailyPlanPriorityValue;
  quadrant: DailyPlanQuadrantValue;
  planDate: string;
  dueDate: string;
  estimateMinutes: string;
  reviewNote: string;
};

const priorityOptions: Array<{ value: DailyPlanPriorityValue; label: string }> = [
  { value: "HIGH", label: "重要" },
  { value: "MEDIUM", label: "普通" },
  { value: "LOW", label: "低优先" },
];

const quadrantOptions: Array<{
  value: DailyPlanQuadrantValue;
  title: string;
  shortTitle: string;
  description: string;
  className: string;
}> = [
  {
    value: "DO_NOW",
    title: "重要且紧急",
    shortTitle: "立即做",
    description: "今天必须推进的事",
    className: "border-red-100 bg-red-50/70 text-red-700",
  },
  {
    value: "SCHEDULE",
    title: "重要不紧急",
    shortTitle: "安排做",
    description: "本周持续推进的事",
    className: "border-blue-100 bg-blue-50/70 text-blue-700",
  },
  {
    value: "DELEGATE",
    title: "紧急不重要",
    shortTitle: "简化做",
    description: "尽快处理但不消耗太多",
    className: "border-amber-100 bg-amber-50/70 text-amber-700",
  },
  {
    value: "DELETE",
    title: "不重要不紧急",
    shortTitle: "先放下",
    description: "不急着占用今天",
    className: "border-slate-200 bg-slate-50 text-slate-600",
  },
];

const weekLabels = ["一", "二", "三", "四", "五", "六", "日"];

export function DailyPlanPanel({
  initialItems,
  initialWeekItems,
  planDate,
  weekDates,
}: DailyPlanPanelProps) {
  const [items, setItems] = useState(initialItems);
  const [weekItems, setWeekItems] = useState(initialWeekItems);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [selectedDate, setSelectedDate] = useState(planDate);
  const [plannedTime, setPlannedTime] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [estimateMinutes, setEstimateMinutes] = useState("");
  const [priority, setPriority] = useState<DailyPlanPriorityValue>("MEDIUM");
  const [quadrant, setQuadrant] = useState<DailyPlanQuadrantValue>("SCHEDULE");
  const [editing, setEditing] = useState<Record<string, EditingState>>({});
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const todayItems = weekItems.filter((item) => item.planDate === planDate);
  const completedCount = todayItems.filter((item) => item.status === "DONE").length;
  const progress = todayItems.length === 0 ? 0 : Math.round((completedCount / todayItems.length) * 100);
  const totalEstimate = todayItems.reduce(
    (sum, item) => sum + (item.estimateMinutes || 0),
    0,
  );
  const displayDate = useMemo(() => planDate.replaceAll("-", "."), [planDate]);

  async function createItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsCreating(true);

    const response = await fetch("/api/daily-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        note,
        planDate: selectedDate,
        plannedTime,
        dueDate,
        estimateMinutes,
        priority,
        quadrant,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      item?: DailyPlanItemView;
      error?: string;
    };

    setIsCreating(false);

    if (!response.ok || !payload.item) {
      setError(payload.error || "新增计划失败。");
      return;
    }

    syncItem(payload.item);
    recordPlanAction("新增计划", payload.item, "计划已新增。");
    setTitle("");
    setNote("");
    setPlannedTime("");
    setDueDate("");
    setEstimateMinutes("");
    setPriority("MEDIUM");
    setQuadrant("SCHEDULE");
  }

  async function updateItem(
    item: DailyPlanItemView,
    input: Partial<
      Pick<
        DailyPlanItemView,
        | "title"
        | "note"
        | "status"
        | "priority"
        | "quadrant"
        | "plannedTime"
        | "planDate"
        | "dueDate"
        | "estimateMinutes"
        | "reviewNote"
      >
    >,
  ) {
    setError("");
    setPendingId(item.id);

    const response = await fetch(`/api/daily-plan/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      item?: DailyPlanItemView;
      error?: string;
    };

    setPendingId(null);

    if (!response.ok || !payload.item) {
      setError(payload.error || "更新计划失败。");
      return;
    }

    syncItem(payload.item);
    recordPlanAction("更新计划", payload.item, "计划已更新。");
    cancelEdit(item.id);
  }

  async function deleteItem(item: DailyPlanItemView) {
    setError("");
    setPendingId(item.id);

    const response = await fetch(`/api/daily-plan/${item.id}`, { method: "DELETE" });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    setPendingId(null);

    if (!response.ok) {
      setError(payload.error || "删除计划失败。");
      return;
    }

    setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
    setWeekItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
    recordPlanAction("删除计划", item, "计划已删除。");
  }

  function recordPlanAction(
    actionLabel: string,
    item: DailyPlanItemView,
    outputSummary: string,
  ) {
    void recordWorkbenchAction({
      toolId: "plan",
      toolLabel: "计划中心",
      actionLabel,
      title: `${actionLabel}：${item.title}`,
      fields: [
        { label: "计划", value: item.title },
        { label: "日期", value: item.planDate },
        { label: "时间", value: item.plannedTime || "未设置" },
        { label: "象限", value: quadrantLabel(item.quadrant) },
        { label: "优先级", value: priorityLabel(item.priority) },
      ],
      inputSnapshot: {
        id: item.id,
        title: item.title,
        note: item.note,
        planDate: item.planDate,
        plannedTime: item.plannedTime,
        priority: item.priority,
        quadrant: item.quadrant,
        status: item.status,
      },
      outputSummary,
    });
  }

  function syncItem(item: DailyPlanItemView) {
    setWeekItems((current) => upsertItem(current, item));
    setItems((current) =>
      item.planDate === planDate
        ? upsertItem(current, item)
        : current.filter((currentItem) => currentItem.id !== item.id),
    );
  }

  function beginEdit(item: DailyPlanItemView) {
    setEditing((current) => ({
      ...current,
      [item.id]: {
        title: item.title,
        note: item.note || "",
        plannedTime: item.plannedTime || "",
        priority: item.priority,
        quadrant: item.quadrant,
        planDate: item.planDate,
        dueDate: item.dueDate || "",
        estimateMinutes: item.estimateMinutes ? String(item.estimateMinutes) : "",
        reviewNote: item.reviewNote || "",
      },
    }));
  }

  function updateEditing(id: string, patch: Partial<EditingState>) {
    setEditing((current) => ({
      ...current,
      [id]: { ...current[id], ...patch },
    }));
  }

  function cancelEdit(id: string) {
    setEditing((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_70px_rgba(15,23,42,0.07)]">
      <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
              计划中心
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-500">
              {displayDate}
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            四象限 + 周计划
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            先按重要/紧急判断，再落到具体日期、时间和完成标准。
          </p>
        </div>

        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">今日完成</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {completedCount}/{todayItems.length}
              </p>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-sm font-semibold text-blue-700 shadow-sm">
              {progress}%
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
            <span className="rounded-lg bg-white px-3 py-2">本周 {weekItems.length} 项</span>
            <span className="rounded-lg bg-white px-3 py-2">预计 {totalEstimate || 0} 分钟</span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-7">
        {weekDates.map((date, index) => {
          const count = weekItems.filter((item) => item.planDate === date).length;
          const doneCount = weekItems.filter(
            (item) => item.planDate === date && item.status === "DONE",
          ).length;
          const isToday = date === planDate;
          return (
            <button
              className={cn(
                "rounded-xl border bg-white px-3 py-2 text-left transition-colors",
                isToday ? "border-blue-200 text-blue-700" : "border-slate-200 text-slate-600",
              )}
              key={date}
              onClick={() => setSelectedDate(date)}
              type="button"
            >
              <span className="text-xs font-medium">周{weekLabels[index]}</span>
              <span className="mt-1 block text-sm font-semibold">{date.slice(5)}</span>
              <span className="mt-1 block text-xs text-slate-400">
                {doneCount}/{count}
              </span>
            </button>
          );
        })}
      </div>

      <form
        className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1fr_8.5rem_8.5rem_8.5rem_auto]"
        onSubmit={createItem}
      >
        <input
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          maxLength={80}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="新增计划"
          required
          value={title}
        />
        <input
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          onChange={(event) => setSelectedDate(event.target.value)}
          type="date"
          value={selectedDate}
        />
        <input
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          onChange={(event) => setPlannedTime(event.target.value)}
          type="time"
          value={plannedTime}
        />
        <select
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          onChange={(event) => setQuadrant(event.target.value as DailyPlanQuadrantValue)}
          value={quadrant}
        >
          {quadrantOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.shortTitle}
            </option>
          ))}
        </select>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          disabled={isCreating}
          type="submit"
        >
          {isCreating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          添加
        </button>
        <select
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          onChange={(event) => setPriority(event.target.value as DailyPlanPriorityValue)}
          value={priority}
        >
          {priorityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          min="1"
          onChange={(event) => setEstimateMinutes(event.target.value)}
          placeholder="预计分钟"
          type="number"
          value={estimateMinutes}
        />
        <input
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          onChange={(event) => setDueDate(event.target.value)}
          type="date"
          value={dueDate}
        />
        <input
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 lg:col-span-2"
          maxLength={500}
          onChange={(event) => setNote(event.target.value)}
          placeholder="备注 / 完成标准"
          value={note}
        />
      </form>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {quadrantOptions.map((option) => (
          <QuadrantPanel
            beginEdit={beginEdit}
            cancelEdit={cancelEdit}
            deleteItem={deleteItem}
            editing={editing}
            items={items.filter((item) => item.quadrant === option.value)}
            key={option.value}
            option={option}
            pendingId={pendingId}
            updateEditing={updateEditing}
            updateItem={updateItem}
          />
        ))}
      </div>
    </section>
  );
}

type QuadrantPanelProps = {
  option: (typeof quadrantOptions)[number];
  items: DailyPlanItemView[];
  pendingId: string | null;
  editing: Record<string, EditingState>;
  beginEdit: (item: DailyPlanItemView) => void;
  cancelEdit: (id: string) => void;
  updateEditing: (id: string, patch: Partial<EditingState>) => void;
  updateItem: (
    item: DailyPlanItemView,
    input: Partial<
      Pick<
        DailyPlanItemView,
        | "title"
        | "note"
        | "status"
        | "priority"
        | "quadrant"
        | "plannedTime"
        | "planDate"
        | "dueDate"
        | "estimateMinutes"
        | "reviewNote"
      >
    >,
  ) => void;
  deleteItem: (item: DailyPlanItemView) => void;
};

function QuadrantPanel({
  option,
  items,
  pendingId,
  editing,
  beginEdit,
  cancelEdit,
  updateEditing,
  updateItem,
  deleteItem,
}: QuadrantPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-3 flex items-start justify-between gap-3 px-1">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{option.title}</h2>
          <p className="mt-1 text-xs text-slate-500">{option.description}</p>
        </div>
        <span className={`rounded-full border px-2 py-1 text-xs font-medium ${option.className}`}>
          {items.length}
        </span>
      </div>

      <div className="grid gap-3">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
            暂时没有任务。
          </div>
        ) : (
          items.map((item) => (
            <PlanItem
              beginEdit={beginEdit}
              cancelEdit={cancelEdit}
              deleteItem={deleteItem}
              editing={editing[item.id]}
              item={item}
              key={item.id}
              pendingId={pendingId}
              updateEditing={updateEditing}
              updateItem={updateItem}
            />
          ))
        )}
      </div>
    </div>
  );
}

type PlanItemProps = {
  item: DailyPlanItemView;
  editing?: EditingState;
  pendingId: string | null;
  beginEdit: (item: DailyPlanItemView) => void;
  cancelEdit: (id: string) => void;
  updateEditing: (id: string, patch: Partial<EditingState>) => void;
  updateItem: QuadrantPanelProps["updateItem"];
  deleteItem: (item: DailyPlanItemView) => void;
};

function PlanItem({
  item,
  editing,
  pendingId,
  beginEdit,
  cancelEdit,
  updateEditing,
  updateItem,
  deleteItem,
}: PlanItemProps) {
  const isPending = pendingId === item.id;

  if (editing) {
    return (
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <input
          className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          maxLength={80}
          onChange={(event) => updateEditing(item.id, { title: event.target.value })}
          value={editing.title}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <input className="h-10 rounded-lg border border-slate-200 px-3 text-sm" onChange={(event) => updateEditing(item.id, { planDate: event.target.value })} type="date" value={editing.planDate} />
          <input className="h-10 rounded-lg border border-slate-200 px-3 text-sm" onChange={(event) => updateEditing(item.id, { plannedTime: event.target.value })} type="time" value={editing.plannedTime} />
          <select className="h-10 rounded-lg border border-slate-200 px-3 text-sm" onChange={(event) => updateEditing(item.id, { quadrant: event.target.value as DailyPlanQuadrantValue })} value={editing.quadrant}>
            {quadrantOptions.map((option) => <option key={option.value} value={option.value}>{option.shortTitle}</option>)}
          </select>
          <select className="h-10 rounded-lg border border-slate-200 px-3 text-sm" onChange={(event) => updateEditing(item.id, { priority: event.target.value as DailyPlanPriorityValue })} value={editing.priority}>
            {priorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <input className="h-10 rounded-lg border border-slate-200 px-3 text-sm" onChange={(event) => updateEditing(item.id, { estimateMinutes: event.target.value })} placeholder="预计分钟" type="number" value={editing.estimateMinutes} />
        <input className="h-10 rounded-lg border border-slate-200 px-3 text-sm" maxLength={500} onChange={(event) => updateEditing(item.id, { note: event.target.value })} placeholder="备注 / 完成标准" value={editing.note} />
        <input className="h-10 rounded-lg border border-slate-200 px-3 text-sm" maxLength={500} onChange={(event) => updateEditing(item.id, { reviewNote: event.target.value })} placeholder="复盘备注" value={editing.reviewNote} />
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            disabled={isPending}
            onClick={() =>
              updateItem(item, {
                ...editing,
                estimateMinutes: editing.estimateMinutes
                  ? Number(editing.estimateMinutes)
                  : null,
              })
            }
            type="button"
          >
            <Save aria-hidden="true" className="h-4 w-4" />
            保存
          </button>
          <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => cancelEdit(item.id)} type="button">
            <X aria-hidden="true" className="h-4 w-4" />
            取消
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-start gap-3">
        <button
          aria-label={item.status === "DONE" ? "标记为未完成" : "标记完成"}
          className="mt-0.5 text-slate-400 transition-colors hover:text-blue-700 disabled:opacity-50"
          disabled={isPending}
          onClick={() => updateItem(item, { status: nextStatus(item.status) })}
          type="button"
        >
          {item.status === "DONE" ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5" />}
        </button>
        <button className="min-w-0 flex-1 text-left" onClick={() => beginEdit(item)} type="button">
          <div className="flex flex-wrap items-center gap-2">
            {item.plannedTime ? <Meta><Clock3 className="h-3 w-3" />{item.plannedTime}</Meta> : null}
            <Meta><CalendarDays className="h-3 w-3" />{item.planDate.slice(5)}</Meta>
            {item.estimateMinutes ? <Meta>{item.estimateMinutes} 分钟</Meta> : null}
            <span className={priorityClass(item.priority)}>{priorityLabel(item.priority)}</span>
          </div>
          <p className={cn("mt-2 text-sm font-semibold text-slate-900", item.status === "DONE" && "text-slate-400 line-through")}>{item.title}</p>
          {item.note ? <p className="mt-1 text-sm leading-6 text-slate-500">{item.note}</p> : null}
          {item.reviewNote ? <p className="mt-2 rounded-lg bg-emerald-50 px-2 py-1 text-xs text-emerald-700">复盘：{item.reviewNote}</p> : null}
        </button>
        <button aria-label="删除计划" className="text-slate-300 transition-colors hover:text-red-600 disabled:opacity-50" disabled={isPending} onClick={() => deleteItem(item)} type="button">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Meta({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      {children}
    </span>
  );
}

function upsertItem(items: DailyPlanItemView[], item: DailyPlanItemView) {
  const exists = items.some((current) => current.id === item.id);
  const next = exists
    ? items.map((current) => (current.id === item.id ? item : current))
    : [...items, item];

  return next.sort((a, b) => {
    if (a.planDate !== b.planDate) return a.planDate.localeCompare(b.planDate);
    return (a.plannedTime || "99:99").localeCompare(b.plannedTime || "99:99");
  });
}

function nextStatus(status: DailyPlanStatusValue): DailyPlanStatusValue {
  return status === "DONE" ? "TODO" : "DONE";
}

function priorityLabel(priority: DailyPlanPriorityValue) {
  if (priority === "HIGH") return "重要";
  if (priority === "LOW") return "低优先";
  return "普通";
}

function quadrantLabel(quadrant: DailyPlanQuadrantValue) {
  return quadrantOptions.find((option) => option.value === quadrant)?.shortTitle ?? quadrant;
}

function priorityClass(priority: DailyPlanPriorityValue) {
  return cn(
    "rounded-full px-2 py-0.5 text-xs font-medium",
    priority === "HIGH" && "bg-red-50 text-red-700",
    priority === "MEDIUM" && "bg-blue-50 text-blue-700",
    priority === "LOW" && "bg-slate-100 text-slate-600",
  );
}
