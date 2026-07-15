import { NextResponse } from "next/server";
import { getAppSession } from "@/server/auth";
import { canUseMemberTools } from "@/server/auth-permissions";
import {
  createMenswearModelProfile,
  listMenswearModelProfiles,
} from "@/server/menswear-studio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getMemberUser();
  if (!user) return unauthorized();

  const profiles = await listMenswearModelProfiles(user.id);
  return NextResponse.json({ profiles });
}

export async function POST(request: Request) {
  const user = await getMemberUser();
  if (!user) return unauthorized();

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const profile = await createMenswearModelProfile(user.id, body);
    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建模特档案失败" },
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
