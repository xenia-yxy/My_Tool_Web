import { NextResponse } from "next/server";
import { getAppSession } from "@/server/auth";
import { canUseMemberTools } from "@/server/auth-permissions";
import {
  deleteMenswearModelProfile,
  getMenswearModelProfile,
  updateMenswearModelProfile,
} from "@/server/menswear-studio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ModelRouteProps = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: ModelRouteProps) {
  const user = await getMemberUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const profile = await getMenswearModelProfile(user.id, id);
  return profile
    ? NextResponse.json({ profile })
    : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
}

export async function PATCH(request: Request, { params }: ModelRouteProps) {
  const user = await getMemberUser();
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const profile = await updateMenswearModelProfile(user.id, id, body);
    return profile
      ? NextResponse.json({ profile })
      : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新模特档案失败" },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, { params }: ModelRouteProps) {
  const user = await getMemberUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const profile = await deleteMenswearModelProfile(user.id, id);
  return profile
    ? NextResponse.json({ deleted: true, id: profile.id })
    : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
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
