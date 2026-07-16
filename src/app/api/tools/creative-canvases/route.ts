import { NextResponse } from "next/server";
import { getAppSession } from "@/server/auth";
import { canUseMemberTools } from "@/server/auth-permissions";
import { createCreativeCanvas, listCreativeCanvases } from "@/server/creative-canvas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthorizedUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  return NextResponse.json({ canvases: await listCreativeCanvases(user.id) });
}

export async function POST(request: Request) {
  const user = await getAuthorizedUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  try {
    const body = (await request.json().catch(() => ({}))) as { title?: unknown };
    if (typeof body.title !== "undefined" && typeof body.title !== "string") {
      throw new Error("画布标题不正确");
    }
    return NextResponse.json({ canvas: await createCreativeCanvas(user.id, body.title) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建画布失败" },
      { status: 400 },
    );
  }
}

async function getAuthorizedUser() {
  const session = await getAppSession();
  return session?.user?.id && canUseMemberTools(session.user.role) ? session.user : null;
}
