import { NextResponse } from "next/server";
import { getAppSession } from "@/server/auth";
import { canUseMemberTools } from "@/server/auth-permissions";
import { buildCreativeCanvasPlan } from "@/server/creative-canvas-agent";
import { getCreativeCanvas } from "@/server/creative-canvas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const session = await getAppSession();
  if (!session?.user?.id || !canUseMemberTools(session.user.role)) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const { sessionId } = await context.params;
    const canvas = await getCreativeCanvas(session.user.id, sessionId);
    if (!canvas) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const body = await request.json() as { message?: unknown };
    return NextResponse.json({ plan: buildCreativeCanvasPlan(typeof body.message === "string" ? body.message : "") });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "生成画布计划失败" }, { status: 400 });
  }
}
