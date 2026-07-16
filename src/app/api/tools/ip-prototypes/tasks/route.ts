import { NextResponse } from "next/server";
import { canUseMemberTools } from "@/server/auth-permissions";
import { getAppSession } from "@/server/auth";
import { createDailyPlanItem } from "@/server/daily-plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TaskPayload = {
  tasks?: Array<{
    title?: string;
    note?: string;
    quadrant?: string;
    priority?: string;
    estimateMinutes?: number;
  }>;
};

export async function POST(request: Request) {
  const session = await getAppSession();

  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    return NextResponse.json({ error: "未登录。" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as TaskPayload;
    const tasks = Array.isArray(body.tasks) ? body.tasks.slice(0, 6) : [];

    if (tasks.length === 0) {
      throw new Error("没有可创建的任务。");
    }

    const items = [];

    for (const task of tasks) {
      items.push(
        await createDailyPlanItem(session.user.id, {
          title: task.title,
          note: task.note,
          quadrant: task.quadrant || "SCHEDULE",
          priority: task.priority || "MEDIUM",
          estimateMinutes: task.estimateMinutes,
          source: "IP_PROTOTYPE",
        }),
      );
    }

    return NextResponse.json({ items }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建计划任务失败。" },
      { status: 400 },
    );
  }
}
