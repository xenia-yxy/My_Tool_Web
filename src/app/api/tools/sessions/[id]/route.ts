import { NextResponse } from "next/server";
import {
  getWorkbenchSession,
  normalizeWorkbenchSessionPatch,
  updateWorkbenchSession,
} from "@/server/workbench-sessions";
import { canUseMemberTools } from "@/server/auth-permissions";
import { getAppSession } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const user = await getAuthorizedUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await context.params;
  const session = await getWorkbenchSession(user.id, id);

  if (!session) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ session });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getAuthorizedUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const patch = normalizeWorkbenchSessionPatch(await request.json());
    const session = await updateWorkbenchSession(user.id, id, patch);

    if (!session) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新历史记录失败" },
      { status: 400 },
    );
  }
}

async function getAuthorizedUser() {
  const session = await getAppSession();

  return session?.user?.id && canUseMemberTools(session.user.role) ? session.user : null;
}
