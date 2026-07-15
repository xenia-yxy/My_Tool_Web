import { NextResponse } from "next/server";
import { canUseMemberTools } from "@/server/auth-permissions";
import { getAppSession } from "@/server/auth";
import {
  createDailyPlanItem,
  getTodayPlanDate,
  getWeekDates,
  getWeekStartDate,
  listDailyPlanItems,
  listWeeklyPlanItems,
  normalizePlanDate,
} from "@/server/daily-plan";

export async function GET(request: Request) {
  const user = await getApiUser();

  if (!user) {
    return NextResponse.json({ error: "未登录。" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const planDate = normalizePlanDate(
      url.searchParams.get("date"),
      getTodayPlanDate(),
    );
    const weekStartDate = normalizePlanDate(
      url.searchParams.get("weekStartDate"),
      getWeekStartDate(planDate),
    );
    const items = await listDailyPlanItems(user.id, planDate);
    const weekItems = await listWeeklyPlanItems(user.id, weekStartDate);

    return NextResponse.json({
      items,
      planDate,
      weekStartDate,
      weekDates: getWeekDates(weekStartDate),
      weekItems,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "读取每日计划失败。" },
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
    const body = (await request.json().catch(() => ({}))) as unknown;
    const item = await createDailyPlanItem(user.id, body as Record<string, unknown>);

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建每日计划失败。" },
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
