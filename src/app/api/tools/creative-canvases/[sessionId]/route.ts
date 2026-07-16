import { NextResponse } from "next/server";
import { getAppSession } from "@/server/auth";
import { canUseMemberTools } from "@/server/auth-permissions";
import { duplicateCreativeCanvas, getCreativeCanvas, patchCreativeCanvas } from "@/server/creative-canvas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const user = await getAuthorizedUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { sessionId } = await context.params;
  const canvas = await getCreativeCanvas(user.id, sessionId);
  return canvas ? NextResponse.json({ canvas }) : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getAuthorizedUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  try {
    const { sessionId } = await context.params;
    const canvas = await patchCreativeCanvas(user.id, sessionId, await request.json());
    return canvas ? NextResponse.json({ canvas }) : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存画布失败" },
      { status: 400 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const user = await getAuthorizedUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (new URL(request.url).searchParams.get("operation") !== "duplicate") {
    return NextResponse.json({ error: "操作不正确" }, { status: 400 });
  }

  const { sessionId } = await context.params;
  const canvas = await duplicateCreativeCanvas(user.id, sessionId);
  return canvas ? NextResponse.json({ canvas }, { status: 201 }) : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
}

async function getAuthorizedUser() {
  const session = await getAppSession();
  return session?.user?.id && canUseMemberTools(session.user.role) ? session.user : null;
}
