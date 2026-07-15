import { NextResponse } from "next/server";
import { getAppSession } from "@/server/auth";
import { canUseMemberTools } from "@/server/auth-permissions";
import {
  getMenswearProject,
  updateMenswearProject,
} from "@/server/menswear-studio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProjectRouteProps = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: ProjectRouteProps) {
  const user = await getMemberUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const project = await getMenswearProject(user.id, id);
  return project
    ? NextResponse.json({ project })
    : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
}

export async function PATCH(request: Request, { params }: ProjectRouteProps) {
  const user = await getMemberUser();
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const project = await updateMenswearProject(user.id, id, body);
    return project
      ? NextResponse.json({ project })
      : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新男装项目失败" },
      { status: 400 },
    );
  }
}

async function getMemberUser() {
  const session = await getAppSession();
  return session?.user?.id && canUseMemberTools(session.user.role)
    ? session.user
    : null;
}

function unauthorized() {
  return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
}
