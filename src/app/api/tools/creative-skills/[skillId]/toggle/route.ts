import { NextResponse } from "next/server";
import { getAppSession } from "@/server/auth";
import { canUseMemberTools } from "@/server/auth-permissions";
import { setCreativeSkillEnabled } from "@/server/creative-skills";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ skillId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const user = await getAuthorizedUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  try {
    const body = (await request.json()) as { enabled?: unknown };
    if (typeof body.enabled !== "boolean") throw new Error("Skill 启用状态不正确");
    const { skillId } = await context.params;
    const skill = await setCreativeSkillEnabled(user.id, skillId, body.enabled);
    return skill ? NextResponse.json({ skill }) : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新 Skill 状态失败" },
      { status: 400 },
    );
  }
}

async function getAuthorizedUser() {
  const session = await getAppSession();
  return session?.user?.id && canUseMemberTools(session.user.role) ? session.user : null;
}
