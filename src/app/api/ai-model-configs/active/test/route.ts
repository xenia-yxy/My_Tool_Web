import { NextResponse } from "next/server";
import { testActiveAiModelCapability } from "@/server/ai-model-configs";
import { canUseMemberTools } from "@/server/auth-permissions";
import { getAppSession } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getAppSession();

  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { headers: { "Cache-Control": "no-store" }, status: 401 },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      capability?: unknown;
    };
    const result = await testActiveAiModelCapability(
      session.user.id,
      body.capability,
    );

    return NextResponse.json(
      { ok: true, ...result },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "当前模型测试失败" },
      { headers: { "Cache-Control": "no-store" }, status: 400 },
    );
  }
}
