import { NextResponse } from "next/server";
import { canUseMemberTools } from "@/server/auth-permissions";
import { getAppSession } from "@/server/auth";
import {
  deleteIpPrototypeGeneration,
  updateIpPrototypeGeneration,
} from "@/server/ip-prototype";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IpGenerationRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: IpGenerationRouteProps,
) {
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
    const generation = await updateIpPrototypeGeneration(user.id, id, body);

    return NextResponse.json({ generation });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新生成记录失败。" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: IpGenerationRouteProps,
) {
  const user = await getApiUser();

  if (!user) {
    return NextResponse.json({ error: "未登录。" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await deleteIpPrototypeGeneration(user.id, id);

    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除生成记录失败。" },
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
