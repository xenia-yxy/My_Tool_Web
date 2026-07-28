import { NextResponse } from "next/server";
import { getAppSession } from "@/server/auth";
import { canAccessAdmin } from "@/server/auth-permissions";
import { updateManagedUser } from "@/server/user-management";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getAppSession();
  if (!session?.user?.id || !canAccessAdmin(session.user.role)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const user = await updateManagedUser(id, body);
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "用户更新失败" },
      { status: 400 },
    );
  }
}
