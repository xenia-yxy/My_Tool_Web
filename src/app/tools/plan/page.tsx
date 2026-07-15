import { DailyPlanPanel } from "@/components/tools/daily-plan-panel";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";
import {
  getTodayPlanDate,
  getWeekDates,
  getWeekStartDate,
  listDailyPlanItems,
  listWeeklyPlanItems,
} from "@/server/daily-plan";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const user = await requireSignedInUser("/tools/plan");
  const planDate = getTodayPlanDate();
  const weekStartDate = getWeekStartDate(planDate);
  const planItems = await listDailyPlanItems(user.id, planDate);
  const weekItems = await listWeeklyPlanItems(user.id, weekStartDate);
  const weekDates = getWeekDates(weekStartDate);

  return (
    <>
      <WorkspacePageHeader
        description="把今天、本周和四象限拆开管理，不再和所有工具堆在一个页面里。"
        title="计划中心"
      />
      <DailyPlanPanel
        initialItems={planItems}
        initialWeekItems={weekItems}
        planDate={planDate}
        weekDates={weekDates}
        weekStartDate={weekStartDate}
      />
    </>
  );
}
