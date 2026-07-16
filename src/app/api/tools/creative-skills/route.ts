import { NextResponse } from "next/server";
import { getAppSession } from "@/server/auth";
import { canUseMemberTools } from "@/server/auth-permissions";
import { createCreativeSkill, listCreativeSkills } from "@/server/creative-skills";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getAuthorizedUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const includeDisabled = new URL(request.url).searchParams.get("includeDisabled") === "true";
  return NextResponse.json({ skills: await listCreativeSkills(user.id, includeDisabled) });
}

export async function POST(request: Request) {
  const user = await getAuthorizedUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  try {
    return NextResponse.json({ skill: await createCreativeSkill(user.id, await request.json()) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建 Skill 失败" },
      { status: 400 },
    );
  }
}

async function getAuthorizedUser() {
  const session = await getAppSession();
  return session?.user?.id && canUseMemberTools(session.user.role) ? session.user : null;
}
