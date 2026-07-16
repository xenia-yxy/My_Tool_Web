import { NextResponse } from "next/server";
import { getAppSession } from "@/server/auth";
import { canUseMemberTools } from "@/server/auth-permissions";
import { deleteCreativeSkill, getCreativeSkill, updateCreativeSkill } from "@/server/creative-skills";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ skillId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const user = await getAuthorizedUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { skillId } = await context.params;
  const skill = await getCreativeSkill(user.id, skillId);
  return skill ? NextResponse.json({ skill }) : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getAuthorizedUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  try {
    const { skillId } = await context.params;
    const skill = await updateCreativeSkill(user.id, skillId, await request.json());
    return skill ? NextResponse.json({ skill }) : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新 Skill 失败" },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getAuthorizedUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { skillId } = await context.params;
  const skill = await deleteCreativeSkill(user.id, skillId);
  return skill ? NextResponse.json({ skill }) : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
}

async function getAuthorizedUser() {
  const session = await getAppSession();
  return session?.user?.id && canUseMemberTools(session.user.role) ? session.user : null;
}
