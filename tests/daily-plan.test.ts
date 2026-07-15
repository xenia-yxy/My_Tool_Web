import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getTodayPlanDate,
  getWeekDates,
  getWeekStartDate,
  normalizeDailyPlanCreateInput,
  normalizeDailyPlanUpdateInput,
  normalizePlanDate,
} from "../src/server/daily-plan";

test("getTodayPlanDate formats local calendar dates", () => {
  assert.equal(getTodayPlanDate(new Date(2026, 6, 10, 9, 30)), "2026-07-10");
});

test("getWeekStartDate and getWeekDates build monday based weeks", () => {
  assert.equal(getWeekStartDate("2026-07-10"), "2026-07-06");
  assert.deepEqual(getWeekDates("2026-07-06"), [
    "2026-07-06",
    "2026-07-07",
    "2026-07-08",
    "2026-07-09",
    "2026-07-10",
    "2026-07-11",
    "2026-07-12",
  ]);
});

test("normalizeDailyPlanCreateInput trims title and optional note", () => {
  assert.deepEqual(
    normalizeDailyPlanCreateInput({
      title: "  写首页需求  ",
      note: "  先把每日计划做出来  ",
      planDate: "2026-07-10",
      quadrant: "DO_NOW",
      plannedTime: "09:30",
      estimateMinutes: 45,
    }),
    {
      title: "写首页需求",
      note: "先把每日计划做出来",
      planDate: "2026-07-10",
      weekStartDate: "2026-07-06",
      priority: "MEDIUM",
      quadrant: "DO_NOW",
      plannedTime: "09:30",
      dueDate: null,
      estimateMinutes: 45,
      reviewNote: null,
      source: "MANUAL",
    },
  );
});

test("normalizeDailyPlanUpdateInput supports done state and empty note", () => {
  const result = normalizeDailyPlanUpdateInput({
    status: "DONE",
    priority: "HIGH",
    quadrant: "SCHEDULE",
    plannedTime: "09:30",
    estimateMinutes: "30",
    note: "   ",
  });

  assert.equal(result.status, "DONE");
  assert.equal(result.priority, "HIGH");
  assert.equal(result.quadrant, "SCHEDULE");
  assert.equal(result.plannedTime, "09:30");
  assert.equal(result.estimateMinutes, 30);
  assert.equal(result.note, null);
  assert.equal(result.completedAt instanceof Date, true);
});

test("normalizePlanDate rejects invalid dates", () => {
  assert.throws(() => normalizePlanDate("2026/07/10"), /计划日期格式不正确/);
});

test("normalizeDailyPlanCreateInput rejects empty titles", () => {
  assert.throws(
    () =>
      normalizeDailyPlanCreateInput({
        title: "   ",
        planDate: "2026-07-10",
      }),
    /计划内容不能为空/,
  );
});

test("normalizeDailyPlanUpdateInput rejects invalid planned time", () => {
  assert.throws(
    () =>
      normalizeDailyPlanUpdateInput({
        plannedTime: "25:00",
      }),
    /计划时间格式不正确/,
  );
});
