import { NextResponse } from "next/server";
import {
  createWorkbenchSession,
  listWorkbenchSessions,
} from "@/server/workbench-sessions";
import { canUseMemberTools } from "@/server/auth-permissions";
import { getAppSession } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getAuthorizedUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const toolId = new URL(request.url).searchParams.get("toolId")?.trim() || "";
    const sessions = await listWorkbenchSessions(user.id, toolId);
    return NextResponse.json({ sessions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "读取历史记录失败" },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  const user = await getAuthorizedUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const session = await createWorkbenchSession(user.id, body);
    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建历史记录失败" },
      { status: 400 },
    );
  }
}

async function getAuthorizedUser() {
  const session = await getAppSession();

  return session?.user?.id && canUseMemberTools(session.user.role) ? session.user : null;
}
