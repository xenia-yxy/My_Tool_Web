import { NextResponse } from "next/server";
import { getAppSession } from "@/server/auth";
import { canUseMemberTools } from "@/server/auth-permissions";
import {
  createMenswearMaterial,
  listMenswearMaterials,
} from "@/server/menswear-studio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getMemberUser();
  if (!user) return unauthorized();

  const url = new URL(request.url);
  const materials = await listMenswearMaterials({
    authorId: user.id,
    category: url.searchParams.get("category"),
    query: url.searchParams.get("query"),
  });

  return NextResponse.json({ materials });
}

export async function POST(request: Request) {
  const user = await getMemberUser();
  if (!user) return unauthorized();

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const material = await createMenswearMaterial(user.id, body);
    return NextResponse.json({ material }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建素材失败" },
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
