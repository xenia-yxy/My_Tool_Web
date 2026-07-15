import { NextResponse } from "next/server";
import { getAppSession } from "@/server/auth";
import { canUseMemberTools } from "@/server/auth-permissions";
import {
  deleteMenswearMaterial,
  getMenswearMaterial,
  updateMenswearMaterial,
} from "@/server/menswear-studio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MaterialRouteProps = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: MaterialRouteProps) {
  const user = await getMemberUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const material = await getMenswearMaterial(user.id, id);
  return material
    ? NextResponse.json({ material })
    : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
}

export async function PATCH(request: Request, { params }: MaterialRouteProps) {
  const user = await getMemberUser();
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const material = await updateMenswearMaterial(user.id, id, body);
    return material
      ? NextResponse.json({ material })
      : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新素材失败" },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, { params }: MaterialRouteProps) {
  const user = await getMemberUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const material = await deleteMenswearMaterial(user.id, id);
  return material
    ? NextResponse.json({ deleted: true, id: material.id })
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
