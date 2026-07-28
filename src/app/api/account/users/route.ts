import { NextResponse } from "next/server";
import { getAppSession } from "@/server/auth";
import { canAccessAdmin } from "@/server/auth-permissions";
import { createManagedUser, listManagedUsers } from "@/server/user-management";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAppSession();
  if (!session?.user?.id || !canAccessAdmin(session.user.role)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  return NextResponse.json({ users: await listManagedUsers() });
}

export async function POST(request: Request) {
  const session = await getAppSession();
  if (!session?.user?.id || !canAccessAdmin(session.user.role)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const user = await createManagedUser(body);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建用户失败" },
      { status: 400 },
    );
  }
}
