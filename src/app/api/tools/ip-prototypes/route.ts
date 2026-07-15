import { NextResponse } from "next/server";
import { canUseMemberTools } from "@/server/auth-permissions";
import { getAppSession } from "@/server/auth";
import {
  createIpPrototypeProject,
  listIpPrototypeProjects,
} from "@/server/ip-prototype";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getApiUser();

  if (!user) {
    return NextResponse.json({ error: "未登录。" }, { status: 401 });
  }

  const projects = await listIpPrototypeProjects(user.id);

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const user = await getApiUser();

  if (!user) {
    return NextResponse.json({ error: "未登录。" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const project = await createIpPrototypeProject(user.id, body);

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建 IP 项目失败。" },
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
