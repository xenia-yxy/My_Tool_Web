import { NextResponse } from "next/server";
import { getAppSession } from "@/server/auth";
import { canUseMemberTools } from "@/server/auth-permissions";
import {
  createMenswearProject,
  listMenswearProjects,
} from "@/server/menswear-studio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getMemberUser();
  if (!user) return unauthorized();

  return NextResponse.json({ projects: await listMenswearProjects(user.id) });
}

export async function POST(request: Request) {
  const user = await getMemberUser();
  if (!user) return unauthorized();

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const project = await createMenswearProject(user.id, body);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建男装项目失败" },
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
