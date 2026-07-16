import { NextResponse } from "next/server";
import { canUseMemberTools } from "@/server/auth-permissions";
import { getAppSession } from "@/server/auth";
import {
  deleteIpPrototypeProject,
  getIpPrototypeProject,
  updateIpPrototypeProject,
} from "@/server/ip-prototype";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IpProjectRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: IpProjectRouteProps) {
  const user = await getApiUser();

  if (!user) {
    return NextResponse.json({ error: "未登录。" }, { status: 401 });
  }

  const { id } = await params;
  const project = await getIpPrototypeProject(user.id, id);

  if (!project) {
    return NextResponse.json({ error: "IP 项目不存在。" }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function PATCH(request: Request, { params }: IpProjectRouteProps) {
  const user = await getApiUser();

  if (!user) {
    return NextResponse.json({ error: "未登录。" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const project = await updateIpPrototypeProject(user.id, id, body);

    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新 IP 项目失败。" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: IpProjectRouteProps,
) {
  const user = await getApiUser();

  if (!user) {
    return NextResponse.json({ error: "未登录。" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await deleteIpPrototypeProject(user.id, id);

    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除 IP 项目失败。" },
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
